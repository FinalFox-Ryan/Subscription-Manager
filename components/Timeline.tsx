import React, { useMemo, useState, useRef } from 'react';
import { Subscription, BillingCycle } from '../types';
import { getTimelineRange, getPositionPercentage, getWidthPercentage, formatMoney } from '../utils/dateHelpers';
import { format, differenceInDays } from 'date-fns';
import { Reorder, useDragControls } from 'framer-motion';
import { 
  Film, 
  Music, 
  ShoppingCart, 
  Code, 
  Activity, 
  Cloud, 
  Zap, 
  Smartphone, 
  BookOpen, 
  Coffee,
  Plus,
  Trash2,
  Pencil,
  Settings,
  GripVertical
} from 'lucide-react';

interface TimelineProps {
  subscriptions: Subscription[];
  startDate: Date;
  endDate: Date;
  onEdit: (sub: Subscription) => void;
  onAdd?: () => void;
  onDelete?: (id: string) => void;
  onEditRange?: () => void;
  onReorder?: (newOrder: Subscription[]) => void;
}

// Helper to predict icon based on name
const getServiceIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('netflix') || n.includes('disney') || n.includes('youtube') || n.includes('hulu') || n.includes('watch')) return <Film size={14} />;
  if (n.includes('spotify') || n.includes('music') || n.includes('melon')) return <Music size={14} />;
  if (n.includes('amazon') || n.includes('coupang') || n.includes('shopping') || n.includes('delivery')) return <ShoppingCart size={14} />;
  if (n.includes('cloud') || n.includes('aws') || n.includes('azure') || n.includes('drive')) return <Cloud size={14} />;
  if (n.includes('gym') || n.includes('health') || n.includes('fitness') || n.includes('yoga')) return <Activity size={14} />;
  if (n.includes('code') || n.includes('git') || n.includes('jetbrains') || n.includes('dev')) return <Code size={14} />;
  if (n.includes('adobe') || n.includes('figma') || n.includes('design')) return <Smartphone size={14} />;
  if (n.includes('book') || n.includes('read') || n.includes('medium')) return <BookOpen size={14} />;
  if (n.includes('coffee') || n.includes('food')) return <Coffee size={14} />;
  return <Zap size={14} />; // Default
};

