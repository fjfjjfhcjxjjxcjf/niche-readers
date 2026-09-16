import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function PublishPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    language: 'en',
    publication_year: new Date().getFullYear(),
    price: '0.00'
  });
  const [manuscript, setManuscript] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user?.role !== 'AUTHOR') {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Author access privileges required.</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!manuscript) return setError('Manuscript file (.epub or .pdf) is required.');

    setLoading(true);
    setError('');

    const body = new FormData();
    Object.keys(formData).forEach((k) => body.append(k, formData[k]));
    body.append('manuscript', manuscript);

    try {
      const res = await api.post('/authors/books', body, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate(`/book/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to publish book.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '28px' }}>
        <h2 style={{ marginTop: 0 }}>Publish Independent Book</h2>
        {error && <div style={{ color: '#e53e3e', marginBottom: '14px', fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Book Title *</label>
            <input required type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '4px' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Description</label>
            <textarea rows="4" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '4px' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Genre</label>
              <input type="text" placeholder="e.g. Speculative Fiction" value={formData.genre} onChange={(e) => setFormData({ ...formData, genre: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Price (USD)</label>
              <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '4px' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Manuscript (.epub, .pdf) *</label>
            <input required type="file" accept=".epub,.pdf" onChange={(e) => setManuscript(e.target.files[0])} />
          </div>

          <button type="submit" disabled={loading} style={{ background: '#2b6cb0', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, marginTop: '8px' }}>
            {loading ? 'Uploading & Publishing...' : 'Publish to Marketplace'}
          </button>
        </form>
      </div>
    </div>
  );
}