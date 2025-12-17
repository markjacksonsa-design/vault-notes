'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  // --- ALL STATES (The App's Memory) ---
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [toast, setToast] = useState(''); // The notification message
  const [teacherNotes, setTeacherNotes] = useState<{id: number, subject: string, title: string, price: string, description: string}[]>([]);
  
  // Form States
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // --- PERSISTENCE (Loading/Saving) ---
  useEffect(() => {
    const savedNotes = localStorage.getItem('vault_notes');
    if (savedNotes) { 
      setTeacherNotes(JSON.parse(savedNotes)); 
    } else { 
      setTeacherNotes([{ 
        id: 1, subject: "Physics", title: "Quantum Basics", price: "$5.00",
        description: "A deep dive into wave-particle duality and Schrödinger's cat."
      }]); 
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('vault_notes', JSON.stringify(teacherNotes));
  }, [teacherNotes]);

  // --- FUNCTIONS (The App's Actions) ---
  const handleAddToCart = (note: any) => {
  setCartCount(prev => prev + 1);
  
  // Get existing cart or start fresh
  const existingCart = JSON.parse(localStorage.getItem('vault_cart') || '[]');
  const updatedCart = [...existingCart, note];
  
  // Save to the bridge
  localStorage.setItem('vault_cart', JSON.stringify(updatedCart));
  
  setToast(`Added "${note.title}" to cart!`);
  setTimeout(() => setToast(''), 3000);
};

  const addNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSubject || !newPrice) return;
    const newNote = { 
      id: Date.now(), title: newTitle, subject: newSubject, price: `$${newPrice}`,
      description: newDesc || "No description provided."
    };
    setTeacherNotes([...teacherNotes, newNote]);
    setNewTitle(''); setNewSubject(''); setNewPrice(''); setNewDesc('');
  };

  const deleteNote = (id: number) => {
    setTeacherNotes(teacherNotes.filter(note => note.id !== id));
  };

  const processedNotes = teacherNotes
    .filter(note => 
      note.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'low') return parseFloat(a.price.replace('$', '')) - parseFloat(b.price.replace('$', ''));
      if (sortBy === 'high') return parseFloat(b.price.replace('$', '')) - parseFloat(a.price.replace('$', ''));
      return b.id - a.id;
    });

  const theme = {
    bg: darkMode ? '#0f172a' : '#f8fafc',
    card: darkMode ? '#1e293b' : '#ffffff',
    text: darkMode ? 'white' : '#1e293b',
    border: darkMode ? '#334155' : '#e2e8f0',
    inputBg: darkMode ? '#0f172a' : '#f1f5f9'
  };

  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: '100vh', padding: '40px', fontFamily: 'system-ui', transition: '0.4s ease' }}>
      
      <style jsx>{`
        .note-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .note-card:hover { transform: translateY(-8px); box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.3); border-color: #3b82f6 !important; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
        @keyframes slideUp { from { transform: translate(-50%, 20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
      `}</style>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#10b981', color: 'white', padding: '12px 25px', borderRadius: '30px', zIndex: 2000, fontWeight: 'bold', boxShadow: '0 10px 15px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease' }}>
          {toast}
        </div>
      )}

      {/* MODAL */}
      {selectedNote && (
        <div className="modal-overlay" onClick={() => setSelectedNote(null)}>
          <div style={{ backgroundColor: theme.card, padding: '40px', borderRadius: '24px', maxWidth: '500px', width: '90%', position: 'relative', border: `1px solid ${theme.border}` }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedNote(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: theme.text, cursor: 'pointer', fontSize: '1.5rem' }}>✕</button>
            <span style={{ color: '#3b82f6', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem' }}>{selectedNote.subject}</span>
            <h2 style={{ fontSize: '2rem', margin: '10px 0' }}>{selectedNote.title}</h2>
            <p style={{ lineHeight: '1.6', color: darkMode ? '#94a3b8' : '#64748b' }}>{selectedNote.description}</p>
            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{selectedNote.price}</span>
              <button onClick={() => { handleAddToCart(selectedNote.title); setSelectedNote(null); }} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Add to Cart</button>
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: `1px solid ${theme.border}`, marginBottom: '40px' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>Vault.Notes</div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '8px', borderRadius: '10px', backgroundColor: theme.card, color: theme.text, border: `1px solid ${theme.border}` }}>
            <option value="newest">Newest</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
          </select>
          <button onClick={() => setDarkMode(!darkMode)} style={{ padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', border: 'none', backgroundColor: '#3b82f6', color: 'white' }}>{darkMode ? '☀️ Light' : '🌙 Dark'}</button>
          <div style={{ backgroundColor: theme.card, padding: '5px 15px', borderRadius: '20px', border: '1px solid #3b82f6', fontWeight: 'bold' }}>🛒 {cartCount}</div>
        </div>
      </nav>

      <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', maxWidth: '1000px', display: 'block', margin: '0 auto 40px', padding: '15px 25px', borderRadius: '30px', border: `1px solid ${theme.border}`, backgroundColor: theme.card, color: theme.text, fontSize: '1rem', outline: 'none' }} />

      {/* GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', maxWidth: '1000px', margin: '0 auto' }}>
        {processedNotes.map((note) => (
          <div key={note.id} className="note-card" onClick={() => setSelectedNote(note)} style={{ position: 'relative', backgroundColor: theme.card, padding: '25px', borderRadius: '20px', border: `1px solid ${theme.border}`, cursor: 'pointer' }}>
            <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', zIndex: 10 }}>✕</button>
            <span style={{ fontSize: '0.7rem', color: '#3b82f6', textTransform: 'uppercase', fontWeight: '800' }}>{note.subject}</span>
            <h2 style={{ fontSize: '1.3rem', margin: '8px 0' }}>{note.title}</h2>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', height: '40px', overflow: 'hidden' }}>{(note.description || "").substring(0, 60)}...</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{note.price}</span>
              <button onClick={(e) => { e.stopPropagation(); handleAddToCart(note.title); }} style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Buy</button>
            </div>
          </div>
        ))}
      </div>

      <hr style={{ margin: '80px 0', opacity: 0.1 }} />

      {/* FORM */}
      <div style={{ maxWidth: '500px', margin: '0 auto 100px', backgroundColor: theme.card, padding: '40px', borderRadius: '24px', border: `1px solid ${theme.border}` }}>
        <h3 style={{ marginBottom: '25px', textAlign: 'center' }}>List New Notes</h3>
        <form onSubmit={addNote} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ padding: '14px', borderRadius: '12px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.text }} />
          <input placeholder="Subject" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} style={{ padding: '14px', borderRadius: '12px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.text }} />
          <input placeholder="Price" type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} style={{ padding: '14px', borderRadius: '12px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.text }} />
          <textarea placeholder="Description..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} style={{ padding: '14px', borderRadius: '12px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.text, minHeight: '100px', fontFamily: 'inherit' }} />
          <button type="submit" style={{ backgroundColor: '#10b981', color: 'white', padding: '16px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Publish</button>
        </form>
      </div>
    </div>
  );
}