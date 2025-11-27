import React, { useState, useEffect } from 'react';
import { Subscription, BillingCycle } from '../types';
import { X } from 'lucide-react';
import { format } from 'date-fns';

interface EditModalProps {
  isOpen: boolean;
  subscription: Subscription | null;
  onClose: () => void;
  onSave: (updated: Subscription) => void;
}

export const EditModal: React.FC<EditModalProps> = ({ isOpen, subscription, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Subscription>>({});

  useEffect(() => {
    if (subscription) {
      setFormData({ ...subscription });
    }
  }, [subscription]);

  if (!isOpen || !subscription) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData as Subscription);
    }
    onClose();
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    if (!value) {
      setFormData(prev => ({ ...prev, [field]: null }));
      return;
    }
    setFormData(prev => ({ ...prev, [field]: new Date(value) }));
  };

  // Helper to safely format date for input
  const formatDateForInput = (date?: Date | null) => {
    if (!date) return '';
    try {
      return format(date, 'yyyy-MM-dd');
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl p-8 transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-white tracking-tight">Edit Subscription</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Name */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Service Name</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-zinc-600 font-medium"
              placeholder="e.g. Netflix Premium"
            />
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Start Date</label>
              <input
                type="date"
                required
                value={formatDateForInput(formData.startDate)}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">End Date <span className="text-zinc-600 font-normal normal-case ml-1">(Optional)</span></label>
              <input
                type="date"
                value={formatDateForInput(formData.endDate)}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Cost & Cycle Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
               <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Billing Cycle</label>
               <div className="relative">
                 <select
                  value={formData.cycle || BillingCycle.MONTHLY}
                  onChange={(e) => setFormData({ ...formData, cycle: e.target.value as BillingCycle })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                >
                  <option value={BillingCycle.MONTHLY}>Monthly</option>
                  <option value={BillingCycle.YEARLY}>Yearly</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
               </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Amount (KRW)</label>
              <input
                type="number"
                required
                min="0"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                placeholder="0"
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end space-x-3 border-t border-zinc-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-white hover:bg-zinc-200 text-black rounded-lg font-bold text-sm shadow-lg shadow-white/10 transition-all transform active:scale-95"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};