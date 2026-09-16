import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Search, Book, ExternalLink, ShieldCheck } from 'lucide-react';

export default function CatalogPage() {
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState('');
  const [availability, setAvailability] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (query.trim()) params.query = query.trim();
      if (availability) params.availability = availability;
      const res = await api.get('/books', { params });
      setBooks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [availability]);

  return (
    <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Search by title, author, or genre..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchBooks()}
          style={{ flex: 1, padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '15px' }}
        />
        <select
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }}
        >
          <option value="">All Access Types</option>
          <option value="PUBLIC_DOMAIN">Public Domain (Free)</option>
          <option value="MARKETPLACE">Independent Authors</option>
          <option value="EXTERNAL_LEGAL">External Legal</option>
        </select>
        <button onClick={fetchBooks} style={{ background: '#2b6cb0', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}>
          Search
        </button>
      </div>

      {loading ? <p>Loading catalog...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {books.map((b) => (
            <div key={b.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#fff' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px', background: b.availability_type === 'PUBLIC_DOMAIN' ? '#c6f6d5' : b.availability_type === 'MARKETPLACE' ? '#feebc8' : '#e2e8f0' }}>
                  {b.availability_type.replace('_', ' ')}
                </span>
                <h3 style={{ margin: '12px 0 4px 0', fontSize: '17px' }}>{b.title}</h3>
                <p style={{ margin: '0 0 10px 0', color: '#718096', fontSize: '14px' }}>by {b.author_name}</p>
                <p style={{ fontSize: '13px', color: '#4a5568', lineHeight: '1.4' }}>
                  {b.description ? b.description.slice(0, 110) + '...' : 'No description provided.'}
                </p>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>{b.price > 0 ? `$${b.price}` : 'Free'}</span>
                <Link to={`/book/${b.id}`} style={{ textDecoration: 'none', color: '#2b6cb0', fontSize: '14px', fontWeight: 500 }}>View Details →</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}