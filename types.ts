
export enum InterestType {
  Simple = 'SIMPLE',
  Compound = 'COMPOUND',
}

export enum RatePeriod {
  Weekly = 'WEEKLY',
  Monthly = 'MONTHLY',
  Yearly = 'YEARLY',
}

export enum EmiFrequency {
  Weekly = 'WEEKLY',
  Monthly = 'MONTHLY',
  Yearly = 'YEARLY',
}

export const CURRENCIES = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export enum RepaymentType {
  Principal = 'PRINCIPAL',
  Interest = 'INTEREST',
  PrincipalInterest = 'PRINCIPAL_INTEREST',
}

export interface Loan {
  id: string;
  principal: number;
  interestRate: number; // e.g., 12 for 12%
  ratePeriod: RatePeriod;
  interestType: InterestType;
  loanDate: string; // ISO String YYYY-MM-DD
  isEmi: boolean;
  emiFrequency?: EmiFrequency;
  tenure?: number; // In units of emiFrequency (e.g., 12 for 12 months)
  dueDate?: string; // ISO String YYYY-MM-DD, for lumpsum
  status: 'ACTIVE' | 'CLOSED';
  isArchived?: boolean;
}

export interface Repayment {
  id: string;
  loanId: string;
  amount: number;
  date: string; // ISO String YYYY-MM-DD
  type: RepaymentType;
}

export interface Lendie {
  id: string;
  name: string;
  mobile: string;
  address?: string;
  photo?: string; // base64 URL
  loans: Loan[];
  repayments: Repayment[];
}

export interface User {
  mobile: string;
  name: string;
  currency: CurrencyCode;
}

export interface UpcomingPayment {
  date: string; // ISO String YYYY-MM-DD
  lendieId: string;
  lendieName: string;
  loanId: string;
  amount: number;
  type: 'EMI' | 'LUMPSUM';
}