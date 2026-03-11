import { useState, useEffect } from "react";
import { Wallet, Plus, Loader2, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import api from "@/lib/api";

interface FinanceRecord {
  _id: string;
  amount: number;
  type: string;
  category: string;
  description: string;
  date: string;
}

const API = "/finance";

export function Finance() {
  const { token } = useAuth();
  const { addNotification } = useNotifications();
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const fetchRecords = async () => {
    if (!token) return;
    try {
      const res = await api.get(API);
      if (res.data.success) setRecords(res.data.items);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchRecords(); }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category.trim() || !token) return;
    try {
      const res = await api.post(API, { amount: Number(amount), type, category, description });
      const data = res.data;
      if (data.success) {
        setRecords([data.item, ...records]);
        setAmount(""); setCategory(""); setDescription(""); setIsAdding(false);
        addNotification({ type: "system", title: "Logged", message: `Finance record saved`, icon: "💰", time: "Just now" });
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!token || !window.confirm("Delete record?")) return;
    setRecords(records.filter(e => e._id !== id));
    try { await api.delete(`${API}/${id}`); } catch (e) { console.error(e); }
  };

  const totalBalance = records.reduce((acc, curr) => curr.type === "income" ? acc + curr.amount : acc - curr.amount, 0);
  const totalExpenses = records.filter(r => r.type === "expense").reduce((a, b) => a + b.amount, 0);
  const totalIncome = records.filter(r => r.type === "income").reduce((a, b) => a + b.amount, 0);

  return (
    <div className="flex flex-col h-full bg-background p-4 md:p-8 max-w-5xl mx-auto w-full custom-scrollbar overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Wallet className="w-7 h-7 text-primary" /> Finance & Budget
          </h1>
          <p className="text-muted-foreground">Keep your student budget perfectly tracked.</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="focus-btn px-4 py-2 flex items-center gap-2">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Transaction</span>
        </button>
      </div>

      {!loading && records.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
            <h2 className={`text-2xl font-bold ${totalBalance >= 0 ? "text-green-500" : "text-red-500"}`}>${totalBalance.toFixed(2)}</h2>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1"><ArrowUpRight className="w-4 h-4 text-green-500" /> Income</p>
            <h2 className="text-2xl font-bold text-foreground">${totalIncome.toFixed(2)}</h2>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1"><ArrowDownRight className="w-4 h-4 text-red-500" /> Expenses</p>
            <h2 className="text-2xl font-bold text-foreground">${totalExpenses.toFixed(2)}</h2>
          </div>
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleSave} className="mb-8 bg-card border border-border p-5 rounded-xl shadow-md space-y-4 hover:-translate-y-1 transition-all duration-300">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required className="w-full bg-input border border-border pl-8 pr-4 py-2.5 rounded-lg text-foreground focus:outline-none focus:border-primary/50" />
            </div>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-input border border-border px-4 py-2.5 rounded-lg text-foreground focus:outline-none focus:border-primary/50">
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <input placeholder="Category (e.g. Food)" value={category} onChange={e => setCategory(e.target.value)} required className="sm:col-span-2 w-full bg-input border border-border px-4 py-2.5 rounded-lg text-foreground focus:outline-none focus:border-primary/50" />
          </div>
          <input placeholder="Note / Description (Optional)" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-input border border-border px-4 py-2.5 rounded-lg text-foreground focus:outline-none focus:border-primary/50" />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 rounded text-muted-foreground hover:bg-secondary">Cancel</button>
            <button type="submit" className="focus-btn px-6 py-2 font-medium">Save Record</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : records.length === 0 && !isAdding ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border mt-2 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <Wallet className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No financial data</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-6">Logs your transactions securely to track insights into your spending.</p>
          <button onClick={() => setIsAdding(true)} className="focus-btn px-6 py-2.5 flex items-center gap-2"><Plus className="w-4 h-4" /> Log Expense</button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/30 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold hidden sm:table-cell">Description</th>
                <th className="p-4 font-semibold text-right">Amount</th>
                <th className="p-4 font-semibold w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.map(rec => (
                <tr key={rec._id} className="hover:bg-secondary/20 transition-colors group">
                  <td className="p-4 text-xs md:text-sm text-foreground align-middle whitespace-nowrap">{new Date(rec.date).toLocaleDateString()}</td>
                  <td className="p-4 text-sm text-foreground font-medium align-middle">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs border ${rec.type === 'income' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-secondary text-muted-foreground border-border'}`}>
                      {rec.category}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground hidden sm:table-cell align-middle truncate max-w-[200px]">{rec.description || "-"}</td>
                  <td className={`p-4 text-sm font-semibold text-right align-middle ${rec.type === 'income' ? 'text-green-500' : 'text-foreground'}`}>
                    {rec.type === "income" ? "+" : "-"}${rec.amount.toFixed(2)}
                  </td>
                  <td className="p-4 text-right align-middle">
                    <button onClick={() => handleDelete(rec._id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
