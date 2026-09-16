import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { PlusCircle, DollarSign, Users, BookMarked, Eye, Archive } from 'lucide-react';

export default function AuthorDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = () => {
    setLoading(true);
    api.get('/authors/dashboard')
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const toggleBookStatus = async (bookId, currentStatus) => {
    const nextStatus = currentStatus === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED';
    try {
      await api.patch(`/authors/books/${bookId}`, { status: nextStatus });
      fetchDashboard();
    } catch (err) {
      alert('Failed to update book status.');
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading author analytics...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>Author Studio</h1>
          <p style={{ margin: '4px 0 0 0', color: '#718096', fontSize: '14px' }}>Manage published manuscripts and monitor readership metrics.</p>
        </div>
        <Link to="/publish" style={{ textDecoration: 'none', background: '#2b6cb0', color: '#fff', padding: '10px 18px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
          <PlusCircle size={16} /> Publish New Book
        </Link>
      </div>

      {/* Analytics KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '30px' }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#4a5568' }}>
            <DollarSign size={20} color="#2b6cb0" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Total Revenue</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '10px', color: '#2d3748' }}>
            ${stats?.total_revenue || '0.00'}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#4a5568' }}>
            <Users size={20} color="#2f855a" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Total Readers</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '10px', color: '#2d3748' }}>
            {stats?.total_readers || 0}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#4a5568' }}>
            <BookMarked size={20} color="#b7791f" />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Published Titles</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '10px', color: '#2d3748' }}>
            {stats?.total_books || 0}
          </div>
        </div>
      </div>

      {/* Manuscripts Management Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Your Manuscripts</h3>
        </div>

        {stats?.books.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>
            No books uploaded yet. Publish your first manuscript to start distributing.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f7fafc', color: '#718096', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 20px' }}>Title</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Price</th>
                  <th style={{ padding: '12px' }}>Sales</th>
                  <th style={{ padding: '12px' }}>Saved to Shelf</th>
                  <th style={{ padding: '12px 20px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats?.books.map((b) => (
                  <tr key={b.book_id} style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 600 }}>{b.title}</td>
                    <td style={{ padding: '14px 12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', background: b.status === 'PUBLISHED' ? '#c6f6d5' : '#fed7d7', color: b.status === 'PUBLISHED' ? '#22543d' : '#742a2a' }}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px' }}>${b.price}</td>
                    <td style={{ padding: '14px 12px' }}>{b.total_purchases} (${b.total_revenue})</td>
                    <td style={{ padding: '14px 12px' }}>{b.shelf_saves_count} times</td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <Link to={`/book/${b.book_id}`} style={{ color: '#2b6cb0', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Eye size={14} /> View
                        </Link>
                        <button 
                          onClick={() => toggleBookStatus(b.book_id, b.status)}
                          style={{ border: 'none', background: 'none', color: '#718096', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                        >
                          <Archive size={14} /> {b.status === 'PUBLISHED' ? 'Archive' : 'Publish'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}