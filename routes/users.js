const express = require('express');
const router = express.Router();
const pool = require('../db');

// obter lista de todos os utilizadores
router.get('/', async (req, res) => { try { const [rows] = await pool.query('SELECT * FROM users'); res.json(rows); } catch (error) { res.status(500).json({ error: error.message }); } });

// criar um novo utilizador 
router.post('/', async (req, res) => { try { const { nome, email } = req.body; const [result] = await pool.query( 'INSERT INTO users (nome, email) VALUES (?, ?)', [nome, email] ); res.json({ id: result.insertId, nome, email }); } catch (error) { res.status(500).json({ error: error.message }); } });

router.put('/:id', async (req,res)=>{
  try{
    const { id } = req.params;
    const { name, username, user, gender, phone, email } = req.body;

    /* constrói SET dinâmico → só altera o que chegar no body */
    const fields = [];
    const values = [];
    const map = {
     name       : name,                // coluna `name`
     nome       : name,                // compat. com BD antiga
     username   : username || user,    // o que vier do front
     gender,
     phone,
     email
   };

    Object.entries(map).forEach(([col,val])=>{
      if(val !== undefined){
        fields.push(`\`${col}\` = ?`);
        values.push(val);
      }
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

