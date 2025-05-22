// routes/auth.js
const express = require('express');
const router = express.Router();
const pool = require('../db');  
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto     = require('crypto');

/* ---------- transporter ----------
   SMTP credenciais em variáveis de ambiente
   (ex.: RAILWAY → Settings → Variables)         */
const transporter = nodemailer.createTransport({
  host : process.env.SMTP_HOST,
  port : +process.env.SMTP_PORT || 587,
  auth : {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

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
        /* 1) cria código de 6 dígitos */
    const code = crypto.randomInt(100000,999999).toString();

    /* 2) grava user por confirmar */
    await pool.query(`
      INSERT INTO users
        (name,email,password,role,verify_code,email_verified,created_at,updated_at)
      VALUES (?,?,?,?,?,0,NOW(),NOW())`,
      [name,email,hashedPassword,role,code]);

    /* 3) envia e-mail */
    await transporter.sendMail({
      from   : 'noreply@mycrosscoach.app',
      to     : email,
      subject: 'Código de verificação',
      text   : `O seu código é: ${code}`
    });

    return res.status(201).json({ message: 'Utilizador registado com sucesso' });
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

    if (!user.email_verified)
      return res.status(403).json({ error:'Confirme o seu e-mail antes de entrar.' });

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

router.post('/verify', async (req,res)=>{
  const { email, code } = req.body;
  try{
    const [rows] = await pool.query(
      'SELECT id,verify_code FROM users WHERE email=?', [email]);
    if(rows.length===0) return res.status(404).json({error:'Utilizador não encontrado'});

    if(rows[0].verify_code !== code)
      return res.status(400).json({error:'Código inválido'});

    await pool.query(`
      UPDATE users
         SET email_verified=1, verify_code=NULL
       WHERE id=?`, [rows[0].id]);

    return res.json({ message:'E-mail verificado com sucesso' });
  }catch(e){
    console.error(e);
    res.status(500).json({error:'Erro no servidor'});
  }
});

/* ─────────────────────────  Forgot PASSWORD  ───────────────────────── */
function genToken() {
  return crypto.randomBytes(32).toString('hex');                 // 64 chars
}
function hashTok(t){
  return crypto.createHash('sha256').update(t).digest('hex');    // 64-hex
}

/* POST /auth/forgot-password  – envia link por e-mail ------------------- */
router.post('/forgot-password', async (req,res)=>{
  try{
    const { email } = req.body;
    if(!email) return res.status(400).json({error:'Email é obrigatório'});

    const [[user]] = await pool.query('SELECT id,name FROM users WHERE email=?',[email]);
    /* resposta genérica para não revelar se existe ou não                 */
    if(!user) return res.json({message:'Se o email existir enviaremos instruções'});

    /* 1) gera + guarda token (apaga anteriores) */
    const token     = genToken();
    const tokenHash = hashTok(token);
    const expires   = new Date(Date.now()+60*60*1000);           // 1 h

    await pool.query('DELETE FROM password_reset_tokens WHERE user_id=?',[user.id]);
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id,token_hash,expires_at) VALUES (?,?,?)',
      [user.id, tokenHash, expires]);

    /* 2) envia e-mail */
    const url = `${process.env.FRONT_URL || 'https://mycrosscoach.app'}/reset-password/${token}`;
    await transporter.sendMail({
      from   :'noreply@mycrosscoach.app',
      to     : email,
      subject: 'Recuperar palavra-passe',
      html   : `<p>Olá ${user.name || ''},</p>
                <p>Clique para definir uma nova password (válido 1 hora):<br>
                <a href="${url}">${url}</a></p>`
    });

    console.log('[DEV] link de reset:', url);       // útil em desenvolvimento
    return res.json({message:'Se o email existir enviaremos instruções'});
  }catch(e){
    console.error(e);
    res.status(500).json({error:'Erro no servidor'});
  }
});

/* POST /auth/reset-password/:token  – define nova password -------------- */
router.post('/reset-password/:token', async (req,res)=>{
  try{
    const { token }    = req.params;
    const { password } = req.body;
    if(!password) return res.status(400).json({error:'Password obrigatória'});

    const [[row]] = await pool.query(
      `SELECT user_id FROM password_reset_tokens
        WHERE token_hash=? AND expires_at>NOW()`,
      [hashTok(token)]);

    if(!row) return res.status(400).json({error:'Token inválido ou expirado'});

    const hashed = await bcrypt.hash(password,10);
    await pool.query('UPDATE users SET password=? WHERE id=?',[hashed,row.user_id]);
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id=?',[row.user_id]);

    return res.json({message:'Password atualizada com sucesso'});
  }catch(e){
    console.error(e);
    res.status(500).json({error:'Erro no servidor'});
  }
});
/* ──────────────────────────────────────────────────────────────────────── */


module.exports = router;
