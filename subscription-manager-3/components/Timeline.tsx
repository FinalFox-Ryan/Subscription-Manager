import React, { useMemo, useState, useRef } from 'react';
import { Subscription, BillingCycle } from '../types';
import { getTimelineRange, getPositionPercentage, getWidthPercentage, formatMoney } from '../utils/dateHelpers';
import { format, differenceInDays, addMonths, isValid } from 'date-fns';
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
  GripVertical,
  Bot
} from 'lucide-react';

interface TimelineProps {
  subscriptions: Subscription[];
  startDate: Date;
  endDate: Date;
  futureOpacity: number;
  onEdit: (sub: Subscription) => void;
  onAdd?: () => void;
  onAddCategory?: () => void;
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
  if (n.includes('midjourney') || n.includes('gpt') || n.includes('openai') || n.includes('claude') || n.includes('gemini') || n.includes('bot') || n.includes('ai')) return <Bot size={14} />;
  return <Zap size={14} />; // Default
};

// --- Sub-Components for Rows ---

interface SubscriptionRowProps {
  sub: Subscription;
  sidebarWidth: number;
  start: Date;
  end: Date;
  totalDays: number;
  todayLeft: number;
  futureOpacity: number;
  onEdit: (sub: Subscription) => void;
  onDelete?: (id: string) => void;
}

