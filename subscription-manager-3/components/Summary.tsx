import React, { useMemo } from 'react';
import { Subscription, BillingCycle } from '../types';
import { Layers, CreditCard, CalendarRange } from 'lucide-react';

interface SummaryProps {
  subscriptions: Subscription[];
}

export const Summary: React.FC<SummaryProps> = ({ subscriptions }) => {
  const stats = useMemo(() => {
    let totalMonthly = 0;
    let totalYearly = 0;
    let serviceCount = 0;

    subscriptions.forEach(sub => {
      // Skip category items for stats
      if (sub.type === 'category') return;

      serviceCount++;
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
      count: serviceCount,
      monthly: totalMonthly,
      yearly: totalYearly
    };
  }, [subscriptions]);

  // Helper to format as "186,900원" (Round up to nearest 100 won)
  const formatWon = (amount: number) => {
    return (Math.ceil(amount / 100) * 100).toLocaleString('ko-KR') + '원';
  };

  // Adjusted alignment to justify-start (Left)
  const blockClass = "bg-surface rounded-2xl border border-zinc-800 shadow-lg py-3 px-6 flex items-center justify-start gap-5 hover:border-zinc-700 transition-colors duration-300";
  // Increased container size (w-10 -> w-14)
  const iconContainerClass = "w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 w-full">
      
      {/* Total Count Block */}
      <div className={blockClass}>
        <div className={iconContainerClass}>
          {/* Increased icon size */}
          <Layers size={28} />
        </div>
        <div className="flex flex-col text-left">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Total Services</p>
          <h3 className="text-2xl font-black text-white tracking-tight">{stats.count}</h3>
        </div>
      </div>

      {/* Monthly Cost Block */}
      <div className={blockClass}>
        <div className={iconContainerClass}>
          <CreditCard size={28} />
        </div>
        <div className="flex flex-col text-left">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Monthly Cost</p>
          <h3 className="text-2xl font-black text-white tracking-tight">
            {formatWon(stats.monthly)}
          </h3>
        </div>
      </div>

      {/* Annual Cost Block */}
      <div className={blockClass}>
        <div className={iconContainerClass}>
          <CalendarRange size={28} />
        </div>
        <div className="flex flex-col text-left">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Annual Cost</p>
          <h3 className="text-2xl font-black text-white tracking-tight">
            {formatWon(stats.yearly)}
          </h3>
        </div>
      </div>

    </div>
  );
};