const mysql = require('mysql2/promise');

/* 1️⃣  Usa, sempre que existir, a connection-string completa  */
if (process.env.MYSQL_URL) {
  module.exports = mysql.createPool(
    process.env.MYSQL_URL + '?connectionLimit=10&waitForConnections=true'
  )
  return;
}s

/* 2️⃣  Fallback – campos individuais (útil em localhost)      */
module.exports = mysql.createPool({
  host            : process.env.MYSQLHOST     || 'localhost',
  user            : process.env.MYSQLUSER     || 'coach_user',
  password        : process.env.MYSQLPASSWORD || '123',
  database        : process.env.MYSQLDATABASE || 'coachdb',
  port            : process.env.MYSQLPORT     || 3306,
  waitForConnections: true,
  connectionLimit : 10,
  connectTimeout  : 10000       // 10 s evita timeouts curtos
});