// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 80px)',
    padding: '2rem'
  };

  const formStyle = {
    backgroundColor: '#111',
    padding: '2rem',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '400px'
  };

  const titleStyle = {
    fontSize: '2rem',
    marginBottom: '1.5rem',
    textAlign: 'center',
    color: '#fff'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#333',
    color: '#fff',
    fontSize: '1rem'
  };

  const buttonStyle = {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#e50914',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginBottom: '1rem'
  };

  const linkStyle = {
    display: 'block',
    textAlign: 'center',
    color: '#ccc',
    textDecoration: 'none',
    fontSize: '0.9rem'
  };

  const errorStyle = {
    backgroundColor: '#d32f2f',
    color: '#fff',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    textAlign: 'center'
  };

  return (
    <div style={containerStyle}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <h2 style={titleStyle}>Sign In</h2>
        
        {error && <div style={errorStyle}>{error}</div>}
        
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          style={inputStyle}
        />
        
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
        
        <Link to="/register" style={linkStyle}>
          Don't have an account? Sign up
        </Link>
      </form>
    </div>
  );
};

export default Login;