import React, { useState, useEffect, useRef } from 'react';
import { Summary } from './components/Summary';
import { Timeline } from './components/Timeline';
import { EditModal } from './components/EditModal';
import { DateRangeModal } from './components/DateRangeModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { Subscription, BillingCycle } from './types';
import { startOfMonth, subMonths, addMonths, isValid } from 'date-fns';
import { Settings, SlidersHorizontal } from 'lucide-react';
import { db } from './firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  writeBatch 
} from 'firebase/firestore';

const App: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  
  // Options State
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [futureOpacity, setFutureOpacity] = useState<number>(0.3); // Default 30%
  const optionsRef = useRef<HTMLDivElement>(null);

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Timeline Range State
  const now = new Date();
  const [timelineStart, setTimelineStart] = useState<Date>(startOfMonth(subMonths(now, 1)));
  const [timelineEnd, setTimelineEnd] = useState<Date>(startOfMonth(addMonths(now, 13)));

  // Real-time Firestore Sync
  useEffect(() => {
    const q = query(collection(db, "subscriptions"), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subs: Subscription[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let start = new Date();
        let end = null;
        
        // Safely convert Timestamp to Date
        try {
            start = data.startDate && typeof data.startDate.toDate === 'function' 
                ? data.startDate.toDate() 
                : new Date(data.startDate); // Fallback for standard date strings
            
            if (data.endDate) {
                end = typeof data.endDate.toDate === 'function'
                    ? data.endDate.toDate()
                    : new Date(data.endDate);
            }
        } catch (e) {
            console.error("Date conversion error:", e);
        }

        subs.push({
          id: doc.id,
          name: data.name,
          amount: data.amount,
          currency: data.currency,
          cycle: data.cycle,
          startDate: start,
          endDate: end,
          color: data.color,
          autoRenew: data.autoRenew ?? true,
          order: data.order ?? 0,
          type: data.type || 'service' // Default to service for existing data
        } as Subscription);
      });
      setSubscriptions(subs);
    });

    return () => unsubscribe();
  }, []);

  // Close options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setIsOptionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleEditClick = (sub: Subscription) => {
    setEditingSub(sub);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    const newSub: Subscription = {
      id: '', // Will be set by Firestore
      name: 'New Subscription',
      amount: 10000,
      currency: 'KRW',
      cycle: BillingCycle.MONTHLY,
      startDate: new Date(),
      endDate: null,
      color: '#3b82f6',
      autoRenew: true,
      order: subscriptions.length,
      type: 'service'
    };
    setEditingSub(newSub);
    setIsModalOpen(true);
  };

  const handleAddCategoryClick = async () => {
    try {
      await addDoc(collection(db, "subscriptions"), {
        type: 'category',
        name: 'Category Line',
        amount: 0,
        currency: 'KRW',
        cycle: BillingCycle.MONTHLY, // Dummy value
        startDate: new Date(), // Dummy value
        endDate: null,
        color: '#52525b',
        autoRenew: false,
        order: subscriptions.length
      });
    } catch (e) {
      console.error("Error adding category: ", e);
    }
  };

  const handleSave = async (updatedSub: Subscription) => {
    // 1. Validate Date Validity
    if (!isValid(updatedSub.startDate)) {
        alert("Invalid Start Date.");
        return;
    }
    if (updatedSub.endDate && !isValid(updatedSub.endDate)) {
        alert("Invalid End Date.");
        return;
    }

    // 2. Validate Date Range (Prevent overflow errors)
    const MAX_YEAR = 3000;
    if (updatedSub.startDate.getFullYear() > MAX_YEAR || (updatedSub.endDate && updatedSub.endDate.getFullYear() > MAX_YEAR)) {
        alert("Date is too far in the future. Please select a date before year 3000.");
        return;
    }

    try {
      if (updatedSub.id) {
        // Update existing
        const subRef = doc(db, "subscriptions", updatedSub.id);
        await updateDoc(subRef, {
          name: updatedSub.name,
          amount: updatedSub.amount,
          currency: updatedSub.currency,
          cycle: updatedSub.cycle,
          startDate: updatedSub.startDate,
          endDate: updatedSub.endDate,
          color: updatedSub.color,
          autoRenew: updatedSub.autoRenew,
          type: updatedSub.type
        });
      } else {
        // Create new
        const { id, ...data } = updatedSub;
        await addDoc(collection(db, "subscriptions"), {
          ...data,
          order: subscriptions.length 
        });
      }
    } catch (e) {
      console.error("Error saving document: ", e);
      alert("Failed to save. Please try again.");
    }
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, "subscriptions", deleteId));
      setDeleteId(null);
    } catch (e) {
      console.error("Error deleting document: ", e);
      alert("Failed to delete the item. Please check your connection.");
    }
  };

  const handleRangeSave = (start: Date, end: Date) => {
    setTimelineStart(start);
    setTimelineEnd(end);
    setIsRangeModalOpen(false);
  };

  const handleReorder = async (newOrder: Subscription[]) => {
    // Optimistic Update
    setSubscriptions(newOrder);

    try {
      const batch = writeBatch(db);
      newOrder.forEach((sub, index) => {
        const subRef = doc(db, "subscriptions", sub.id);
        batch.update(subRef, { order: index });
      });
      await batch.commit();
    } catch (e) {
      console.error("Error reordering: ", e);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-[1920px] mx-auto px-6 pt-16 pb-2 md:px-20 lg:px-32 bg-background text-zinc-200 relative">
      
      {/* Top Right Options Button */}
      <div className="absolute top-6 right-6 md:right-10 z-[60]" ref={optionsRef}>
        <button 
          onClick={() => setIsOptionsOpen(!isOptionsOpen)}
          className={`p-2 rounded-full transition-all duration-300 ${isOptionsOpen ? 'bg-zinc-800 text-white rotate-90' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}
          title="Options"
        >
          <Settings size={24} />
        </button>

        {/* Options Dropdown */}
        {isOptionsOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-surface border border-zinc-800 rounded-xl shadow-2xl p-5 animate-in fade-in slide-in-from-top-2 duration-200">
             <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-zinc-800/50">
                <SlidersHorizontal size={16} className="text-zinc-400"/>
                <span className="text-sm font-bold text-white uppercase tracking-wider">Display Options</span>
             </div>
             
             <div className="space-y-4">
               <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Future Bar Opacity</label>
                    <span className="text-xs font-mono text-zinc-300">{Math.round(futureOpacity * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05"
                    value={futureOpacity} 
                    onChange={(e) => setFutureOpacity(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                  />
                  <p className="text-[10px] text-zinc-600 mt-1.5 leading-tight">
                    Adjusts the visibility of projected subscription periods when Auto-Renewal is active.
                  </p>
               </div>
             </div>
          </div>
        )}
      </div>

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
      <main className="flex-1 min-h-0 pb-4">
        <Timeline 
          subscriptions={subscriptions} 
          startDate={timelineStart}
          endDate={timelineEnd}
          futureOpacity={futureOpacity}
          onEdit={handleEditClick} 
          onAdd={handleAddClick}
          onAddCategory={handleAddCategoryClick}
          onDelete={handleDeleteRequest}
          onEditRange={() => setIsRangeModalOpen(true)}
          onReorder={handleReorder}
        />
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center">
        <p className="text-xs text-zinc-600 font-light tracking-wide">
          Copyright © 2025, Ryan Co., Ltd., All Rights Reserved.
        </p>
      </footer>

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

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default App;