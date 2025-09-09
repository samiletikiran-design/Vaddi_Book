
import React, { useState, useEffect } from 'react';
import { InterestType, RatePeriod, Loan } from '../types';
import { calculateInterestForLoan } from '../services/calculationService';
import { formatCurrency } from '../utils/format';

interface InterestCalculatorProps {
  onClose: () => void;
  currencySymbol: string;
}

export const InterestCalculator: React.FC<InterestCalculatorProps> = ({ onClose, currencySymbol }) => {
    const today = new Date().toISOString().split('T')[0];
    const [principal, setPrincipal] = useState('10000');
    const [interestRate, setInterestRate] = useState('12');
    const [ratePeriod, setRatePeriod] = useState<RatePeriod>(RatePeriod.Yearly);
    const [interestType, setInterestType] = useState<InterestType>(InterestType.Simple);
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [calculatedInterest, setCalculatedInterest] = useState<number | null>(null);

    useEffect(() => {
        const principalNum = parseFloat(principal);
        const interestRateNum = parseFloat(interestRate);

        if (principalNum > 0 && interestRateNum >= 0 && startDate && endDate && new Date(endDate) >= new Date(startDate)) {
            // FIX: Added missing 'status' property to satisfy the Loan type.
            const dummyLoan: Loan = {
                id: 'calc',
                principal: principalNum,
                interestRate: interestRateNum,
                ratePeriod,
                interestType,
                loanDate: startDate,
                isEmi: false,
                status: 'ACTIVE',
            };
            const interest = calculateInterestForLoan(dummyLoan, [], endDate);
            setCalculatedInterest(interest);
        } else {
            setCalculatedInterest(null);
        }
    }, [principal, interestRate, ratePeriod, interestType, startDate, endDate]);


    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-500">
                This is a tool for quick calculations. No data will be saved.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Principal Amount</label>
                    <input type="number" value={principal} onChange={e => setPrincipal(e.target.value)} className="p-2 border rounded w-full mt-1" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Interest Rate (%)</label>
                    <input type="number" value={interestRate} onChange={e => setInterestRate(e.target.value)} className="p-2 border rounded w-full mt-1" />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={ratePeriod} onChange={e => setRatePeriod(e.target.value as RatePeriod)} className="p-2 border rounded w-full">
                    {Object.values(RatePeriod).map(p => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
                </select>
                <select value={interestType} onChange={e => setInterestType(e.target.value as InterestType)} className="p-2 border rounded w-full">
                    {Object.values(InterestType).map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Start Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded w-full mt-1" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">End Date</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded w-full mt-1" />
                </div>
            </div>
            
            <div className="pt-4 mt-4 border-t">
                {calculatedInterest !== null ? (
                    <div className="text-center bg-sky-50 p-4 rounded-lg">
                        <p className="text-sm text-slate-600">Calculated Interest</p>
                        <p className="text-3xl font-bold text-sky-700">
                            {currencySymbol}{formatCurrency(calculatedInterest)}
                        </p>
                    </div>
                ) : (
                    <div className="text-center text-slate-500">
                        <p>Enter valid details to see the calculation.</p>
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-md text-slate-800 hover:bg-slate-300">Close</button>
            </div>
        </div>
    );
};