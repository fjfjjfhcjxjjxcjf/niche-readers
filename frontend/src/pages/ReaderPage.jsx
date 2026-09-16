import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ePub from 'epubjs';
import api from '../services/api';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft, 
  List, 
  Highlighter, 
  Trash2,
  Check
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

const HIGHLIGHT_COLORS = {
  yellow: 'rgba(254, 240, 138, 0.5)',
  green: 'rgba(187, 247, 208, 0.5)',
  blue: 'rgba(191, 219, 254, 0.5)',
  pink: 'rgba(251, 207, 232, 0.5)'
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
  const [showNotes, setShowNotes] = useState(false);

  // Annotations state
  const [annotations, setAnnotations] = useState([]);
  const [selectedRange, setSelectedRange] = useState(null);
  const [activeColor, setActiveColor] = useState('yellow');
  const [noteInput, setNoteInput] = useState('');

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

  const loadAnnotations = async () => {
    try {
      const res = await api.get(`/library/books/${id}/annotations`);
      setAnnotations(res.data);
      return res.data;
    } catch (e) {
      console.warn("Could not fetch remote annotations:", e);
      return [];
    }
  };

  useEffect(() => {
    let book = null;

    const loadBookStream = async () => {
      try {
        setLoading(true);
        const [bookResponse, remoteAnnotations] = await Promise.all([
          api.get(`/library/content/${id}`, { responseType: 'arraybuffer' }),
          loadAnnotations()
        ]);

        book = ePub(bookResponse.data);
        bookRef.current = book;

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

        // Register saved annotations on the rendition
        remoteAnnotations.forEach((anno) => {
          rendition.annotations.add('highlight', anno.cfi_range, {}, (e) => {}, 'hl', {
            fill: HIGHLIGHT_COLORS[anno.color] || HIGHLIGHT_COLORS.yellow
          });
        });

        // Listen for text selection
        rendition.on('selected', (cfiRange, contents) => {
          book.getRange(cfiRange).then((range) => {
            if (range) {
              const text = range.toString();
              if (text.trim()) {
                setSelectedRange({ cfiRange, text });
              }
            }
          });
        });

        const savedCfi = localStorage.getItem(storageProgressKey);
        await rendition.display(savedCfi || undefined);

        rendition.on('relocated', (location) => {
          if (location && location.start) {
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

  const saveCurrentHighlight = async () => {
    if (!selectedRange) return;
    try {
      const res = await api.post(`/library/books/${id}/annotations`, {
        cfi_range: selectedRange.cfiRange,
        highlighted_text: selectedRange.text,
        note: noteInput.trim() || null,
        color: activeColor
      });

      // Render highlight locally on epubjs
      renditionRef.current?.annotations.add('highlight', selectedRange.cfiRange, {}, () => {}, 'hl', {
        fill: HIGHLIGHT_COLORS[activeColor]
      });

      setAnnotations([res.data, ...annotations]);
      setSelectedRange(null);
      setNoteInput('');
    } catch (e) {
      console.error('Failed to save highlight', e);
    }
  };

  const deleteAnnotation = async (annotationId, cfiRange) => {
    try {
      await api.delete(`/library/annotations/${annotationId}`);
      renditionRef.current?.annotations.remove(cfiRange, 'highlight');
      setAnnotations(annotations.filter((a) => a.id !== annotationId));
    } catch (e) {
      console.error('Failed to delete annotation', e);
    }
  };

  const jumpToCfi = (cfi) => {
    if (renditionRef.current) {
      renditionRef.current.display(cfi);
    }
  };

  const themeConfig = THEMES[currentTheme];

  return (
    <div style={{ background: themeConfig.bg, color: themeConfig.color, minHeight: 'calc(100vh - 60px)', transition: 'background 0.2s ease, color 0.2s ease' }}>
      <div style={{ maxWidth: '940px', margin: '0 auto', padding: '16px 20px' }}>
        
        {/* Navigation & Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px', paddingBottom: '12px', borderBottom: `1px solid ${currentTheme === 'dark' ? '#2d3748' : '#e2e8f0'}` }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={() => navigate(-1)} 
              style={{ border: 'none', background: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}
            >
              <ArrowLeft size={16} /> Library
            </button>
            <button 
              onClick={() => { setShowToc(!showToc); setShowNotes(false); }} 
              style={{ display: 'flex', alignItems: 'center', gap: '4px', border: `1px solid ${currentTheme === 'dark' ? '#4a5568' : '#cbd5e0'}`, background: 'none', color: 'inherit', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
            >
              <List size={14} /> Contents
            </button>
            <button 
              onClick={() => { setShowNotes(!showNotes); setShowToc(false); }} 
              style={{ display: 'flex', alignItems: 'center', gap: '4px', border: `1px solid ${currentTheme === 'dark' ? '#4a5568' : '#cbd5e0'}`, background: 'none', color: 'inherit', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
            >
              <Highlighter size={14} /> Notes ({annotations.length})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button onClick={() => changeFontSize(-10)} style={{ padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #cbd5e0', background: 'none', color: 'inherit', fontWeight: 'bold' }}>A-</button>
              <button onClick={() => changeFontSize(10)} style={{ padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #cbd5e0', background: 'none', color: 'inherit', fontWeight: 'bold' }}>A+</button>
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => changeTheme('light')} style={{ padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #cbd5e0', background: '#fff', color: '#1a202c', fontSize: '12px' }}>Light</button>
              <button onClick={() => changeTheme('sepia')} style={{ padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #cbd5e0', background: '#fbf0d9', color: '#5f4b32', fontSize: '12px' }}>Sepia</button>
              <button onClick={() => changeTheme('dark')} style={{ padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #4a5568', background: '#1a202c', color: '#e2e8f0', fontSize: '12px' }}>Dark</button>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => renditionRef.current?.prev()} style={{ padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #cbd5e0', background: 'none', color: 'inherit' }}><ChevronLeft size={16} /></button>
              <button onClick={() => renditionRef.current?.next()} style={{ padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', border: '1px solid #cbd5e0', background: 'none', color: 'inherit' }}><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>

        {/* Highlight Creation Floating Card */}
        {selectedRange && (
          <div style={{ background: currentTheme === 'dark' ? '#2d3748' : '#fff', border: `1px solid ${currentTheme === 'dark' ? '#4a5568' : '#e2e8f0'}`, padding: '16px', borderRadius: '8px', marginBottom: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontStyle: 'italic', color: '#718096' }}>"{selectedRange.text.slice(0, 90)}..."</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
              {Object.keys(HIGHLIGHT_COLORS).map((colorKey) => (
                <button
                  key={colorKey}
                  onClick={() => setActiveColor(colorKey)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: activeColor === colorKey ? '2px solid #3182ce' : '1px solid #cbd5e0',
                    background: HIGHLIGHT_COLORS[colorKey],
                    cursor: 'pointer'
                  }}
                />
              ))}
              <input
                type="text"
                placeholder="Add an optional note..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '13px' }}
              />
              <button onClick={saveCurrentHighlight} style={{ background: '#2b6cb0', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                Save
              </button>
              <button onClick={() => setSelectedRange(null)} style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: '13px' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Annotations List Drawer */}
        {showNotes && (
          <div style={{ background: currentTheme === 'dark' ? '#2d3748' : '#fff', border: `1px solid ${currentTheme === 'dark' ? '#4a5568' : '#e2e8f0'}`, borderRadius: '8px', padding: '16px', marginBottom: '16px', maxHeight: '240px', overflowY: 'auto' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Saved Highlights & Notes</h4>
            {annotations.length === 0 ? <p style={{ fontSize: '13px', color: '#a0aec0' }}>Select any text in the book to create your first highlight.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {annotations.map((a) => (
                  <div key={a.id} style={{ borderLeft: `4px solid ${a.color}`, paddingLeft: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ cursor: 'pointer', flex: 1 }} onClick={() => jumpToCfi(a.cfi_range)}>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>"{a.highlighted_text}"</p>
                      {a.note && <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#718096' }}>Note: {a.note}</p>}
                    </div>
                    <button onClick={() => deleteAnnotation(a.id, a.cfi_range)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: '2px' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Table of Contents Drawer */}
        {showToc && (
          <div style={{ background: currentTheme === 'dark' ? '#2d3748' : '#fff', border: `1px solid ${currentTheme === 'dark' ? '#4a5568' : '#e2e8f0'}`, borderRadius: '8px', padding: '16px', marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Table of Contents</h4>
            {toc.length === 0 ? <p style={{ fontSize: '13px', color: '#a0aec0' }}>No chapters indexed.</p> : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {toc.map((item, idx) => (
                  <li key={idx} style={{ padding: '6px 0', borderBottom: '1px solid #edf2f7' }}>
                    <button 
                      onClick={() => { renditionRef.current?.display(item.href); setShowToc(false); }}
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