const SubscriptionRow: React.FC<SubscriptionRowProps> = ({ sub, sidebarWidth, start, end, totalDays, todayLeft, futureOpacity, onEdit, onDelete }) => {
  const dragControls = useDragControls();

  const left = getPositionPercentage(sub.startDate, start, totalDays);
  const width = getWidthPercentage(sub.startDate, sub.endDate, start, end, totalDays);
  
  const monthlyVal = sub.cycle === BillingCycle.MONTHLY ? sub.amount : sub.amount / 12;
  const yearlyVal = sub.cycle === BillingCycle.YEARLY ? sub.amount : sub.amount * 12;

  const today = new Date();
  
  let nextRenewal = new Date(sub.startDate);
  
  // Logic to calculate next renewal from start date
  // Safety break to prevent infinite loops if dates are messed up
  if (isValid(sub.startDate)) {
      if (sub.startDate <= today) {
        let loopCount = 0;
        const MAX_LOOPS = 1000; // Protection against infinite loop

        while (nextRenewal <= today && loopCount < MAX_LOOPS) {
            nextRenewal = sub.cycle === BillingCycle.MONTHLY 
            ? addMonths(nextRenewal, 1) 
            : addMonths(nextRenewal, 12);
            loopCount++;
        }
      } else {
        nextRenewal = sub.cycle === BillingCycle.MONTHLY 
            ? addMonths(sub.startDate, 1) 
            : addMonths(sub.startDate, 12);
      }
  }

  // If autoRenew is checked, we visualize the bar extending "forever" in the future (within timeline bounds)
  // regardless of whether endDate is set or not (since endDate acts as a renewal stop date, but autoRenew implies continuity).
  // Actually, per user request: "Auto-Renewal checked => Translucent bar after period ends".
  
  // Visual Calculation:
  // 1. Solid part ends at: endDate (if set) OR nextRenewal (if endDate is not set)
  // 2. Future part starts at: Solid part end
  
  // However, if AutoRenew is ON, the visualEndDate (total width) should be the timeline end.
  // If AutoRenew is OFF, the visualEndDate is simply the endDate.

  let visualEndDate = sub.endDate;
  if (sub.autoRenew) {
      visualEndDate = end; // Extend to end of view
  } else if (!sub.endDate) {
      // Ongoing but autoRenew OFF? Should not happen based on logic, but treat as ongoing to next renewal or timeline end
      visualEndDate = nextRenewal > end ? nextRenewal : end; 
  }

  // Re-calculate width based on visualEndDate
  const visualWidth = getWidthPercentage(sub.startDate, visualEndDate, start, end, totalDays);
  
  // Determine where the "Solid" bar ends
  // If endDate is set, solid ends there.
  // If endDate is NOT set, solid ends at nextRenewal.
  const solidEndDate = sub.endDate ? sub.endDate : nextRenewal;
  const solidEndPct = getPositionPercentage(solidEndDate, start, totalDays);

  return (
    <Reorder.Item 
      value={sub}
      as="div"
      dragListener={false} 
      dragControls={dragControls}
      className="relative"
      layout 
      whileDrag={{ scale: 1.01, zIndex: 100, boxShadow: '0px 10px 20px rgba(0,0,0,0.5)' }}
    >
      <div 
       className="flex group transition-all duration-200 ease-out hover:z-50 hover:bg-zinc-800 hover:shadow-xl hover:border-zinc-700 h-11 relative border-b border-zinc-800/50 origin-center bg-surface select-none"
      >
        {/* Name Column (Resizable) */}
        <div 
         className="shrink-0 sticky left-0 z-20 bg-surface group-hover:bg-transparent border-r border-zinc-800 flex items-center transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)]"
         style={{ width: sidebarWidth }}
        >
           {/* Drag Handle - Fixed Width Container for alignment */}
           <div 
             className="shrink-0 w-10 h-full flex items-center justify-center cursor-grab active:cursor-grabbing text-zinc-700 hover:text-zinc-400 transition-opacity touch-none opacity-0 group-hover:opacity-100"
             onPointerDown={(e) => dragControls.start(e)}
           >
             <GripVertical size={16} />
           </div>

           <div className="flex items-center space-x-3 overflow-hidden flex-1 pr-2">
             {/* Auto-predicted Icon with Dynamic Color */}
             <div 
               className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center bg-zinc-800 border transition-colors"
               style={{ borderColor: sub.color, color: sub.color }}
             >
               {getServiceIcon(sub.name)}
             </div>
             <span 
               className="truncate font-bold text-zinc-300 text-sm group-hover:text-white transition-colors cursor-pointer" 
               onClick={(e) => { e.stopPropagation(); onEdit(sub); }}
             >
               {sub.name}
             </span>
           </div>
           
           {/* Edit & Delete Buttons (Visible on Hover) */}
           <div className="absolute right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-50 bg-surface/80 group-hover:bg-transparent backdrop-blur-sm rounded-lg px-1">
             <button
               type="button"
               onPointerDown={(e) => e.stopPropagation()}
               onClick={(e) => { 
                 e.stopPropagation(); 
                 onEdit(sub); 
               }}
               className="p-1.5 hover:bg-blue-500/20 text-zinc-500 hover:text-blue-400 rounded transition-all cursor-pointer"
               title="Edit"
             >
               <Pencil size={14} />
             </button>
             <button
               type="button"
               onPointerDown={(e) => e.stopPropagation()}
               onClick={(e) => { 
                 e.stopPropagation(); 
                 if (onDelete) onDelete(sub.id); 
               }}
               className="p-1.5 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 rounded transition-all cursor-pointer"
               title="Delete"
             >
               <Trash2 size={14} />
             </button>
           </div>
        </div>

        {/* Bar Area */}
        <div className="flex-1 relative h-full z-10 border-r border-zinc-800">
           <div className="relative w-full h-full">
             {(() => {
               const barStartPct = left;
               const barEndPct = barStartPct + visualWidth;
               
               // The visual break point between Active (Solid) and Future (Translucent)
               const splitPct = Math.min(solidEndPct, barEndPct);

               // We render two bars: Active and Future.
               // Active: from barStartPct to splitPct
               // Future: from splitPct to barEndPct (only if autoRenew is true)
               
               const hasActive = splitPct > barStartPct;
               const hasFuture = sub.autoRenew && (barEndPct > splitPct);

               const renderBar = (startP: number, endP: number, type: 'active' | 'future') => {
                 if (endP <= startP + 0.001) return null; // Too small to render
                 
                 const w = endP - startP;
                 
                 let bg = sub.color;
                 // Use prop opacity for future bars
                 let opacity = type === 'active' ? 1 : futureOpacity;
                 
                 let pattern = type === 'active' 
                    ? 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)'
                    : 'none';
                 let glow = type === 'active' 
                    ? `0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 8px ${sub.color}40`
                    : 'none';
                 let zIndex = type === 'active' ? 20 : 10;

                 const radius = '4px';

                 // Logic for connection rounding
                 let borderTopRightRadius = radius;
                 let borderBottomRightRadius = radius;
                 let borderTopLeftRadius = radius;
                 let borderBottomLeftRadius = radius;

                 // If it's active and has a future segment attached, flatten right
                 if (type === 'active' && hasFuture) {
                    borderTopRightRadius = '0';
                    borderBottomRightRadius = '0';
                 }

                 // If it's future and has an active segment before it, flatten left
                 if (type === 'future' && hasActive) {
                    borderTopLeftRadius = '0';
                    borderBottomLeftRadius = '0';
                 }
                 
                 // If active bar starts at the very beginning of the component (clamped), flatten left
                 // (Optional, keeps it looking continuous if it started way back)
                 
                 return (
                    <div 
                       key={type}
                       className={`absolute top-1/2 -translate-y-1/2 h-4 transition-all duration-300 ${type === 'active' ? 'group-hover:brightness-110 group-hover:shadow-[0_0_10px_rgba(255,255,255,0.3)]' : ''}`}
                       style={{ 
                          left: `${startP}%`, 
                          width: `${w}%`,
                          backgroundColor: bg,
                          opacity: opacity,
                          backgroundImage: pattern,
                          backgroundSize: '12px 12px',
                          boxShadow: glow,
                          borderTopLeftRadius,
                          borderBottomLeftRadius,
                          borderTopRightRadius,
                          borderBottomRightRadius,
                          zIndex: zIndex
                       }}
                    />
                 );
               };

               return (
                 <>
                    {renderBar(barStartPct, splitPct, 'active')}
                    {renderBar(splitPct, barEndPct, 'future')}
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
};

interface CategoryRowProps {
  sub: Subscription;
  sidebarWidth: number;
  onDelete?: (id: string) => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({ sub, sidebarWidth, onDelete }) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item 
      value={sub}
      as="div"
      dragListener={false}
      dragControls={dragControls}
      className="relative"
      layout 
      whileDrag={{ scale: 1.01, zIndex: 100, boxShadow: '0px 10px 20px rgba(0,0,0,0.5)' }}
    >
       <div 
         className="flex group transition-all duration-200 ease-out hover:bg-zinc-800/50 h-6 relative origin-center bg-surface select-none items-center"
       >
          {/* Sticky Sidebar Part */}
          <div 
           className="shrink-0 sticky left-0 z-20 bg-surface group-hover:bg-transparent flex items-center h-full border-r border-zinc-800 relative"
           style={{ width: sidebarWidth }}
          >
             {/* Drag Handle - Aligned with SubscriptionRow */}
             <div 
               className="shrink-0 w-10 h-full flex items-center justify-center cursor-grab active:cursor-grabbing text-zinc-700 hover:text-zinc-400 transition-opacity touch-none opacity-0 group-hover:opacity-100"
               onPointerDown={(e) => dragControls.start(e)}
               onClick={(e) => e.stopPropagation()} 
             >
               <GripVertical size={16} />
             </div>

             {/* Continuous Line in Sidebar */}
             <div className="flex-1 h-px bg-zinc-600 group-hover:bg-zinc-400 transition-colors relative mr-[-1px] z-30"></div>

             {/* Delete Button for Category (No Edit) */}
             <div className="absolute right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-50 bg-surface/80 group-hover:bg-transparent backdrop-blur-sm rounded-lg px-1 py-0.5">
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (onDelete) onDelete(sub.id); 
                  }}
                  className="p-1 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 rounded transition-all cursor-pointer"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
             </div>
          </div>

          {/* Rest of the line - Starts immediately */}
          <div className="flex-1 h-full border-r border-zinc-800 relative flex items-center">
             <div className="w-full h-px bg-zinc-600 group-hover:bg-zinc-400 transition-colors"></div>
          </div>
          <div className="w-28 shrink-0 h-full border-r border-zinc-800 flex items-center">
             <div className="w-full h-px bg-zinc-600 group-hover:bg-zinc-400 transition-colors"></div>
          </div>
          <div className="w-28 shrink-0 h-full flex items-center">
             <div className="w-full h-px bg-zinc-600 group-hover:bg-zinc-400 transition-colors"></div>
          </div>
       </div>
    </Reorder.Item>
  );
};


// --- Main Component ---

export const Timeline: React.FC<TimelineProps> = ({ subscriptions, startDate, endDate, futureOpacity, onEdit, onAdd, onAddCategory, onDelete, onEditRange, onReorder }) => {
  // Use passed start/end dates instead of calculating default
  const { start, end, months } = useMemo(() => getTimelineRange(startDate, endDate), [startDate, endDate]);
  const totalDays = useMemo(() => differenceInDays(end, start), [start, end]);
  
  // --- Resizing Logic (Delta based) ---
  const [sidebarWidth, setSidebarWidth] = useState(240); 
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
      {/* Container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar flex flex-col">
        <div className="w-full relative min-h-full flex flex-col">
          
          {/* Grid Header (Year & Month grouped) - Sticky */}
          <div className="sticky top-0 z-[80] bg-surface/95 backdrop-blur border-b border-zinc-800 h-14 flex shrink-0 shadow-sm">
             {/* Service Column Header - Resizable */}
             <div 
               className={`shrink-0 bg-surface border-r border-zinc-800 flex items-center justify-between shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] truncate h-full z-40 relative group ${headerStyle}`}
               style={{ width: sidebarWidth, paddingLeft: '40px' }} 
             >
               <span className="pl-2">SERVICE</span>
               
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
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditRange?.();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center opacity-0 group-hover/header:opacity-100 transition-all z-50 shadow-sm cursor-pointer"
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
                   
                   {/* TODAY LABEL - MOVED TO HEADER */}
                   <div 
                      className="absolute top-full pointer-events-none z-[60]"
                      style={{ 
                        left: `${todayLeft}%`,
                        transform: 'translateX(-1px)' // Align exactly with line
                      }}
                   >
                      <div className="absolute -left-[18px] top-2 bg-zinc-200 text-zinc-900 text-[9px] px-1.5 py-0.5 rounded shadow-sm font-bold tracking-wider border border-white">
                        TODAY
                      </div>
                   </div>
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
             
             {/* Rows Wrapper for exact height of Today line (Subscriptions Only) */}
             <div className="relative">
                 {/* Subscription Rows Reorder Group */}
                 <Reorder.Group 
                    as="div" 
                    axis="y" 
                    values={subscriptions} 
                    onReorder={onReorder || (() => {})}
                    className="flex flex-col"
                 >
                   {subscriptions.map((sub) => {
                     if (sub.type === 'category') {
                       return (
                         <CategoryRow 
                           key={sub.id} 
                           sub={sub} 
                           sidebarWidth={sidebarWidth} 
                           onDelete={onDelete}
                         />
                       );
                     }

                     return (
                       <SubscriptionRow
                         key={sub.id}
                         sub={sub}
                         sidebarWidth={sidebarWidth}
                         start={start}
                         end={end}
                         totalDays={totalDays}
                         todayLeft={todayLeft}
                         futureOpacity={futureOpacity}
                         onEdit={onEdit}
                         onDelete={onDelete}
                       />
                     );
                   })}
                 </Reorder.Group>

                 {/* Today Line Background (z-40 to be above rows unless hovered) */}
                 {/* Moved AFTER Reorder.Group to ensure it renders on top in stack order */}
                 <div 
                   className="absolute top-0 bottom-0 right-56 pointer-events-none z-40"
                   style={{ left: sidebarWidth }}
                 >
                    <div 
                      className="absolute top-0 bottom-0 border-l-2 border-dashed border-white/50"
                      style={{ left: `${todayLeft}%` }}
                    />
                 </div>
             </div>

             {/* ADD BUTTONS ROW */}
             <div className="flex flex-col">
                 {/* ADD SUBSCRIPTION ROW */}
                 {onAdd && (
                    <div 
                      onClick={onAdd}
                      className="flex group cursor-pointer transition-all duration-200 ease-out hover:bg-zinc-800 h-11 relative border-b border-zinc-800/50 origin-center items-center select-none"
                    >
                       <div 
                        className="shrink-0 sticky left-0 z-20 bg-surface group-hover:bg-transparent border-r border-zinc-800 flex items-center transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] h-full"
                        style={{ width: sidebarWidth }}
                       >
                          <div className="shrink-0 w-10 h-full flex items-center justify-center">
                             <div className="w-6 h-6 rounded-full flex items-center justify-center border border-dashed border-zinc-600 group-hover:border-white text-zinc-500 group-hover:text-white">
                               <Plus size={14} />
                             </div>
                          </div>
                          <span className="font-medium text-sm text-zinc-500 group-hover:text-white transition-colors pl-2">Add Subscription</span>
                       </div>
                       <div className="flex-1 h-full border-r border-zinc-800 bg-transparent" />
                       <div className="w-28 shrink-0 h-full border-r border-zinc-800 bg-transparent" />
                       <div className="w-28 shrink-0 h-full bg-transparent" />
                    </div>
                 )}

                 {/* ADD CATEGORY LINE ROW */}
                 {onAddCategory && (
                    <div 
                      onClick={onAddCategory}
                      className="flex group cursor-pointer transition-all duration-200 ease-out hover:bg-zinc-800 h-8 relative border-b border-zinc-800/50 origin-center items-center select-none"
                    >
                       <div 
                        className="shrink-0 sticky left-0 z-20 bg-surface group-hover:bg-transparent border-r border-zinc-800 flex items-center transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] h-full"
                        style={{ width: sidebarWidth }}
                       >
                          <div className="shrink-0 w-10 h-full flex items-center justify-center">
                             <div className="w-6 h-6 rounded-full flex items-center justify-center border border-dashed border-zinc-600 group-hover:border-white text-zinc-500 group-hover:text-white">
                               <Plus size={14} />
                             </div>
                          </div>
                          <span className="font-medium text-sm text-zinc-500 group-hover:text-white transition-colors pl-2">Add Category Line</span>
                       </div>
                       <div className="flex-1 h-full border-r border-zinc-800 bg-transparent" />
                       <div className="w-28 shrink-0 h-full border-r border-zinc-800 bg-transparent" />
                       <div className="w-28 shrink-0 h-full bg-transparent" />
                    </div>
                 )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};