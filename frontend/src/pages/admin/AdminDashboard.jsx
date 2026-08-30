import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import TorneosList from './TorneosList';
import GimnastasList from './GimnastasList';
import Configuracion from './Configuracion';
import ResultadosView from './ResultadosView';
import UsuariosList from './UsuariosList';
import ControlRotacion from './ControlRotacion'; // ✅ NUEVO IMPORT

const AdminDashboard = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('torneos');
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>🏆 Panel de Administrador</h1>
          <div style={styles.userActions}>
            <span style={styles.userName}>Bienvenido, Admin</span>
            <button onClick={handleLogout} style={styles.logoutButton}>
              🚪 Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <div style={styles.tabs}>
        <button 
          onClick={() => setActiveTab('torneos')}
          style={activeTab === 'torneos' ? styles.activeTab : styles.tab}
        >
           Torneos
        </button>
        <button 
          onClick={() => setActiveTab('gimnastas')}
          style={activeTab === 'gimnastas' ? styles.activeTab : styles.tab}
        >
          🤸‍♀️ Gimnastas
        </button>
        <button 
          onClick={() => setActiveTab('usuarios')}
          style={activeTab === 'usuarios' ? styles.activeTab : styles.tab}
        >
          👥 Usuarios
        </button>
        <button 
          onClick={() => setActiveTab('configuracion')}
          style={activeTab === 'configuracion' ? styles.activeTab : styles.tab}
        >
          ⚙️ Configuración
        </button>
        <button 
          onClick={() => navigate('/evaluaciones')}
          style={styles.tab}
        >
          📋 Evaluaciones
        </button>
        <button 
          onClick={() => setActiveTab('resultados')}
          style={activeTab === 'resultados' ? styles.activeTab : styles.tab}
        >
          📊 Resultados
        </button>
        <button 
          onClick={() => navigate('/pantallas-jueces')}
          style={styles.tab}
        >
          📺 Pantallas Jueces
        </button>
        {/* ✅ NUEVA PESTAÑA: Rotación */}
        <button 
          onClick={() => setActiveTab('rotacion')}
          style={activeTab === 'rotacion' ? styles.activeTab : styles.tab}
        >
          🔄 Rotación
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === 'torneos' && <TorneosList />}
        {activeTab === 'gimnastas' && <GimnastasList />}
        {activeTab === 'usuarios' && <UsuariosList />}
        {activeTab === 'configuracion' && <Configuracion />}
        {activeTab === 'resultados' && <ResultadosView />}
        {activeTab === 'rotacion' && <ControlRotacion />} {/* ✅ NUEVO */}
      </div>
    </div>
  );
};

const styles = {
  container: { 
    backgroundColor: '#faf8f3', 
    minHeight: '100vh', 
    padding: '20px' 
  },
  header: { 
    backgroundColor: '#170000', 
    padding: '25px 30px', 
    borderRadius: '10px', 
    marginBottom: '25px', 
    boxShadow: '0 4px 15px rgba(23, 0, 0, 0.15)', 
    border: '1px solid #d2b178' 
  },
  headerContent: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    color: '#d2b178', 
    flexWrap: 'wrap', 
    gap: '15px' 
  },
  title: { 
    fontSize: '2.2rem', 
    fontWeight: '700', 
    color: '#d2b178', 
    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
    margin: 0
  },
  userActions: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '15px',
    flexWrap: 'wrap'
  },
  userName: { 
    color: '#d2b178', 
    fontWeight: '600', 
    fontSize: '1.1rem' 
  },
  logoutButton: { 
    backgroundColor: '#d8372d', 
    color: 'white', 
    border: 'none', 
    borderRadius: '8px', 
    padding: '10px 18px', 
    fontSize: '1rem', 
    fontWeight: '600', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s'
  },
  tabs: { 
    display: 'flex', 
    gap: '10px', 
    marginBottom: '25px', 
    flexWrap: 'wrap' 
  },
  tab: { 
    backgroundColor: '#f5ebe0', 
    color: '#4a2c2a', 
    border: 'none', 
    borderRadius: '8px', 
    padding: '12px 25px', 
    fontSize: '1.1rem', 
    fontWeight: '600', 
    cursor: 'pointer', 
    transition: 'all 0.3s', 
    boxShadow: '0 2px 5px rgba(0,0,0,0.08)' 
  },
  activeTab: { 
    backgroundColor: '#d8372d', 
    color: '#ffffff', 
    border: 'none', 
    borderRadius: '8px', 
    padding: '12px 25px', 
    fontSize: '1.1rem', 
    fontWeight: '600', 
    cursor: 'pointer', 
    boxShadow: '0 4px 8px rgba(216, 55, 45, 0.3)' 
  },
  content: { 
    backgroundColor: '#ffffff', 
    borderRadius: '10px', 
    padding: '30px', 
    boxShadow: '0 4px 15px rgba(0,0,0,0.08)', 
    border: '1px solid #e8d5b5' 
  },
};

export default AdminDashboard;