import React, { useState } from 'react';
import { Loan, InterestType, RatePeriod, EmiFrequency } from '../types';

interface AddNewLoanFormProps {
  onAddLoan: (loanData: Omit<Loan, 'id'>) => void;
  onClose: () => void;
}

export const AddNewLoanForm: React.FC<AddNewLoanFormProps> = ({ onAddLoan, onClose }) => {
    const [principal, setPrincipal] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [ratePeriod, setRatePeriod] = useState<RatePeriod>(RatePeriod.Yearly);
    const [interestType, setInterestType] = useState<InterestType>(InterestType.Simple);
    const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
    const [isEmi, setIsEmi] = useState(false);
    const [dueDate, setDueDate] = useState('');
    const [emiFrequency, setEmiFrequency] = useState<EmiFrequency>(EmiFrequency.Monthly);
    const [tenure, setTenure] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!principal || !interestRate || !loanDate || (!isEmi && !dueDate) || (isEmi && !tenure)) {
            alert('Please fill all required fields');
            return;
        }

        const loanData: Omit<Loan, 'id'> = {
            principal: parseFloat(principal),
            interestRate: parseFloat(interestRate),
            ratePeriod,
            interestType,
            loanDate,
            isEmi,
            status: 'ACTIVE',
            ...(isEmi ? { emiFrequency, tenure: parseInt(tenure, 10) } : { dueDate }),
        };
        onAddLoan(loanData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-600 border-b pb-2 pt-4">Loan Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="number" placeholder="Principal Amount*" value={principal} onChange={e => setPrincipal(e.target.value)} className="p-2 border rounded" required />
                <input type="number" placeholder="Interest Rate (%)*" value={interestRate} onChange={e => setInterestRate(e.target.value)} className="p-2 border rounded" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={ratePeriod} onChange={e => setRatePeriod(e.target.value as RatePeriod)} className="p-2 border rounded">
                    {Object.values(RatePeriod).map(p => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
                </select>
                <select value={interestType} onChange={e => setInterestType(e.target.value as InterestType)} className="p-2 border rounded">
                    {Object.values(InterestType).map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700">Loan Date*</label>
                <input type="date" value={loanDate} onChange={e => setLoanDate(e.target.value)} className="p-2 border rounded w-full" required />
            </div>
             <div>
                <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={isEmi} onChange={e => setIsEmi(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                    <span className="font-semibold text-slate-700">EMI / Installment</span>
                </label>
            </div>
            {isEmi ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">EMI Frequency*</label>
                        <select value={emiFrequency} onChange={e => setEmiFrequency(e.target.value as EmiFrequency)} className="p-2 border rounded w-full">
                            {Object.values(EmiFrequency).map(f => <option key={f} value={f}>{f.charAt(0) + f.slice(1).toLowerCase()}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Tenure (in {emiFrequency.toLowerCase()}s)*</label>
                        <input type="number" placeholder="e.g., 12" value={tenure} onChange={e => setTenure(e.target.value)} className="p-2 border rounded w-full" required={isEmi} />
                    </div>
                </div>
            ) : (
                <div>
                    <label className="block text-sm font-medium text-slate-700">Due Date*</label>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="p-2 border rounded w-full" required={!isEmi} />
                </div>
            )}
            
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-md text-slate-800 hover:bg-slate-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-primary rounded-md text-white hover:bg-sky-600">Add Loan</button>
            </div>
        </form>
    );
};
