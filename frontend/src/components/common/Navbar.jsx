import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Library, PlusCircle, LogOut, BarChart2, ShieldAlert } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav style={{ borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link to="/" style={{ textDecoration: 'none', fontWeight: 'bold', fontSize: '18px', color: '#1a202c', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={20} /> NicheReader
        </Link>
        <Link to="/" style={{ textDecoration: 'none', color: '#4a5568' }}>Catalog</Link>
        {user && <Link to="/library" style={{ textDecoration: 'none', color: '#4a5568', display: 'flex', alignItems: 'center', gap: '4px' }}><Library size={16} /> My Shelf</Link>}
        {user?.role === 'AUTHOR' && (
          <>
            <Link to="/publish" style={{ textDecoration: 'none', color: '#2b6cb0', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
              <PlusCircle size={16} /> Publish
            </Link>
            <Link to="/author/dashboard" style={{ textDecoration: 'none', color: '#4a5568', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <BarChart2 size={16} /> Author Studio
            </Link>
          </>
        )}
        {user?.role === 'ADMIN' && (
          <Link to="/admin/review" style={{ textDecoration: 'none', color: '#c53030', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <ShieldAlert size={16} /> Review Queue
          </Link>
        )}
      </div>
      <div>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px', color: '#4a5568' }}>{user.email} ({user.role})</span>
            <button onClick={() => { logout(); navigate('/'); }} style={{ background: 'none', border: '1px solid #cbd5e0', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <LogOut size={14} /> Logout
            </button>
          </div>
        ) : (
          <Link to="/login" style={{ textDecoration: 'none', background: '#2b6cb0', color: '#fff', padding: '6px 16px', borderRadius: '4px' }}>Sign In</Link>
        )}
      </div>
    </nav>
  );
}