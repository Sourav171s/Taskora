import { useState, useEffect } from "react";

const CITIES = [
  { name: "Local", tz: Intl.DateTimeFormat().resolvedOptions().timeZone },
  { name: "New York", tz: "America/New_York" },
  { name: "London", tz: "Europe/London" },
  { name: "Tokyo", tz: "Asia/Tokyo" },
  { name: "Sydney", tz: "Australia/Sydney" },
];

export function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto custom-scrollbar gap-2 px-1">
      <div className="mb-2 shrink-0">
         <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time Zones</span>
      </div>
      {CITIES.map(city => {
        let timeString = "";
        let dateString = "";
        try {
          timeString = time.toLocaleTimeString("en-US", { timeZone: city.tz, hour: "2-digit", minute: "2-digit", hour12: true });
          dateString = time.toLocaleDateString("en-US", { timeZone: city.tz, weekday: "short", month: "short", day: "numeric" });
        } catch { }

        return (
          <div key={city.name} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg shadow-sm shrink-0">
            <div>
              <p className="text-sm font-medium text-foreground">{city.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{dateString}</p>
            </div>
            <div className="text-lg font-bold font-mono text-primary tracking-tight">
              {timeString}
            </div>
          </div>
        );
      })}
    </div>
  );
}
