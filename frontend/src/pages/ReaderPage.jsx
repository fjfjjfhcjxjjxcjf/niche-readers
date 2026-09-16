import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ePub from 'epubjs';
import api from '../services/api';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft, 
  Sun, 
  Moon, 
  BookOpen, 
  Type, 
  List 
} from 'lucide-react';

const THEMES = {
  light: {
    name: 'Light',
    bg: '#ffffff',
    color: '#2d3748',
    readerBg: '#ffffff',
    readerColor: '#1a202c'
  },
  sepia: {
    name: 'Sepia',
    bg: '#fbf0d9',
    color: '#5f4b32',
    readerBg: '#fbf0d9',
    readerColor: '#433422'
  },
  dark: {
    name: 'Dark',
    bg: '#1a202c',
    color: '#e2e8f0',
    readerBg: '#12161f',
    readerColor: '#cbd5e0'
  }
};

export default function ReaderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const viewerRef = useRef(null);
  const renditionRef = useRef(null);
  const bookRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTheme, setCurrentTheme] = useState('light');
  const [fontSize, setFontSize] = useState(100);
  const [toc, setToc] = useState([]);
  const [showToc, setShowToc] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('');

  const storageProgressKey = `reader_progress_${id}`;

  const applyTheme = (themeKey, rendition) => {
    if (!rendition) return;
    const theme = THEMES[themeKey];
    rendition.themes.default({
      body: {
        background: `${theme.readerBg} !important`,
        color: `${theme.readerColor} !important`,
        'font-family': 'Charter, Georgia, serif !important',
        'line-height': '1.7 !important',
        padding: '0 20px !important'
      }
    });
  };

  useEffect(() => {
    let book = null;

    const loadBookStream = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/library/content/${id}`, {
          responseType: 'arraybuffer'
        });

        book = ePub(response.data);
        bookRef.current = book;

        // Extract Table of Contents
        const navigation = await book.loaded.navigation;
        if (navigation && navigation.toc) {
          setToc(navigation.toc);
        }

        const rendition = book.renderTo(viewerRef.current, {
          width: '100%',
          height: '620px',
          flow: 'paginated',
          spread: 'never'
        });
        renditionRef.current = rendition;

        applyTheme(currentTheme, rendition);
        rendition.themes.fontSize(`${fontSize}%`);

        // Restore saved position or start from beginning
        const savedCfi = localStorage.getItem(storageProgressKey);
        await rendition.display(savedCfi || undefined);

        // Track reading progress on page change
        rendition.on('relocated', (location) => {
          if (location && location.start) {
            setCurrentLocation(location.start.cfi);
            localStorage.setItem(storageProgressKey, location.start.cfi);
          }
        });

        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.detail || 'Unable to access or render book content.');
        setLoading(false);
      }
    };

    loadBookStream();

    return () => {
      if (book) book.destroy();
    };
  }, [id]);

  const changeTheme = (themeKey) => {
    setCurrentTheme(themeKey);
    if (renditionRef.current) {
      applyTheme(themeKey, renditionRef.current);
    }
  };

  const changeFontSize = (delta) => {
    const newSize = Math.min(Math.max(fontSize + delta, 70), 160);
    setFontSize(newSize);
    if (renditionRef.current) {
      renditionRef.current.themes.fontSize(`${newSize}%`);
    }
  };

  const jumpToHref = (href) => {
    if (renditionRef.current) {
      renditionRef.current.display(href);
      setShowToc(false);
    }
  };

  const themeConfig = THEMES[currentTheme];

  return (
    <div style={{ background: themeConfig.bg, color: themeConfig.color, minHeight: 'calc(100vh - 60px)', transition: 'background 0.2s ease, color 0.2s ease' }}>
      <div style={{ maxWidth: '940px', margin: '0 auto', padding: '16px 20px' }}>
        
        {/* Top Control Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px', paddingBottom: '12px', borderBottom: `1px solid ${currentTheme === 'dark' ? '#2d3748' : '#e2e8f0'}` }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => navigate(-1)} 
              style={{ border: 'none', background: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}
            >
              <ArrowLeft size={16} /> Library
            </button>
            <button 
              onClick={() => setShowToc(!showToc)} 
              style={{ display: 'flex', alignItems: 'center', gap: '4px', border: `1px solid ${currentTheme === 'dark' ? '#4a5568' : '#cbd5e0'}`, background: 'none', color: 'inherit', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
            >
              <List size={14} /> Contents
            </button>
          </div>

          {/* Reader Preferences */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Font Size Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button onClick={() => changeFontSize(-10)} style={{ padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #cbd5e0', background: 'none', color: 'inherit', fontWeight: 'bold' }}>A-</button>
              <span style={{ fontSize: '13px', minWidth: '40px', textAlign: 'center' }}>{fontSize}%</span>
              <button onClick={() => changeFontSize(10)} style={{ padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #cbd5e0', background: 'none', color: 'inherit', fontWeight: 'bold' }}>A+</button>
            </div>

            {/* Theme Selectors */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                title="Light Mode"
                onClick={() => changeTheme('light')} 
                style={{ padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', border: currentTheme === 'light' ? '2px solid #3182ce' : '1px solid #cbd5e0', background: '#fff', color: '#1a202c' }}
              >
                Light
              </button>
              <button 
                title="Sepia Mode"
                onClick={() => changeTheme('sepia')} 
                style={{ padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', border: currentTheme === 'sepia' ? '2px solid #b7791f' : '1px solid #cbd5e0', background: '#fbf0d9', color: '#5f4b32' }}
              >
                Sepia
              </button>
              <button 
                title="Dark Mode"
                onClick={() => changeTheme('dark')} 
                style={{ padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', border: currentTheme === 'dark' ? '2px solid #63b3ed' : '1px solid #4a5568', background: '#1a202c', color: '#e2e8f0' }}
              >
                Dark
              </button>
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => renditionRef.current?.prev()} style={{ padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #cbd5e0', background: 'none', color: 'inherit' }}><ChevronLeft size={16} /></button>
              <button onClick={() => renditionRef.current?.next()} style={{ padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #cbd5e0', background: 'none', color: 'inherit' }}><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>

        {/* Table of Contents Drawer */}
        {showToc && (
          <div style={{ background: currentTheme === 'dark' ? '#2d3748' : '#fff', border: `1px solid ${currentTheme === 'dark' ? '#4a5568' : '#e2e8f0'}`, borderRadius: '8px', padding: '16px', marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Table of Contents</h4>
            {toc.length === 0 ? <p style={{ fontSize: '13px', color: '#a0aec0' }}>No chapters indexed.</p> : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {toc.map((item, idx) => (
                  <li key={idx} style={{ padding: '6px 0', borderBottom: '1px solid #edf2f7' }}>
                    <button 
                      onClick={() => jumpToHref(item.href)}
                      style={{ background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer', textAlign: 'left', fontSize: '14px', width: '100%' }}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {loading && <p style={{ textAlign: 'center', padding: '40px 0' }}>Rendering manuscript flow...</p>}
        {error && <div style={{ padding: '16px', background: '#fff5f5', color: '#c53030', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

        {/* Reader Canvas Container */}
        <div 
          ref={viewerRef} 
          style={{ 
            borderRadius: '10px', 
            overflow: 'hidden', 
            minHeight: '620px', 
            boxShadow: currentTheme === 'dark' ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.06)',
            background: themeConfig.readerBg
          }} 
        />
      </div>
    </div>
  );
}