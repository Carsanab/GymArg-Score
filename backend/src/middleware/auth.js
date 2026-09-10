const jwt = require('jsonwebtoken');

// Middleware para verificar token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'No se proporcionó token de autenticación' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mi_secreto_super_seguro_cambiar_en_produccion_2026');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Token inválido o expirado' 
    });
  }
};

// Middleware para verificar rol
const verifyRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'No autenticado' 
      });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ 
        error: 'No tienes permisos para realizar esta acción' 
      });
    }

    next();
  };
};

module.exports = { verifyToken, verifyRole };