export const Timeline: React.FC<TimelineProps> = ({ subscriptions, startDate, endDate, onEdit, onAdd, onDelete, onEditRange, onReorder }) => {
  // Use passed start/end dates instead of calculating default
  const { start, end, months } = useMemo(() => getTimelineRange(startDate, endDate), [startDate, endDate]);
  const totalDays = useMemo(() => differenceInDays(end, start), [start, end]);
  
  // --- Resizing Logic (Delta based) ---
  const [sidebarWidth, setSidebarWidth] = useState(240); // Slightly increased default for grip
  const resizingRef = useRef<{ startX: number, startWidth: number } | null>(null);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = {
      startX: e.clientX,
      startWidth: sidebarWidth
    };
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizingRef.current) return;
    
    const delta = e.clientX - resizingRef.current.startX;
    const newWidth = Math.max(140, Math.min(500, resizingRef.current.startWidth + delta));
    
    setSidebarWidth(newWidth);
  };

  const stopResizing = () => {
    resizingRef.current = null;
    document.body.style.cursor = 'default';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
  };
  
  const todayLeft = useMemo(() => {
    return getPositionPercentage(new Date(), start, totalDays);
  }, [start, totalDays]);

  // Group months by year for the header
  const yearGroups = useMemo(() => {
    const groups: { year: string; count: number }[] = [];
    if (months.length === 0) return groups;

    let currentYear = format(months[0], 'yyyy');
    let currentCount = 0;

    months.forEach(month => {
      const year = format(month, 'yyyy');
      if (year === currentYear) {
        currentCount++;
      } else {
        groups.push({ year: currentYear, count: currentCount });
        currentYear = year;
        currentCount = 1;
      }
    });
    if (currentCount > 0) {
      groups.push({ year: currentYear, count: currentCount });
    }
    
    return groups;
  }, [months]);

  // Common header style class
  const headerStyle = "text-sm font-black text-white uppercase tracking-wider";

  return (
    <div className="flex flex-col h-full bg-surface rounded-xl border border-zinc-800 shadow-lg overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar flex flex-col">
        <div className="w-full relative min-h-full flex flex-col">
          
          {/* Grid Header (Year & Month grouped) */}
          <div className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-zinc-800 h-14 flex shrink-0 shadow-sm">
             {/* Service Column Header - Resizable */}
             <div 
               className={`shrink-0 bg-surface border-r border-zinc-800 flex items-center justify-between px-4 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] truncate h-full z-40 relative group ${headerStyle}`}
               style={{ width: sidebarWidth }}
             >
               <span className="pl-6">SERVICE</span>
               
               {/* Resize Handle */}
               <div 
                 className="absolute right-0 top-0 bottom-0 w-1 hover:w-1.5 cursor-col-resize bg-transparent hover:bg-blue-500/50 transition-colors z-50"
                 onMouseDown={startResizing}
               />
             </div>
             
             {/* Timeline Header Columns - Editable on Hover */}
             <div className="flex-1 flex flex-col min-w-0 border-r border-zinc-800 relative group/header">
                
                {/* Years Row */}
                <div className="flex h-1/2 w-full border-b border-zinc-800/50 relative">
                  {yearGroups.map((group, i) => (
                    <div 
                      key={i} 
                      className={`border-r border-zinc-800/50 flex items-center justify-center bg-zinc-800/30 ${headerStyle}`}
                      style={{ width: `${(group.count / months.length) * 100}%` }}
                    >
                      {group.year}
                    </div>
                  ))}

                  {/* Edit Timeline Range Icon (Circular, Right-aligned) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditRange?.();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center opacity-0 group-hover/header:opacity-100 transition-all z-50 shadow-sm"
                    title="Edit Timeline Range"
                  >
                    <Settings size={14} />
                  </button>
                </div>
                
                {/* Months Row */}
                <div className="flex h-1/2 w-full relative">
                   {months.map((month, i) => {
                      const widthPct = 100 / months.length; 
                      const isCurrentMonth = format(new Date(), 'yyyy-MM') === format(month, 'yyyy-MM');
   
                      return (
                        <div 
                           key={i} 
                           className={`border-r border-zinc-800/30 flex items-center justify-center leading-tight relative ${isCurrentMonth ? 'bg-white/5' : ''}`}
                           style={{ width: `${widthPct}%` }}
                        >
                          <span className={`${headerStyle} ${isCurrentMonth ? 'text-zinc-200' : 'text-zinc-400'}`}>
                            {format(month, 'M')}월
                          </span>
                        </div>
                      );
                   })}
                </div>
             </div>

             {/* Monthly Amount Header */}
             <div className={`w-28 shrink-0 bg-surface border-r border-zinc-800 flex items-center justify-end px-3 h-full z-40 ${headerStyle}`}>
               MONTHLY
             </div>
             {/* Annual Amount Header */}
             <div className={`w-28 shrink-0 bg-surface flex items-center justify-end px-3 h-full z-40 ${headerStyle}`}>
               ANNUAL
             </div>
          </div>

          {/* Timeline Body */}
          <div className="relative flex-1 pt-10">
             {/* Vertical Grid Lines Background */}
             <div 
               className="absolute inset-0 right-56 pointer-events-none z-0"
               style={{ left: sidebarWidth }}
             >
                {months.map((_, i) => (
                  <div key={i} className="border-r border-zinc-800/30 h-full" style={{ width: `${100 / months.length}%` }}></div>
                ))}
             </div>
             
             {/* Today Label Overlay (Positioned in top padding gap) */}
             <div 
                className="absolute top-0 right-56 h-10 pointer-events-none z-30"
                style={{ left: sidebarWidth }}
             >
                <div 
                  className="absolute top-2.5"
                  style={{ left: `${todayLeft}%` }}
                >
                  <div className="absolute -left-[18px] bg-zinc-200 text-zinc-900 text-[9px] px-1.5 py-0.5 rounded shadow-sm font-bold tracking-wider border border-white">
                    TODAY
                  </div>
                </div>
             </div>

             {/* Rows Wrapper for exact height of Today line (Subscriptions Only) */}
             <div className="relative">
                 {/* Today Line Background (Layered ABOVE bars now: z-[60] > hover:z-50) */}
                 <div 
                   className="absolute top-0 bottom-0 right-56 pointer-events-none z-[60]"
                   style={{ left: sidebarWidth }}
                 >
                    <div 
                      className="absolute top-0 bottom-0 border-l-2 border-dashed border-white/50"
                      style={{ left: `${todayLeft}%` }}
                    />
                 </div>

                 {/* Subscription Rows Reorder Group */}
                 <Reorder.Group axis="y" values={subscriptions} onReorder={onReorder || (() => {})}>
                   {subscriptions.map((sub) => {
                     const left = getPositionPercentage(sub.startDate, start, totalDays);
                     const width = getWidthPercentage(sub.startDate, sub.endDate, start, end, totalDays);
                     
                     // Calculate display amounts
                     const monthlyVal = sub.cycle === BillingCycle.MONTHLY ? sub.amount : sub.amount / 12;
                     const yearlyVal = sub.cycle === BillingCycle.YEARLY ? sub.amount : sub.amount * 12;

                     return (
                       <Reorder.Item 
                        key={sub.id} 
                        value={sub}
                        className="relative"
                       >
                         <div 
                          className="flex group transition-all duration-200 ease-out hover:scale-[1.005] hover:z-50 hover:bg-zinc-800 hover:shadow-xl hover:border-zinc-700 h-11 relative border-b border-zinc-800/50 origin-center bg-surface"
                         >
                           {/* Name Column (Resizable) */}
                           <div 
                            className="shrink-0 sticky left-0 z-20 bg-surface group-hover:bg-transparent border-r border-zinc-800 flex items-center px-4 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]"
                            style={{ width: sidebarWidth }}
                           >
                              {/* Drag Handle */}
                              <div className="mr-2 text-zinc-600 hover:text-zinc-300 cursor-grab active:cursor-grabbing">
                                <GripVertical size={14} />
                              </div>

                              <div className="flex items-center space-x-3 overflow-hidden flex-1">
                                {/* Auto-predicted Icon */}
                                <div 
                                  className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center bg-zinc-800 border border-zinc-700 text-zinc-400 group-hover:text-white group-hover:border-zinc-500 transition-colors"
                                >
                                  {getServiceIcon(sub.name)}
                                </div>
                                <span className="truncate font-bold text-zinc-300 text-sm group-hover:text-white transition-colors select-none">{sub.name}</span>
                              </div>
                              
                              {/* Edit/Delete Buttons (Visible on Hover) */}
                              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); onEdit(sub); }}
                                  className="p-1.5 hover:bg-blue-500/20 text-zinc-500 hover:text-blue-400 rounded transition-all"
                                  title="Edit"
                                >
                                  <Pencil size={14} />
                                </button>
                                {onDelete && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(sub.id); }}
                                    className="p-1.5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded transition-all"
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                           </div>

                           {/* Bar Area (No longer clickable) */}
                           <div className="flex-1 relative h-full z-10 border-r border-zinc-800">
                              <div className="relative w-full h-full">
                                {/* Rendering Split Bars: Past (Grayscale) and Future (Colored) */}
                                {(() => {
                                  const barStartPct = left;
                                  const barWidthPct = width;
                                  const barEndPct = barStartPct + barWidthPct;
                                  
                                  // If bar ends before today, render full grayscale
                                  if (barEndPct <= todayLeft) {
                                    return (
                                      <div 
                                        className="absolute top-1/2 -translate-y-1/2 h-4 rounded-full transition-all duration-300"
                                        style={{ 
                                          left: `${barStartPct}%`, 
                                          width: `${barWidthPct}%`,
                                          backgroundColor: '#3f3f46', // Zinc-700
                                          opacity: 0.6
                                        }}
                                      />
                                    );
                                  }
                                  
                                  // If bar starts after today, render full colored
                                  if (barStartPct >= todayLeft) {
                                    return (
                                      <div 
                                        className="absolute top-1/2 -translate-y-1/2 h-4 rounded-full transition-all duration-300 group-hover:brightness-110 group-hover:shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                                        style={{ 
                                          left: `${barStartPct}%`, 
                                          width: `${barWidthPct}%`,
                                          backgroundColor: sub.color,
                                          backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)',
                                          backgroundSize: '12px 12px',
                                          boxShadow: `0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 8px ${sub.color}40`,
                                        }}
                                      />
                                    );
                                  }
                                  
                                  // Split Bar: Part in past, Part in future
                                  const pastWidth = todayLeft - barStartPct;
                                  const futureWidth = barEndPct - todayLeft;
                                  
                                  return (
                                    <>
                                      {/* Past Part */}
                                      <div 
                                        className="absolute top-1/2 -translate-y-1/2 h-4 rounded-l-full transition-all duration-300"
                                        style={{ 
                                          left: `${barStartPct}%`, 
                                          width: `${pastWidth}%`,
                                          backgroundColor: '#3f3f46',
                                          opacity: 0.6,
                                          borderTopRightRadius: 0,
                                          borderBottomRightRadius: 0
                                        }}
                                      />
                                      {/* Future Part */}
                                      <div 
                                        className="absolute top-1/2 -translate-y-1/2 h-4 rounded-r-full transition-all duration-300 group-hover:brightness-110 group-hover:shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                                        style={{ 
                                          left: `${todayLeft}%`, 
                                          width: `${futureWidth}%`,
                                          backgroundColor: sub.color,
                                          backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)',
                                          backgroundSize: '12px 12px',
                                          boxShadow: `0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 8px ${sub.color}40`,
                                          borderTopLeftRadius: 0,
                                          borderBottomLeftRadius: 0
                                        }}
                                      />
                                    </>
                                  );
                                })()}
                                
                              </div>
                           </div>

                           {/* Monthly Amount Column */}
                           <div className={`w-28 shrink-0 flex items-center justify-end px-3 text-sm border-r border-zinc-800 bg-surface group-hover:bg-transparent transition-colors z-20 ${sub.cycle === BillingCycle.MONTHLY ? 'font-bold text-white' : 'text-zinc-500'}`}>
                              {formatMoney(monthlyVal)}
                           </div>

                           {/* Annual Amount Column */}
                           <div className={`w-28 shrink-0 flex items-center justify-end px-3 text-sm bg-surface group-hover:bg-transparent transition-colors z-20 ${sub.cycle === BillingCycle.YEARLY ? 'font-bold text-white' : 'text-zinc-500'}`}>
                              {formatMoney(yearlyVal)}
                           </div>
                         </div>
                       </Reorder.Item>
                     );
                   })}
                 </Reorder.Group>
             </div>

             {/* ADD SUBSCRIPTION ROW - MOVED OUTSIDE THE WRAPPER SO TODAY LINE DOES NOT COVER IT */}
             {onAdd && (
                <div 
                  onClick={onAdd}
                  className="flex group cursor-pointer transition-all duration-200 ease-out hover:bg-zinc-800 h-11 relative border-b border-zinc-800/50 origin-center items-center"
                >
                    {/* Name Column Area */}
                   <div 
                    className="shrink-0 sticky left-0 z-20 bg-surface group-hover:bg-transparent border-r border-zinc-800 flex items-center px-4 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] h-full"
                    style={{ width: sidebarWidth }}
                   >
                      <div className="flex items-center space-x-3 text-zinc-500 group-hover:text-white transition-colors pl-6">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center border border-dashed border-zinc-600 group-hover:border-white">
                           <Plus size={14} />
                        </div>
                        <span className="font-medium text-sm">Add Subscription</span>
                      </div>
                   </div>

                   {/* Rest of the row (Empty filler to maintain grid lines) */}
                   <div className="flex-1 h-full border-r border-zinc-800 bg-transparent" />
                   <div className="w-28 shrink-0 h-full border-r border-zinc-800 bg-transparent" />
                   <div className="w-28 shrink-0 h-full bg-transparent" />
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};