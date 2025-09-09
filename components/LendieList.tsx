
import React from 'react';
import { Lendie } from '../types';
import { calculateTotalPrincipal, calculateTotalRepayments, calculateTotalInterest } from '../services/calculationService';
import { formatCurrency } from '../utils/format';

interface LendieListProps {
  lendies: Lendie[];
  onSelectLendie: (lendieId: string) => void;
  currency: string;
}

const LendieListItem: React.FC<{ lendie: Lendie, onSelect: (id: string) => void, currency: string }> = ({ lendie, onSelect, currency }) => {
  const today = new Date().toISOString().split('T')[0];
  const totalPrincipal = calculateTotalPrincipal(lendie);
  const totalRepaid = calculateTotalRepayments(lendie);
  const totalInterest = calculateTotalInterest(lendie, today);
  const balance = (totalPrincipal + totalInterest) - totalRepaid;

  return (
    <div onClick={() => onSelect(lendie.id)} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg hover:border-sky-500 border-2 border-transparent transition-all cursor-pointer flex items-center space-x-4">
      <img src={lendie.photo || `https://i.pravatar.cc/150?u=${lendie.id}`} alt={lendie.name} className="w-16 h-16 rounded-full object-cover" />
      <div className="flex-1">
        <h3 className="text-xl font-bold text-slate-800">{lendie.name}</h3>
        <p className="text-sm text-slate-500">{lendie.mobile}</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-semibold text-slate-700">{currency}{formatCurrency(balance)}</p>
        <p className="text-xs text-slate-500">Outstanding Balance</p>
      </div>
    </div>
  );
};

export const LendieList: React.FC<LendieListProps> = ({ lendies, onSelectLendie, currency }) => {
  return (
    <div className="space-y-4">
      {lendies.map(lendie => (
        <LendieListItem key={lendie.id} lendie={lendie} onSelect={onSelectLendie} currency={currency} />
      ))}
      {lendies.length === 0 && (
        <div className="text-center py-10 px-4 bg-white rounded-lg shadow-md">
            <h3 className="text-lg text-slate-600">No lendies yet.</h3>
            <p className="text-slate-500">Click "Add New Lendie" to get started.</p>
        </div>
      )}
    </div>
  );
};