
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

interface GlobalSummaryDashboardProps {
    totalLent: number;
    totalInterest: number;
    totalRepaid: number;
    currency: string;
}

export const GlobalSummaryDashboard: React.FC<GlobalSummaryDashboardProps> = ({
    totalLent,
    totalInterest,
    totalRepaid,
    currency,
}) => {
    const totalOutstanding = (totalLent + totalInterest) - totalRepaid;

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-700 mb-4">Overall Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard title="Total Lent" amount={totalLent} currency={currency} color="text-slate-700" />
                <SummaryCard title="Interest Earned" amount={totalInterest} currency={currency} color="text-green-600" />
                <SummaryCard title="Total Repaid" amount={totalRepaid} currency={currency} color="text-sky-600" />
                <SummaryCard title="Outstanding" amount={totalOutstanding} currency={currency} color="text-red-600" />
            </div>
        </div>
    );
};