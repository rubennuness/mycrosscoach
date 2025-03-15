// routes/coach.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // sua conexão MySQL
const jwt = require('jsonwebtoken');

// Exemplo de middleware que pega userId do token
// e garante que o user é "coach".
function coachAuthMiddleware(req, res, next) {
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
}

// Rota para adicionar um atleta já existente (role=athlete)
router.post('/athletes', coachAuthMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Faltam dados (name e email).' });
    }

    // 1. Verificar se existe user com esse email e role=athlete
    const [rows] = await pool.query(
      'SELECT id, name, email, role FROM users WHERE email = ? AND role="athlete"',
      [email]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Email não encontrado ou não é atleta.' });
    }
    const athleteUser = rows[0];

    // 2. Tenta inserir na tabela coach_athletes
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

    // 3. Retorna dados do atleta
    return res.status(201).json({
      id: athleteUser.id,
      name: athleteUser.name || name,
      email: athleteUser.email
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Rota GET /api/coach/athletes -> lista os atletas do coach
router.get('/athletes', coachAuthMiddleware, async (req, res) => {
  try {
    const coachId = req.userId; // obtido do token
    const [rows] = await pool.query(`
      SELECT u.id, u.name, u.email
        FROM coach_athletes ca
        JOIN users u ON u.id = ca.athlete_id
       WHERE ca.coach_id = ?
    `, [coachId]);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;
