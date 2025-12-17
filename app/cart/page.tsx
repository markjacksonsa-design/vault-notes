'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<any[]>([]);
  const [purchased, setPurchased] = useState(false);
  const [ratedItems, setRatedItems] = useState<number[]>([]);
  
  // State for optional comments
  const [comments, setComments] = useState<{[key: number]: string}>({});

  useEffect(() => {
    const savedCart = localStorage.getItem('vault_cart');
    if (savedCart) { setCartItems(JSON.parse(savedCart)); }
  }, []);

  const handleRating = (noteId: number, stars: number) => {
    const savedInventory = JSON.parse(localStorage.getItem('vault_inventory') || '[]');
    const noteComment = comments[noteId] || ""; // Get the optional comment
    
    const updatedInventory = savedInventory.map((note: any) => {
      if (note.id === noteId) {
        const newReviewCount = (note.reviews || 0) + 1;
        const newAvgRating = ((note.rating * (note.reviews || 0)) + stars) / newReviewCount;
        
        // Save the comment into an array of reviews on the note object
        const newReviews = note.textReviews || [];
        if (noteComment.trim()) {
            newReviews.push({ stars, comment: noteComment, date: new Date().toLocaleDateString() });
        }

        return { 
            ...note, 
            rating: newAvgRating, 
            reviews: newReviewCount,
            textReviews: newReviews 
        };
      }
      return note;
    });

    localStorage.setItem('vault_inventory', JSON.stringify(updatedInventory));
    setRatedItems(prev => [...prev, noteId]);
  };

  const totalPrice = cartItems.reduce((sum, item) => {
    const price = item.price ? String(item.price).replace('R', '').trim() : '0';
    return sum + parseFloat(price);
  }, 0);

  const completePurchase = () => {
    if (cartItems.length === 0) return;
    setPurchasedItems([...cartItems]); 
    localStorage.setItem('vault_cart', JSON.stringify([]));
    setCartItems([]);
    setPurchased(true);
  };

  const simulateDownload = (title: string) => {
    alert(`📥 Downloading: ${title}_VaultNotes_ZA.pdf`);
  };

  return (
    <div style={{ backgroundColor: '#0f172a', color: 'white', minHeight: '100vh', padding: '40px', fontFamily: 'system-ui' }}>
      <nav style={{ marginBottom: '40px' }}>
        <Link href="/" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }}>← Return to Marketplace</Link>
      </nav>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {!purchased ? (
          <>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '30px' }}>Your Cart 🛒</h1>
            {cartItems.map((item, i) => (
              <div key={i} style={{ backgroundColor: '#1e293b', padding: '25px', borderRadius: '16px', marginBottom: '12px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{item.title}</h3>
                  <p style={{ margin: '5px 0 0', color: '#3b82f6', fontWeight: 'bold' }}>{item.subject}</p>
                </div>
                <span style={{ fontWeight: 'bold', fontSize: '1.4rem', color: '#10b981' }}>{item.price}</span>
              </div>
            ))}
            {cartItems.length > 0 && (
              <div style={{ marginTop: '40px', textAlign: 'right', borderTop: '2px solid #334155', paddingTop: '25px' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>Total: R {totalPrice.toFixed(2)}</h2>
                <button onClick={completePurchase} style={{ backgroundColor: '#10b981', color: 'white', padding: '20px', borderRadius: '14px', border: 'none', fontWeight: 'bold', cursor: 'pointer', width: '100%', fontSize: '1.2rem' }}>Secure Checkout</button>
              </div>
            )}
          </>
        ) : (
          /* --- POST-PURCHASE SCREEN --- */
          <div style={{ backgroundColor: '#1e293b', padding: '40px', borderRadius: '28px', border: '2px solid #10b981' }}>
            <h1 style={{ color: '#10b981', textAlign: 'center' }}>Payment Received! 🇿🇦</h1>
            <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: '40px' }}>Rate your notes to unlock the PDF downloads.</p>
            
            {purchasedItems.map((item, i) => {
              const hasBeenRated = ratedItems.includes(item.id);
              
              return (
                <div key={i} style={{ backgroundColor: '#0f172a', marginBottom: '25px', padding: '25px', borderRadius: '20px', border: `1px solid ${hasBeenRated ? '#10b981' : '#334155'}` }}>
                  <p style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '15px', textAlign: 'center' }}>{item.title}</p>
                  
                  {!hasBeenRated ? (
                    <>
                      <textarea 
                        placeholder="Optional: How were the notes? (e.g. 'Great for GDE trials!')"
                        value={comments[item.id] || ''}
                        onChange={(e) => setComments({...comments, [item.id]: e.target.value})}
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#1e293b', color: 'white', border: '1px solid #334155', marginBottom: '15px', fontFamily: 'inherit', resize: 'none' }}
                        rows={2}
                      />
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button 
                            key={star} 
                            onClick={() => handleRating(item.id, star)}
                            style={{ backgroundColor: 'transparent', border: '1px solid #fbbf24', borderRadius: '10px', color: '#fbbf24', cursor: 'pointer', padding: '10px 15px' }}
                          >
                            {star} ⭐
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <button 
                      onClick={() => simulateDownload(item.title)}
                      style={{ backgroundColor: '#3b82f6', color: 'white', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                      📥 Download PDF
                    </button>
                  )}
                </div>
              );
            })}
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
               <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Back to Shop</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}