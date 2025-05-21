const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const coachMW = require('../middleware/coachAuth');   // já existente no projecto

/* GET /api/events/:athleteId  →  lista todos os eventos */
router.get('/:athleteId', coachMW, async (req,res)=>{
  const [rows] = await pool.query(
    'SELECT id, event_date AS date, title, note \
       FROM events WHERE athlete_id = ? ORDER BY event_date',
    [req.params.athleteId]);
  res.json(rows);
});

/* POST /api/events/:athleteId →  cria um novo evento */
router.post('/:athleteId', coachMW, async (req,res)=>{
  const {title, note, date} = req.body;
  await pool.query(
    'INSERT INTO events (athlete_id, coach_id, event_date, title, note) \
     VALUES (?,?,?, ?,?)',
     [req.params.athleteId, req.userId, date, title, note]
  );
  res.status(201).json({message:'Evento criado'});
});
module.exports = router;
