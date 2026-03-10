import { useState } from "react";
import { Search, Book, Loader2 } from "lucide-react";

export function DictionaryWidget() {
  const [word, setWord] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      
      if (!res.ok) {
        if (res.status === 404) throw new Error("Word not found in dictionary");
        throw new Error("API Connection Error");
      }
      
      const data = await res.json();
      setResult(data[0]);
    } catch (err: any) {
      setError(err.message || "Failed to fetch definition.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <form onSubmit={search} className="relative mb-3 flex shrink-0">
        <input 
          type="text" 
          placeholder="Search word..." 
          value={word}
          onChange={(e) => setWord(e.target.value)}
          className="w-full bg-input border border-border rounded-lg py-2 pl-3 pr-10 text-sm text-foreground focus:outline-none focus:border-primary"
        />
        <button type="submit" className="absolute right-2 top-2 text-muted-foreground hover:text-primary transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </form>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
        {error && <p className="text-xs text-red-500 text-center mt-4 font-medium">{error}</p>}
        {result ? (
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-bold text-foreground capitalize">{result.word}</h3>
              {result.phonetics?.[0]?.text && <span className="text-xs text-primary font-mono">{result.phonetics[0].text}</span>}
            </div>
            {result.meanings?.slice(0, 2).map((m: any, i: number) => (
              <div key={i} className="bg-card p-2.5 rounded-lg border border-border">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">{m.partOfSpeech}</p>
                <ol className="list-decimal pl-4 space-y-1.5 marker:text-primary">
                  {m.definitions?.slice(0, 2).map((d: any, j: number) => (
                    <li key={j} className="text-xs text-foreground/90 leading-snug">
                      {d.definition}
                      {d.example && <p className="text-[10px] text-muted-foreground italic mt-0.5 opacity-80">"{d.example}"</p>}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        ) : !loading && !error ? (
          <div className="flex flex-col items-center justify-center h-full opacity-50 pt-10">
            <Book className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">Look up any word</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
