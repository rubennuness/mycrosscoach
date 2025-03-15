const express = require('express');
const router = express.Router();
const pool = require('../db');

// Exemplo: obter lista de todos os utilizadores
router.get('/', async (req, res) => { try { const [rows] = await pool.query('SELECT * FROM users'); res.json(rows); } catch (error) { res.status(500).json({ error: error.message }); } });

// Exemplo: criar um novo utilizador 
router.post('/', async (req, res) => { try { const { nome, email } = req.body; const [result] = await pool.query( 'INSERT INTO users (nome, email) VALUES (?, ?)', [nome, email] ); res.json({ id: result.insertId, nome, email }); } catch (error) { res.status(500).json({ error: error.message }); } });

module.exports = router;

