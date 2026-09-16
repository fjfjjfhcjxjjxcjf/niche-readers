import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { Globe, BookOpen, User, Calendar } from 'lucide-react';

export default function AuthorPublicProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuthorData = async () => {
      setLoading(true);
      try {
        const [profileRes, booksRes] = await Promise.all([
          api.get(`/authors/${id}/public`),
          api.get(`/authors/${id}/books`)
        ]);
        setProfile(profileRes.data);
        setBooks(booksRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorData();
  }, [id]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading author showcase...</div>;
  if (!profile) return <div style={{ padding: '40px', textAlign: 'center' }}>Author profile not found.</div>;

  return (
    <div style={{ maxWidth: '960px', margin: '30px auto', padding: '0 20px' }}>
      {/* Header Bio Card */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '30px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#edf2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5568' }}>
            <User size={40} />
          </div>
          <div>
            <h1 style={{ margin: '0 0 6px 0', fontSize: '24px' }}>{profile.display_name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#718096', fontSize: '13px' }}>
              <span>Published Titles: <strong>{profile.published_books_count}</strong></span>
              {profile.website_url && (
                <a href={profile.website_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2b6cb0', textDecoration: 'none' }}>
                  <Globe size={14} /> Website
                </a>
              )}
            </div>
          </div>
        </div>

        <p style={{ marginTop: '20px', color: '#2d3748', lineHeight: '1.6', fontSize: '15px' }}>
          {profile.bio || 'Independent author publishing on the platform.'}
        </p>
      </div>

      {/* Published Works Showcase */}
      <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Published Works</h3>
      {books.length === 0 ? (
        <div style={{ padding: '30px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center', color: '#718096' }}>
          No public titles currently listed.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {books.map((b) => (
            <div key={b.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px', background: '#feebc8', color: '#744210' }}>
                  INDEPENDENT
                </span>
                <h4 style={{ margin: '10px 0 6px 0', fontSize: '16px' }}>{b.title}</h4>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#718096' }}>{b.genre || 'Literature'}</p>
                <p style={{ fontSize: '13px', color: '#4a5568', lineHeight: '1.4' }}>
                  {b.description ? b.description.slice(0, 100) + '...' : 'No description provided.'}
                </p>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>${b.price}</span>
                <Link to={`/book/${b.id}`} style={{ textDecoration: 'none', color: '#2b6cb0', fontSize: '14px', fontWeight: 500 }}>
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}