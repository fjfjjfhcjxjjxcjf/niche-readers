import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('READER');
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register(email, password, role);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication error.');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '30px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
      <h2 style={{ marginTop: 0 }}>{isRegister ? 'Create Account' : 'Sign In'}</h2>
      {error && <div style={{ color: '#e53e3e', fontSize: '14px', marginBottom: '12px' }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Email</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e0', borderRadius: '4px' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Password</label>
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e0', borderRadius: '4px' }} />
        </div>
        {isRegister && (
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: '8px' }}>
              <option value="READER">Reader</option>
              <option value="AUTHOR">Independent Author</option>
            </select>
          </div>
        )}
        <button type="submit" style={{ background: '#2b6cb0', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
          {isRegister ? 'Register' : 'Login'}
        </button>
      </form>
      <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px' }}>
        <button onClick={() => setIsRegister(!isRegister)} style={{ background: 'none', border: 'none', color: '#2b6cb0', cursor: 'pointer' }}>
          {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
        </button>
      </div>
    </div>
  );
}