const supabase = require('../config/supabase');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Formato de token inválido.' });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }

  // FASE 6: Segurança máxima - Bloqueia qualquer usuário que não seja o dono
  if (data.user.email !== 'depositorefresca@gmail.com') {
    return res.status(403).json({ error: 'Acesso negado. E-mail não autorizado para acesso administrativo.' });
  }

  req.user = data.user;
  next();
};

module.exports = authMiddleware;
