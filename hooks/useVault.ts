import { useState, useEffect } from 'react';

export type ViewType = 'student' | 'seller' | 'library';
export type ThemeType = 'dark' | 'light';
export type CurriculumType = 'CAPS' | 'IEB';

export interface Note {
  id: number;
  curriculum: CurriculumType;
  subject: string;
  title: string;
  price: string;
  rating?: number;
  reviews?: number;
  sales?: number;
  description: string;
  textReviews?: Array<{ stars: number; comment: string; date: string }>;
  sellerName?: string;
  sellerSchool?: string;
  isVerified?: boolean;
  pdfData?: string; // Base64 encoded PDF data
}

export type VerificationStatus = 'none' | 'pending' | 'verified';

export interface SellerProfile {
  name: string;
  school: string;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
}

export interface BankDetails {
  bank: string;
  accNumber: string;
  accHolder?: string;
}

export interface ThemeColors {
  bg: string;
  card: string;
  text: string;
  subtext: string;
  border: string;
  nav: string;
}

export const themeColors: Record<ThemeType, ThemeColors> = {
  dark: {
    bg: '#0f172a', // Deep navy
    card: '#1e293b', // Slate-800
    text: '#ffffff',
    subtext: '#94a3b8', // Slate-400
    border: '#334155', // Slate-700
    nav: '#1e293b'
  },
  light: {
    bg: '#f8fafc', // Slate-50
    card: '#ffffff',
    text: '#0f172a', // Deep navy
    subtext: '#64748b', // Slate-500
    border: '#e2e8f0', // Slate-200
    nav: '#ffffff'
  }
};

const initialNotes: Note[] = [
  { 
    id: 1, 
    curriculum: "CAPS", 
    subject: "Mathematics", 
    title: "Grade 12 Calculus Masterclass", 
    price: "R 150.00", 
    rating: 4.8, 
    reviews: 12, 
    sales: 45, 
    description: "Comprehensive breakdown of limits, derivatives, and integration techniques. Perfect for final exam preparation.", 
    textReviews: [{ stars: 5, comment: "Amazing notes!", date: "10/12/2025" }],
    sellerName: "Mr. Govender",
    sellerSchool: "Westville Boys",
    isVerified: true,
  },
  { 
    id: 2, 
    curriculum: "IEB", 
    subject: "Physics", 
    title: "Mechanics & Motion Summary", 
    price: "R 85.00", 
    rating: 5, 
    reviews: 8, 
    sales: 22, 
    description: "Cheat-sheets and detailed explanations for Newton's Laws, kinematics, and energy principles.", 
    textReviews: [{ stars: 5, comment: "Saved me!", date: "15/12/2025" }],
    sellerName: "Mrs. Smith",
    sellerSchool: "St. Mary's",
    isVerified: true,
  },
  { 
    id: 3, 
    curriculum: "CAPS", 
    subject: "English Home Language", 
    title: "Poetry Analysis Guide", 
    price: "R 120.00", 
    rating: 4.6, 
    reviews: 15, 
    sales: 38, 
    description: "Complete guide to analyzing poetry with examples from prescribed works and exam techniques.",
    sellerName: "Dr. Naidoo",
    sellerSchool: "Hilton College",
    isVerified: false,
  }
];

