'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<'student' | 'seller'>('student');
  const [cartCount, setCartCount] = useState(0);
  const [teacherNotes, setTeacherNotes] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  
  // Withdrawal States
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawnTotal, setWithdrawnTotal] = useState(0);
  const [bankDetails, setBankDetails] = useState({ bank: '', accNumber: '' });
  const [isBankLinked, setIsBankLinked] = useState(false);

  // --- NEW NOTE FORM STATE ---
  const [newNote, setNewNote] = useState({
    title: '',
    subject: '',
    curriculum: 'CAPS',
    price: '',
    description: ''
  });

  useEffect(() => {
    setMounted(true);
    const savedInventory = localStorage.getItem('vault_inventory');
    const savedWithdrawn = localStorage.getItem('vault_withdrawn');
    const savedBank = localStorage.getItem('vault_bank_details');
    const savedCart = localStorage.getItem('vault_cart');

    if (savedWithdrawn) setWithdrawnTotal(parseFloat(savedWithdrawn));
    if (savedBank) { setBankDetails(JSON.parse(savedBank)); setIsBankLinked(true); }
    if (savedCart) setCartCount(JSON.parse(savedCart).length);

    if (savedInventory) {
      setTeacherNotes(JSON.parse(savedInventory));
    } else {
      const initialData = [
        { 
          id: 1, curriculum: "CAPS", subject: "Maths", 
          title: "Grade 12 Calculus Masterclass", price: "R 150.00", rating: 4.8, reviews: 1, sales: 5,
          description: "Full breakdown of limits and derivatives.",
          textReviews: [{ stars: 5, comment: "Best notes for Gauteng students!", date: "10/12/2025" }]
        }
      ];
      setTeacherNotes(initialData);
      localStorage.setItem('vault_inventory', JSON.stringify(initialData));
    }
  }, []);

  if (!mounted) return null;

  // --- HANDLERS ---
  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.title || !newNote.price) return alert("Please add a title and price.");

    const noteToAdd = {
      ...newNote,
      id: Date.now(), // Unique ID
      price: `R ${parseFloat(newNote.price).toFixed(2)}`,
      rating: 0,
      reviews: 0,
      sales: 0,
      textReviews: []
    };

    const updatedInventory = [...teacherNotes, noteToAdd];
    setTeacherNotes(updatedInventory);
    localStorage.setItem('vault_inventory', JSON.stringify(updatedInventory));
    
    // Reset Form
    setNewNote({ title: '', subject: '', curriculum: 'CAPS', price: '', description: '' });
    alert("🚀 Note published to Marketplace!");
  };

  const grossEarnings = teacherNotes.reduce((acc, note) => {
    const priceNum = parseFloat(String(note.price).replace('R', '').trim()) || 0;
    return acc + (priceNum * (note.sales || 0));
  }, 0);

  const currentBalance = grossEarnings - withdrawnTotal;

  return (
    <div style={{ backgroundColor: '#0f172a', color: 'white', minHeight: '100vh', padding: '20px', fontFamily: 'system-ui' }}>
      
      {/* HEADER */}
      <nav style={{ maxWidth: '1100px', margin: '0 auto 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: '12px 25px', borderRadius: '50px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setView('student')} style={{ padding: '10px 20px', borderRadius: '50px', border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: view === 'student' ? '#3b82f6' : 'transparent', color: 'white' }}>Student Shop</button>
          <button onClick={() => setView('seller')} style={{ padding: '10px 20px', borderRadius: '50px', border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: view === 'seller' ? '#10b981' : 'transparent', color: 'white' }}>Seller Central</button>
        </div>
        {view === 'student' && <Link href="/cart" style={{ textDecoration: 'none', color: 'white', fontWeight: 'bold' }}>🛒 Cart ({cartCount})</Link>}
      </nav>

      {/* --- STUDENT VIEW --- */}
      {view === 'student' && (
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>Marketplace</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {teacherNotes.map(note => (
              <div key={note.id} onClick={() => setSelectedNote(note)} style={{ backgroundColor: '#1e293b', padding: '25px', borderRadius: '24px', border: '1px solid #334155', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '0.8rem' }}>{note.curriculum}</span>
                  <span style={{ color: '#fbbf24' }}>⭐ {(note.rating || 0).toFixed(1)}</span>
                </div>
                <h3>{note.title}</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{note.subject}</p>
                <p style={{ color: '#10b981', fontWeight: 'bold', marginTop: '15px', fontSize: '1.2rem' }}>{note.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- SELLER DASHBOARD --- */}
      {view === 'seller' && (
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '25px', marginBottom: '30px' }}>
            
            {/* 1. POST A NEW NOTE FORM */}
            <div style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '32px', border: '1px solid #334155' }}>
              <h2 style={{ marginBottom: '20px' }}>Post a New Note 📄</h2>
              <form onSubmit={handleCreateNote} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input placeholder="Note Title (e.g. Physics Paper 1 Prep)" value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value})} style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155' }} />
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input placeholder="Subject" value={newNote.subject} onChange={e => setNewNote({...newNote, subject: e.target.value})} style={{ flex: 1, padding: '12px', borderRadius: '12px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155' }} />
                  <select value={newNote.curriculum} onChange={e => setNewNote({...newNote, curriculum: e.target.value})} style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155' }}>
                    <option value="CAPS">CAPS</option>
                    <option value="IEB">IEB</option>
                    <option value="University">University</option>
                  </select>
                </div>

                <input type="number" placeholder="Price in Rands (e.g. 50)" value={newNote.price} onChange={e => setNewNote({...newNote, price: e.target.value})} style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155' }} />
                
                <textarea placeholder="Description (Tell students what they get...)" value={newNote.description} onChange={e => setNewNote({...newNote, description: e.target.value})} rows={3} style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155', resize: 'none' }} />
                
                <button type="submit" style={{ padding: '15px', borderRadius: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Publish Note</button>
              </form>
            </div>

            {/* 2. PAYOUT & BANKING */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '32px', border: '2px solid #10b981' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Available Balance</p>
                <h2 style={{ fontSize: '2.5rem', color: '#10b981' }}>R {currentBalance.toFixed(2)}</h2>
                <button onClick={() => alert("Withdrawal triggered!")} style={{ width: '100%', marginTop: '10px', padding: '12px', borderRadius: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Withdraw</button>
              </div>
              
              <div style={{ backgroundColor: '#1e293b', padding: '25px', borderRadius: '32px', border: '1px solid #334155' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Student Feedback</h4>
                {teacherNotes.flatMap(n => n.textReviews || []).slice(0, 2).map((rev, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', backgroundColor: '#0f172a', padding: '10px', borderRadius: '10px', marginBottom: '8px' }}>
                    "{rev.comment}"
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedNote && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setSelectedNote(null)}>
           <div style={{ backgroundColor: '#1e293b', padding: '40px', borderRadius: '32px', maxWidth: '450px', width: '100%', border: '1px solid #334155' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ marginBottom: '10px' }}>{selectedNote.title}</h2>
              <p style={{ color: '#94a3b8', marginBottom: '25px' }}>{selectedNote.description || "No description provided."}</p>
              <button onClick={() => {
                const cart = JSON.parse(localStorage.getItem('vault_cart') || '[]');
                localStorage.setItem('vault_cart', JSON.stringify([...cart, selectedNote]));
                setCartCount(cart.length + 1);
                setSelectedNote(null);
                alert("Added to cart!");
              }} style={{ width: '100%', padding: '15px', backgroundColor: '#10b981', border: 'none', borderRadius: '14px', color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>Buy for {selectedNote.price}</button>
           </div>
        </div>
      )}
    </div>
  );
}