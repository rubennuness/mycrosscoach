// server.js
const express = require('express');
const path     = require('path');
const cors = require('cors');
const pool = require('./db');  // Import da conexão MySQL
const authRoutes = require('./routes/auth');
const coachRoutes = require('./routes/coach');
const planRoutes = require('./routes/planRoutes');
const progressRoutes = require('./routes/progress');
const metricsRoutes = require('./routes/metrics');
const eventsRoutes= require('./routes/events');
const teamRoutes = require('./routes/team');
const userRoutes = require('./routes/users');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas de autenticação
app.use('/auth', authRoutes);

// Rotas do coach => /api/coach
app.use('/api/coach', coachRoutes);

// Rotas de planos => /api/plans
app.use('/api/plans', planRoutes);

app.use('/api/progress', progressRoutes);

app.use('/api/metrics', metricsRoutes);

app.use('/api/events',eventsRoutes);

app.use('/api/team', teamRoutes);

app.use('/api/users', userRoutes);

// Rota para o Atleta (ou qualquer um) ver todos os dias do user
// GET /api/training/week/:athleteId
app.get('/api/training/week/:athleteId', async (req, res) => {
  try {
    const { athleteId } = req.params;
    const weekStart = req.query.week || mondayISO(new Date());


    // Dias fixos
    const dayList = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
    const plansObj = {};
    dayList.forEach(d => { plansObj[d] = []; });

    // Seleciona unindo plan + phases
    const [rows] = await pool.query(`
    SELECT p.day_of_week,
              ph.id           AS phase_id,       
               ph.title        AS phase_title,   
                 ph.phase_text,
                 ph.sets                          AS sets,
          ph.reps                          AS reps,
          ph.p_low        AS pLow,
            ph.p_high       AS pHigh,
                 ph.phase_order
        FROM plans p
        JOIN plan_phases ph ON ph.plan_id = p.id
       WHERE p.athlete_id = ?
         ${weekStart ? 'AND p.week_start_date = ?' : ''}
       ORDER BY p.day_of_week, ph.phase_order
    `, weekStart ? [athleteId, weekStart] : [athleteId]);


    // Agrupa
    rows.forEach(row => {
      plansObj[row.day_of_week].push({id    : row.phase_id, title : row.title, text  : row.phase_text, sets : row.sets, reps  : row.reps, pLow : row.pLow,
       pHigh: row.pHigh});
    });

    return res.json({
      daysOfWeek: dayList,
      plans: plansObj
    });
  } catch (err) {
    console.error('Erro ao obter planos:', err);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Teste
app.get('/', (req, res) => {
  res.send('API a funcionar');
});

app.listen(3000, () => {
  console.log('Servidor a correr na porta 3000');
});
