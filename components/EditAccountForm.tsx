
import React, { useState } from 'react';
import { User, CURRENCIES, CurrencyCode } from '../types';

interface EditAccountFormProps {
  user: User;
  onUpdateAccount: (userData: Pick<User, 'name' | 'currency'>) => void;
  onClose: () => void;
}

export const EditAccountForm: React.FC<EditAccountFormProps> = ({ user, onUpdateAccount, onClose }) => {
    const [name, setName] = useState(user.name);
    const [currency, setCurrency] = useState<CurrencyCode>(user.currency);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!name) {
            alert('Please enter your name');
            return;
        }
        onUpdateAccount({ name, currency });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-slate-700">Mobile Number</label>
                <input type="text" value={user.mobile} className="p-2 border rounded w-full mt-1 bg-slate-100 text-slate-500" disabled />
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700">Display Name*</label>
                <input type="text" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} className="p-2 border rounded w-full mt-1" required />
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700">Currency*</label>
                <select value={currency} onChange={e => setCurrency(e.target.value as CurrencyCode)} className="p-2 border rounded w-full mt-1">
                    {(Object.keys(CURRENCIES) as CurrencyCode[]).map(code => (
                         <option key={code} value={code}>{code} ({CURRENCIES[code]})</option>
                    ))}
                </select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-md text-slate-800 hover:bg-slate-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-primary rounded-md text-white hover:bg-sky-600">Update Account</button>
            </div>
        </form>
    );
};