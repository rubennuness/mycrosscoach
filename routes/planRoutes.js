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
router.post('/:athleteId', async (req, res) => {
  try {
    const { athleteId }          = req.params;
    const { day_of_week, phases, week_start_date } = req.body;

    /* ---------- existe? ------------------------------------------------ */
    const [existingPlan] = await pool.query(`
    SELECT id FROM plans
     WHERE athlete_id      = ?
       AND day_of_week     = ?
       AND week_start_date = ?
    LIMIT 1
  `, [athleteId, day_of_week, week_start_date]);

    let planId;
    if (existingPlan.length > 0) {
      /* --- 1) sobrescreve: limpa phases antigas ----------------------- */
      planId = existingPlan[0].id;
      await pool.query('DELETE FROM plan_phases WHERE plan_id = ?', [planId]);
    } else {
      /* --- 2) novo: agora inclui week_start_date ---------------------- */
      const monday = week_start_date || mondayOfCurrentWeek();
      const [insert] = await pool.query(`
        INSERT INTO plans (athlete_id, day_of_week, week_start_date)
        VALUES (?, ?, ?)
      `, [athleteId, day_of_week, monday]);           // 🔸 NOVO (3.º valor)
      planId = insert.insertId;
    }

    /* ---------- phases ------------------------------------------------- */
    for (let i = 0; i < phases.length; i++) {
      const { title, text } = phases[i];
      await pool.query(`
        INSERT INTO plan_phases (plan_id, phase_order, title, phase_text)
        VALUES (?, ?, ?, ?)
      `, [ planId, i + 1,
           title || `Fase ${i+1}`,
           text  || '' ]);
    }

    return res.status(201).json({
      plan_id : planId,
      message : `Plano salvo para user_id=${athleteId}, dia=${day_of_week}`
    });

  } catch (err) {
    console.error('Erro ao criar/atualizar plano:', err);
    return res.status(500).json({ error: 'Erro ao criar/atualizar plano' });
  }
});

// GET /api/plans/day/:athleteId/:dayOfWeek
// Retorna as phases existentes para um dia específico do atleta
router.get('/day/:athleteId/:dayOfWeek', async (req, res) => {
  try {
    const { athleteId, dayOfWeek } = req.params;
    const weekStart = req.query.week || null;

    // 1) Verifica se existe row em "plans" (athlete_id, day_of_week)
    const [planRows] = await pool.query(`
      SELECT id
        FROM plans
        WHERE athlete_id=? 
                 AND day_of_week=?
                 ${weekStart ? 'AND week_start_date = ?' : ''}
      LIMIT 1
      `, weekStart ? [athleteId, dayOfWeek, weekStart]
                   : [athleteId, dayOfWeek]);
    if (planRows.length === 0) {
      // Se não houver plano, devolve phases=[]
      return res.json({ phases: [] });
    }

    const planId = planRows[0].id;

    // 2) Buscar phases do plano
      const [phaseRows] = await pool.query(`
        SELECT
            ph.id                             AS id,
            ph.phase_order,
            COALESCE(ph.title,
                     CONCAT('Fase ',ph.phase_order)) AS title,
            ph.phase_text                     AS text,
            COALESCE(pp.status  ,'pending')   AS status,
            COALESCE(pp.comment ,'')          AS comment
        FROM plan_phases ph
        LEFT JOIN phase_progress pp
               ON pp.plan_phase_id = ph.id
              AND pp.athlete_id    = ?
        WHERE ph.plan_id = ?
        ORDER BY ph.phase_order
      `, [athleteId, planId]);            // NEW (passa athleteId)

 const phases = phaseRows;     
    return res.json({ phases });
  } catch (err) {
    console.error('Erro ao carregar plano:', err);
    return res.status(500).json({ error: 'Erro no servidor' });
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
    const d     = new Date(dateYMD + 'T00:00:00Z');   // força UTC
    const wd    = d.getUTCDay() || 7;                 // 1-7  (Dom=7)
    d.setUTCDate(d.getUTCDate() - wd + 1);            // recua até 2.ª-feira
    const monday = d.toISOString().slice(0, 10);      // “YYYY-MM-DD”

    /* 2️⃣  converte a data para o nome do dia (‘Segunda’, …)            */
    const ptDay = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
                  [ new Date(dateYMD).getDay() ];

    /* 3️⃣  procura o plano dessa semana + dia                           */
    const [planRows] = await pool.query(`
      SELECT id
        FROM plans
       WHERE athlete_id  = ?
         AND day_of_week = ?
         /* planos novos  ➜ week_start_date = monday
           planos antigos ➜ week_start_date IS NULL          */
         AND (week_start_date = ? OR week_start_date IS NULL)
      LIMIT 1
    `, [athleteId, ptDay, monday]);

    if (planRows.length === 0)
      return res.json({ phases: [] });                 // nada nesse dia

    const planId = planRows[0].id;

    /* 4️⃣  devolve as phases já com estado / comentário (se existirem)  */
    const [phaseRows] = await pool.query(`
      SELECT
          ph.id                            AS id,
          ph.phase_order,
          COALESCE(ph.title,
                   CONCAT('Fase ',ph.phase_order)) AS title,
          ph.phase_text                    AS text,
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
