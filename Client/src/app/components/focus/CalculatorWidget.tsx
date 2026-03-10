import { useState } from "react";
import { Calculator } from "lucide-react";

export function CalculatorWidget() {
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  const [memory, setMemory] = useState<number | null>(null);

  const calculate = () => {
    try {
      // eslint-disable-next-line
      const result = eval(equation + display);
      if (Number.isFinite(result)) {
        setDisplay(String(result));
        setEquation("");
      } else {
        setDisplay("Error");
      }
    } catch {
      setDisplay("Error");
    }
  };

  const handlePress = (btn: string) => {
    if (display === "Error") {
      setDisplay("0");
      setEquation("");
    }
    
    if (btn === "C") {
      setDisplay("0");
      setEquation("");
    } else if (btn === "⌫") {
      setDisplay(display.length > 1 ? display.slice(0, -1) : "0");
    } else if (["+", "-", "*", "/"].includes(btn)) {
      setEquation(equation + display + btn);
      setDisplay("0");
    } else if (btn === "=") {
      calculate();
    } else if (btn === ".") {
      if (!display.includes(".")) setDisplay(display + ".");
    } else {
      setDisplay(display === "0" ? btn : display + btn);
    }
  };

  const buttons = [
    "C", "⌫", "/", "*",
    "7", "8", "9", "-",
    "4", "5", "6", "+",
    "1", "2", "3", "=",
    "0", ".", 
  ];

  return (
    <div className="flex flex-col h-full w-full bg-card rounded-lg border border-border p-3">
      <div className="flex-1 bg-input rounded-md mb-3 p-3 flex flex-col items-end justify-center overflow-hidden shrink-0">
        <span className="text-muted-foreground text-xs min-h-[16px] truncate max-w-full">{equation}</span>
        <div className="w-full overflow-x-auto custom-scrollbar flex justify-end">
          <span className="text-foreground text-3xl font-bold tracking-tight whitespace-nowrap">{display}</span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 h-full pb-1">
        {buttons.map((btn, i) => (
          <button
            key={i}
            onClick={() => handlePress(btn)}
            className={`rounded-md flex items-center justify-center font-medium transition-colors active:scale-95 ${
              btn === "=" ? "row-span-2 bg-primary text-primary-foreground" : 
              btn === "0" ? "col-span-2 bg-secondary text-foreground hover:bg-border" :
              ["C", "⌫", "/", "*", "-", "+"].includes(btn) ? "bg-secondary/50 text-primary hover:bg-secondary" :
              "bg-secondary text-foreground hover:bg-border"
            }`}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}
