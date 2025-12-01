import React, { useState, useEffect } from 'react';
import { Subscription, BillingCycle } from '../types';
import { X, Check } from 'lucide-react';
import { format, isValid, addMonths } from 'date-fns';

interface EditModalProps {
  isOpen: boolean;
  subscription: Subscription | null;
  onClose: () => void;
  onSave: (updated: Subscription) => void;
}

// 10 Color Palette (Added White)
const COLOR_PALETTE = [
  '#FFFFFF', // White
  '#E50914', // Red
  '#FC801D', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#1DB954', // Green
  '#00A8E1', // Sky Blue
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
];

export const EditModal: React.FC<EditModalProps> = ({ isOpen, subscription, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Subscription>>({});

  useEffect(() => {
    if (subscription) {
      setFormData({ ...subscription });
    }
  }, [subscription]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !subscription) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      // Final check for start date validity
      if (formData.startDate && !isValid(formData.startDate)) {
        alert("Please enter a valid start date.");
        return;
      }
      onSave(formData as Subscription);
    }
    onClose();
  };

  // Helper to calculate expected end date based on cycle
  const calculateCycleEndDate = (start: Date, cycle: BillingCycle) => {
    if (!isValid(start)) return null;
    return cycle === BillingCycle.MONTHLY ? addMonths(start, 1) : addMonths(start, 12);
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    if (!value) {
      // Don't allow clearing start date, but allow clearing end date
      if (field === 'startDate') return;
      setFormData(prev => ({ ...prev, [field]: null }));
      return;
    }
    
    const dateObj = new Date(value);
    // Only update if it's a valid date
    if (isValid(dateObj)) {
      if (field === 'startDate') {
        // When Start Date changes:
        // If Auto-Renew is ON, automatically recalculate End Date based on cycle
        let newEndDate = formData.endDate;
        const isAutoRenew = formData.autoRenew ?? true;

        if (isAutoRenew) {
             newEndDate = calculateCycleEndDate(dateObj, formData.cycle || BillingCycle.MONTHLY);
        }

        setFormData(prev => ({ 
          ...prev, 
          startDate: dateObj,
          endDate: newEndDate
        }));
      } else {
        setFormData(prev => ({ ...prev, [field]: dateObj }));
      }
    }
  };

  const handleAutoRenewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    let newEndDate = formData.endDate;

    // If turning ON auto-renew, FORCE reset end date to standard cycle length
    if (checked && formData.startDate && isValid(formData.startDate)) {
         newEndDate = calculateCycleEndDate(formData.startDate, formData.cycle || BillingCycle.MONTHLY);
    }

    setFormData(prev => ({
        ...prev,
        autoRenew: checked,
        endDate: newEndDate
    }));
  };

  // Helper to safely format date for input
  const formatDateForInput = (date?: Date | null) => {
    if (!date || !isValid(date)) return '';
    try {
      return format(date, 'yyyy-MM-dd');
    } catch (e) {
      return '';
    }
  };

  const isAutoRenew = formData.autoRenew ?? true;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl p-8 transform transition-all animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-white tracking-tight">
            {formData.type === 'category' ? 'Edit Category' : 'Edit Subscription'}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Name */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              {formData.type === 'category' ? 'Category Name' : 'Service Name'}
            </label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-zinc-600 font-medium"
              placeholder={formData.type === 'category' ? "e.g. Entertainment" : "e.g. Netflix Premium"}
            />
          </div>

          {/* Color Selection - Single Row, No Scroll, Justified */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Color Theme</label>
            <div className="flex items-center justify-between p-1">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-7 h-7 rounded-full flex shrink-0 items-center justify-center transition-all border border-zinc-700 ${formData.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {formData.color === color && (
                    <Check 
                      size={14} 
                      className={`drop-shadow-md ${color === '#FFFFFF' ? 'text-black' : 'text-white'}`} 
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Start Date</label>
              <input
                type="date"
                required
                max="2999-12-31"
                value={formatDateForInput(formData.startDate)}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                End Date 
                {isAutoRenew ? (
                   <span className="text-zinc-500 font-normal normal-case ml-1">(Auto-Calculated)</span>
                ) : (
                   <span className="text-blue-400 font-normal normal-case ml-1">(Manual)</span>
                )}
              </label>
              <input
                type="date"
                max="2999-12-31"
                disabled={isAutoRenew}
                value={formatDateForInput(formData.endDate)}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className={`w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium [color-scheme:dark] ${isAutoRenew ? 'opacity-50 cursor-not-allowed text-zinc-500' : ''}`}
              />
            </div>
          </div>

          {/* Auto Renewal Checkbox */}
          <div>
             <label className="flex items-center space-x-3 cursor-pointer group">
                <input 
                  type="checkbox"
                  checked={isAutoRenew}
                  onChange={handleAutoRenewChange}
                  className="w-5 h-5 rounded border-zinc-600 bg-zinc-900 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-colors"
                />
                <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">Auto-Renewal (Continuous)</span>
             </label>
          </div>

          {/* Cost & Cycle Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
               <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Billing Cycle</label>
               <div className="relative">
                 <select
                  value={formData.cycle || BillingCycle.MONTHLY}
                  onChange={(e) => {
                    const newCycle = e.target.value as BillingCycle;
                    
                    // Auto-calculate end date based on the new cycle choice IF Auto-Renew is ON
                    let newEndDate = formData.endDate;
                    const autoRenewActive = formData.autoRenew ?? true;

                    if (autoRenewActive && formData.startDate && isValid(formData.startDate)) {
                         newEndDate = calculateCycleEndDate(formData.startDate, newCycle);
                    }

                    setFormData({ 
                      ...formData, 
                      cycle: newCycle,
                      endDate: newEndDate
                    });
                  }}
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
                value={formData.amount !== undefined ? formData.amount : ''}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                placeholder="0"
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end space-x-3 border-t border-zinc-800 mt-2">
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