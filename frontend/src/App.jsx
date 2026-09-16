import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import CatalogPage from './pages/CatalogPage';
import BookDetailPage from './pages/BookDetailPage';
import PublishPage from './pages/author/PublishPage';
import LibraryPage from './pages/LibraryPage';
import ReaderPage from './pages/ReaderPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ minHeight: '100vh', background: '#f7fafc', color: '#2d3748', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          <Navbar />
          <Routes>
            <Route path="/" element={<CatalogPage />} />
            <Route path="/book/:id" element={<BookDetailPage />} />
            <Route path="/publish" element={<PublishPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/reader/:id" element={<ReaderPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}