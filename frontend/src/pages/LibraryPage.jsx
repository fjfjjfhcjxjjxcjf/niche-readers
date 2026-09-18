import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { BookOpen, Clock, CheckCircle2, Bookmark, FileText } from 'lucide-react';

export default function LibraryPage() {
  const [shelfItems, setShelfItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/library/shelf'),
      api.get('/library/stats/me')
    ])
      .then(([shelfRes, statsRes]) => {
        setShelfItems(shelfRes.data);
        setStats(statsRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading your library...</div>;

  return (
    <div style={{ maxWidth: '960px', margin: '30px auto', padding: '0 20px' }}>
      <h1 style={{ margin: '0 0 24px 0', fontSize: '26px' }}>My Library & Reading Room</h1>

      {/* Reader Statistics Card */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#ebf8ff', padding: '10px', borderRadius: '8px', color: '#3182ce' }}><Clock size={24} /></div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{stats.total_reading_minutes}m</div>
              <div style={{ fontSize: '12px', color: '#718096' }}>Total Time Read</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#f0fff4', padding: '10px', borderRadius: '8px', color: '#38a169' }}><CheckCircle2 size={24} /></div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{stats.total_books_read}</div>
              <div style={{ fontSize: '12px', color: '#718096' }}>Books Finished</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#fffaf0', padding: '10px', borderRadius: '8px', color: '#dd6b20' }}><Bookmark size={24} /></div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{stats.active_reading_count}</div>
              <div style={{ fontSize: '12px', color: '#718096' }}>Currently Reading</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#faf5ff', padding: '10px', borderRadius: '8px', color: '#805ad5' }}><FileText size={24} /></div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{stats.total_notes_count}</div>
              <div style={{ fontSize: '12px', color: '#718096' }}>Highlights & Notes</div>
            </div>
          </div>
        </div>
      )}

      {/* Shelves List */}
      <h3 style={{ marginBottom: '16px' }}>Saved & Purchased Titles</h3>
      {shelfItems.length === 0 ? (
        <p style={{ color: '#718096' }}>No titles on your shelves yet. Discover books in the catalog.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
          {shelfItems.map((item) => (
            <div key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', background: item.shelf_type === 'PURCHASED' ? '#feebc8' : '#e2e8f0' }}>
                  {item.shelf_type.replace(/_/g, ' ')}
                </span>
                <h4 style={{ margin: '10px 0 4px 0' }}>{item.book.title}</h4>
                <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#718096' }}>{item.book.author_name}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #edf2f7', paddingTop: '12px' }}>
                <Link to={`/book/${item.book.id}`} style={{ textDecoration: 'none', color: '#4a5568', fontSize: '13px' }}>Details</Link>
                <Link to={`/reader/${item.book.id}`} style={{ textDecoration: 'none', color: '#2b6cb0', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <BookOpen size={14} /> Read Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
