// routes/auth.js
const express = require('express');
const router = express.Router();
const pool = require('../db');  
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'chave-super-secreta'; // Em produção, use variável de ambiente

// Rota de registo (/register) – já existe no teu código
router.post('/register', async (req, res) => {
  try {
    // Extrai dados do body
    const { name, email, password, role } = req.body;

    // Verifica se vieram todos os campos necessários
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Verifica se o email já existe
    const [existingUser] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    // Gera hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insere no banco (supõe que a tabela "users" tem colunas: name, email, password, role, created_at, updated_at)
    await pool.query(
      `INSERT INTO users (name, email, password, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [name, email, hashedPassword, role]
    );

    return res.status(201).json({ message: 'Usuário cadastrado com sucesso' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
});
// Rota de login (/login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password são obrigatórios' });
    }

    // Verifica se existe utilizador com esse email
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Utilizador não encontrado' });
    }

    const user = rows[0];
    // Compare a password com a hash do BD
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Tudo ok – gerar token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '1h'
    });

    return res.json({
      message: 'Login efetuado com sucesso',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;
