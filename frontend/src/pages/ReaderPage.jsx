import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ePub from 'epubjs';
import api from '../services/api';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

export default function ReaderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const viewerRef = useRef(null);
  const renditionRef = useRef(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let bookInstance = null;

    const loadBookStream = async () => {
      try {
        const response = await api.get(`/library/content/${id}`, {
          responseType: 'arraybuffer'
        });

        bookInstance = ePub(response.data);
        const rendition = bookInstance.renderTo(viewerRef.current, {
          width: '100%',
          height: '650px',
          flow: 'paginated'
        });

        renditionRef.current = rendition;
        await rendition.display();
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.detail || 'Unable to access or render book content.');
        setLoading(false);
      }
    };

    loadBookStream();

    return () => {
      if (bookInstance) bookInstance.destroy();
    };
  }, [id]);

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#4a5568' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => renditionRef.current?.prev()} style={{ padding: '6px 12px', cursor: 'pointer' }}><ChevronLeft size={18} /></button>
          <button onClick={() => renditionRef.current?.next()} style={{ padding: '6px 12px', cursor: 'pointer' }}><ChevronRight size={18} /></button>
        </div>
      </div>

      {loading && <p style={{ textAlign: 'center' }}>Loading manuscript contents...</p>}
      {error && <div style={{ padding: '20px', background: '#fff5f5', color: '#c53030', borderRadius: '8px' }}>{error}</div>}

      <div ref={viewerRef} style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: '8px', minHeight: '650px' }} />
    </div>
  );
}