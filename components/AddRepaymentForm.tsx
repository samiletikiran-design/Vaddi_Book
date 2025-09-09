
import React, { useState, useEffect } from 'react';
import { Lendie, Repayment, RepaymentType } from '../types';

interface AddRepaymentFormProps {
  lendie: Lendie;
  onAddRepayment: (lendieId: string, repayment: Omit<Repayment, 'id'>) => void;
  onClose: () => void;
  defaultLoanId?: string;
}

export const AddRepaymentForm: React.FC<AddRepaymentFormProps> = ({ lendie, onAddRepayment, onClose, defaultLoanId }) => {
    const activeLoans = lendie.loans.filter(loan => !loan.isArchived);

    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loanId, setLoanId] = useState<string>(defaultLoanId || activeLoans[0]?.id || '');
    const [repaymentType, setRepaymentType] = useState<RepaymentType>(RepaymentType.Principal);

    const selectedLoan = activeLoans.find(loan => loan.id === loanId);

    // Effect to auto-select repayment type based on amount
    useEffect(() => {
        if (selectedLoan) {
            const principalRepayments = lendie.repayments
                .filter(r => r.loanId === selectedLoan.id && (r.type === RepaymentType.Principal || r.type === RepaymentType.PrincipalInterest))
                .reduce((sum, r) => sum + r.amount, 0);
            
            const outstandingPrincipal = selectedLoan.principal - principalRepayments;
            const enteredAmount = parseFloat(amount);

            if (!isNaN(enteredAmount) && enteredAmount > outstandingPrincipal) {
                setRepaymentType(RepaymentType.PrincipalInterest);
            }
        }
    }, [amount, loanId, lendie.repayments, selectedLoan]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !date || !loanId) {
            alert('Please fill all required fields');
            return;
        }

        // For EMI loans, all repayments are treated as principal to reduce the balance.
        const finalRepaymentType = selectedLoan?.isEmi ? RepaymentType.Principal : repaymentType;

        onAddRepayment(lendie.id, { 
            loanId,
            amount: parseFloat(amount), 
            date,
            type: finalRepaymentType,
        });
    };

    if (activeLoans.length === 0) {
        return (
            <div>
                <p className="text-slate-600">This lendie has no active loans to record a payment against.</p>
                <div className="flex justify-end pt-4 mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-md text-slate-800 hover:bg-slate-300">Close</button>
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-slate-600">Recording payment for <span className="font-bold">{lendie.name}</span>.</p>
            
            <div>
                <label className="block text-sm font-medium text-slate-700">Repay against Loan*</label>
                <select value={loanId} onChange={e => setLoanId(e.target.value)} className="p-2 border rounded w-full mt-1" required>
                    {activeLoans.map(loan => (
                        <option key={loan.id} value={loan.id}>
                           Loan of {loan.principal} ({loan.isEmi ? 'EMI' : 'Lumpsum'}) on {loan.loanDate}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Amount Received*</label>
                    <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} className="p-2 border rounded w-full mt-1" required />
                </div>
                {/* Only show 'Payment For' dropdown for non-EMI loans */}
                {selectedLoan && !selectedLoan.isEmi && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Payment For*</label>
                        <select value={repaymentType} onChange={e => setRepaymentType(e.target.value as RepaymentType)} className="p-2 border rounded w-full mt-1" required>
                            <option value={RepaymentType.Principal}>Principal</option>
                            <option value={RepaymentType.Interest}>Interest</option>
                            <option value={RepaymentType.PrincipalInterest}>Principal + Interest</option>
                        </select>
                    </div>
                )}
            </div>

             <div>
                <label className="block text-sm font-medium text-slate-700">Date of Payment*</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-2 border rounded w-full mt-1" required />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-md text-slate-800 hover:bg-slate-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-primary rounded-md text-white hover:bg-sky-600" disabled={!loanId}>Record Payment</button>
            </div>
        </form>
    );
};