import { useState } from 'react';
import { Note, ThemeColors } from '../hooks/useVault';
import StudyMode from './StudyMode';

interface VaultProps {
  purchasedNotes: Note[];
  activeTheme: ThemeColors;
}

export default function Vault({ purchasedNotes, activeTheme }: VaultProps) {
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          marginBottom: '10px',
          background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          My Vault 📂
        </h1>
        <p style={{ color: activeTheme.subtext, fontSize: '1.1rem' }}>
          {purchasedNotes.length === 0 
            ? 'Your purchased notes will appear here' 
            : `${purchasedNotes.length} note${purchasedNotes.length !== 1 ? 's' : ''} in your vault`
          }
        </p>
      </div>

      {purchasedNotes.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          backgroundColor: activeTheme.card,
          borderRadius: '24px',
          border: `2px dashed ${activeTheme.border}`,
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📭</div>
          <p style={{ color: activeTheme.subtext, fontSize: '1.2rem', marginBottom: '10px' }}>
            Your vault is empty
          </p>
          <p style={{ color: activeTheme.subtext, fontSize: '0.95rem' }}>
            Start shopping to add notes to your collection
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '28px',
        }}>
          {purchasedNotes.map((note, index) => (
            <div
              key={`${note.id}-${index}`}
              className="vault-card"
              style={{
                backgroundColor: activeTheme.card,
                padding: '28px',
                borderRadius: '24px',
                border: `2px solid #a855f7`,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {/* Gradient accent */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)',
              }} />

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px',
              }}>
                <span style={{
                  color: '#a855f7',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                }}>
                  {note.curriculum} • {note.subject}
                </span>
                <span style={{
                  fontSize: '1.5rem',
                }}>
                  ✓
                </span>
              </div>

              <h3 style={{
                margin: '0 0 20px 0',
                fontSize: '1.35rem',
                fontWeight: '700',
                lineHeight: '1.3',
                color: activeTheme.text,
              }}>
                {note.title}
              </h3>

              {/* PDF Indicator */}
              {note.pdfData && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  border: `1px solid rgba(59, 130, 246, 0.2)`,
                }}>
                  <span style={{ fontSize: '1.2rem' }}>📄</span>
                  <span style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: '600' }}>
                    PDF Ready
                  </span>
                </div>
              )}

              <button
                onClick={() => note.pdfData && setViewingNote(note)}
                className="download-btn"
                style={{
                  width: '100%',
                  padding: '14px',
                  marginTop: '20px',
                  borderRadius: '12px',
                  backgroundColor: note.pdfData ? '#a855f7' : '#64748b',
                  border: 'none',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '1rem',
                  cursor: note.pdfData ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                }}
                disabled={!note.pdfData}
              >
                {note.pdfData ? 'View PDF' : 'No PDF Available'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Study Mode PDF Viewer */}
      {viewingNote && (
        <StudyMode
          note={viewingNote}
          activeTheme={activeTheme}
          onClose={() => setViewingNote(null)}
        />
      )}

      <style jsx>{`
        .vault-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px -12px rgba(168, 85, 247, 0.3);
        }
        .download-btn:hover {
          background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
          transform: translateY(-2px);
          box-shadow: 0 10px 20px -5px rgba(168, 85, 247, 0.4);
        }
        .download-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
