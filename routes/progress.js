// routes/progress.js
const express = require('express');
const router  = express.Router();
const pool    = require('../db');

/* POST /api/progress
   body = { athlete_id, plan_phase_id, status: 'completed' | 'missed', comment? } */
router.post('/', async (req,res)=>{
  try{
    const { athlete_id, plan_phase_id, status, comment } = req.body;   //  <-- COMMENT
    if(!athlete_id || !plan_phase_id || !['completed','missed'].includes(status)){
      return res.status(400).json({error:'Dados inválidos'});
    }

    // UPSERT + comentário
    await pool.query(`
      INSERT INTO phase_progress (athlete_id, plan_phase_id, status, comment)
           VALUES (?,?,?,?)
      ON DUPLICATE KEY UPDATE
            status   = VALUES(status),
            comment  = VALUES(comment),       /* COMMENT */
            updated_at = CURRENT_TIMESTAMP
    `,[athlete_id,plan_phase_id,status,comment || null]);               /* COMMENT */

    return res.json({ok:true});
  }catch(e){
    console.error(e);
    res.status(500).json({error:'Erro no servidor'});
  }
});

/* (Opcional) Treinador vê progresso + comentário de um dia */
router.get('/:athleteId/:planPhaseId', async (req,res)=>{
  try{
     const { athleteId, planPhaseId } = req.params;
     const [rows] = await pool.query(`
        SELECT status, comment, updated_at
          FROM phase_progress
         WHERE athlete_id=? AND plan_phase_id=?
     `,[athleteId,planPhaseId]);
     res.json(rows[0]||{});
  }catch(e){
     res.status(500).json({error:'Erro'});
  }
});

module.exports = router;
