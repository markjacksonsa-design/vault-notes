import { useState } from 'react';
import { ThemeColors, BankDetails, CurriculumType, SellerProfile } from '../hooks/useVault';

interface DashboardProps {
  sellerEarnings: number;
  userBalance: number;
  activeTheme: ThemeColors;
  bankDetails: BankDetails;
  saveBankDetails: (details: BankDetails) => void;
  withdrawFunds: (amount: number) => boolean;
  addNote: (note: {
    curriculum: CurriculumType;
    subject: string;
    title: string;
    price: string;
    description: string;
    pdfData?: string;
  }) => void;
  sellerProfile: SellerProfile;
  saveSellerProfile: (profile: Partial<SellerProfile>) => void;
  requestVerification: () => void;
  toggleVerification: () => void;
}

export default function Dashboard({
  sellerEarnings,
  userBalance,
  activeTheme,
  bankDetails,
  saveBankDetails,
  withdrawFunds,
  addNote,
  sellerProfile,
  saveSellerProfile,
  requestVerification,
  toggleVerification,
}: DashboardProps) {
  const [showBankForm, setShowBankForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  
  const [newNote, setNewNote] = useState({
    title: '',
    subject: '',
    curriculum: 'CAPS' as CurriculumType,
    price: '',
    description: '',
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string>('');
  const [pdfError, setPdfError] = useState<string>('');

  const [bankForm, setBankForm] = useState<BankDetails>(bankDetails);
  const [profileForm, setProfileForm] = useState<{ name: string; school: string }>({ 
    name: sellerProfile.name, 
    school: sellerProfile.school 
  });
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Handle PDF file selection and conversion to Base64
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPdfFile(null);
      setPdfBase64('');
      setPdfError('');
      return;
    }

    // Check file type
    if (file.type !== 'application/pdf') {
      setPdfError('Please select a PDF file');
      setPdfFile(null);
      setPdfBase64('');
      return;
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setPdfError('File size exceeds 5MB limit. Please choose a smaller file.');
      setPdfFile(null);
      setPdfBase64('');
      return;
    }

    setPdfError('');
    setPdfFile(file);

    // Convert to Base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPdfBase64(base64String);
    };
    reader.onerror = () => {
      setPdfError('Error reading file. Please try again.');
      setPdfFile(null);
      setPdfBase64('');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    saveBankDetails(bankForm);
    setShowBankForm(false);
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (withdrawFunds(amount)) {
      setWithdrawAmount('');
      setShowWithdrawForm(false);
      alert(`R ${amount.toFixed(2)} withdrawn successfully!`);
    } else {
      alert('Insufficient funds or invalid amount');
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.title && newNote.subject && newNote.price && newNote.description) {
      addNote({
        ...newNote,
        pdfData: pdfBase64 || undefined,
      });
      setNewNote({ title: '', subject: '', curriculum: 'CAPS', price: '', description: '' });
      setPdfFile(null);
      setPdfBase64('');
      setPdfError('');
      setShowNoteForm(false);
      alert('Note published successfully!');
    } else {
      alert('Please fill in all fields');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveSellerProfile({ name: profileForm.name, school: profileForm.school });
    setShowProfileForm(false);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          marginBottom: '10px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Seller Dashboard
        </h1>
        <p style={{ color: activeTheme.subtext, fontSize: '1.1rem' }}>
          Manage your notes and earnings
        </p>
      </div>

      {/* Earnings Card */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '40px',
      }}>
        <div style={{
          backgroundColor: '#10b981',
          padding: '40px',
          borderRadius: '24px',
          color: 'white',
          boxShadow: '0 10px 30px -10px rgba(16, 185, 129, 0.3)',
        }}>
          <p style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '12px' }}>Total Earnings</p>
          <h2 style={{ fontSize: '3rem', fontWeight: '700', margin: '0' }}>
            R {sellerEarnings.toFixed(2)}
          </h2>
          <p style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '12px' }}>
            From {sellerEarnings > 0 ? Math.ceil(sellerEarnings / 50) : 0} note sales
          </p>
        </div>

        <div style={{
          backgroundColor: activeTheme.card,
          padding: '40px',
          borderRadius: '24px',
          border: `1px solid ${activeTheme.border}`,
        }}>
          <p style={{ color: activeTheme.subtext, fontSize: '1rem', marginBottom: '12px' }}>
            Available Balance
          </p>
          <h2 style={{
            fontSize: '3rem',
            fontWeight: '700',
            margin: '0',
            color: activeTheme.text,
          }}>
            R {userBalance.toFixed(2)}
          </h2>
          <button
            onClick={() => setShowWithdrawForm(true)}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              borderRadius: '12px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Withdraw Funds
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr',
        gap: '24px',
        marginBottom: '24px',
      }}>
        {/* Teacher Profile Card */}
        <div style={{
          backgroundColor: activeTheme.card,
          padding: '32px',
          borderRadius: '24px',
          border: `1px solid ${activeTheme.border}`,
        }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: '1.5rem', fontWeight: '700' }}>Teacher Profile</h2>
          
          {showProfileForm ? (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                placeholder="Full Name (e.g., Mr. Govender)"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: activeTheme.bg,
                  color: activeTheme.text,
                  border: `1px solid ${activeTheme.border}`,
                  fontSize: '1rem',
                }}
                required
              />
              <input
                placeholder="School/Institution (e.g., Westville Boys)"
                value={profileForm.school}
                onChange={(e) => setProfileForm({ ...profileForm, school: e.target.value })}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: activeTheme.bg,
                  color: activeTheme.text,
                  border: `1px solid ${activeTheme.border}`,
                  fontSize: '1rem',
                }}
                required
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Save Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileForm(false);
                    setProfileForm({ name: sellerProfile.name, school: sellerProfile.school });
                  }}
                  style={{
                    padding: '14px 24px',
                    borderRadius: '12px',
                    backgroundColor: 'transparent',
                    color: activeTheme.text,
                    border: `1px solid ${activeTheme.border}`,
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ color: activeTheme.subtext, fontSize: '0.9rem', marginBottom: '8px' }}>Full Name</p>
                <p style={{ color: activeTheme.text, fontWeight: '600', fontSize: '1.1rem' }}>{sellerProfile.name}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ color: activeTheme.subtext, fontSize: '0.9rem', marginBottom: '8px' }}>School/Institution</p>
                <p style={{ color: activeTheme.text, fontWeight: '600', fontSize: '1.1rem' }}>
                  {sellerProfile.school || 'Not set'}
                </p>
              </div>
              
              {/* Verification Status */}
              <div style={{ 
                marginBottom: '20px', 
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: sellerProfile.isVerified ? 'rgba(16, 185, 129, 0.1)' : sellerProfile.verificationStatus === 'pending' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                border: `1px solid ${sellerProfile.isVerified ? '#10b981' : sellerProfile.verificationStatus === 'pending' ? '#fbbf24' : activeTheme.border}`
              }}>
                <p style={{ 
                  color: activeTheme.text, 
                  fontSize: '0.9rem', 
                  fontWeight: '600',
                  margin: '0 0 4px 0'
                }}>
                  Verification Status:
                </p>
                <p style={{ 
                  color: sellerProfile.isVerified ? '#10b981' : sellerProfile.verificationStatus === 'pending' ? '#fbbf24' : activeTheme.subtext, 
                  fontSize: '0.85rem',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {sellerProfile.isVerified ? (
                    <>
                      <span>✓</span> Verified
                    </>
                  ) : sellerProfile.verificationStatus === 'pending' ? (
                    '⏳ Pending Review'
                  ) : (
                    'Not Verified'
                  )}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => setShowProfileForm(true)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: 'transparent',
                    color: activeTheme.text,
                    border: `1px solid ${activeTheme.border}`,
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Edit Profile
                </button>
                
                {!sellerProfile.isVerified && sellerProfile.verificationStatus !== 'pending' && (
                  <button
                    onClick={requestVerification}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Request Verification
                  </button>
                )}

                {/* Admin Override for Testing */}
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                  border: `1px solid ${activeTheme.border}`,
                  cursor: 'pointer',
                  marginTop: '8px',
                }}>
                  <input
                    type="checkbox"
                    checked={sellerProfile.isVerified}
                    onChange={toggleVerification}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ 
                    color: activeTheme.text, 
                    fontSize: '0.85rem',
                    fontWeight: '500'
                  }}>
                    Admin: Manually Verify
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Post New Note Form */}
        <div style={{
          backgroundColor: activeTheme.card,
          padding: '32px',
          borderRadius: '24px',
          border: `1px solid ${activeTheme.border}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>Post a New Note</h2>
            {!showNoteForm && (
              <button
                onClick={() => setShowNoteForm(true)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                + New Note
              </button>
            )}
          </div>

          {showNoteForm && (
            <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                placeholder="Note Title"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: activeTheme.bg,
                  color: activeTheme.text,
                  border: `1px solid ${activeTheme.border}`,
                  fontSize: '1rem',
                }}
                required
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <select
                  value={newNote.curriculum}
                  onChange={(e) => setNewNote({ ...newNote, curriculum: e.target.value as CurriculumType })}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: activeTheme.bg,
                    color: activeTheme.text,
                    border: `1px solid ${activeTheme.border}`,
                    fontSize: '1rem',
                  }}
                >
                  <option value="CAPS">CAPS</option>
                  <option value="IEB">IEB</option>
                </select>
                <input
                  placeholder="Subject"
                  value={newNote.subject}
                  onChange={(e) => setNewNote({ ...newNote, subject: e.target.value })}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: activeTheme.bg,
                    color: activeTheme.text,
                    border: `1px solid ${activeTheme.border}`,
                    fontSize: '1rem',
                  }}
                  required
                />
              </div>
              <input
                placeholder="Price (e.g., R 150.00)"
                value={newNote.price}
                onChange={(e) => setNewNote({ ...newNote, price: e.target.value })}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: activeTheme.bg,
                  color: activeTheme.text,
                  border: `1px solid ${activeTheme.border}`,
                  fontSize: '1rem',
                }}
                required
              />
              <textarea
                placeholder="Description"
                value={newNote.description}
                onChange={(e) => setNewNote({ ...newNote, description: e.target.value })}
                rows={4}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: activeTheme.bg,
                  color: activeTheme.text,
                  border: `1px solid ${activeTheme.border}`,
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
                required
              />
              
              {/* PDF Upload */}
              <div>
                <label style={{
                  display: 'block',
                  color: activeTheme.text,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  marginBottom: '8px',
                }}>
                  PDF File (Optional)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: activeTheme.bg,
                    color: activeTheme.text,
                    border: `1px solid ${activeTheme.border}`,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                />
                {pdfFile && (
                  <p style={{
                    marginTop: '8px',
                    fontSize: '0.85rem',
                    color: '#10b981',
                  }}>
                    ✓ {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                {pdfError && (
                  <p style={{
                    marginTop: '8px',
                    fontSize: '0.85rem',
                    color: '#ef4444',
                  }}>
                    {pdfError}
                  </p>
                )}
                {pdfFile && pdfFile.size > 4 * 1024 * 1024 && (
                  <p style={{
                    marginTop: '8px',
                    fontSize: '0.85rem',
                    color: '#f59e0b',
                  }}>
                    ⚠️ File is large. Note: localStorage has size limits (~5-10MB total).
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  Publish Note
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNoteForm(false);
                    setNewNote({ title: '', subject: '', curriculum: 'CAPS', price: '', description: '' });
                    setPdfFile(null);
                    setPdfBase64('');
                    setPdfError('');
                  }}
                  style={{
                    padding: '16px 24px',
                    borderRadius: '12px',
                    backgroundColor: 'transparent',
                    color: activeTheme.text,
                    border: `1px solid ${activeTheme.border}`,
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Bank Details Card */}
        <div style={{
          backgroundColor: activeTheme.card,
          padding: '32px',
          borderRadius: '24px',
          border: `1px solid ${activeTheme.border}`,
        }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: '1.5rem', fontWeight: '700' }}>Bank Details</h2>
          
          {!bankDetails.bank && !showBankForm ? (
            <div>
              <p style={{ color: activeTheme.subtext, marginBottom: '20px' }}>
                Add your bank details to withdraw earnings
              </p>
              <button
                onClick={() => setShowBankForm(true)}
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
                Add Bank Details
              </button>
            </div>
          ) : showBankForm ? (
            <form onSubmit={handleSaveBank} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                placeholder="Bank Name"
                value={bankForm.bank}
                onChange={(e) => setBankForm({ ...bankForm, bank: e.target.value })}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: activeTheme.bg,
                  color: activeTheme.text,
                  border: `1px solid ${activeTheme.border}`,
                  fontSize: '1rem',
                }}
                required
              />
              <input
                placeholder="Account Number"
                value={bankForm.accNumber}
                onChange={(e) => setBankForm({ ...bankForm, accNumber: e.target.value })}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: activeTheme.bg,
                  color: activeTheme.text,
                  border: `1px solid ${activeTheme.border}`,
                  fontSize: '1rem',
                }}
                required
              />
              <input
                placeholder="Account Holder (Optional)"
                value={bankForm.accHolder || ''}
                onChange={(e) => setBankForm({ ...bankForm, accHolder: e.target.value })}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: activeTheme.bg,
                  color: activeTheme.text,
                  border: `1px solid ${activeTheme.border}`,
                  fontSize: '1rem',
                }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBankForm(false);
                    setBankForm(bankDetails);
                  }}
                  style={{
                    padding: '14px 24px',
                    borderRadius: '12px',
                    backgroundColor: 'transparent',
                    color: activeTheme.text,
                    border: `1px solid ${activeTheme.border}`,
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: activeTheme.subtext, fontSize: '0.9rem', marginBottom: '8px' }}>Bank</p>
                <p style={{ color: activeTheme.text, fontWeight: '600', fontSize: '1.1rem' }}>{bankDetails.bank}</p>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: activeTheme.subtext, fontSize: '0.9rem', marginBottom: '8px' }}>Account Number</p>
                <p style={{ color: activeTheme.text, fontWeight: '600', fontSize: '1.1rem' }}>
                  {bankDetails.accNumber.replace(/\d(?=\d{4})/g, '*')}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBankForm(true);
                  setBankForm(bankDetails);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  backgroundColor: 'transparent',
                  color: activeTheme.text,
                  border: `1px solid ${activeTheme.border}`,
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Update Details
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawForm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowWithdrawForm(false)}
        >
          <div
            style={{
              backgroundColor: activeTheme.card,
              padding: '40px',
              borderRadius: '24px',
              maxWidth: '450px',
              width: '90%',
              boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 24px 0', fontSize: '1.5rem', fontWeight: '700' }}>Withdraw Funds</h2>
            <form onSubmit={handleWithdraw}>
              <input
                type="number"
                placeholder="Amount (R)"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="1"
                max={userBalance}
                step="0.01"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: activeTheme.bg,
                  color: activeTheme.text,
                  border: `1px solid ${activeTheme.border}`,
                  fontSize: '1rem',
                  marginBottom: '20px',
                }}
                required
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Withdraw
                </button>
                <button
                  type="button"
                  onClick={() => setShowWithdrawForm(false)}
                  style={{
                    padding: '14px 24px',
                    borderRadius: '12px',
                    backgroundColor: 'transparent',
                    color: activeTheme.text,
                    border: `1px solid ${activeTheme.border}`,
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
