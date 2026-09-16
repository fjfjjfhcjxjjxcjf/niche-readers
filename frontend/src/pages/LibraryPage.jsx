import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { BookOpen } from 'lucide-react';

export default function LibraryPage() {
  const [shelfItems, setShelfItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/library/shelf')
      .then((res) => setShelfItems(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading shelf...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto', padding: '0 20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Personal Library & Shelves</h2>
      {shelfItems.length === 0 ? (
        <p style={{ color: '#718096' }}>No books in your shelf yet. Browse the catalog to discover titles.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
          {shelfItems.map((item) => (
            <div key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#fff' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', background: '#e2e8f0' }}>
                {item.shelf_type.replace(/_/g, ' ')}
              </span>
              <h4 style={{ margin: '10px 0 4px 0' }}>{item.book.title}</h4>
              <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#718096' }}>{item.book.author_name}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link to={`/book/${item.book.id}`} style={{ textDecoration: 'none', color: '#4a5568', fontSize: '13px' }}>Details</Link>
                <Link to={`/reader/${item.book.id}`} style={{ textDecoration: 'none', color: '#2b6cb0', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <BookOpen size={14} /> Read
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}