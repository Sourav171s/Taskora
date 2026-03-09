import { useState } from "react";
import { Coffee, Heart, Loader2, DollarSign, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface CoffeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const API = "http://localhost:4000/api/payment";

export function CoffeeModal({ isOpen, onClose }: CoffeeModalProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number | null>(1);
  const [customAmount, setCustomAmount] = useState("");
  
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const tiers = [
    { value: 1, label: "Basic Tip ($1)", desc: "Just a small gesture to keep Kora awake" },
    { value: 3, label: "Double Shot ($3)", desc: "Boost the productivity engines" },
    { value: 5, label: "Venti Support ($5)", desc: "A great contribution to server costs" },
  ];

  const handleCheckout = async () => {
    let amountToProcess = selectedTier;
    let tierName = tiers.find(t => t.value === selectedTier)?.label || "Custom Support";

    if (!selectedTier) {
      amountToProcess = Number(customAmount);
      tierName = "Custom Coffee Tip";
    }

    if (!amountToProcess || amountToProcess < 1) {
      setError("Please select or enter a valid amount (min $1).");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: amountToProcess, tierName })
      });

      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.message || "Failed to initiate checkout");
        setLoading(false);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="relative h-32 bg-gradient-to-br from-orange-500/20 via-rose-500/10 to-amber-500/20 flex flex-col items-center justify-center border-b border-border">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-background/50 text-muted-foreground hover:text-foreground transition-all"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-14 h-14 bg-card border shadow-sm border-border rounded-full flex items-center justify-center mb-2">
            <Coffee className="w-6 h-6 text-orange-500" />
          </div>
          <h2 className="text-foreground font-semibold" style={{ fontSize: 16 }}>Buy Kora a Coffee ☕</h2>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-center text-muted-foreground mx-auto" style={{ fontSize: 13, lineHeight: 1.5 }}>
             Your support helps keep the servers running, AI models fast, and new features coming. Every dollar counts!
          </p>

          <div className="space-y-2 mt-4">
            {tiers.map((tier) => (
              <button
                key={tier.value}
                onClick={() => { setSelectedTier(tier.value); setCustomAmount(""); setError(""); }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  selectedTier === tier.value 
                    ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/20" 
                    : "border-border bg-card hover:bg-secondary/40"
                }`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  selectedTier === tier.value ? "border-orange-500" : "border-muted-foreground/30"
                }`}>
                  {selectedTier === tier.value && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                </div>
                <div>
                   <p className={`font-semibold ${selectedTier === tier.value ? "text-orange-600 dark:text-orange-400" : "text-foreground"}`} style={{ fontSize: 13 }}>{tier.label}</p>
                   <p className="text-muted-foreground" style={{ fontSize: 11.5 }}>{tier.desc}</p>
                </div>
              </button>
            ))}

            <button
               onClick={() => { setSelectedTier(null); setError(""); }}
               className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                 selectedTier === null 
                   ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/20" 
                   : "border-border bg-card hover:bg-secondary/40"
               }`}
             >
               <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                 selectedTier === null ? "border-orange-500" : "border-muted-foreground/30"
               }`}>
                 {selectedTier === null && <div className="w-2 h-2 rounded-full bg-orange-500" />}
               </div>
               <div className="flex-1">
                  <p className={`font-semibold ${selectedTier === null ? "text-orange-600 dark:text-orange-400" : "text-foreground"}`} style={{ fontSize: 13 }}>Custom amount</p>
                  {selectedTier === null ? (
                    <div className="relative mt-2">
                       <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                       <input 
                         type="number"
                         min="1"
                         value={customAmount}
                         onChange={(e) => setCustomAmount(e.target.value)}
                         placeholder="Enter amount"
                         className="w-full bg-background border border-border outline-none focus:border-orange-500 rounded-md py-1.5 pl-7 pr-2 text-foreground"
                         style={{ fontSize: 13 }}
                         autoFocus
                       />
                    </div>
                  ) : (
                    <p className="text-muted-foreground" style={{ fontSize: 11.5 }}>Enter your own tip amount</p>
                  )}
               </div>
             </button>
          </div>

          {error && <p className="text-red-500 text-center" style={{ fontSize: 12 }}>{error}</p>}

          <button
            onClick={handleCheckout}
            disabled={loading || (selectedTier === null && (!customAmount || Number(customAmount) < 1))}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] transition-all text-white py-2.5 rounded-lg font-semibold disabled:opacity-50 disabled:pointer-events-none"
            style={{ fontSize: 13.5 }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4 fill-current" />}
            {loading ? "Processing..." : `Support Now ($${selectedTier || customAmount || 0})`}
          </button>
          <p className="text-center text-muted-foreground mt-3 opacity-60" style={{ fontSize: 10 }}>Secured by Stripe</p>
        </div>
      </div>
    </div>
  );
}
