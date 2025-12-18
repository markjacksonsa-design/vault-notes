import { Note, ThemeColors } from '../hooks/useVault';

interface StudyModeProps {
  note: Note;
  activeTheme: ThemeColors;
  onClose: () => void;
}

export default function StudyMode({ note, activeTheme, onClose }: StudyModeProps) {
  if (!note.pdfData) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
      >
        <div
          style={{
            backgroundColor: activeTheme.card,
            padding: '40px',
            borderRadius: '24px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5)',
            border: `1px solid ${activeTheme.border}`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem', fontWeight: '700' }}>
            No PDF Available
          </h2>
          <p style={{ color: activeTheme.subtext, marginBottom: '24px' }}>
            This note doesn't have a PDF file attached yet.
          </p>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: activeTheme.bg,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: activeTheme.card,
          padding: '16px 24px',
          borderBottom: `1px solid ${activeTheme.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: activeTheme.text }}>
            {note.title}
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: activeTheme.subtext }}>
            {note.curriculum} • {note.subject}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: activeTheme.bg,
            color: activeTheme.text,
            border: `1px solid ${activeTheme.border}`,
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Close Viewer
        </button>
      </div>

      {/* PDF Viewer */}
      <div
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <iframe
          src={note.pdfData}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          title={`PDF Viewer - ${note.title}`}
        />
      </div>
    </div>
  );
}

