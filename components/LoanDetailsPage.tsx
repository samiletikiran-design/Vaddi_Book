
import React from 'react';
import { Lendie, Loan, Repayment, RepaymentType } from '../types';
import { calculateInterestForLoan, calculateRepaymentsForLoan, calculateEmiAmount } from '../services/calculationService';
import { formatCurrency } from '../utils/format';

interface LoanDetailsPageProps {
  lendie: Lendie;
  loan: Loan;
  currency: string;
  onBack: () => void;
  onOpenEditLoanModal: (loan: Loan) => void;
  onDeleteLoan: (loanId: string) => void;
  onOpenEditRepaymentModal: (repayment: Repayment) => void;
  onDeleteRepayment: (repaymentId: string) => void;
  onOpenRepaymentModal: (loanId: string) => void;
}

const SummaryCard: React.FC<{ title: string; amount: number; currency: string; color: string; }> = ({ title, amount, currency, color }) => (
    <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-sm text-slate-500">{title}</p>
        <p className={`text-3xl font-bold ${color}`}>{currency}{formatCurrency(amount)}</p>
    </div>
);

export const LoanDetailsPage: React.FC<LoanDetailsPageProps> = ({
  lendie,
  loan,
  currency,
  onBack,
  onOpenEditLoanModal,
  onDeleteLoan,
  onOpenEditRepaymentModal,
  onDeleteRepayment,
  onOpenRepaymentModal,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const repaymentsForLoan = lendie.repayments.filter(r => r.loanId === loan.id);
  const interestAccrued = calculateInterestForLoan(loan, repaymentsForLoan, today);
  const amountPaid = calculateRepaymentsForLoan(repaymentsForLoan);
  const outstandingBalance = (loan.principal + interestAccrued) - amountPaid;
  const emiAmount = calculateEmiAmount(loan);

  const statusBadge = (
    <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
        loan.status === 'CLOSED' 
        ? 'bg-gray-200 text-gray-800' 
        : 'bg-green-200 text-green-800'
    }`}>
        {loan.status}
    </span>
  );
  
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
        <button onClick={onBack} className="flex items-center space-x-2 text-brand-primary hover:text-brand-primary-hover">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
           <span>Back to {lendie.name}'s Dashboard</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md relative">
        <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-brand-secondary">Loan Details</h2>
                    <p className="text-slate-500">Loan of {currency}{formatCurrency(loan.principal)} taken on {loan.loanDate}</p>
                </div>
                {statusBadge}
            </div>
            <div className="flex space-x-2 flex-shrink-0">
                {loan.status !== 'CLOSED' && (
                     <button onClick={() => onOpenRepaymentModal(loan.id)} className="px-4 py-2 text-sm font-semibold text-green-700 bg-green-100 rounded-md hover:bg-green-200">Record Payment</button>
                )}
                <button onClick={() => onOpenEditLoanModal(loan)} className="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">Edit</button>
                <button onClick={() => onDeleteLoan(loan.id)} className="px-4 py-2 text-sm font-semibold text-red-700 bg-red-100 rounded-md hover:bg-red-200">Archive</button>
            </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200 text-sm text-slate-600 grid grid-cols-2 sm:grid-cols-4 gap-4">
             <p><strong>Rate:</strong> {loan.interestRate}% {loan.ratePeriod.toLowerCase()}</p>
             <p><strong>Type:</strong> {loan.interestType.toLowerCase()} interest</p>
             {loan.isEmi && loan.tenure ? (
                 <>
                     <p><strong>Repayment:</strong> {loan.tenure} {loan.emiFrequency?.toLowerCase()} EMIs</p>
                     <p className="font-bold text-base text-slate-800"><strong>EMI Amount:</strong> {currency}{formatCurrency(emiAmount)}</p>
                 </>
             ) : (
                 <p><strong>Due Date:</strong> {loan.dueDate}</p>
             )}
        </div>
      </div>
      
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard title="Principal" amount={loan.principal} currency={currency} color="text-brand-secondary" />
            <SummaryCard title="Interest Accrued" amount={interestAccrued} currency={currency} color="text-green-600" />
            <SummaryCard title="Amount Paid" amount={amountPaid} currency={currency} color="text-brand-primary-dark" />
            <SummaryCard title="Outstanding Balance" amount={outstandingBalance} currency={currency} color="text-red-600" />
      </div>

      <div>
        <h3 className="text-2xl font-bold text-brand-secondary mb-4">Repayment History for this Loan</h3>
        <div className="bg-white rounded-lg shadow-md">
            <ul className="divide-y divide-slate-200">
                {repaymentsForLoan.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(repayment => (
                    <li key={repayment.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center">
                        <div className="flex-1 mb-2 sm:mb-0">
                            <p className="font-semibold text-green-600">
                                {formatRepaymentType(repayment.type)}
                            </p>
                            <p className="text-sm text-slate-500">{repayment.date}</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-lg font-bold text-green-600 mr-4">
                                +{currency}{formatCurrency(repayment.amount)}
                            </p>
                            <div className="flex space-x-2">
                                <button 
                                    onClick={() => onOpenEditRepaymentModal(repayment)}
                                    className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
                                    aria-label="Edit repayment"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-600" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                </button>
                                <button 
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this repayment record? This action cannot be undone.')) {
                                            onDeleteRepayment(repayment.id);
                                        }
                                    }}
                                    className="p-2 bg-red-50 rounded-full hover:bg-red-100"
                                    aria-label="Delete repayment"
                                >
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                </button>
                            </div>
                        </div>
                    </li>
                ))}
                 {repaymentsForLoan.length === 0 && (
                    <li className="p-4 text-center text-slate-500">No repayments recorded for this loan yet.</li>
                )}
            </ul>
        </div>
      </div>
    </div>
  );
};