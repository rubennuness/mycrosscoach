// server/db.js
const mysql = require('mysql2/promise');

// Railway cria automaticamente MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE, MYSQLPORT
const {
  MYSQLHOST,
  MYSQLUSER,
  MYSQLPASSWORD,
  MYSQLDATABASE,
  MYSQLPORT
} = process.env;

const pool = mysql.createPool({
  host    : MYSQLHOST,
  user    : MYSQLUSER,
  password: MYSQLPASSWORD,
  database: MYSQLDATABASE,
  port    : MYSQLPORT,
  waitForConnections: true,
  connectionLimit  : 10
});

module.exports = pool;
