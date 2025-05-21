const jwt = require('jsonwebtoken');

module.exports = function coachAuth(req,res,next){
  const authHeader = req.headers.authorization;
  if(!authHeader) return res.status(401).json({error:'Token não fornecido'});

  const token      = authHeader.split(' ')[1];
  const JWT_SECRET = 'chave-super-secreta';

  try{
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId    = decoded.userId;
    next();
  }catch(e){
    return res.status(401).json({error:'Token inválido'});
  }
};
