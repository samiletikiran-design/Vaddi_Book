import React, { useState } from 'react';
import { Lendie, Loan, InterestType, RatePeriod, EmiFrequency } from '../types';

interface AddLendieAndLoanFormProps {
  onAddLoan: (lendieData: Omit<Lendie, 'id' | 'loans' | 'repayments'>, loanData: Omit<Loan, 'id'>) => void;
  onClose: () => void;
}

export const AddLendieAndLoanForm: React.FC<AddLendieAndLoanFormProps> = ({ onAddLoan, onClose }) => {
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [address, setAddress] = useState('');
    const [photo, setPhoto] = useState<string | undefined>(undefined);
    
    const [principal, setPrincipal] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [ratePeriod, setRatePeriod] = useState<RatePeriod>(RatePeriod.Yearly);
    const [interestType, setInterestType] = useState<InterestType>(InterestType.Simple);
    const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
    const [isEmi, setIsEmi] = useState(false);
    const [dueDate, setDueDate] = useState('');
    const [emiFrequency, setEmiFrequency] = useState<EmiFrequency>(EmiFrequency.Monthly);
    const [tenure, setTenure] = useState('');

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setPhoto(event.target?.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!name || !mobile || !principal || !interestRate || !loanDate || (!isEmi && !dueDate) || (isEmi && !tenure)) {
            alert('Please fill all required fields');
            return;
        }

        const lendieData = { name, mobile, address, photo };
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
        onAddLoan(lendieData, loanData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-secondary border-b pb-2">Lendie Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Name*" value={name} onChange={e => setName(e.target.value)} className="p-2 border rounded" required />
                <input type="text" placeholder="Mobile Number*" value={mobile} onChange={e => setMobile(e.target.value)} className="p-2 border rounded" required />
            </div>
            <textarea placeholder="Address (Optional)" value={address} onChange={e => setAddress(e.target.value)} className="p-2 border rounded w-full" />
            <div>
                <label className="block text-sm font-medium text-slate-700">Photo (Optional)</label>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary-light file:text-brand-primary-dark hover:file:bg-brand-primary-light-hover"/>
            </div>
            
            <h3 className="text-lg font-semibold text-brand-secondary border-b pb-2 pt-4">Loan Details</h3>
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
                    <input type="checkbox" checked={isEmi} onChange={e => setIsEmi(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
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
                <button type="submit" className="px-4 py-2 bg-brand-primary rounded-md text-white hover:bg-brand-primary-hover">Add Lendie & Loan</button>
            </div>
        </form>
    );
};