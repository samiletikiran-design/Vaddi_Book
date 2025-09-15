import React from 'react';
import { Lendie, Loan, Repayment } from '../types';
import {
  calculateInterestForLoan,
  calculateRepaymentsForLoan,
  calculateEmiAmount,
} from '../services/calculationService';
import { formatCurrency } from '../utils/format';

interface ClosedLoansPageProps {
  lendie: Lendie;
  currency: string;
  onBack: () => void;
  onSelectLoan: (loanId: string) => void;
}

interface LoanDetailsCardProps {
    loan: Loan;
    repayments: Repayment[];
    currency: string;
    onSelect: (loanId: string) => void;
}

const LoanDetailsCard: React.FC<LoanDetailsCardProps> = ({ loan, repayments, currency, onSelect }) => {
    const today = new Date().toISOString().split('T')[0];
    const interestAccrued = calculateInterestForLoan(loan, repayments, today);
    const emiAmount = calculateEmiAmount(loan);
    const amountPaid = calculateRepaymentsForLoan(repayments);
    const outstandingBalance = (loan.principal + interestAccrued) - amountPaid;

    return (
        <div onClick={() => onSelect(loan.id)} className="bg-white p-4 rounded-lg shadow-md flex flex-col justify-between cursor-pointer hover:shadow-lg hover:border-brand-primary border-2 border-transparent transition-all">
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-xl font-bold text-slate-800">{currency}{formatCurrency(loan.principal)}</p>
                        <p className="text-sm text-slate-500">Loan on {loan.loanDate}</p>
                    </div>
                     <div className="text-right">
                        <p className="text-lg font-semibold text-gray-500">{currency}{formatCurrency(outstandingBalance)}</p>
                        <p className="text-xs text-slate-500">Outstanding Balance</p>
                    </div>
                </div>

                 <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                    <div className="bg-green-50 p-2 rounded">
                        <p className="text-xs text-green-700">Interest Accrued</p>
                        <p className="font-bold text-green-800">{currency}{formatCurrency(interestAccrued)}</p>
                    </div>
                    <div className="bg-brand-primary-light p-2 rounded">
                        <p className="text-xs text-brand-primary-dark">Amount Paid</p>
                        <p className="font-bold text-brand-primary-dark">{currency}{formatCurrency(amountPaid)}</p>
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
                 <button onClick={() => onSelect(loan.id)} className="px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">View Details</button>
            </div>
        </div>
    )
}


export const ClosedLoansPage: React.FC<ClosedLoansPageProps> = ({ lendie, currency, onBack, onSelectLoan }) => {
    const closedLoans = lendie.loans.filter(loan => loan.status === 'CLOSED' && !loan.isArchived);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <button onClick={onBack} className="flex items-center space-x-2 text-brand-primary hover:text-brand-primary-hover">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                <span>Back to {lendie.name}'s Dashboard</span>
                </button>
            </div>

            <div>
                <h3 className="text-2xl font-bold text-brand-secondary mb-4">Closed Loans</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {closedLoans.map(loan => {
                        const loanRepayments = lendie.repayments.filter(r => r.loanId === loan.id);
                        return <LoanDetailsCard key={loan.id} loan={loan} repayments={loanRepayments} currency={currency} onSelect={onSelectLoan} />
                    })}
                    {closedLoans.length === 0 && (
                        <div className="col-span-1 md:col-span-2 text-center py-10 px-4 bg-white rounded-lg shadow-md">
                            <h3 className="text-lg text-slate-600">No closed loans found.</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};