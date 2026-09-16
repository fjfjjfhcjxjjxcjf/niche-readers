import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, ExternalLink, BookmarkPlus, CheckCircle } from 'lucide-react';

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [book, setBook] = useState(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    api.get(`/books/${id}`)
      .then((res) => setBook(res.data))
      .catch((err) => console.error(err));
  }, [id]);

  const handleAddToShelf = async (shelfType) => {
    if (!user) return navigate('/login');
    try {
      await api.post('/library/shelf', { book_id: id, shelf_type: shelfType });
      setFeedback(`Saved to ${shelfType.replace(/_/g, ' ')}!`);
    } catch (err) {
      setFeedback('Error adding to shelf.');
    }
  };

  const handleMockCheckout = async () => {
    if (!user) return navigate('/login');
    try {
      await api.post(`/library/checkout/mock/${id}`);
      setFeedback('Purchased successfully! Available in your Library.');
    } catch (err) {
      setFeedback('Purchase transaction failed.');
    }
  };

  if (!book) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading book...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '30px' }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', background: '#edf2f7' }}>
          {book.availability_type.replace(/_/g, ' ')}
        </span>
        <h1 style={{ margin: '14px 0 6px 0' }}>{book.title}</h1>
        <h3 style={{ margin: '0 0 20px 0', color: '#4a5568', fontWeight: 400 }}>Author: {book.author_name}</h3>

        <div style={{ margin: '20px 0', borderTop: '1px solid #edf2f7', borderBottom: '1px solid #edf2f7', padding: '16px 0' }}>
          <p style={{ lineHeight: '1.6', color: '#2d3748' }}>{book.description || 'No description available.'}</p>
          <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#718096', marginTop: '12px' }}>
            <span>Language: {book.language.toUpperCase()}</span>
            <span>Published: {book.publication_year || 'N/A'}</span>
            <span>Format: {book.file_format || 'Metadata Only'}</span>
          </div>
        </div>

        {feedback && <div style={{ padding: '10px', background: '#ebf8ff', color: '#2b6cb0', borderRadius: '6px', marginBottom: '16px' }}>{feedback}</div>}

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {book.availability_type === 'PUBLIC_DOMAIN' && (
            <button onClick={() => navigate(`/reader/${book.id}`)} style={{ background: '#2f855a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={16} /> Read Now (Public Domain)
            </button>
          )}

          {book.availability_type === 'EXTERNAL_LEGAL' && book.external_url && (
            <a href={book.external_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', background: '#3182ce', color: '#fff', padding: '10px 20px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ExternalLink size={16} /> Open Legal Source
            </a>
          )}

          {book.availability_type === 'MARKETPLACE' && (
            <>
              <button onClick={handleMockCheckout} style={{ background: '#dd6b20', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}>
                Buy Book (${book.price})
              </button>
              <button onClick={() => navigate(`/reader/${book.id}`)} style={{ background: '#4a5568', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}>
                Open Reader
              </button>
            </>
          )}

          <button onClick={() => handleAddToShelf('WANT_TO_READ')} style={{ border: '1px solid #cbd5e0', background: '#fff', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BookmarkPlus size={16} /> Want to Read
          </button>
        </div>
      </div>
    </div>
  );
}