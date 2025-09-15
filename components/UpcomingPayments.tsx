import React from 'react';
import { UpcomingPayment } from '../types';
import { formatCurrency } from '../utils/format';

interface UpcomingPaymentsProps {
  payments: UpcomingPayment[];
  currency: string;
  onSelectLendie: (lendieId: string) => void;
}

export const UpcomingPayments: React.FC<UpcomingPaymentsProps> = ({ payments, currency, onSelectLendie }) => {
  if (payments.length === 0) {
    return (
        <div className="mb-8 text-center py-10 px-4 bg-white rounded-lg shadow-md">
            <h3 className="text-lg text-slate-600">No upcoming deadlines.</h3>
            <p className="text-slate-500">You have no payments due in the next 30 days.</p>
        </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-slate-700 mb-4">Upcoming Deadlines (Next 30 Days)</h2>
      <div className="bg-white rounded-lg shadow-md">
        <ul className="divide-y divide-slate-200">
          {payments.map((payment, index) => {
             const paymentDate = new Date(payment.date);
             const isOverdue = paymentDate < today;
             const isToday = paymentDate.getTime() === today.getTime();
             
             let dateColor = 'text-slate-600';
             if (isToday) {
                 dateColor = 'text-yellow-600 font-bold';
             } else if (isOverdue) {
                 dateColor = 'text-red-600 font-bold';
             }

            return (
              <li 
                key={`${payment.loanId}-${index}`} 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                onClick={() => onSelectLendie(payment.lendieId)}
              >
                <div className="flex-1">
                    <p className="font-semibold text-slate-800">{payment.lendieName}</p>
                    <p className="text-sm text-slate-500">
                        {payment.type === 'EMI' ? 'EMI Payment' : 'Lump-sum Due'}
                    </p>
                </div>
                <div className="text-right">
                    <p className={`text-lg font-bold ${payment.type === 'EMI' ? 'text-brand-primary-dark' : 'text-slate-800'}`}>
                        {currency}{formatCurrency(payment.amount)}
                    </p>
                    <p className={`text-sm ${dateColor}`}>{payment.date}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};