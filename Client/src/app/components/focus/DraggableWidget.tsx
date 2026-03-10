import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useDragControls } from "motion/react";
import { GripHorizontal, X, Maximize2, Minimize2 } from "lucide-react";

interface DraggableWidgetProps {
  title: string;
  icon: any;
  children: React.ReactNode;
  defaultPosition: { x: number; y: number };
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
  zIndex: number;
  onFocus: () => void;
  onClose: () => void;
}

export function DraggableWidget({
  title,
  icon: Icon,
  children,
  defaultPosition,
  defaultSize,
  minSize = { w: 220, h: 150 },
  zIndex,
  onFocus,
  onClose,
}: DraggableWidgetProps) {
  const controls = useDragControls();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(defaultSize);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);
  const [constraints, setConstraints] = useState({ top: 0, left: 0, right: 0, bottom: 0 });

  // Update drag boundaries when container or window changes
  useEffect(() => {
    const updateBounds = () => {
      setConstraints({
        top: -defaultPosition.y + 10, // 10px padding from top
        left: -defaultPosition.x + 10,
        right: Math.max(-defaultPosition.x, window.innerWidth - defaultPosition.x - size.w - 10),
        bottom: Math.max(-defaultPosition.y, window.innerHeight - defaultPosition.y - size.h - 10)
      });
    };
    updateBounds();
    window.addEventListener("resize", updateBounds);
    return () => window.removeEventListener("resize", updateBounds);
  }, [defaultPosition, size]);

  // Determine compact mode for content adaptation
  const isCompact = size.w < 280 || size.h < 260;
  const isTiny = size.w < 240 || size.h < 200;

  // Resize handler
  const onResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onFocus();
      resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: size.w, startH: size.h };

      const onMove = (ev: PointerEvent) => {
        if (!resizeRef.current) return;
        const dx = ev.clientX - resizeRef.current.startX;
        const dy = ev.clientY - resizeRef.current.startY;
        const rect = containerRef.current?.getBoundingClientRect();
        const currentLeft = rect ? rect.left : defaultPosition.x;
        const currentTop = rect ? rect.top : defaultPosition.y;

        setSize({
          w: Math.min(window.innerWidth - currentLeft, Math.max(minSize.w, resizeRef.current.startW + dx)),
          h: Math.min(window.innerHeight - currentTop, Math.max(minSize.h, resizeRef.current.startH + dy)),
        });
      };

      const onUp = () => {
        resizeRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [size, minSize, onFocus]
  );

  return (
    <motion.div
      ref={containerRef}
      className="focus-widget absolute select-none flex flex-col"
      style={{
        zIndex,
        width: size.w,
        height: size.h,
        left: defaultPosition.x,
        top: defaultPosition.y,
      }}
      drag
      dragConstraints={constraints}
      dragControls={controls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      onPointerDown={onFocus}
      initial={{ opacity: 0, scale: 0.92, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 10 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* Title bar - drag handle */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-border cursor-grab active:cursor-grabbing shrink-0"
        onPointerDown={(e) => {
          onFocus();
          controls.start(e);
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripHorizontal className="w-3.5 h-3.5 shrink-0 text-muted-foreground opacity-60" />
          {Icon && <Icon className="w-3.5 h-3.5 shrink-0 text-primary" />}
          <span className="truncate text-muted-foreground" style={{ fontSize: 11.5, fontWeight: 500 }}>{title}</span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 rounded hover:bg-secondary transition-colors"
          >
            <X className="w-3 h-3 text-muted-foreground opacity-60" />
          </button>
        </div>
      </div>

      {/* Content — fills remaining space, scrollable */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden focus-scrollbar p-3"
        data-compact={isCompact ? "true" : "false"}
        data-tiny={isTiny ? "true" : "false"}
        style={{ minHeight: 0 }}
      >
        {children}
      </div>

      {/* Resize handle (bottom-right corner) */}
      <div
        onPointerDown={onResizeStart}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-10 flex items-end justify-end"
        style={{ touchAction: "none" }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" className="opacity-30 hover:opacity-60 transition-opacity">
          <line x1="9" y1="1" x2="1" y2="9" stroke="#6b6b80" strokeWidth="1.5" />
          <line x1="9" y1="5" x2="5" y2="9" stroke="#6b6b80" strokeWidth="1.5" />
        </svg>
      </div>
    </motion.div>
  );
}
