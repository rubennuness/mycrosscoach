// routes/coach.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // sua conexão MySQL
//const jwt = require('jsonwebtoken');
const coachAuth = require('../middleware/coachAuth');
// Plan Templates CRUD
router.get('/templates', coachAuth, async (req,res)=>{
  try{
    const coachId = req.userId;
    const [rows] = await pool.query(
      `SELECT id, title, description, created_at
         FROM plan_templates
        WHERE coach_id=?
        ORDER BY created_at DESC`, [coachId]);
    res.json(rows);
  }catch(e){ console.error(e); res.status(500).json({error:'Erro no servidor'}); }
});

router.post('/templates', coachAuth, async (req,res)=>{
  try{
    const coachId = req.userId;
    const { title, description } = req.body;
    if(!title) return res.status(400).json({error:'title obrigatório'});
    const [ins] = await pool.query(
      `INSERT INTO plan_templates (coach_id,title,description,created_at)
       VALUES (?,?,?,NOW())`, [coachId, title, description||null]);
    res.status(201).json({ id: ins.insertId, title, description: description||null });
  }catch(e){ console.error(e); res.status(500).json({error:'Erro no servidor'}); }
});

router.put('/templates/:id', coachAuth, async (req,res)=>{
  try{
    const coachId = req.userId;
    const { id } = req.params;
    const { title, description } = req.body;
    await pool.query(
      `UPDATE plan_templates SET title=?, description=?
        WHERE id=? AND coach_id=?`, [title||null, description||null, id, coachId]);
    res.json({ message:'Template atualizado' });
  }catch(e){ console.error(e); res.status(500).json({error:'Erro no servidor'}); }
});

router.delete('/templates/:id', coachAuth, async (req,res)=>{
  try{
    const coachId = req.userId;
    const { id } = req.params;
    await pool.query(`DELETE FROM plan_templates WHERE id=? AND coach_id=?`, [id, coachId]);
    res.sendStatus(204);
  }catch(e){ console.error(e); res.status(500).json({error:'Erro no servidor'}); }
});
// Define/atualiza título do plano por atleta (por coach)
router.post('/athletes/:athleteId/plan-title', coachAuth, async (req,res)=>{
  try{
    const coachId   = req.userId;
    const athleteId = Number(req.params.athleteId);
    const { title } = req.body;
    await pool.query(
      `INSERT INTO coach_athlete_meta (coach_id,athlete_id,plan_title)
         VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE plan_title=VALUES(plan_title)`,
      [coachId, athleteId, title || null]
    );
    res.json({ message:'Plan title updated' });
  }catch(err){
    console.error(err);
    res.status(500).json({error:'Erro no servidor'});
  }
});



// Exemplo de middleware que pega userId do token
// e garante que o user é "coach".
/*function coachAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  const token = authHeader.split(' ')[1];
  const JWT_SECRET = 'chave-super-secreta';

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // se quiser checar role=coach, podes buscar no DB ou no token
    // mas por simplicidade, assumo que se ele está usando essa rota, é coach:
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}*/

// Rota para adicionar um atleta já existente (role=athlete)
router.post('/athletes', coachAuth, async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Faltam dados (name e email).' });
    }

    
    const [rows] = await pool.query(
      'SELECT id, name, email, role FROM users WHERE email = ? AND role="athlete"',
      [email]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Email não encontrado ou não é atleta.' });
    }
    const athleteUser = rows[0];

    
    try {
      await pool.query(
        'INSERT INTO coach_athletes (coach_id, athlete_id) VALUES (?, ?)',
        [req.userId, athleteUser.id]
      );
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        // Relação já existe
        return res.status(409).json({ error: 'Este atleta já está associado a você.' });
      }
      throw err;
    }

    // inicia meta row (caso queira preencher título depois)
    await pool.query(
      'INSERT IGNORE INTO coach_athlete_meta (coach_id,athlete_id,plan_title) VALUES (?,?,NULL)',
      [req.userId, athleteUser.id]
    );

    // 3. Retorna dados do atleta
    return res.status(201).json({
      id: athleteUser.id,
      name: athleteUser.name || name,
      email: athleteUser.email,
      avatar_url: athleteUser.avatar_url || null,
      plan_title: null
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Rota GET /api/coach/athletes -> lista os atletas do coach
router.get('/athletes', coachAuth, async (req, res) => {
  try {
    const coachId = req.userId; // obtido do token
    const [rows] = await pool.query(`
      SELECT u.id, u.name, u.email, u.avatar_url,
             cam.plan_title
        FROM coach_athletes ca
        JOIN users u ON u.id = ca.athlete_id
        LEFT JOIN coach_athlete_meta cam
               ON cam.coach_id = ca.coach_id AND cam.athlete_id = ca.athlete_id
       WHERE ca.coach_id = ?
    `, [coachId]);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
});

router.delete('/athletes/:athleteId', coachAuth, async (req, res) => {
  try {
    const coachId   = req.userId;
    const athleteId = Number(req.params.athleteId);

    // apaga a relação (não apaga o utilizador!)
    const [result] = await pool.query(
      'DELETE FROM coach_athletes WHERE coach_id=? AND athlete_id=?',
      [coachId, athleteId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Atleta não encontrado na sua lista.' });

    return res.sendStatus(204);              // OK, sem body
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;
