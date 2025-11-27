import React, { useState } from 'react';
import { Summary } from './components/Summary';
import { Timeline } from './components/Timeline';
import { EditModal } from './components/EditModal';
import { DateRangeModal } from './components/DateRangeModal';
import { MOCK_SUBSCRIPTIONS } from './constants';
import { Subscription, BillingCycle } from './types';
import { v4 as uuidv4 } from 'uuid';
import { startOfMonth, subMonths, addMonths } from 'date-fns';

const App: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(MOCK_SUBSCRIPTIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  // Timeline Range State
  const now = new Date();
  const [timelineStart, setTimelineStart] = useState<Date>(startOfMonth(subMonths(now, 1)));
  const [timelineEnd, setTimelineEnd] = useState<Date>(startOfMonth(addMonths(now, 13)));

  const handleEditClick = (sub: Subscription) => {
    setEditingSub(sub);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    const newSub: Subscription = {
      id: uuidv4(),
      name: 'New Subscription',
      amount: 10000,
      currency: 'KRW',
      cycle: BillingCycle.MONTHLY,
      startDate: new Date(),
      endDate: null,
      color: '#3b82f6'
    };
    setEditingSub(newSub);
    setIsModalOpen(true);
  };

  const handleSave = (updatedSub: Subscription) => {
    setSubscriptions(prev => {
      const exists = prev.find(s => s.id === updatedSub.id);
      if (exists) {
        return prev.map(sub => sub.id === updatedSub.id ? updatedSub : sub);
      } else {
        return [...prev, updatedSub];
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this subscription?')) {
      setSubscriptions(prev => prev.filter(sub => sub.id !== id));
    }
  };

  const handleRangeSave = (start: Date, end: Date) => {
    setTimelineStart(start);
    setTimelineEnd(end);
    setIsRangeModalOpen(false);
  };

  const handleReorder = (newOrder: Subscription[]) => {
    setSubscriptions(newOrder);
  };

  return (
    <div className="flex flex-col h-screen max-w-[1920px] mx-auto px-6 pt-16 pb-6 md:px-20 lg:px-32 bg-background text-zinc-200">
      {/* Header Section */}
      <div className="mb-8 pt-4 flex flex-col items-center justify-center w-full">
        {/* Main Title */}
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-center pb-2 leading-tight bg-gradient-to-r from-zinc-600 via-white to-zinc-600 bg-[length:200%_auto] bg-clip-text text-transparent animate-[shimmer_8s_linear_infinite,breathe_5s_ease-in-out_infinite]">
          Subscription Manager
        </h1>
        
        {/* Gradient Divider Line */}
        <div className="w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-zinc-500 to-transparent mt-4 mb-2 opacity-50 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
        
        {/* Slogan */}
        <p className="text-zinc-400 text-center text-sm md:text-base font-light tracking-wide">
          A visual timeline tool to manage recurring subscriptions and expenses.
        </p>
      </div>

      {/* Stats Dashboard */}
      <Summary subscriptions={subscriptions} />

      {/* Main Visualization Area */}
      <main className="flex-1 min-h-0 pb-6">
        <Timeline 
          subscriptions={subscriptions} 
          startDate={timelineStart}
          endDate={timelineEnd}
          onEdit={handleEditClick} 
          onAdd={handleAddClick}
          onDelete={handleDelete}
          onEditRange={() => setIsRangeModalOpen(true)}
          onReorder={handleReorder}
        />
      </main>

      {/* Modals */}
      <EditModal 
        isOpen={isModalOpen} 
        subscription={editingSub} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave}
      />

      <DateRangeModal
        isOpen={isRangeModalOpen}
        startDate={timelineStart}
        endDate={timelineEnd}
        onClose={() => setIsRangeModalOpen(false)}
        onSave={handleRangeSave}
      />
    </div>
  );
};

export default App;