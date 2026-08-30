const express = require('express');
const cors = require('cors');
const path = require('path'); 
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Servir archivos estáticos de uploads (para la imagen de rotación)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas
const authRoutes = require('./routes/auth');
const gimnastasRoutes = require('./routes/gimnastas');
const evaluacionesRoutes = require('./routes/evaluaciones');
const nivelesRoutes = require('./routes/niveles');
const categoriasRoutes = require('./routes/categorias');
const gruposRoutes = require('./routes/grupos');
const zonasRoutes = require('./routes/zonas');
const torneosRoutes = require('./routes/torneos');

app.use('/api/auth', authRoutes);
app.use('/api/gimnastas', gimnastasRoutes);
app.use('/api/evaluaciones', evaluacionesRoutes);
app.use('/api/niveles', nivelesRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/grupos', gruposRoutes);
app.use('/api/zonas', zonasRoutes);
app.use('/api/torneos', torneosRoutes);

// Ruta raíz
app.get('/api', (req, res) => {
  res.json({ message: 'API del Torneo de Gimnasia funcionando' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});