const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'coach_user',    // ou root (não recomendado em prod)
  password: '123',
  database: 'coachdb'
});

module.exports = pool;

