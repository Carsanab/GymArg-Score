import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useContext(AuthContext);

  // Si está cargando la sesión
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#faf8f3',
        fontSize: '1.5rem',
        color: '#4a2c2a'
      }}>
        ⏳ Cargando sesión...
      </div>
    );
  }

  // Si no hay usuario, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si se requiere un rol específico, verificar (case-insensitive)
  if (requiredRole) {
    const userRol = user.rol?.toLowerCase();
    const requiredRol = requiredRole.toLowerCase();
    
    if (userRol !== requiredRol) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#faf8f3',
          padding: '20px'
        }}>
          <h1 style={{ color: '#d8372d', fontSize: '3rem', marginBottom: '20px' }}>
            🚫 Acceso Denegado
          </h1>
          <p style={{ color: '#4a2c2a', fontSize: '1.3rem', marginBottom: '30px' }}>
            No tienes permisos para acceder a esta sección.
          </p>
          <p style={{ color: '#6c757d', fontSize: '1rem' }}>
            Tu rol actual: <strong>{user.rol?.toUpperCase()}</strong> | 
            Rol requerido: <strong>{requiredRole.toUpperCase()}</strong>
          </p>
          <button
            onClick={() => window.history.back()}
            style={{
              marginTop: '20px',
              backgroundColor: '#d8372d',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 25px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            ← Volver
          </button>
        </div>
      );
    }
  }

  // Si todo está bien, renderizar el contenido
  return children;
};

export default ProtectedRoute;