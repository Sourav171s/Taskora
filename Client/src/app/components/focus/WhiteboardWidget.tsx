import { useRef, useState, useEffect } from "react";
import { Eraser, Trash } from "lucide-react";

export function WhiteboardWidget() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#e4e4ed");
  const [thickness, setThickness] = useState(2);

  const colors = ["#e4e4ed", "#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#0e0e16"];

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Set canvas resolution strictly to container size
    const resizeCanvas = () => {
      // Save content
      const ctx = canvas.getContext("2d");
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCanvas.getContext("2d")?.drawImage(canvas, 0, 0);

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      // Restore content
      ctx?.drawImage(tempCanvas, 0, 0);
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const getPos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.PointerEvent) => {
    // Only left click or touch
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const pos = getPos(e);
    const ctx = canvasRef.current!.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current!.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = color === "#0e0e16" ? 15 : thickness; // erase is huge
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const ctx = canvasRef.current!.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 bg-card rounded-t-lg border border-border border-b-0 overflow-hidden relative cursor-crosshair touch-none"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={stopDraw}
          onPointerLeave={stopDraw}
          onPointerCancel={stopDraw}
          className="absolute inset-0 w-full h-full"
        />
      </div>

      {/* Toolbar */}
      <div className="bg-input p-2 rounded-b-lg border border-border flex items-center justify-between shrink-0">
        <div className="flex gap-1.5">
          {colors.slice(0, 6).map(c => (
            <button key={c} onClick={() => setColor(c)} className={`w-5 h-5 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-primary/50' : 'hover:scale-110'}`} style={{ background: c }} title={`Color ${c}`} />
          ))}
          <div className="w-[1px] h-5 bg-border mx-1" />
          <button onClick={() => setColor("#0e0e16")} className={`w-5 h-5 rounded-md flex items-center justify-center transition-transform ${color === "#0e0e16" ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:bg-border'}`} title="Eraser">
             <Eraser className="w-3.5 h-3.5" />
          </button>
        </div>
        <button onClick={clear} className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors" title="Clear All">
          <Trash className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
