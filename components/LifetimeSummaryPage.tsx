
import React from 'react';
import { formatCurrency } from '../utils/format';

interface SummaryCardProps {
  title: string;
  amount: number;
  currency: string;
  color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, currency, color }) => (
    <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-sm text-slate-500">{title}</p>
        <p className={`text-3xl font-bold ${color}`}>{currency}{formatCurrency(amount)}</p>
    </div>
);


interface LifetimeSummaryPageProps {
    totalLent: number;
    totalInterest: number;
    totalRepaid: number;
    currency: string;
    onBack: () => void;
}

export const LifetimeSummaryPage: React.FC<LifetimeSummaryPageProps> = ({
    totalLent,
    totalInterest,
    totalRepaid,
    currency,
    onBack,
}) => {
    const totalOutstanding = (totalLent + totalInterest) - totalRepaid;

    return (
        <div className="space-y-6">
            <div className="flex items-center">
                <button onClick={onBack} className="flex items-center space-x-2 text-brand-primary hover:text-brand-primary-hover">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    <span>Back to Main Dashboard</span>
                </button>
            </div>
            <h2 className="text-2xl font-bold text-brand-secondary mb-4">Lifetime Summary</h2>
            <p className="text-slate-600 -mt-4">This is a summary of all your activity, including both active and closed loans.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard title="Total Lent" amount={totalLent} currency={currency} color="text-brand-secondary" />
                <SummaryCard title="Interest Earned" amount={totalInterest} currency={currency} color="text-green-600" />
                <SummaryCard title="Total Repaid" amount={totalRepaid} currency={currency} color="text-brand-primary-dark" />
                <SummaryCard title="Outstanding" amount={totalOutstanding} currency={currency} color="text-red-600" />
            </div>
        </div>
    );
};
