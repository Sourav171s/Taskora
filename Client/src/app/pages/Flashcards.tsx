import { useState, useEffect } from "react";
import { Layers, Plus, Loader2, Trash2, Maximize2, ArrowLeft, Play, RefreshCcw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

interface Flashcard {
  front: string;
  back: string;
  masteryLevel: number;
}

interface Deck {
  _id: string;
  title: string;
  description: string;
  cards: Flashcard[];
}

const API = "http://localhost:4000/api/flashcards";

export function Flashcards() {
  const { token } = useAuth();
  const { addNotification } = useNotifications();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardFront, setNewCardFront] = useState("");
  const [newCardBack, setNewCardBack] = useState("");
  
  const [isStudying, setIsStudying] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);

  const fetchDecks = async () => {
    if (!token) return;
    try {
      const res = await fetch(API, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setDecks(data.items);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchDecks(); }, [token]);

  const handleSaveDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !token) return;
    try {
      const res = await fetch(API, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, description, cards: [] })
      });
      const data = await res.json();
      if (data.success) {
        setDecks([data.item, ...decks]);
        setTitle(""); setDescription(""); setIsAdding(false);
        addNotification({ type: "system", title: "Deck Created", message: "Ready for studying!", icon: "🧠", time: "Just now" });
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!token || !window.confirm("Delete deck permanently?")) return;
    setDecks(decks.filter(e => e._id !== id));
    if (selectedDeckId === id) setSelectedDeckId(null);
    try { await fetch(`${API}/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }); } catch (e) { console.error(e); }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardFront.trim() || !newCardBack.trim() || !selectedDeckId || !token) return;
    
    const deck = decks.find(d => d._id === selectedDeckId);
    if(!deck) return;

    const newCards = [{ front: newCardFront, back: newCardBack, masteryLevel: 0 }, ...deck.cards];
    setDecks(decks.map(d => d._id === selectedDeckId ? { ...d, cards: newCards } : d));
    
    try {
      await fetch(`${API}/${selectedDeckId}`, {
         method: "PUT",
         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
         body: JSON.stringify({ cards: newCards })
      });
      setNewCardFront(""); setNewCardBack(""); setIsAddingCard(false);
      addNotification({ type: "system", title: "Card Added", message: "Flashcard added to deck", icon: "➕", time: "Just now" });
    } catch(e) { console.error(e); }
  };

  const handleDeleteCard = async (deckId: string, cardIndex: number) => {
    if (!token || !window.confirm("Delete this card?")) return;
    const deck = decks.find(d => d._id === deckId);
    if(!deck) return;
    
    const newCards = deck.cards.filter((_, i) => i !== cardIndex);
    setDecks(decks.map(d => d._id === deckId ? { ...d, cards: newCards } : d));
    
    try {
      await fetch(`${API}/${deckId}`, {
         method: "PUT",
         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
         body: JSON.stringify({ cards: newCards })
      });
    } catch(e) { console.error(e); }
  };

  const selectedDeck = decks.find(d => d._id === selectedDeckId);

  return (
    <div className="flex flex-col h-full bg-background p-4 md:p-8 max-w-5xl mx-auto w-full custom-scrollbar overflow-y-auto">
      
      {/* Dynamic Header based on state */}
      {!selectedDeckId ? (
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              <Layers className="w-7 h-7 text-primary" /> Flashcards
            </h1>
            <p className="text-muted-foreground">Master your concepts with flashcards sets.</p>
          </div>
          <button onClick={() => setIsAdding(!isAdding)} className="focus-btn px-4 py-2 flex items-center gap-2">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Deck</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => { setIsStudying(false); setSelectedDeckId(null); setIsAddingCard(false); }} className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{selectedDeck?.title}</h1>
              <p className="text-muted-foreground text-sm">{selectedDeck?.description || "No description"}</p>
            </div>
          </div>
          {!isStudying && (
            <div className="flex items-center gap-2">
               <button onClick={() => setIsAddingCard(!isAddingCard)} className="focus-btn px-4 py-2 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Card</span>
               </button>
               {selectedDeck && selectedDeck.cards.length > 0 && (
                  <button onClick={() => { setIsStudying(true); setStudyIndex(0); setShowBack(false); }} className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors">
                    <Play className="w-4 h-4 fill-current" /> <span className="hidden sm:inline">Study</span>
                  </button>
               )}
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : !selectedDeckId ? (
        <>
          {isAdding && (
            <form onSubmit={handleSaveDeck} className="mb-8 bg-card border border-border p-5 rounded-xl shadow-md space-y-4 hover:-translate-y-1 transition-all duration-300">
               <div className="grid gap-4 sm:grid-cols-2">
                 <input autoFocus placeholder="Deck Title (e.g. Biology 101)" value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-input border border-border px-4 py-2.5 rounded-lg text-foreground focus:outline-none focus:border-primary/50" />
                 <input placeholder="Description..." value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-input border border-border px-4 py-2.5 rounded-lg text-foreground focus:outline-none focus:border-primary/50" />
               </div>
               <div className="flex justify-end gap-2 pt-2">
                 <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 rounded text-muted-foreground hover:bg-secondary">Cancel</button>
                 <button type="submit" className="focus-btn px-6 py-2 font-medium">Create Blank Deck</button>
               </div>
            </form>
          )}

          {decks.length === 0 && !isAdding ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border mt-10 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <Layers className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No decks exist</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-6">Start learning by creating your first set of flashcards.</p>
              <button onClick={() => setIsAdding(true)} className="focus-btn px-6 py-2.5 flex items-center gap-2"><Plus className="w-4 h-4" /> Create Deck</button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {decks.map(deck => (
                <div key={deck._id} onClick={() => setSelectedDeckId(deck._id)} className="bg-card border border-border rounded-xl p-5 flex flex-col group hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] pointer-events-none" />
                   <div className="flex justify-between items-start mb-2 z-10">
                      <span className="text-xs font-bold text-primary tracking-wider uppercase">{deck.cards.length} Cards</span>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(deck._id); }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                   </div>
                   <h3 className="font-semibold text-foreground text-lg mb-1 truncate z-10">{deck.title}</h3>
                   <p className="text-xs text-muted-foreground mb-6 flex-1 line-clamp-2 z-10">{deck.description || "No description."}</p>
                   
                   <button className="w-full flex justify-center items-center gap-2 py-2 bg-secondary group-hover:bg-primary text-foreground group-hover:text-primary-foreground transition-colors rounded-lg font-medium text-sm z-10">
                      <Maximize2 className="w-4 h-4" /> View Deck
                   </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : isStudying && selectedDeck && selectedDeck.cards.length > 0 ? (
         <div className="flex flex-col items-center max-w-2xl mx-auto w-full flex-1">
            <div className="w-full bg-secondary/50 h-2 rounded-full mb-6 overflow-hidden">
               <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((studyIndex + 1) / selectedDeck.cards.length) * 100}%` }} />
            </div>
            
            <div 
               onClick={() => setShowBack(!showBack)}
               className="w-full aspect-[4/3] bg-card border-2 border-border hover:border-primary/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer shadow-lg hover:shadow-xl transition-all duration-500 relative perspective-1000 mb-8 overflow-y-auto"
            >
               <span className="absolute top-4 left-4 text-xs font-bold tracking-widest text-muted-foreground uppercase">{showBack ? 'Back' : 'Front'}</span>
               <RefreshCcw className="absolute top-4 right-4 w-4 h-4 text-muted-foreground opacity-50" />
               <p className="text-2xl md:text-3xl font-medium text-foreground max-w-lg mb-4">{showBack ? selectedDeck.cards[studyIndex].back : selectedDeck.cards[studyIndex].front}</p>
               {!showBack && <p className="text-sm text-primary animate-pulse opacity-70 mt-8">Click to reveal answer</p>}
            </div>
            
            <div className="flex gap-4 w-full">
               <button onClick={() => {
                  if (studyIndex > 0) { setStudyIndex(s => s - 1); setShowBack(false); }
               }} disabled={studyIndex === 0} className="flex-1 py-3 px-4 rounded-xl font-medium border border-border bg-card hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-foreground">
                  Previous
               </button>
               {studyIndex < selectedDeck.cards.length - 1 ? (
                  <button onClick={() => {
                     setStudyIndex(s => s + 1); setShowBack(false);
                  }} className="flex-1 py-3 px-4 rounded-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md">
                     Next Card
                  </button>
               ) : (
                  <button onClick={() => setIsStudying(false)} className="flex-1 py-3 px-4 rounded-xl font-medium bg-green-500 text-white hover:bg-green-600 transition-colors shadow-md">
                     Finish Deck
                  </button>
               )}
            </div>
         </div>
      ) : (
         <>
            {isAddingCard && (
               <form onSubmit={handleAddCard} className="mb-8 bg-card border border-border p-5 rounded-xl shadow-md space-y-4 hover:-translate-y-1 transition-all duration-300">
                  <div className="grid gap-4 sm:grid-cols-2">
                     <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground pl-1">Front (Question)</label>
                        <textarea autoFocus value={newCardFront} onChange={e => setNewCardFront(e.target.value)} required rows={4} className="w-full bg-input border border-border px-4 py-2.5 rounded-lg text-foreground focus:outline-none focus:border-primary/50 resize-none custom-scrollbar" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground pl-1">Back (Answer)</label>
                        <textarea value={newCardBack} onChange={e => setNewCardBack(e.target.value)} required rows={4} className="w-full bg-input border border-border px-4 py-2.5 rounded-lg text-foreground focus:outline-none focus:border-primary/50 resize-none custom-scrollbar" />
                     </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-border mt-2">
                    <button type="button" onClick={() => setIsAddingCard(false)} className="px-4 py-2 rounded text-muted-foreground hover:bg-secondary mt-2">Cancel</button>
                    <button type="submit" className="focus-btn px-6 py-2 mt-2 font-medium">Save Flashcard</button>
                  </div>
               </form>
            )}

            {selectedDeck && selectedDeck.cards.length === 0 && !isAddingCard ? (
               <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border mt-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                 <Layers className="w-12 h-12 text-muted-foreground/50 mb-4" />
                 <h3 className="text-lg font-medium text-foreground mb-2">Deck is empty</h3>
                 <p className="text-muted-foreground text-center max-w-sm mb-6">This deck has no flashcards yet. Add some cards to begin studying.</p>
                 <button onClick={() => setIsAddingCard(true)} className="focus-btn px-6 py-2.5 flex items-center gap-2"><Plus className="w-4 h-4" /> Add First Card</button>
               </div>
            ) : (
               <div className="space-y-4">
                  {selectedDeck?.cards.map((card, idx) => (
                     <div key={idx} className="bg-card border border-border rounded-xl p-0 flex flex-col sm:flex-row group hover:-translate-y-1 hover:shadow-lg transition-all duration-300 overflow-hidden">
                        <div className="flex-1 p-5 border-b sm:border-b-0 sm:border-r border-border relative">
                           <span className="absolute top-2 left-3 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Front</span>
                           <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">{card.front}</p>
                        </div>
                        <div className="flex-1 p-5 relative">
                           <span className="absolute top-2 left-3 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Back</span>
                           <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{card.back}</p>
                        </div>
                        <button onClick={() => handleDeleteCard(selectedDeck._id, idx)} className="sm:w-16 flex items-center justify-center bg-destructive/5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors py-4 sm:py-0">
                           <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                  ))}
               </div>
            )}
         </>
      )}
    </div>
  );
}
