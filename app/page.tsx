'use client';

import { useVault } from '../hooks/useVault';
import Navbar from '../components/Navbar';
import Marketplace from '../components/Marketplace';
import Vault from '../components/Vault';
import Dashboard from '../components/Dashboard';
import BankDetailsCard from '../components/BankDetailsCard';
import StarRating from '../components/StarRating';

export default function Home() {
  const {
    mounted,
    view,
    setView,
    theme,
    activeTheme,
    teacherNotes,
    purchasedNotes,
    selectedNote,
    setSelectedNote,
    userBalance,
    bankDetails,
    sellerProfile,
    sellerEarnings,
    toggleTheme,
    buyNote,
    addNote,
    saveBankDetails,
    withdrawFunds,
    saveSellerProfile,
    requestVerification,
    toggleVerification,
  } = useVault();

  // Prevent hydration errors
  if (!mounted) {
    return null;
  }

  return (
    <div style={{
      backgroundColor: activeTheme.bg,
      color: activeTheme.text,
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      transition: 'background-color 0.3s ease, color 0.3s ease',
    }}>
      <Navbar
        view={view}
        setView={setView}
        theme={theme}
        toggleTheme={toggleTheme}
        activeTheme={activeTheme}
      />

      {view === 'student' && (
        <Marketplace
          teacherNotes={teacherNotes}
          setSelectedNote={setSelectedNote}
          activeTheme={activeTheme}
          sellerProfile={sellerProfile}
        />
      )}

      {view === 'library' && (
        <Vault
          purchasedNotes={purchasedNotes}
          activeTheme={activeTheme}
        />
      )}

      {view === 'seller' && (
        <Dashboard
          sellerEarnings={sellerEarnings}
          userBalance={userBalance}
          activeTheme={activeTheme}
          bankDetails={bankDetails}
          saveBankDetails={saveBankDetails}
          withdrawFunds={withdrawFunds}
          addNote={addNote}
          sellerProfile={sellerProfile}
          saveSellerProfile={saveSellerProfile}
          requestVerification={requestVerification}
          toggleVerification={toggleVerification}
        />
      )}

      {/* Bank Details & Rating Section */}
      {(view === 'student' || view === 'library') && (
        <div className="max-w-6xl mx-auto mt-16 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bank Details Card */}
            <div>
              <BankDetailsCard
                bankName={bankDetails.bank || undefined}
                accountNumber={bankDetails.accNumber || undefined}
                accountHolder={bankDetails.accHolder || undefined}
              />
            </div>

            {/* Star Rating Component */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Rate Your Experience
              </h2>
              <StarRating userEmail="user@example.com" />
            </div>
          </div>
        </div>
      )}

      {/* Note Detail Modal with Glass Effect */}
      {selectedNote && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setSelectedNote(null)}
          className="modal-overlay"
        >
          <div
            style={{
              backgroundColor: theme === 'dark' 
                ? 'rgba(30, 41, 59, 0.95)' 
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              padding: '48px',
              borderRadius: '32px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: `1px solid ${activeTheme.border}`,
              animation: 'modalSlideIn 0.3s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
            className="modal-content"
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '24px',
            }}>
              <div>
                <span style={{
                  color: selectedNote.curriculum === 'CAPS' ? '#3b82f6' : '#8b5cf6',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  {selectedNote.curriculum} • {selectedNote.subject}
                </span>
                <h2 style={{
                  margin: '12px 0 0 0',
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  lineHeight: '1.3',
                }}>
                  {selectedNote.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedNote(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: activeTheme.subtext,
                  padding: '4px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <p style={{
              color: activeTheme.subtext,
              margin: '24px 0',
              lineHeight: '1.6',
              fontSize: '1.05rem',
            }}>
              {selectedNote.description}
            </p>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingTop: '24px',
              borderTop: `1px solid ${activeTheme.border}`,
            }}>
              <div>
                <span style={{
                  color: '#10b981',
                  fontWeight: '700',
                  fontSize: '1.5rem',
                }}>
                  {selectedNote.price}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#fbbf24', fontSize: '1.2rem' }}>⭐</span>
                <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                  {(selectedNote.rating || 0).toFixed(1)}
                </span>
                {selectedNote.reviews && (
                  <span style={{ color: activeTheme.subtext, fontSize: '0.9rem' }}>
                    ({selectedNote.reviews} reviews)
                  </span>
                )}
              </div>
            </div>

            {/* Teacher Info in Modal - with fallback to sellerProfile */}
            {(() => {
              const displayName = selectedNote.sellerName || sellerProfile.name || 'Teacher';
              const displaySchool = selectedNote.sellerSchool || sellerProfile.school;
              const isVerified = selectedNote.isVerified !== undefined ? selectedNote.isVerified : sellerProfile.isVerified;
              
              return (displayName || displaySchool) ? (
                <div style={{
                  marginBottom: '32px',
                  paddingTop: '16px',
                  borderTop: `1px solid ${activeTheme.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span style={{
                    color: activeTheme.subtext,
                    fontSize: '0.9rem',
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
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      flexShrink: 0,
                    }} title="Verified Teacher">
                      ✓
                    </span>
                  )}
                </div>
              ) : null;
            })()}

            <button
              onClick={() => buyNote(selectedNote)}
              style={{
                width: '100%',
                padding: '18px',
                backgroundColor: '#10b981',
                border: 'none',
                borderRadius: '16px',
                color: 'white',
                fontWeight: '700',
                fontSize: '1.1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              className="buy-button"
            >
              Buy Now - {selectedNote.price}
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .modal-content {
          animation: modalSlideIn 0.3s ease-out;
        }

        .buy-button:hover {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);
        }

        .buy-button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
