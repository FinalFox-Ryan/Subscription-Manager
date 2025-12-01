import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface DateRangeModalProps {
  isOpen: boolean;
  startDate: Date;
  endDate: Date;
  onClose: () => void;
  onSave: (start: Date, end: Date) => void;
}

export const DateRangeModal: React.FC<DateRangeModalProps> = ({ isOpen, startDate, endDate, onClose, onSave }) => {
  const [startStr, setStartStr] = useState('');
  const [endStr, setEndStr] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStartStr(format(startDate, 'yyyy-MM'));
      setEndStr(format(endDate, 'yyyy-MM'));
    }
  }, [isOpen, startDate, endDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (startStr && endStr) {
      const newStart = new Date(startStr + '-01');
      const newEnd = new Date(endStr + '-01');
      
      if (newEnd < newStart) {
        alert("End date must be after start date");
        return;
      }
      onSave(newStart, newEnd);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl p-8 transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-zinc-800 rounded-lg text-white">
                <Calendar size={20} />
             </div>
             <h2 className="text-xl font-black text-white tracking-tight">Timeline Range</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Start Month</label>
              <input
                type="month"
                required
                value={startStr}
                onChange={(e) => setStartStr(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">End Month</label>
              <input
                type="month"
                required
                value={endStr}
                onChange={(e) => setEndStr(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium [color-scheme:dark]"
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
              Update View
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};