import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function CalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const today = new Date();

  return (
    <div className="flex flex-col h-full w-full bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 hover:bg-secondary rounded text-muted-foreground"><ChevronLeft className="w-4 h-4"/></button>
        <span className="font-semibold text-foreground text-sm">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </span>
        <button onClick={nextMonth} className="p-1 hover:bg-secondary rounded text-muted-foreground"><ChevronRight className="w-4 h-4"/></button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground uppercase py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isToday = day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
          return (
            <div 
              key={day} 
              className={`flex items-center justify-center text-xs rounded-md ${isToday ? "bg-primary text-primary-foreground font-bold" : "text-foreground hover:bg-secondary cursor-default"}`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
