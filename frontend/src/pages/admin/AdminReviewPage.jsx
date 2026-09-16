import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, XCircle, Clock, BookOpen } from 'lucide-react';

export default function AdminReviewPage() {
  const { user } = useAuth();
  const [pendingBooks, setPendingBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState('');

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/books/pending');
      setPendingBooks(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchPending();
    }
  }, [user]);

  if (user?.role !== 'ADMIN') {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Administrator privileges required.</div>;
  }

  const handleApprove = async (id) => {
    try {
      await api.post(`/admin/books/${id}/approve`);
      setActionFeedback('Book approved and published to catalog.');
      fetchPending();
    } catch (e) {
      setActionFeedback('Approval action failed.');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/admin/books/${id}/reject`, { rejection_reason: 'Quality or legal guidelines' });
      setActionFeedback('Book submission rejected.');
      fetchPending();
    } catch (e) {
      setActionFeedback('Rejection action failed.');
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Clock size={24} color="#b7791f" />
        <h2 style={{ margin: 0 }}>Editorial Review Queue</h2>
      </div>

      {actionFeedback && (
        <div style={{ padding: '12px', background: '#ebf8ff', color: '#2b6cb0', borderRadius: '6px', marginBottom: '16px' }}>
          {actionFeedback}
        </div>
      )}

      {loading ? <p>Loading submissions...</p> : (
        <>
          {pendingBooks.length === 0 ? (
            <div style={{ padding: '40px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#718096' }}>The editorial queue is empty. All submissions have been processed.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pendingBooks.map((b) => (
                <div key={b.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ flex: '1 1 500px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px', background: '#feebc8', color: '#744210' }}>
                      PENDING REVIEW
                    </span>
                    <h3 style={{ margin: '8px 0 4px 0' }}>{b.title}</h3>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#4a5568' }}>Author: <strong>{b.author_name}</strong> | Format: {b.file_format} | Price: ${b.price}</p>
                    <p style={{ fontSize: '13px', color: '#718096', lineHeight: '1.5' }}>{b.description || 'No description provided.'}</p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      onClick={() => handleApprove(b.id)}
                      style={{ background: '#2f855a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}
                    >
                      <CheckCircle2 size={16} /> Approve & Publish
                    </button>
                    <button
                      onClick={() => handleReject(b.id)}
                      style={{ background: '#e53e3e', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}