import { supabase } from '../lib/supabase';
import { Lendie, Loan, Repayment, User } from '../types';

// User operations
export const createOrUpdateUser = async (userData: User): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .upsert({
      id: userData.mobile, // Using mobile as ID for simplicity
      mobile: userData.mobile,
      name: userData.name,
      currency: userData.currency,
    });

  if (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
};

export const getUser = async (mobile: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('mobile', mobile)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No user found
      return null;
    }
    console.error('Error fetching user:', error);
    throw new Error(`Failed to fetch user: ${error.message}`);
  }

  return {
    mobile: data.mobile,
    name: data.name,
    currency: data.currency,
  };
};

// Lendie operations
export const createLendie = async (userId: string, lendieData: Omit<Lendie, 'id' | 'loans' | 'repayments'>): Promise<string> => {
  const { data, error } = await supabase
    .from('lendies')
    .insert({
      user_id: userId,
      name: lendieData.name,
      mobile: lendieData.mobile,
      address: lendieData.address,
      photo: lendieData.photo,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating lendie:', error);
    throw error;
  }

  return data.id;
};

export const updateLendie = async (lendieId: string, updates: Partial<Pick<Lendie, 'name' | 'mobile' | 'address' | 'photo'>>): Promise<void> => {
  const { error } = await supabase
    .from('lendies')
    .update(updates)
    .eq('id', lendieId);

  if (error) {
    console.error('Error updating lendie:', error);
    throw error;
  }
};

export const getLendies = async (userId: string): Promise<Lendie[]> => {
  // Get lendies with their loans and repayments
  const { data: lendiesData, error: lendiesError } = await supabase
    .from('lendies')
    .select('*')
    .eq('user_id', userId);

  if (lendiesError) {
    console.error('Error fetching lendies:', lendiesError);
    throw lendiesError;
  }

  const { data: loansData, error: loansError } = await supabase
    .from('loans')
    .select('*')
    .eq('user_id', userId);

  if (loansError) {
    console.error('Error fetching loans:', loansError);
    throw loansError;
  }

  const { data: repaymentsData, error: repaymentsError } = await supabase
    .from('repayments')
    .select('*')
    .eq('user_id', userId);

  if (repaymentsError) {
    console.error('Error fetching repayments:', repaymentsError);
    throw repaymentsError;
  }

  // Combine the data
  const lendies: Lendie[] = lendiesData.map(lendie => ({
    id: lendie.id,
    name: lendie.name,
    mobile: lendie.mobile,
    address: lendie.address,
    photo: lendie.photo,
    loans: loansData
      .filter(loan => loan.lendie_id === lendie.id)
      .map(loan => ({
        id: loan.id,
        principal: parseFloat(loan.principal),
        interestRate: parseFloat(loan.interest_rate),
        ratePeriod: loan.rate_period,
        interestType: loan.interest_type,
        loanDate: loan.loan_date,
        isEmi: loan.is_emi,
        emiFrequency: loan.emi_frequency,
        tenure: loan.tenure,
        dueDate: loan.due_date,
        status: loan.status,
        isArchived: loan.is_archived,
      })),
    repayments: repaymentsData
      .filter(repayment => {
        const loan = loansData.find(l => l.id === repayment.loan_id);
        return loan && loan.lendie_id === lendie.id;
      })
      .map(repayment => ({
        id: repayment.id,
        loanId: repayment.loan_id,
        amount: parseFloat(repayment.amount),
        date: repayment.date,
        type: repayment.type,
      })),
  }));

  return lendies;
};

// Loan operations
export const createLoan = async (userId: string, lendieId: string, loanData: Omit<Loan, 'id'>): Promise<string> => {
  const { data, error } = await supabase
    .from('loans')
    .insert({
      lendie_id: lendieId,
      user_id: userId,
      principal: loanData.principal,
      interest_rate: loanData.interestRate,
      rate_period: loanData.ratePeriod,
      interest_type: loanData.interestType,
      loan_date: loanData.loanDate,
      is_emi: loanData.isEmi,
      emi_frequency: loanData.emiFrequency,
      tenure: loanData.tenure,
      due_date: loanData.dueDate,
      status: loanData.status,
      is_archived: loanData.isArchived || false,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating loan:', error);
    throw error;
  }

  return data.id;
};

export const updateLoan = async (loanId: string, updates: Partial<Loan>): Promise<void> => {
  const updateData: any = {};
  
  if (updates.principal !== undefined) updateData.principal = updates.principal;
  if (updates.interestRate !== undefined) updateData.interest_rate = updates.interestRate;
  if (updates.ratePeriod !== undefined) updateData.rate_period = updates.ratePeriod;
  if (updates.interestType !== undefined) updateData.interest_type = updates.interestType;
  if (updates.loanDate !== undefined) updateData.loan_date = updates.loanDate;
  if (updates.isEmi !== undefined) updateData.is_emi = updates.isEmi;
  if (updates.emiFrequency !== undefined) updateData.emi_frequency = updates.emiFrequency;
  if (updates.tenure !== undefined) updateData.tenure = updates.tenure;
  if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.isArchived !== undefined) updateData.is_archived = updates.isArchived;

  const { error } = await supabase
    .from('loans')
    .update(updateData)
    .eq('id', loanId);

  if (error) {
    console.error('Error updating loan:', error);
    throw error;
  }
};

// Repayment operations
export const createRepayment = async (userId: string, repaymentData: Omit<Repayment, 'id'>): Promise<string> => {
  const { data, error } = await supabase
    .from('repayments')
    .insert({
      loan_id: repaymentData.loanId,
      user_id: userId,
      amount: repaymentData.amount,
      date: repaymentData.date,
      type: repaymentData.type,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating repayment:', error);
    throw error;
  }

  return data.id;
};

export const updateRepayment = async (repaymentId: string, updates: Partial<Repayment>): Promise<void> => {
  const updateData: any = {};
  
  if (updates.amount !== undefined) updateData.amount = updates.amount;
  if (updates.date !== undefined) updateData.date = updates.date;
  if (updates.type !== undefined) updateData.type = updates.type;

  const { error } = await supabase
    .from('repayments')
    .update(updateData)
    .eq('id', repaymentId);

  if (error) {
    console.error('Error updating repayment:', error);
    throw error;
  }
};

export const deleteRepayment = async (repaymentId: string): Promise<void> => {
  const { error } = await supabase
    .from('repayments')
    .delete()
    .eq('id', repaymentId);

  if (error) {
    console.error('Error deleting repayment:', error);
    throw error;
  }
};