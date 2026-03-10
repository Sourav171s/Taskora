import { useState } from "react";
import { Copy, RefreshCw, Quote } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";

const quotes = [
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
  { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" },
  { text: "Focusing is about saying no.", author: "Steve Jobs" },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
  { text: "My success, part of it certainly, is that I have focused in on a few things.", author: "Bill Gates" },
  { text: "Concentrate all your thoughts upon the work in hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
  { text: "Lack of direction, not lack of time, is the problem. We all have twenty-four hour days.", author: "Zig Ziglar" },
];

export function QuoteWidget() {
  const { addNotification } = useNotifications();
  const [quoteIndex, setQuoteIndex] = useState(Math.floor(Math.random() * quotes.length));

  const cycleQuote = () => {
    let next = Math.floor(Math.random() * quotes.length);
    while (next === quoteIndex) next = Math.floor(Math.random() * quotes.length);
    setQuoteIndex(next);
  };

  const copyToClipboard = () => {
    const q = quotes[quoteIndex];
    navigator.clipboard.writeText(`"${q.text}" — ${q.author}`);
    addNotification({
      type: "system",
      title: "Copied Quote",
      message: "Quote copied to your clipboard.",
      time: "Just now",
      icon: "📋" 
    });
  };

  const q = quotes[quoteIndex];

  return (
    <div className="flex flex-col h-full justify-center px-4 py-2 relative group w-full">
      <Quote className="w-6 h-6 absolute top-2 left-2 opacity-20" style={{ color: "#7C5CFF" }} />
      <div className="text-center z-10 px-2 mt-2">
        <p style={{ fontSize: 13, color: "#e4e4ed", fontStyle: "italic", lineHeight: 1.5 }}>
          "{q.text}"
        </p>
        <p style={{ fontSize: 11, color: "#8a8a9a", marginTop: 8, fontWeight: 500 }}>
          — {q.author}
        </p>
      </div>
      
      {/* Controls */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={copyToClipboard}
          className="p-1.5 rounded hover:bg-[#1A1A24] transition-colors"
          title="Copy Quote"
        >
          <Copy className="w-3.5 h-3.5" style={{ color: "#6b6b80" }} />
        </button>
        <button 
          onClick={cycleQuote}
          className="p-1.5 rounded hover:bg-[#1A1A24] transition-colors"
          title="New Quote"
        >
          <RefreshCw className="w-3.5 h-3.5" style={{ color: "#6b6b80" }} />
        </button>
      </div>
    </div>
  );
}
