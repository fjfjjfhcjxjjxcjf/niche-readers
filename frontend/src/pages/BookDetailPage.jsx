import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, ExternalLink, BookmarkPlus, ShieldCheck } from 'lucide-react';

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
    <div style={{ maxWidth: '840px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', background: '#edf2f7' }}>
            {book.availability_type.replace(/_/g, ' ')}
          </span>
          {book.rights_statement && (
            <span style={{ fontSize: '12px', color: '#2b6cb0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} /> {book.rights_statement}
            </span>
          )}
        </div>

        <h1 style={{ margin: '14px 0 6px 0' }}>{book.title}</h1>
        
        <div style={{ margin: '0 0 20px 0', fontSize: '15px', color: '#4a5568' }}>
          Author:{' '}
          {book.author_profile_id ? (
            <Link to={`/author/${book.author_profile_id}`} style={{ color: '#2b6cb0', textDecoration: 'none', fontWeight: 600 }}>
              {book.author_name}
            </Link>
          ) : (
            <strong>{book.author_name}</strong>
          )}
        </div>

        <div style={{ margin: '20px 0', borderTop: '1px solid #edf2f7', borderBottom: '1px solid #edf2f7', padding: '16px 0' }}>
          <p style={{ lineHeight: '1.6', color: '#2d3748' }}>{book.description || 'No description available.'}</p>
          
          {/* Detailed Bibliographic Metadata Table */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', fontSize: '13px', color: '#718096', marginTop: '16px', background: '#f8fafc', padding: '14px', borderRadius: '6px' }}>
            <div><strong>Language:</strong> {book.language.toUpperCase()}</div>
            <div><strong>Year:</strong> {book.publication_year || 'N/A'}</div>
            <div><strong>Format:</strong> {book.file_format || 'EPUB'}</div>
            {book.isbn && <div><strong>ISBN:</strong> {book.isbn}</div>}
            {book.page_count && <div><strong>Pages:</strong> ~{book.page_count}</div>}
            {book.original_publisher && <div><strong>Publisher:</strong> {book.original_publisher}</div>}
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
