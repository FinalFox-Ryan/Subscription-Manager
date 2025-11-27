import React, { useMemo } from 'react';
import { Subscription, BillingCycle } from '../types';
import { formatMoney } from '../utils/dateHelpers';
import { Layers } from 'lucide-react';

interface SummaryProps {
  subscriptions: Subscription[];
}

export const Summary: React.FC<SummaryProps> = ({ subscriptions }) => {
  const stats = useMemo(() => {
    let totalMonthly = 0;
    let totalYearly = 0;

    subscriptions.forEach(sub => {
      let monthlyAmount = 0;
      let yearlyAmount = 0;

      if (sub.cycle === BillingCycle.MONTHLY) {
        monthlyAmount = sub.amount;
        yearlyAmount = sub.amount * 12;
      } else {
        monthlyAmount = sub.amount / 12;
        yearlyAmount = sub.amount;
      }

      const isActive = !sub.endDate || sub.endDate > new Date();
      
      if (isActive) {
        totalMonthly += monthlyAmount;
        totalYearly += yearlyAmount;
      }
    });

    return {
      count: subscriptions.length,
      monthly: totalMonthly,
      yearly: totalYearly
    };
  }, [subscriptions]);

  return (
    <div className="bg-surface rounded-xl border border-zinc-800 shadow-lg mb-6 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
      
      {/* Total Count Section */}
      <div className="p-5 flex items-center space-x-4">
        <div className="p-3 bg-zinc-800 rounded-full text-zinc-100">
          <Layers size={24} />
        </div>
        <div>
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Total Services</p>
          <h3 className="text-2xl font-bold text-white">{stats.count}</h3>
        </div>
      </div>

      {/* Monthly Cost Section */}
      <div className="p-5 flex items-center space-x-4">
         <div className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-lg border border-zinc-700">
           ₩
         </div>
         <div>
           <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Monthly Cost</p>
           <h3 className="text-xl md:text-2xl font-bold text-white">{formatMoney(stats.monthly).replace('₩', '')}<span className="text-sm text-zinc-600 font-normal ml-1">KRW</span></h3>
         </div>
      </div>

      {/* Annual Cost Section */}
      <div className="p-5 flex items-center space-x-4">
         <div className="w-10 h-10 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-lg border border-zinc-700">
           ₩
         </div>
         <div>
           <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Annual Cost</p>
           <h3 className="text-xl md:text-2xl font-bold text-white">{formatMoney(stats.yearly).replace('₩', '')}<span className="text-sm text-zinc-600 font-normal ml-1">KRW</span></h3>
         </div>
      </div>

    </div>
  );
};