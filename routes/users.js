const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');


const uploadDir = path.join(__dirname, '..', 'uploads'); //  …/app/uploads
fs.mkdirSync(uploadDir, { recursive: true });            // cria se faltar

const storage = multer.diskStorage({
  destination : (_, __, cb) => cb(null, uploadDir),
  filename    : (_, file, cb) => {
    // ex.: avatar_123_1675234534534.jpg
    const unique = Date.now() + '_' + Math.round(Math.random()*1e5);
    const ext    = file.originalname.split('.').pop();  // “jpg”, “png”…
    cb(null, `avatar_${unique}.${ext}`);
  }
});
const upload = multer({ storage });
// obter lista de todos os utilizadores
router.get('/', async (req, res) => { try { const [rows] = await pool.query('SELECT * FROM users'); res.json(rows); } catch (error) { res.status(500).json({ error: error.message }); } });

// criar um novo utilizador 
router.post('/', async (req, res) => { try { const { nome, email } = req.body; const [result] = await pool.query( 'INSERT INTO users (nome, email) VALUES (?, ?)', [nome, email] ); res.json({ id: result.insertId, nome, email }); } catch (error) { res.status(500).json({ error: error.message }); } });

router.put('/:id', upload.single('avatar'), async (req,res)=>{
  try{
    const VALID_COLS = ['name','username','gender','phone','avatar_url','email'];
    const { id } = req.params;
    const { name, username, gender, phone, email } = req.body;


    // se veio um ficheiro, gera-se a URL pública
    const avatar_url = req.file
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : undefined;
    /* constrói SET dinâmico → só altera o que chegar no body */
    const fields = [];
    const values = [];
    const map = {
     name       : name,                // coluna `name`
     nome       : name,                // compat. com BD antiga
     username,
     gender,
     phone,
     avatar_url,
     email,
   };

    Object.entries(map).forEach(([col,val])=>{
     if (val === undefined || !VALID_COLS.includes(col)) return;

  // strings vazias ⇒ NULL   (evita problemas com ENUM / NOT NULL)
  const v = val === '' ? null : val;

  fields.push(`\`${col}\` = ?`);
  values.push(v);
    });
    if(fields.length === 0)                    // nada para alterar
      return res.status(400).json({error:'No data to update'});

    values.push(id);                           // WHERE id = ?
    await pool.query(
      `UPDATE users SET ${fields.join(', ')},
                        updated_at = NOW()
       WHERE id = ?`,
      values);

    res.json({ message:'Perfil actualizado' });
  }catch(err){
    console.error(err);
    res.status(500).json({ error:'Erro no servidor' });
  }
});


module.exports = router;

