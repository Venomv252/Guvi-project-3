// frontend/src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate to login even if logout fails
      navigate('/login');
    }
  };

  const navStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#000',
    borderBottom: '1px solid #333'
  };

  const logoStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#e50914',
    textDecoration: 'none'
  };

  const navLinksStyle = {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center'
  };

  const linkStyle = {
    color: '#fff',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    transition: 'background-color 0.2s'
  };

  const buttonStyle = {
    ...linkStyle,
    backgroundColor: '#e50914',
    border: 'none',
    cursor: 'pointer'
  };

  return (
    <nav style={navStyle}>
      <Link to="/" style={logoStyle}>Netflix Clone</Link>
      
      {user && (
        <div style={navLinksStyle}>
          <Link to="/" style={linkStyle}>Home</Link>
          <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
          <Link to="/subscription" style={linkStyle}>Subscription</Link>
          <span style={{ color: '#ccc' }}>Welcome, {user.name}</span>
          <button onClick={handleLogout} style={buttonStyle}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;