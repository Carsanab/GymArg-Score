import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ usuario: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [particles, setParticles] = useState([]);

  // ✅ Generar partículas aleatorias al montar el componente
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100, // Posición horizontal aleatoria (0-100%)
        size: Math.random() * 4 + 2, // Tamaño entre 2px y 6px
        duration: Math.random() * 15 + 10, // Duración entre 10s y 25s
        delay: Math.random() * 10, // Delay inicial aleatorio
        opacity: Math.random() * 0.5 + 0.2, // Opacidad entre 0.2 y 0.7
      }));
      setParticles(newParticles);
    };
    generateParticles();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.usuario, formData.password);
      const rol = result.user?.rol?.toLowerCase();
      
      if (rol === 'admin') navigate('/admin');
      else if (rol === 'juez') navigate('/dashboard');
      else setError(`Rol no reconocido: ${rol}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* ✅ PARTÍCULAS FLOTANTES (Polvo de Magnesio / Destellos) */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.left}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            opacity: particle.opacity,
          }}
        />
      ))}

      <div style={styles.loginBox}>
        <div style={styles.logoContainer}>
          <img src="/logo.png" alt="GymArg Score Logo" style={styles.logo} />
        </div>
        
        <h1 style={styles.subtitle}>Iniciar Sesión</h1>
        
        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Usuario:</label>
            <input
              type="text"
              name="usuario"
              value={formData.usuario}
              onChange={handleChange}
              style={styles.input}
              required
              autoFocus
              placeholder="Tu usuario"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Contraseña:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
              required
              placeholder="Tu contraseña"
            />
          </div>

          <button type="submit" style={loading ? styles.buttonDisabled : styles.button} disabled={loading}>
            {loading ? '⏳ Iniciando...' : '🚀 Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `
      linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%),
      repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.02) 10px, rgba(255,255,255,0.02) 20px)
    `,
    padding: '0',
    margin: '0',
    position: 'relative',
    overflow: 'hidden',
  },
  loginBox: {
    backgroundColor: '#faf8f3',
    padding: '30px 35px',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(210, 177, 120, 0.3)',
    border: '2px solid #d2b178',
    width: '90%',
    maxWidth: '380px',
    position: 'relative',
    zIndex: 10,
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '15px',
  },
  logo: {
    width: '100px',
    height: 'auto',
    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#d2b178',
    textAlign: 'center',
    marginBottom: '25px',
    fontWeight: '700',
    borderBottom: '2px solid #e8d5b5',
    paddingBottom: '12px',
  },
  errorBox: {
    backgroundColor: 'rgba(216, 55, 45, 0.15)',
    color: '#d8372d',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '20px',
    borderLeft: '4px solid #d8372d',
    fontWeight: '600',
    fontSize: '0.9rem',
  },
  formGroup: {
    marginBottom: '18px',
  },
  label: {
    display: 'block',
    fontWeight: '700',
    color: '#170000',
    marginBottom: '6px',
    fontSize: '0.9rem',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '2px solid #d2b178',
    borderRadius: '6px',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    transition: 'all 0.3s ease',
    outline: 'none',
  },
  button: {
    width: '100%',
    backgroundColor: '#d8372d',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '14px',
    fontSize: '1.05rem',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '10px',
    boxShadow: '0 4px 15px rgba(216, 55, 45, 0.4)',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  buttonDisabled: {
    width: '100%',
    backgroundColor: '#cccccc',
    color: '#666666',
    border: 'none',
    borderRadius: '8px',
    padding: '14px',
    fontSize: '1.05rem',
    fontWeight: '700',
    cursor: 'not-allowed',
    marginTop: '10px',
    opacity: 0.7,
  },
};

// ✅ ESTILOS GLOBALES CON PARTÍCULAS FLOTANTES
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body, #root { width: 100%; margin: 0; padding: 0; overflow-x: hidden; }
  
  /* ✅ PARTÍCULAS FLOTANTES - Polvo de Magnesio / Destellos */
  .particle {
    position: absolute;
    bottom: -10px;
    background: radial-gradient(circle, rgba(210, 177, 120, 0.8) 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%);
    border-radius: 50%;
    pointer-events: none;
    z-index: 1;
    animation: floatUp linear infinite;
  }

  /* ✅ Animación: flotar desde abajo hacia arriba con movimiento lateral suave */
  @keyframes floatUp {
    0% {
      transform: translateY(0) translateX(0) scale(1);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    50% {
      transform: translateY(-50vh) translateX(30px) scale(1.2);
    }
    90% {
      opacity: 1;
    }
    100% {
      transform: translateY(-110vh) translateX(-20px) scale(0.8);
      opacity: 0;
    }
  }

  /* ✅ Efectos hover para inputs y botón */
  input:hover { border-color: #d8372d !important; box-shadow: 0 0 0 3px rgba(216, 55, 45, 0.1) !important; }
  input:focus { border-color: #d8372d !important; box-shadow: 0 0 0 4px rgba(216, 55, 45, 0.2) !important; }
  button:not(:disabled):hover { transform: translateY(-2px) !important; box-shadow: 0 8px 25px rgba(216, 55, 45, 0.5) !important; background-color: #c42f26 !important; }
  button:not(:disabled):active { transform: translateY(0) !important; }
`;
document.head.appendChild(styleSheet);

export default Login;