// routes/planRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // Conexão MySQL

// POST /api/plans/:athleteId => cria ou sobrescreve plano de um dia
router.post('/:athleteId', async (req, res) => {
  try {
    const { athleteId } = req.params;
    const { day_of_week, phases } = req.body;

    // Verifica se já existe (athlete_id, day_of_week)
    const [existingPlan] = await pool.query(`
      SELECT id FROM plans
       WHERE athlete_id=? 
         AND day_of_week=?
      LIMIT 1
    `, [athleteId, day_of_week]);

    let planId;
    if (existingPlan.length > 0) {
      // Sobrescreve => apaga as phases antigas
      planId = existingPlan[0].id;
      await pool.query(
        `INSERT INTO phase_progress (plan_id, phase_order, status)
           VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status)`,
        [planId, phase_order, status]
      );
    } else {
      // Cria nova row em "plans"
      const [insert] = await pool.query(`
        INSERT INTO plans (athlete_id, day_of_week) 
        VALUES (?, ?)
      `, [athleteId, day_of_week]);
      planId = insert.insertId;
    }

    // Inserir as phases
    for (let i = 0; i < phases.length; i++) {
      const { title, text } = phases[i];
      await pool.query(`
        INSERT INTO plan_phases (plan_id, phase_order, title, phase_text)
        VALUES (?, ?, ?, ?)
       `, [
        planId,
        i + 1,
        title || `Fase ${i + 1}`,  // fallback
        text   || ''
      ]);
    }

    return res.status(201).json({
      plan_id: planId,
      message: `Plano salvo para user_id=${athleteId}, dia=${day_of_week}`
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

    // 1) Verifica se existe row em "plans" (athlete_id, day_of_week)
    const [planRows] = await pool.query(`
      SELECT id
        FROM plans
       WHERE athlete_id=? 
         AND day_of_week=?
      LIMIT 1
    `, [athleteId, dayOfWeek]);
    if (planRows.length === 0) {
      // Se não houver plano, devolve phases=[]
      return res.json({ phases: [] });
    }

    const planId = planRows[0].id;

    // 2) Buscar phases do plano
      const [phaseRows] = await pool.query(`
        SELECT
            ph.id                             AS plan_phase_id,
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

module.exports = router;
