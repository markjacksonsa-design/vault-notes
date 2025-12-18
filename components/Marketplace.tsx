import { useState, useMemo } from 'react';
import { Note, ThemeColors, SellerProfile } from '../hooks/useVault';
import SearchBar, { CurriculumFilter, GradeFilter } from './SearchBar';

interface MarketplaceProps {
  teacherNotes: Note[];
  setSelectedNote: (note: Note) => void;
  activeTheme: ThemeColors;
  sellerProfile: SellerProfile;
}

// Helper function to extract grade from title
function extractGrade(title: string): GradeFilter {
  const gradeMatch = title.match(/Grade\s+(10|11|12)/i);
  if (gradeMatch) {
    const gradeNum = gradeMatch[1];
    return `Grade ${gradeNum}` as GradeFilter;
  }
  return null;
}

export default function Marketplace({ teacherNotes, setSelectedNote, activeTheme, sellerProfile }: MarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [curriculumFilter, setCurriculumFilter] = useState<CurriculumFilter>(null);
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>(null);

  // Filter and search logic
  const filteredNotes = useMemo(() => {
    return teacherNotes.filter(note => {
      // Search filter (title, subject, teacher name)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        note.title.toLowerCase().includes(searchLower) ||
        note.subject.toLowerCase().includes(searchLower) ||
        (note.sellerName || sellerProfile.name || '').toLowerCase().includes(searchLower);

      // Curriculum filter
      const matchesCurriculum = !curriculumFilter || note.curriculum === curriculumFilter;

      // Grade filter (extract from title)
      const noteGrade = extractGrade(note.title);
      const matchesGrade = !gradeFilter || noteGrade === gradeFilter;

      return matchesSearch && matchesCurriculum && matchesGrade;
    });
  }, [teacherNotes, searchQuery, curriculumFilter, gradeFilter, sellerProfile]);

  const hasActiveFilters = !!(searchQuery || curriculumFilter || gradeFilter);

  const clearAllFilters = () => {
    setSearchQuery('');
    setCurriculumFilter(null);
    setGradeFilter(null);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ 
          fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', 
          fontWeight: '700', 
          marginBottom: '10px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Vault.Notes Marketplace
        </h1>
        <p style={{ color: activeTheme.subtext, fontSize: 'clamp(0.9rem, 3vw, 1.1rem)' }}>🇿🇦 Premium Study Notes for South African Students</p>
      </div>

      {/* Search and Filter Bar */}
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        curriculumFilter={curriculumFilter}
        onCurriculumFilterChange={setCurriculumFilter}
        gradeFilter={gradeFilter}
        onGradeFilterChange={setGradeFilter}
        activeTheme={activeTheme}
        onClearFilters={clearAllFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Results */}
      {filteredNotes.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '80px 20px',
          backgroundColor: activeTheme.card,
          borderRadius: '24px',
          border: `1px solid ${activeTheme.border}`,
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔍</div>
          <p style={{ 
            color: activeTheme.text, 
            fontSize: '1.2rem', 
            fontWeight: '600',
            marginBottom: '12px'
          }}>
            No notes found for this search.
          </p>
          <p style={{ 
            color: activeTheme.subtext, 
            fontSize: '1rem',
            marginBottom: '24px'
          }}>
            Try a different subject or grade!
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              style={{
                padding: '12px 32px',
                borderRadius: '24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              className="clear-filters-empty-btn"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', 
          gap: 'clamp(20px, 4vw, 28px)'
        }}>
          {filteredNotes.map((note, index) => (
            <div
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className="note-card fade-in"
              style={{
                backgroundColor: activeTheme.card,
                padding: '28px',
                borderRadius: '24px',
                border: `1px solid ${activeTheme.border}`,
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                animation: `fadeIn 0.4s ease-out ${index * 0.05}s both`,
              }}
            >
              {/* Curriculum badge */}
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                padding: '6px 12px',
                borderRadius: '20px',
                backgroundColor: note.curriculum === 'CAPS' ? '#3b82f6' : '#8b5cf6',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 'bold',
              }}>
                {note.curriculum}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px',
              }}>
                <span style={{
                  color: '#3b82f6',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {note.subject}
                </span>
                {note.pdfData && (
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    color: '#10b981',
                    fontWeight: '600',
                  }} title="PDF Available">
                    📄 PDF
                  </span>
                )}
              </div>

              <h3 style={{
                margin: '16px 0',
                fontSize: '1.35rem',
                fontWeight: '700',
                lineHeight: '1.3',
                color: activeTheme.text,
                minHeight: '3.5rem',
              }}>
                {note.title}
              </h3>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: `1px solid ${activeTheme.border}`,
              }}>
                <span style={{
                  color: '#10b981',
                  fontWeight: '700',
                  fontSize: '1.25rem'
                }}>
                  {note.price}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#fbbf24', fontSize: '1.1rem' }}>⭐</span>
                  <span style={{ color: activeTheme.text, fontWeight: '600' }}>
                    {(note.rating || 0).toFixed(1)}
                  </span>
                  {note.reviews && (
                    <span style={{ color: activeTheme.subtext, fontSize: '0.85rem' }}>
                      ({note.reviews})
                    </span>
                  )}
                </div>
              </div>

              {/* Teacher Info - with fallback to sellerProfile */}
              {(() => {
                const displayName = note.sellerName || sellerProfile.name || 'Teacher';
                const displaySchool = note.sellerSchool || sellerProfile.school;
                const isVerified = note.isVerified !== undefined ? note.isVerified : sellerProfile.isVerified;
                
                return (displayName || displaySchool) ? (
                  <div style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: `1px solid ${activeTheme.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span style={{
                      color: activeTheme.subtext,
                      fontSize: '0.8rem',
                      fontWeight: '500',
                    }}>
                      {displayName}
                      {displaySchool && ` • ${displaySchool}`}
                    </span>
                    {isVerified && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        flexShrink: 0,
                      }} title="Verified Teacher">
                        ✓
                      </span>
                    )}
                  </div>
                ) : null;
              })()}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .note-card {
          position: relative;
        }
        .note-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .note-card:hover::before {
          opacity: 1;
        }
        .note-card:hover {
          transform: translateY(-12px) scale(1.02);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        .clear-filters-empty-btn:hover {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          transform: translateY(-2px);
          box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.4);
        }
      `}</style>
    </div>
  );
}
