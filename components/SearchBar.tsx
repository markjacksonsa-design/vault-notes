import { ThemeColors, CurriculumType } from '../hooks/useVault';

export type GradeFilter = 'Grade 10' | 'Grade 11' | 'Grade 12' | null;
export type CurriculumFilter = CurriculumType | null;

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  curriculumFilter: CurriculumFilter;
  onCurriculumFilterChange: (filter: CurriculumFilter) => void;
  gradeFilter: GradeFilter;
  onGradeFilterChange: (filter: GradeFilter) => void;
  activeTheme: ThemeColors;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export default function SearchBar({
  searchQuery,
  onSearchChange,
  curriculumFilter,
  onCurriculumFilterChange,
  gradeFilter,
  onGradeFilterChange,
  activeTheme,
  onClearFilters,
  hasActiveFilters,
}: SearchBarProps) {
  const curricula: CurriculumType[] = ['CAPS', 'IEB'];
  const grades: GradeFilter[] = ['Grade 10', 'Grade 11', 'Grade 12'];

  return (
    <div style={{ marginBottom: '40px' }}>
      {/* Search Input */}
      <div style={{
        position: 'relative',
        marginBottom: '20px',
      }}>
        <input
          type="text"
          placeholder="Search by title, subject, or teacher name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '16px 20px 16px 48px',
            borderRadius: '16px',
            backgroundColor: activeTheme.card,
            color: activeTheme.text,
            border: `2px solid ${activeTheme.border}`,
            fontSize: '1rem',
            fontFamily: 'inherit',
            transition: 'all 0.3s ease',
            boxSizing: 'border-box',
          }}
          className="search-input"
        />
        <span style={{
          position: 'absolute',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '1.2rem',
          color: activeTheme.subtext,
        }}>
          🔍
        </span>
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              fontSize: '1.2rem',
              cursor: 'pointer',
              color: activeTheme.subtext,
              padding: '4px',
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        {/* Curriculum Filters */}
        <div>
          <p style={{
            color: activeTheme.subtext,
            fontSize: '0.9rem',
            fontWeight: '600',
            margin: '0 0 12px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Curriculum
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
          }}>
            {curricula.map((curr) => (
              <button
                key={curr}
                onClick={() => onCurriculumFilterChange(curriculumFilter === curr ? null : curr)}
                className="filter-chip"
                style={{
                  padding: '10px 20px',
                  borderRadius: '24px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backgroundColor: curriculumFilter === curr
                    ? (curr === 'CAPS' ? '#3b82f6' : '#8b5cf6')
                    : activeTheme.card,
                  color: curriculumFilter === curr ? 'white' : activeTheme.text,
                  border: `2px solid ${curriculumFilter === curr
                    ? (curr === 'CAPS' ? '#3b82f6' : '#8b5cf6')
                    : activeTheme.border}`,
                }}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>

        {/* Grade Filters */}
        <div>
          <p style={{
            color: activeTheme.subtext,
            fontSize: '0.9rem',
            fontWeight: '600',
            margin: '0 0 12px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Grade
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
          }}>
            {grades.map((grade) => (
              <button
                key={grade}
                onClick={() => onGradeFilterChange(gradeFilter === grade ? null : grade)}
                className="filter-chip"
                style={{
                  padding: '10px 20px',
                  borderRadius: '24px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backgroundColor: gradeFilter === grade
                    ? '#10b981'
                    : activeTheme.card,
                  color: gradeFilter === grade ? 'white' : activeTheme.text,
                  border: `2px solid ${gradeFilter === grade
                    ? '#10b981'
                    : activeTheme.border}`,
                }}
              >
                {grade}
              </button>
            ))}
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            style={{
              alignSelf: 'flex-start',
              padding: '10px 24px',
              borderRadius: '24px',
              border: `2px solid ${activeTheme.border}`,
              backgroundColor: 'transparent',
              color: activeTheme.text,
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            className="clear-filters-btn"
          >
            Clear All Filters
          </button>
        )}
      </div>

      <style jsx>{`
        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .filter-chip:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .clear-filters-btn:hover {
          backgroundColor: ${activeTheme.border};
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}

