import { Lendie, User } from '../types';

const STORAGE_KEYS = {
  USER: 'lenders-ledger-user',
  LENDIES: 'lenders-ledger-lendies',
};

// User operations
export const createOrUpdateUser = async (userData: User): Promise<void> => {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
};

export const getUser = async (mobile: string): Promise<User | null> => {
  const userData = localStorage.getItem(STORAGE_KEYS.USER);
  if (userData) {
    const user = JSON.parse(userData);
    if (user.mobile === mobile) {
      return user;
    }
  }
  return null;
};

// Lendie operations
export const getLendies = async (userId: string): Promise<Lendie[]> => {
  const lendiesData = localStorage.getItem(`${STORAGE_KEYS.LENDIES}-${userId}`);
  return lendiesData ? JSON.parse(lendiesData) : [];
};

export const saveLendies = async (userId: string, lendies: Lendie[]): Promise<void> => {
  localStorage.setItem(`${STORAGE_KEYS.LENDIES}-${userId}`, JSON.stringify(lendies));
};

export const createLendie = async (userId: string, lendieData: Omit<Lendie, 'id' | 'loans' | 'repayments'>): Promise<string> => {
  const lendies = await getLendies(userId);
  const newLendie: Lendie = {
    ...lendieData,
    id: Date.now().toString(),
    loans: [],
    repayments: [],
  };
  lendies.push(newLendie);
  await saveLendies(userId, lendies);
  return newLendie.id;
};

export const updateLendie = async (userId: string, lendieId: string, updates: Partial<Pick<Lendie, 'name' | 'mobile' | 'address' | 'photo'>>): Promise<void> => {
  const lendies = await getLendies(userId);
  const lendieIndex = lendies.findIndex(l => l.id === lendieId);
  if (lendieIndex !== -1) {
    lendies[lendieIndex] = { ...lendies[lendieIndex], ...updates };
    await saveLendies(userId, lendies);
  }
};

export const createLoan = async (userId: string, lendieId: string, loanData: any): Promise<string> => {
  const lendies = await getLendies(userId);
  const lendieIndex = lendies.findIndex(l => l.id === lendieId);
  if (lendieIndex !== -1) {
    const newLoan = {
      ...loanData,
      id: Date.now().toString(),
    };
    lendies[lendieIndex].loans.push(newLoan);
    await saveLendies(userId, lendies);
    return newLoan.id;
  }
  throw new Error('Lendie not found');
};

export const updateLoan = async (userId: string, loanId: string, updates: any): Promise<void> => {
  const lendies = await getLendies(userId);
  for (const lendie of lendies) {
    const loanIndex = lendie.loans.findIndex(l => l.id === loanId);
    if (loanIndex !== -1) {
      lendie.loans[loanIndex] = { ...lendie.loans[loanIndex], ...updates };
      await saveLendies(userId, lendies);
      return;
    }
  }
};

export const createRepayment = async (userId: string, repaymentData: any): Promise<string> => {
  const lendies = await getLendies(userId);
  for (const lendie of lendies) {
    const loan = lendie.loans.find(l => l.id === repaymentData.loanId);
    if (loan) {
      const newRepayment = {
        ...repaymentData,
        id: Date.now().toString(),
      };
      lendie.repayments.push(newRepayment);
      await saveLendies(userId, lendies);
      return newRepayment.id;
    }
  }
  throw new Error('Loan not found');
};

export const updateRepayment = async (userId: string, repaymentId: string, updates: any): Promise<void> => {
  const lendies = await getLendies(userId);
  for (const lendie of lendies) {
    const repaymentIndex = lendie.repayments.findIndex(r => r.id === repaymentId);
    if (repaymentIndex !== -1) {
      lendie.repayments[repaymentIndex] = { ...lendie.repayments[repaymentIndex], ...updates };
      await saveLendies(userId, lendies);
      return;
    }
  }
};

export const deleteRepayment = async (userId: string, repaymentId: string): Promise<void> => {
  const lendies = await getLendies(userId);
  for (const lendie of lendies) {
    const repaymentIndex = lendie.repayments.findIndex(r => r.id === repaymentId);
    if (repaymentIndex !== -1) {
      lendie.repayments.splice(repaymentIndex, 1);
      await saveLendies(userId, lendies);
      return;
    }
  }
};