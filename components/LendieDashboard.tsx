
import React from 'react';
import { Lendie, Loan, Repayment, RepaymentType } from '../types';
import {
  calculateTotalPrincipal,
  calculateTotalRepayments,
  calculateTotalInterest,
  calculateInterestForLoan,
  calculateRepaymentsForLoan,
  getNextDueDate,
  calculateEmiAmount,
} from '../services/calculationService';
import { formatCurrency } from '../utils/format';

interface LendieDashboardProps {
  lendie: Lendie;
  currency: string;
  onBack: () => void;
  onOpenAddLoanModal: () => void;
  onOpenRepaymentModal: (loanId?: string) => void;
  onSelectLoan: (loanId: string) => void;
  onOpenEditLendieModal: () => void;
  onViewClosedLoans: () => void;
}

const SummaryCard: React.FC<{ title: string; amount: number; currency: string; subtext?: string; color: string; }> = ({ title, amount, currency, subtext, color }) => (
    <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-sm text-slate-500">{title}</p>
        <p className={`text-3xl font-bold ${color}`}>{currency}{formatCurrency(amount)}</p>
        {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
    </div>
);

interface LoanDetailsCardProps {
    loan: Loan;
    repayments: Repayment[];
    currency: string;
    onSelect: (loanId: string) => void;
    onRecordRepayment: (loanId: string) => void;
}

const LoanDetailsCard: React.FC<LoanDetailsCardProps> = ({ loan, repayments, currency, onSelect, onRecordRepayment }) => {
    const today = new Date().toISOString().split('T')[0];
    const interestAccrued = calculateInterestForLoan(loan, repayments, today);
    const emiAmount = calculateEmiAmount(loan);
    const amountPaid = calculateRepaymentsForLoan(repayments);
    const outstandingBalance = (loan.principal + interestAccrued) - amountPaid;

    return (
        <div onClick={() => onSelect(loan.id)} className="bg-white p-4 rounded-lg shadow-md flex flex-col justify-between cursor-pointer hover:shadow-lg hover:border-sky-500 border-2 border-transparent transition-all">
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-xl font-bold text-slate-800">{currency}{formatCurrency(loan.principal)}</p>
                        <p className="text-sm text-slate-500">Loan on {loan.loanDate}</p>
                    </div>
                     <div className="text-right">
                        <p className={`text-lg font-semibold ${loan.status === 'CLOSED' ? 'text-gray-500' : 'text-red-600'}`}>{currency}{formatCurrency(outstandingBalance)}</p>
                        <p className="text-xs text-slate-500">Outstanding Balance</p>
                    </div>
                </div>

                 <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                    <div className="bg-green-50 p-2 rounded">
                        <p className="text-xs text-green-700">Interest Accrued</p>
                        <p className="font-bold text-green-800">{currency}{formatCurrency(interestAccrued)}</p>
                    </div>
                    <div className="bg-sky-50 p-2 rounded">
                        <p className="text-xs text-sky-700">Amount Paid</p>
                        <p className="font-bold text-sky-800">{currency}{formatCurrency(amountPaid)}</p>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 text-sm text-slate-600 space-y-1">
                    <p><strong>Rate:</strong> {loan.interestRate}% {loan.ratePeriod.toLowerCase()}</p>
                    {loan.isEmi ? (
                        <p className="font-bold text-base text-slate-800"><strong>EMI Amount:</strong> {currency}{formatCurrency(emiAmount)}</p>
                    ) : (
                        <p><strong>Due Date:</strong> {loan.dueDate}</p>
                    )}
                </div>
            </div>
            <div onClick={e => e.stopPropagation()} className="mt-4 pt-4 border-t border-slate-200 flex justify-end space-x-2">
                 {loan.status !== 'CLOSED' && <button onClick={() => onRecordRepayment(loan.id)} className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-md hover:bg-green-200">Record Repayment</button>}
                 <button onClick={() => onSelect(loan.id)} className="px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">View Details</button>
            </div>
        </div>
    )
}

export const LendieDashboard: React.FC<LendieDashboardProps> = ({ lendie, currency, onBack, onOpenAddLoanModal, onOpenRepaymentModal, onSelectLoan, onOpenEditLendieModal, onViewClosedLoans }) => {
  const today = new Date().toISOString().split('T')[0];
  const totalPrincipal = calculateTotalPrincipal(lendie);
  const totalRepayments = calculateTotalRepayments(lendie);
  const totalInterest = calculateTotalInterest(lendie, today);
  const outstandingBalance = (totalPrincipal + totalInterest) - totalRepayments;
  const nextDueDate = getNextDueDate(lendie);

  type Transaction = (Loan & { transactionType: 'LOAN'; date: string }) | (Repayment & { transactionType: 'REPAYMENT' });

  const allTransactions: Transaction[] = [
      ...lendie.loans.map(l => ({...l, transactionType: 'LOAN' as const, date: l.loanDate })),
      ...lendie.repayments.map(r => ({...r, transactionType: 'REPAYMENT' as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const activeLoans = lendie.loans.filter(loan => !loan.isArchived && loan.status !== 'CLOSED');
  const closedLoansCount = lendie.loans.filter(loan => loan.status === 'CLOSED').length;
  
  const formatRepaymentType = (type: RepaymentType) => {
    switch (type) {
        case RepaymentType.Principal: return 'Principal Repayment';
        case RepaymentType.Interest: return 'Interest Repayment';
        case RepaymentType.PrincipalInterest: return 'Principal + Interest Repayment';
        default: return 'Repayment';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center space-x-2 text-brand-primary hover:text-sky-700">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
           <span>Back to List</span>
        </button>
        <div className="flex space-x-2">
            <button onClick={onOpenAddLoanModal} className="px-4 py-2 bg-sky-100 text-sky-700 rounded-md text-sm font-semibold hover:bg-sky-200">Add New Loan</button>
            <button onClick={() => onOpenRepaymentModal()} className="px-4 py-2 bg-green-100 text-green-700 rounded-md text-sm font-semibold hover:bg-green-200">Record Repayment</button>
        </div>
      </div>
      
      <div className="flex items-center space-x-6 bg-white p-6 rounded-lg shadow-md relative">
         <img src={lendie.photo || `https://i.pravatar.cc/150?u=${lendie.id}`} alt={lendie.name} className="w-24 h-24 rounded-full object-cover" />
         <div>
            <h2 className="text-3xl font-bold text-slate-800">{lendie.name}</h2>
            <p className="text-slate-500">{lendie.mobile}</p>
            <p className="text-slate-500">{lendie.address}</p>
         </div>
         <button 
            onClick={onOpenEditLendieModal}
            className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
            aria-label="Edit lendie details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
              <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
            </svg>
         </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Principal" amount={totalPrincipal} currency={currency} color="text-slate-700" />
        <SummaryCard title="Interest Accrued" amount={totalInterest} currency={currency} color="text-green-600" />
        <SummaryCard title="Amount Paid" amount={totalRepayments} currency={currency} color="text-sky-600" />
        <SummaryCard title="Outstanding Balance" amount={outstandingBalance} currency={currency} color="text-red-600" />
      </div>

      {nextDueDate && <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg text-center font-medium">Next Due Date: {nextDueDate}</div>}

      <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-slate-700">Active Loans</h3>
            {closedLoansCount > 0 && (
                <button onClick={onViewClosedLoans} className="text-sm font-semibold text-brand-primary hover:text-sky-700 hover:underline">
                    View {closedLoansCount} Closed Loan(s)
                </button>
            )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeLoans.map(loan => {
               const loanRepayments = lendie.repayments.filter(r => r.loanId === loan.id);
               return <LoanDetailsCard key={loan.id} loan={loan} repayments={loanRepayments} currency={currency} onSelect={onSelectLoan} onRecordRepayment={onOpenRepaymentModal} />
            })}
             {activeLoans.length === 0 && (
                <div className="col-span-1 md:col-span-2 text-center py-10 px-4 bg-white rounded-lg shadow-md">
                    <h3 className="text-lg text-slate-600">No active loans.</h3>
                    <p className="text-slate-500">Click "Add New Loan" to record a loan for {lendie.name}.</p>
                </div>
            )}
        </div>
      </div>
      
       <div>
            <h3 className="text-2xl font-bold text-slate-700 mb-4">Transaction History</h3>
            <div className="bg-white rounded-lg shadow-md">
                <ul className="divide-y divide-slate-200">
                    {allTransactions.map(tx => (
                        <li key={tx.id + (tx.transactionType === 'LOAN' ? tx.loanDate : tx.date)} className="p-4 flex justify-between items-center">
                            <div>
                                <p className={`font-semibold ${tx.transactionType === 'LOAN' ? 'text-red-500' : 'text-green-500'}`}>
                                    {tx.transactionType === 'LOAN' ? 'Loan Issued' : formatRepaymentType((tx as Repayment).type)}
                                </p>
                                <p className="text-sm text-slate-500">{tx.date}</p>
                            </div>
                            <p className={`text-lg font-bold ${tx.transactionType === 'LOAN' ? 'text-red-500' : 'text-green-500'}`}>
                                {tx.transactionType === 'LOAN' ? '-' : '+'}{currency}{formatCurrency(tx.transactionType === 'LOAN' ? tx.principal : tx.amount)}
                            </p>
                        </li>
                    ))}
                    {allTransactions.length === 0 && (
                        <li className="p-4 text-center text-slate-500">No transactions yet.</li>
                    )}
                </ul>
            </div>
        </div>

    </div>
  );
};