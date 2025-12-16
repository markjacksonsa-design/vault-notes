export default function Home() {
  // This is our "database" of notes (for now)
  const teacherNotes = [
    { id: 1, subject: "Physics", title: "Quantum Basics", price: "$5.00" },
    { id: 2, subject: "Calculus", title: "Integrals Simplified", price: "$8.50" },
    { id: 3, subject: "History", title: "The Cold War Era", price: "$4.00" },
    { id: 4, subject: "Maths", title: "trigenometry", price: "R10" }
  ];

  return (
    <div style={{ backgroundColor: '#0f172a', color: 'white', minHeight: '100vh', padding: '40px', fontFamily: 'system-ui' }}>
      
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#3b82f6' }}>Teacher Notes Marketplace</h1>
        <p style={{ color: '#94a3b8' }}>High-quality engineering and academic resources</p>
      </header>

      {/* The Marketplace Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px', 
        maxWidth: '1000px', 
        margin: '0 auto' 
      }}>
        
        {teacherNotes.map((note) => (
          <div key={note.id} style={{ 
            backgroundColor: '#1e293b', 
            padding: '20px', 
            borderRadius: '12px', 
            border: '1px solid #334155',
            textAlign: 'left'
          }}>
            <span style={{ fontSize: '0.8rem', color: '#3b82f6', textTransform: 'uppercase', fontWeight: 'bold' }}>{note.subject}</span>
            <h2 style={{ fontSize: '1.25rem', margin: '10px 0' }}>{note.title}</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{note.price}</span>
              <button style={{ 
                backgroundColor: '#2563eb', 
                color: 'white', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: '6px',
                cursor: 'pointer'
              }}>Buy Now</button>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}