import React from 'react';
import { Lendie } from '../types';
import { calculateTotalPrincipal, calculateTotalRepayments, calculateTotalInterest } from '../services/calculationService';
import { formatCurrency } from '../utils/format';

interface LendieListProps {
  lendies: Lendie[];
  onSelectLendie: (lendieId: string) => void;
  currency: string;
  showAll?: boolean;
  onAddNewLendie?: () => void;
}

const LendieListItem: React.FC<{ lendie: Lendie, onSelect: (id: string) => void, currency: string }> = ({ lendie, onSelect, currency }) => {
  const today = new Date().toISOString().split('T')[0];
  const totalPrincipal = calculateTotalPrincipal(lendie);
  const totalRepaid = calculateTotalRepayments(lendie);
  const totalInterest = calculateTotalInterest(lendie, today);
  const balance = (totalPrincipal + totalInterest) - totalRepaid;

  return (
    <div onClick={() => onSelect(lendie.id)} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg hover:border-brand-primary border-2 border-transparent transition-all cursor-pointer flex items-center space-x-4">
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

export const LendieList: React.FC<LendieListProps> = ({ lendies, onSelectLendie, currency, showAll = false, onAddNewLendie }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const lendiesToShow = showAll 
    ? lendies
    : lendies.filter(lendie => {
        const totalPrincipal = calculateTotalPrincipal(lendie);
        const totalRepaid = calculateTotalRepayments(lendie);
        const totalInterest = calculateTotalInterest(lendie, today);
        const balance = (totalPrincipal + totalInterest) - totalRepaid;
        return balance >= 1;
      });

  return (
    <div className="space-y-4">
      {lendiesToShow.map(lendie => (
        <LendieListItem key={lendie.id} lendie={lendie} onSelect={onSelectLendie} currency={currency} />
      ))}
      {lendiesToShow.length === 0 && (
        <div className="text-center py-10 px-4 bg-white rounded-lg shadow-md">
            {showAll ? (
                 <>
                    <h3 className="text-lg text-slate-600">No lendies have been saved yet.</h3>
                    <p className="text-slate-500">Go to the main dashboard to add one.</p>
                </>
            ) : (
                <>
                    <h3 className="text-lg text-slate-600">No lendies with an outstanding balance.</h3>
                    <p className="text-slate-500 mb-4">View all saved lendies from the profile menu or add a new one to get started.</p>
                    {onAddNewLendie && (
                        <button onClick={onAddNewLendie} className="px-4 py-2 bg-brand-primary rounded-md text-white hover:bg-brand-primary-hover flex items-center space-x-2 mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                            <span>Add New Lendie</span>
                        </button>
                    )}
                </>
            )}
        </div>
      )}
    </div>
  );
};