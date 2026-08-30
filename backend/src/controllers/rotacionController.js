   const multer = require('multer');
   const path = require('path');
   const fs = require('fs');
   const estadoEvaluacion = require('../services/estadoEvaluacion');

   // Crear carpeta de uploads si no existe
   const uploadDir = path.join(__dirname, '../../uploads');
   if (!fs.existsSync(uploadDir)) {
     fs.mkdirSync(uploadDir, { recursive: true });
   }

   // Configurar multer para guardar siempre como 'rotacion.jpg' (sobreescribe la anterior)
   const storage = multer.diskStorage({
     destination: (req, file, cb) => cb(null, uploadDir),
     filename: (req, file, cb) => cb(null, 'rotacion.jpg')
   });
   const upload = multer({ storage });

   // 1. Middleware para subir la imagen
   exports.subirImagenRotacion = upload.single('imagen');

   // 2. Activar rotación
   exports.activarRotacion = async (req, res) => {
     estadoEvaluacion.setModoRotacion(true);
     res.json({ message: 'Rotación activada' });
   };

   // 3. Desactivar rotación (Quitar)
   exports.desactivarRotacion = async (req, res) => {
     estadoEvaluacion.setModoRotacion(false);
     res.json({ message: 'Rotación desactivada' });
   };

   // 4. Obtener estado actual (y la URL de la imagen)
   exports.getEstadoRotacion = async (req, res) => {
     const baseUrl = req.protocol + '://' + req.get('host');
     res.json({ 
       activa: estadoEvaluacion.getModoRotacion(),
       imageUrl: `${baseUrl}/uploads/rotacion.jpg`
     });
   };