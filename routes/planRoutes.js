// routes/planRoutes.js
const express = require('express');
const router  = express.Router();
const pool    = require('../db');   // Conexão MySQL

/* ------------------------------------------------------------------ */
/* 🔽 1. Helper  – devolve a 2.ª-feira (ISO) da semana em curso  🔽   */
function mondayOfCurrentWeek () {
  const d   = new Date();                // hoje (UTC)
  const wd  = d.getUTCDay() || 7;        // 1-7  (Domingo = 7)
  d.setUTCDate(d.getUTCDate() - wd + 1); // recua até à 2.ª-feira
  d.setUTCHours(0,0,0,0);
  return d.toISOString().slice(0,10);    // “YYYY-MM-DD”
}
/* ------------------------------------------------------------------ */


/* POST /api/plans/:athleteId  – cria / sobrescreve plano de um dia */
router.post('/:athleteId', async (req,res)=>{
  try{
    const {athleteId}=req.params;
    const {day_of_week,phases,week_start_date}=req.body;

    /* plan row ---------------------------------------------------------- */
    const monday = week_start_date || mondayOfCurrentWeek();

    const [[plan]] = await pool.query(
      `SELECT id FROM plans
        WHERE athlete_id=? AND day_of_week=? AND week_start_date=?`,
      [athleteId,day_of_week,monday]);

    let planId;
    if(plan){                         // sobrescreve
      planId = plan.id;
      await pool.query('DELETE FROM plan_phases WHERE plan_id=?',[planId]); // ON DELETE CASCADE remove ranges
    }else{                            // novo
      const [ins]=await pool.query(
        'INSERT INTO plans(athlete_id,day_of_week,week_start_date) VALUES(?,?,?)',
        [athleteId,day_of_week,monday]);
      planId = ins.insertId;
    }

    /* phases + ranges --------------------------------------------------- */
    for (let i = 0; i < phases.length; i++) {
  const p = phases[i];

  /* ▼ trocámos “percent” por p_low / p_high */
  const [insPh] = await pool.query(
    `INSERT INTO plan_phases
       (plan_id, phase_order, title, phase_text,
        sets, reps, p_low, p_high)
     VALUES (?,?,?,?,?,?,?,?)`,
    [ planId, i + 1,
      p.title  || `Fase ${i+1}`,
      p.text   || '',
      p.sets   || null,
      p.reps   || null,
      p.pLow   || null,
      p.pHigh  || null ]        //  ← novos campos
  );

      /* sub-blocos (ranges) */
      if (Array.isArray(p.ranges) && p.ranges.length) {
    for (let j = 0; j < p.ranges.length; j++) {
      const r = p.ranges[j];
      await pool.query(
        `INSERT INTO phase_ranges
           (plan_phase_id, range_order,
            sets, reps, p_low, p_high)
         VALUES (?,?,?,?,?,?)`,
        [ insPh.insertId, j + 1,
          r.sets  || null,
          r.reps  || null,
          r.pLow  || null,
          r.pHigh || null ]
      );
    }
  }
}

    res.status(201).json({plan_id:planId});
  }catch(e){
    console.error(e);
    res.status(500).json({error:'Erro ao criar/actualizar plano'});
  }
});

// GET /api/plans/day/:athleteId/:dayOfWeek
// Retorna as phases existentes para um dia específico do atleta
/* ───────────────────────── GET por dia (semana) ───────────────────────── */
router.get('/day/:athleteId/:dayOfWeek', async (req,res)=>{
  try{
    const {athleteId,dayOfWeek}=req.params;
    const weekStart=req.query.week||mondayOfCurrentWeek();

    /* obtém planId (semana exacta) */
    const [[plan]] = await pool.query(
      `SELECT id FROM plans
        WHERE athlete_id=? AND day_of_week=? AND week_start_date=?`,
      [athleteId,dayOfWeek,weekStart]);

    if(!plan) return res.json({phases:[]});

    /* devolve phases + ranges + progresso */
    const [rows] = await pool.query(`
      SELECT
        ph.id, ph.phase_order,
        COALESCE(ph.title,CONCAT('Fase ',ph.phase_order)) AS title,
        ph.phase_text         AS text,
        ph.sets, ph.reps,
        ph.p_low              AS pLow,
        ph.p_high             AS pHigh,
        pr.range_order        AS r_order,
        pr.sets               AS r_sets,
        pr.reps               AS r_reps,
        pr.p_low              AS r_pLow,
        pr.p_high             AS r_pHigh,
        COALESCE(pg.status ,'pending') AS status,
        COALESCE(pg.comment,'')        AS comment
      FROM plan_phases ph
      LEFT JOIN phase_ranges   pr ON pr.plan_phase_id = ph.id
      LEFT JOIN phase_progress pg ON pg.plan_phase_id = ph.id
                                  AND pg.athlete_id   = ?
      WHERE ph.plan_id = ?
      ORDER BY ph.phase_order, pr.range_order`,
      [athleteId,plan.id]);

    /* agrupa ranges ---------------------------------------------------- */
    const map={};
    rows.forEach(r=>{
      if(!map[r.id]){
        map[r.id]={ id:r.id, title:r.title, text:r.text,
                    sets:r.sets, reps:r.reps, pLow : r.pLow, pHigh: r.pHigh,
                    status:r.status, comment:r.comment,
                    ranges:[] };
      }
      if(r.r_order!==null){
  map[r.id].ranges.push({
    sets:r.r_sets, reps:r.r_reps,
    pLow:r.r_pLow, pHigh:r.r_pHigh
  });
      }
    });

    res.json({phases:Object.values(map)});
  }catch(e){
    console.error(e);
    res.status(500).json({error:'Erro no servidor'});
  }
});


