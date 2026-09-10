import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import JuezDashboard from './pages/JuezDashboard';
import PantallaJueces from './pages/PantallaJueces';
import PantallaJuezIndividual from './pages/PantallaJuezIndividual';
import PantallaPublica from './pages/PantallaPublica';
import RankingFinal from './pages/admin/RankingFinal';
import EvaluacionesList from './pages/admin/EvaluacionesList';
import PantallasJueces from './pages/admin/PantallasJueces';
import ProtectedRoute from './components/ProtectedRoute';
import ControlRotacion from './pages/admin/ControlRotacion';


function App() {
  return (
    <Router>
      <Routes>
        {/* RUTAS PÚBLICAS (Sin autenticación) */}
        <Route path="/login" element={<Login />} />
        <Route path="/jueces" element={<PantallaJueces />} />
        <Route path="/juez/:id" element={<PantallaJuezIndividual />} />
        <Route path="/publico" element={<PantallaPublica />} />

        {/* RUTAS PROTEGIDAS */}
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute requiredRole="juez">
              <JuezDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/ranking" 
          element={
            <ProtectedRoute requiredRole="admin">
              <RankingFinal />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/evaluaciones" 
          element={
            <ProtectedRoute requiredRole="admin">
              <EvaluacionesList />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/pantallas-jueces" 
          element={
            <ProtectedRoute requiredRole="admin">
              <PantallasJueces />
            </ProtectedRoute>
          } 
        />

        <Route path="/admin/rotacion" element={<ProtectedRoute requiredRole="admin"><ControlRotacion /></ProtectedRoute>} />

        {/* Ruta por defecto */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;