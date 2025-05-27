const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const coachMW = require('../middleware/coachAuth');

/* lista equipas do coach (admin ou membro) ----------------------- */
router.get('/', coachMW, async (req,res)=>{
  const coachId = req.userId;
  const [rows]  = await pool.query(`
    SELECT t.id, t.name,
           t.admin_id = ?          AS is_admin,
           tm.status = 'pending'    AS pending
      FROM teams t
      LEFT JOIN team_members tm
             ON tm.team_id  = t.id
            AND tm.coach_id = ?
     WHERE t.admin_id = ? OR tm.coach_id = ?
  `,[coachId,coachId,coachId,coachId]);
  res.json(rows);
});

/* listar equipas disponíveis (exclui onde já é membro ou admin) */
router.get('/available', coachMW, async (req,res)=>{
  const coachId = req.userId;
  const [rows] = await pool.query(`
    SELECT t.id, t.name
      FROM teams t
     WHERE t.id NOT IN (
           SELECT team_id FROM team_members WHERE coach_id = ?
           UNION
           SELECT id FROM teams WHERE admin_id = ?
         )
  `,[coachId, coachId]);
  res.json(rows);
});

/* cria equipa (coach = admin) ------------------------------------ */
router.post('/', coachMW, async (req,res)=>{
  const {name} = req.body;
  if(!name) return res.status(400).json({error:'name required'});
  const [ins] = await pool.query(
    'INSERT INTO teams(name,admin_id,created_at) VALUES(?,?,NOW())',
    [name, req.userId]);
  await pool.query(
    'INSERT INTO team_members(team_id,coach_id,status) VALUES(?,?,?)',
    [ins.insertId, req.userId, 'accepted']);     // Admin já é membro
  res.status(201).json({id:ins.insertId,name,is_admin:true});
});

/* pedir adesão ---------------------------------------------------- */
router.post('/:teamId/join', coachMW, async (req,res)=>{
  const {teamId} = req.params;
  try{
    await pool.query(
      'INSERT INTO team_members(team_id,coach_id,status) VALUES(?,?,?)',
      [teamId, req.userId, 'pending']);
    res.status(201).json({message:'pedido enviado'});
  }catch(e){
    if(e.code==='ER_DUP_ENTRY')
      return res.status(409).json({error:'já existe pedido / membro'});
    throw e;
  }
});

/* aceitar ou recusar (só admin) ---------------------------------- */
router.put('/:teamId/member/:coachId', coachMW, async (req,res)=>{
  const {teamId,coachId} = req.params;
  const {action}         = req.body;         // 'accept' | 'reject'
  const [[admin]] = await pool.query(
    'SELECT admin_id FROM teams WHERE id=?',[teamId]);
  if(!admin || admin.admin_id !== req.userId)
    return res.status(403).json({error:'not admin'});
  const status = action==='accept'?'accepted':'rejected';
  await pool.query(
    'UPDATE team_members SET status=? WHERE team_id=? AND coach_id=?',
    [status,teamId,coachId]);
  res.json({message:'ok'});
});

module.exports = router;
