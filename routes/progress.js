const express = require('express');
const router  = express.Router();
const pool    = require('../db');

/* POST /api/progress
   body = { athlete_id, plan_phase_id, status: 'completed' | 'missed' } */
router.post('/', async (req,res)=>{
  try{
    const { athlete_id, plan_phase_id, status } = req.body;
    if(!athlete_id || !plan_phase_id || !['completed','missed'].includes(status)){
      return res.status(400).json({error:'Dados inválidos'});
    }

    // UPSERT: se já existir row para (athlete,phase) faz update
    await pool.query(`
      INSERT INTO phase_progress (athlete_id, plan_phase_id, status)
          VALUES (?,?,?)
      ON DUPLICATE KEY UPDATE status = VALUES(status),
                              updated_at = CURRENT_TIMESTAMP
    `,[athlete_id,plan_phase_id,status]);

    return res.json({ok:true});
  }catch(e){
    console.error(e);
    res.status(500).json({error:'Erro no servidor'});
  }
});

module.exports = router;
