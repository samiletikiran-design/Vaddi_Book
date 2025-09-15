
import React, { useState } from 'react';
import { Loan, Repayment, RepaymentType } from '../types';

interface EditRepaymentFormProps {
  repaymentToEdit: Repayment;
  loan: Loan;
  onUpdateRepayment: (repayment: Repayment) => void;
  onClose: () => void;
}

export const EditRepaymentForm: React.FC<EditRepaymentFormProps> = ({ repaymentToEdit, loan, onUpdateRepayment, onClose }) => {
    const [amount, setAmount] = useState(repaymentToEdit.amount.toString());
    const [date, setDate] = useState(repaymentToEdit.date);
    const [repaymentType, setRepaymentType] = useState<RepaymentType>(repaymentToEdit.type);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !date) {
            alert('Please fill all required fields');
            return;
        }

        const finalRepaymentType = loan.isEmi ? RepaymentType.Principal : repaymentType;

        const updatedRepayment: Repayment = {
            ...repaymentToEdit,
            amount: parseFloat(amount),
            date,
            type: finalRepaymentType,
        };
        onUpdateRepayment(updatedRepayment);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Amount Received*</label>
                    <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} className="p-2 border rounded w-full mt-1" required />
                </div>
                {!loan.isEmi && (
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
                <button type="submit" className="px-4 py-2 bg-brand-primary rounded-md text-white hover:bg-brand-primary-hover">Update Payment</button>
            </div>
        </form>
    );
};