export const useVault = () => {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<ViewType>('student');
  const [theme, setTheme] = useState<ThemeType>('dark');
  const [teacherNotes, setTeacherNotes] = useState<Note[]>([]);
  const [purchasedNotes, setPurchasedNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [bankDetails, setBankDetails] = useState<BankDetails>({ bank: '', accNumber: '' });
  const [sellerProfile, setSellerProfile] = useState<SellerProfile>({ 
    name: 'Guest Teacher', 
    school: '', 
    isVerified: false,
    verificationStatus: 'none'
  });

  const activeTheme = themeColors[theme];

  // Initialize from localStorage on mount
  useEffect(() => {
    setMounted(true);
    
    // Load theme
    const savedTheme = localStorage.getItem('vault_theme') as ThemeType | null;
    if (savedTheme) setTheme(savedTheme);

    // Load teacher notes (marketplace inventory)
    const savedInventory = localStorage.getItem('vault_inventory');
    if (savedInventory) {
      try {
        setTeacherNotes(JSON.parse(savedInventory));
      } catch (e) {
        setTeacherNotes(initialNotes);
        localStorage.setItem('vault_inventory', JSON.stringify(initialNotes));
      }
    } else {
      setTeacherNotes(initialNotes);
      localStorage.setItem('vault_inventory', JSON.stringify(initialNotes));
    }

    // Load purchased notes
    const savedPurchased = localStorage.getItem('vault_purchased');
    if (savedPurchased) {
      try {
        setPurchasedNotes(JSON.parse(savedPurchased));
      } catch (e) {
        setPurchasedNotes([]);
      }
    }

    // Load user balance
    const savedBalance = localStorage.getItem('vault_balance');
    if (savedBalance) {
      setUserBalance(parseFloat(savedBalance) || 0);
    }

    // Load bank details
    const savedBank = localStorage.getItem('vault_bank_details');
    if (savedBank) {
      try {
        setBankDetails(JSON.parse(savedBank));
      } catch (e) {
        setBankDetails({ bank: '', accNumber: '' });
      }
    }

    // Load seller profile or initialize default
    const savedProfile = localStorage.getItem('vault_seller_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        // Ensure all fields exist (backward compatibility)
        setSellerProfile({
          name: parsed.name || 'Guest Teacher',
          school: parsed.school || '',
          isVerified: parsed.isVerified || false,
          verificationStatus: parsed.verificationStatus || 'none'
        });
      } catch (e) {
        setSellerProfile({ name: 'Guest Teacher', school: '', isVerified: false, verificationStatus: 'none' });
        localStorage.setItem('vault_seller_profile', JSON.stringify({ name: 'Guest Teacher', school: '', isVerified: false, verificationStatus: 'none' }));
      }
    } else {
      // Initialize default profile
      const defaultProfile: SellerProfile = { 
        name: 'Guest Teacher', 
        school: '', 
        isVerified: false, 
        verificationStatus: 'none' as VerificationStatus
      };
    }
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('vault_theme', newTheme);
  };

  // Buy note (instant buy flow)
  const buyNote = (note: Note) => {
    // Add to purchased notes (include PDF data)
    const purchasedNote = {
      ...note,
      pdfData: note.pdfData, // Transfer PDF data
    };
    const updatedPurchased = [...purchasedNotes, purchasedNote];
    setPurchasedNotes(updatedPurchased);
    localStorage.setItem('vault_purchased', JSON.stringify(updatedPurchased));

    // Update sales count
    const updatedInventory = teacherNotes.map(n => 
      n.id === note.id ? { ...n, sales: (n.sales || 0) + 1 } : n
    );
    setTeacherNotes(updatedInventory);
    localStorage.setItem('vault_inventory', JSON.stringify(updatedInventory));

    // Calculate and update seller balance
    const priceNum = parseFloat(String(note.price).replace('R', '').replace(',', '').trim()) || 0;
    const newBalance = userBalance + priceNum;
    setUserBalance(newBalance);
    localStorage.setItem('vault_balance', newBalance.toString());

    // Close modal and navigate to vault
    setSelectedNote(null);
    setView('library');
  };

  // Add new note (seller posts a note)
  const addNote = (noteData: Omit<Note, 'id' | 'sales' | 'sellerName' | 'sellerSchool' | 'isVerified'>) => {
    const newId = Math.max(...teacherNotes.map(n => n.id), 0) + 1;
    const newNote: Note = {
      ...noteData,
      id: newId,
      sales: 0,
      rating: 0,
      reviews: 0,
      sellerName: sellerProfile.name || 'Guest Teacher',
      sellerSchool: sellerProfile.school || undefined,
      isVerified: sellerProfile.isVerified, // Use current profile verification status
    };
    const updated = [...teacherNotes, newNote];
    setTeacherNotes(updated);
    localStorage.setItem('vault_inventory', JSON.stringify(updated));
  };

  // Save seller profile
  const saveSellerProfile = (profile: Partial<SellerProfile>) => {
    const updatedProfile = { ...sellerProfile, ...profile };
    setSellerProfile(updatedProfile);
    localStorage.setItem('vault_seller_profile', JSON.stringify(updatedProfile));
  };

  // Request verification
  const requestVerification = () => {
    const updatedProfile = { ...sellerProfile, verificationStatus: 'pending' as VerificationStatus };
    setSellerProfile(updatedProfile);
    localStorage.setItem('vault_seller_profile', JSON.stringify(updatedProfile));
  };

  // Admin: Toggle verification (for testing)
  const toggleVerification = () => {
    const updatedProfile = { 
      ...sellerProfile, 
      isVerified: !sellerProfile.isVerified,
      verificationStatus: !sellerProfile.isVerified ? 'verified' as VerificationStatus : 'none' as VerificationStatus
    };
    setSellerProfile(updatedProfile);
    localStorage.setItem('vault_seller_profile', JSON.stringify(updatedProfile));
  };

  // Calculate seller earnings (total sales - withdrawals)
  const calculateEarnings = () => {
    const totalSales = teacherNotes.reduce((acc, note) => {
      const priceNum = parseFloat(String(note.price).replace('R', '').replace(',', '').trim()) || 0;
      return acc + (priceNum * (note.sales || 0));
    }, 0);
    return totalSales;
  };

  // Save bank details
  const saveBankDetails = (details: BankDetails) => {
    setBankDetails(details);
    localStorage.setItem('vault_bank_details', JSON.stringify(details));
  };

  // Withdraw funds
  const withdrawFunds = (amount: number) => {
    const earnings = calculateEarnings();
    if (amount <= earnings && amount > 0) {
      const newBalance = userBalance - amount;
      setUserBalance(newBalance);
      localStorage.setItem('vault_balance', newBalance.toString());
      return true;
    }
    return false;
  };

  return {
    // State
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
    // Computed
    sellerEarnings: calculateEarnings(),
    // Actions
    toggleTheme,
    buyNote,
    addNote,
    saveBankDetails,
    withdrawFunds,
    saveSellerProfile,
    requestVerification,
    toggleVerification,
  };
};

