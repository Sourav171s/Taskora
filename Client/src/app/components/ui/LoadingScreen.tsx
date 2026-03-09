import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export function LoadingScreen({ authLoading }: { authLoading?: boolean }) {
  const [quote, setQuote] = useState<{ text: string; author: string } | null>(null);
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    // Fetch random a motivational quote
    const fetchQuote = async () => {
      try {
        const res = await fetch("https://dummyjson.com/quotes/random");
        const data = await res.json();
        if (data && data.quote) {
          setQuote({ text: data.quote, author: data.author });
        } else {
          throw new Error("Invalid format");
        }
      } catch (err) {
        setQuote({
          text: "Focus on being productive instead of busy.",
          author: "Tim Ferriss",
        });
      }
    };

    fetchQuote();

    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, 2800); // minimum 2.8s display

    return () => clearTimeout(timer);
  }, []);

  const loading = authLoading || !minTimePassed;

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(10px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background pointer-events-none"
        >
          {/* Animated Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center gap-6"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, var(--primary-color, #7C5CFF), #4a2fba)" }}
            >
              <motion.div
                className="absolute inset-0 opacity-50"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                style={{
                  background: "conic-gradient(from 0deg, transparent 0 340deg, white 360deg)",
                }}
              />
              <div className="absolute inset-[2px] rounded-xl bg-background/20 backdrop-blur-md flex items-center justify-center">
                <svg className="w-8 h-8 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L4.5 13.5H11V22L19.5 10.5H13V2z" />
                </svg>
              </div>
            </div>
            
            {/* Blurring in Quote Text */}
            <motion.div
              initial={{ filter: "blur(8px)", opacity: 0, y: 10 }}
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1.2 }}
              className="max-w-md text-center px-6"
            >
              <p className="text-foreground/90 font-medium" style={{ fontSize: 17, lineHeight: 1.5, letterSpacing: "-0.01em" }}>
                "{quote?.text || "Preparing your workspace..."}"
              </p>
              {quote?.author && (
                <p className="text-muted-foreground mt-3 uppercase tracking-widest" style={{ fontSize: 11, fontWeight: 600 }}>
                  — {quote.author}
                </p>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
