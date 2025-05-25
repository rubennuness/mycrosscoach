const express = require('express');
const router  = express.Router();
const pool    = require('../db');

/* lista todas as métricas do atleta */
router.get('/:athleteId', async (req,res)=>{
  const [rows] = await pool.query(
    'SELECT id,name FROM metrics WHERE athlete_id = ?',
    [req.params.athleteId]);
  res.json(rows);
});

/* cria nova métrica */
router.post('/:athleteId', async (req,res)=>{
  const {name} = req.body;
  if(!name) return res.status(400).json({error:'name required'});
  const [ins] = await pool.query(
    'INSERT INTO metrics(athlete_id,name) VALUES(?,?)',
    [req.params.athleteId,name]);
  res.status(201).json({id:ins.insertId,name});
});

/* devolve meta + resultados */
router.get('/view/:metricId', async (req,res)=>{
  const {metricId}=req.params;
  const [[metric]] = await pool.query(
     'SELECT id,name FROM metrics WHERE id=?',[metricId]);
  const [results] = await pool.query(
     'SELECT value, result_date AS date FROM metric_results WHERE metric_id=? ORDER BY result_date',
     [metricId]);
  res.json({metric,results});
});

/* adiciona resultado */
router.post('/result/:metricId', async (req,res)=>{
  const when = date ? new Date(date) : new Date();
  await pool.query(
    'INSERT INTO metric_results(metric_id,value,result_date) VALUES(?,?,?)',
    [req.params.metricId, value, when]);
  res.status(201).json({ok:true});
});

module.exports = router;