// GET /api/plans/view/:planId => se quiser ver um plano específico
router.get('/view/:planId', async (req, res) => {
  try {
    const { planId } = req.params;

    const [planRows] = await pool.query(`
      SELECT id, athlete_id, day_of_week, created_at
        FROM plans
       WHERE id=?
    `, [planId]);
    if (planRows.length === 0) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    const plan = planRows[0];
    const [phaseRows] = await pool.query(`
      SELECT phase_order, phase_text
        FROM plan_phases
       WHERE plan_id=?
       ORDER BY phase_order
    `, [planId]);

    return res.json({
      ...plan,
      phases: phaseRows
    });
  } catch (err) {
    console.error('Erro ao obter plano:', err);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
});

/* ────────────────────────────────────────────────────────────────────
   GET /api/plans/by-date/:athleteId/:dateYMD
   Devolve o plano (phases[]) do atleta para a data exacta escolhida
   – Usa week_start_date (2.ª-feira da semana) + day_of_week (‘Segunda’, …)
   – Se não houver treino nesse dia devolve phases:[]
   ──────────────────────────────────────────────────────────────────── */

router.get('/by-date/:athleteId/:dateYMD', async (req, res) => {
  try {
    const { athleteId, dateYMD } = req.params;        // YYYY-MM-DD

    /* 1️⃣  calcula week_start_date (segunda-feira ISO)  */
    const d   = new Date(dateYMD);          // local
    const wd  = d.getDay() || 7;            // 1-7  (Dom = 7)
    d.setDate(d.getDate() - wd + 1);        // recua até 2.ª
    const monday = d.toISOString().slice(0,10);  // ainda devolve “YYYY-MM-DD”

    /* 2️⃣  converte a data para o nome do dia (‘Segunda’, …)            */
    const ptDay = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
                  [ new Date(dateYMD).getDay() ];

    /* 3️⃣  procura o plano dessa semana + dia                           */
    let [planRows] = await pool.query(`
      SELECT id
        FROM plans
       WHERE athlete_id  = ?
         AND day_of_week = ?
         /* planos novos  ➜ week_start_date = monday
           planos antigos ➜ week_start_date IS NULL          */
         AND (week_start_date = ? OR week_start_date IS NULL)
      LIMIT 1
    `, [athleteId, ptDay, monday]);

    /* se não encontrou exactamente essa semana -> não há treino */
    if (planRows.length === 0)
      return res.json({ phases: [] });

    const planId = planRows[0].id;

    /* 4️⃣  devolve as phases já com estado / comentário (se existirem)  */
    const [phaseRows] = await pool.query(`
      SELECT
          ph.id                            AS id,
          ph.phase_order,
          COALESCE(ph.title,
                   CONCAT('Fase ',ph.phase_order)) AS title,
          ph.phase_text                    AS text,
          ph.sets                          AS sets,
          ph.reps                          AS reps,
          ph.p_low              AS p_low,
          ph.p_high             AS p_high,
          COALESCE(pp.status ,'pending')   AS status,
          COALESCE(pp.comment,'')          AS comment
      FROM plan_phases ph
      LEFT JOIN phase_progress pp
             ON pp.plan_phase_id = ph.id
            AND pp.athlete_id    = ?
      WHERE ph.plan_id = ?
      ORDER BY ph.phase_order
    `, [athleteId, planId]);

    return res.json({ phases: phaseRows });

  } catch (err) {
    console.error('Erro ao obter plano por data:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;
