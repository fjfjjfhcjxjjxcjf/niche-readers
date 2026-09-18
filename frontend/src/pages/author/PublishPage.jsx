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
    isbn: '',
    page_count: '',
    original_publisher: '',
    rights_statement: 'Author retains all digital rights.',
    price: '0.00'
  });
  const [manuscript, setManuscript] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
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
    Object.keys(formData).forEach((k) => {
      if (formData[k]) body.append(k, formData[k]);
    });
    body.append('manuscript', manuscript);
    if (coverImage) body.append('cover_image', coverImage);

    try {
      const res = await api.post('/authors/books', body, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/author/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to publish book.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '28px' }}>
        <h2 style={{ marginTop: 0 }}>Publish Independent Book</h2>
        <p style={{ color: '#718096', fontSize: '14px', marginTop: '-6px', marginBottom: '20px' }}>
          Submissions enter editorial review before public discovery.
        </p>
        
        {error && <div style={{ color: '#e53e3e', marginBottom: '14px', fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Book Title *</label>
            <input required type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '4px' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Description</label>
            <textarea rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '4px' }} />
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

          {/* Bibliographic Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>ISBN (Optional)</label>
              <input type="text" placeholder="e.g. 978-3-16-148410-0" value={formData.isbn} onChange={(e) => setFormData({ ...formData, isbn: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Est. Page Count</label>
              <input type="number" placeholder="e.g. 240" value={formData.page_count} onChange={(e) => setFormData({ ...formData, page_count: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '4px' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Original Publisher (if previously published)</label>
              <input type="text" value={formData.original_publisher} onChange={(e) => setFormData({ ...formData, original_publisher: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Rights / License Statement</label>
              <input type="text" value={formData.rights_statement} onChange={(e) => setFormData({ ...formData, rights_statement: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '4px' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Cover Image (JPEG, PNG — Auto-converted to WebP)</label>
            <input type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files[0])} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Manuscript (.epub, .pdf) *</label>
            <input required type="file" accept=".epub,.pdf" onChange={(e) => setManuscript(e.target.files[0])} />
          </div>

          <button type="submit" disabled={loading} style={{ background: '#2b6cb0', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, marginTop: '8px' }}>
            {loading ? 'Processing & Submitting...' : 'Submit to Editorial Review'}
          </button>
        </form>
      </div>
    </div>
  );
}
