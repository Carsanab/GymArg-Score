import { useState } from 'react';
import NivelesList from './NivelesList';
import CategoriasList from './CategoriasList';
import GruposList from './GruposList';
import ZonasList from './ZonasList';

const Configuracion = () => {
  const [activeSection, setActiveSection] = useState('niveles');

  return (
    <div>
      <h2 style={styles.title}>️ Configuración del Sistema</h2>
      <p style={styles.description}>
        Gestiona los niveles, categorías, grupos y zonas que se usarán en el sistema.
      </p>

      <div style={styles.sectionTabs}>
        <button 
          onClick={() => setActiveSection('niveles')}
          style={activeSection === 'niveles' ? styles.activeSectionTab : styles.sectionTab}
        >
          📊 Niveles
        </button>
        <button 
          onClick={() => setActiveSection('categorias')}
          style={activeSection === 'categorias' ? styles.activeSectionTab : styles.sectionTab}
        >
           Categorías
        </button>
        <button 
          onClick={() => setActiveSection('grupos')}
          style={activeSection === 'grupos' ? styles.activeSectionTab : styles.sectionTab}
        >
          👥 Grupos
        </button>
        <button 
          onClick={() => setActiveSection('zonas')}
          style={activeSection === 'zonas' ? styles.activeSectionTab : styles.sectionTab}
        >
          🗺️ Zonas
        </button>
      </div>

      <div style={styles.sectionContent}>
        {activeSection === 'niveles' && <NivelesList />}
        {activeSection === 'categorias' && <CategoriasList />}
        {activeSection === 'grupos' && <GruposList />}
        {activeSection === 'zonas' && <ZonasList />}
      </div>
    </div>
  );
};

const styles = {
  title: {
    fontSize: '1.8rem',
    color: '#170000',
    fontWeight: '600',
    marginBottom: '10px',
  },
  description: {
    color: '#4a2c2a',
    marginBottom: '25px',
    fontSize: '1rem',
  },
  sectionTabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '25px',
    flexWrap: 'wrap',
    borderBottom: '2px solid #e8d5b5',
    paddingBottom: '15px',
  },
  sectionTab: {
    backgroundColor: '#f5ebe0',
    color: '#4a2c2a',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  activeSectionTab: {
    backgroundColor: '#d2b178',
    color: '#170000',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  },
  sectionContent: {
    backgroundColor: '#faf8f3',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e8d5b5',
  },
};

export default Configuracion;