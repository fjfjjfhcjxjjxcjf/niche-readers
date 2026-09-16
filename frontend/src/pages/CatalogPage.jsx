import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CatalogPage() {
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState('');
  const [availability, setAvailability] = useState('');
  const [page, setPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState({ total_pages: 1, total_count: 0 });
  const [loading, setLoading] = useState(false);

  const fetchBooks = async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = {
        page: targetPage,
        page_size: 12
      };
      if (query.trim()) params.query = query.trim();
      if (availability) params.availability = availability;

      const res = await api.get('/books', { params });
      setBooks(res.data.items);
      setPaginationMeta({
        total_pages: res.data.total_pages,
        total_count: res.data.total_count
      });
      setPage(res.data.page);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks(1);
  }, [availability]);

  const handleSearch = () => {
    fetchBooks(1);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by title, author, genre, or keyword..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          style={{ flex: '1 1 300px', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '15px' }}
        />
        <select
          value={availability}
          onChange={(e) => { setAvailability(e.target.value); }}
          style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', background: '#fff' }}
        >
          <option value="">All Access Types</option>
          <option value="PUBLIC_DOMAIN">Public Domain (Free)</option>
          <option value="MARKETPLACE">Independent Authors</option>
          <option value="EXTERNAL_LEGAL">External Legal</option>
        </select>
        <button onClick={handleSearch} style={{ background: '#2b6cb0', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
          Search
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '14px', color: '#718096' }}>
          Showing {books.length} of {paginationMeta.total_count} books
        </span>
      </div>

      {loading ? <p style={{ textAlign: 'center', padding: '40px 0' }}>Searching catalog...</p> : (
        <>
          {books.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#718096' }}>
              <h3>No titles matched your search.</h3>
              <p>Try searching for broader keywords or resetting the availability filter.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {books.map((b) => (
                <div key={b.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#fff' }}>
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

          {/* Pagination Navigation */}
          {paginationMeta.total_pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginTop: '36px' }}>
              <button
                disabled={page <= 1}
                onClick={() => fetchBooks(page - 1)}
                style={{ padding: '8px 14px', border: '1px solid #cbd5e0', background: page <= 1 ? '#edf2f7' : '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Previous
              </button>
              <span style={{ fontSize: '14px', color: '#4a5568' }}>
                Page {page} of {paginationMeta.total_pages}
              </span>
              <button
                disabled={page >= paginationMeta.total_pages}
                onClick={() => fetchBooks(page + 1)}
                style={{ padding: '8px 14px', border: '1px solid #cbd5e0', background: page >= paginationMeta.total_pages ? '#edf2f7' : '#fff', cursor: page >= paginationMeta.total_pages ? 'not-allowed' : 'pointer', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}