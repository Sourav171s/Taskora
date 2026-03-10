import { useState, useRef, useEffect, useCallback } from "react";

const sounds = [
  { id: "rain", label: "Rain", emoji: "🌧️", defaultLevel: 0, file: "/sounds/rain.mp3" },
  { id: "cafe", label: "Cafe", emoji: "☕", defaultLevel: 0, file: "/sounds/cafe.mp3" },
  { id: "forest", label: "Forest", emoji: "🌲", defaultLevel: 0, file: "/sounds/forest.mp3" },
  { id: "fire", label: "Fire", emoji: "🔥", defaultLevel: 0, file: "/sounds/fire.mp3" },
  { id: "underwater", label: "Underwater", emoji: "🫧", defaultLevel: 0, file: "/sounds/underwater.mp3" },
  { id: "ocean", label: "Ocean", emoji: "🌊", defaultLevel: 0, file: "/sounds/ocean.mp3" },
  { id: "storm", label: "Storm", emoji: "⛈️", defaultLevel: 0, file: "/sounds/storm.mp3" },
];

export function AmbienceWidget() {
  const [levels, setLevels] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    sounds.forEach((s) => { init[s.id] = s.defaultLevel; });
    return init;
  });

  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  // Create audio elements on mount
  useEffect(() => {
    sounds.forEach((sound) => {
      const audio = new Audio(sound.file);
      audio.loop = true;
      audio.volume = 0;
      audio.preload = "auto";
      audioRefs.current[sound.id] = audio;
    });

    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      audioRefs.current = {};
    };
  }, []);

  const updateLevel = useCallback((id: string, value: number) => {
    setLevels((prev) => ({ ...prev, [id]: value }));
    const audio = audioRefs.current[id];
    if (!audio) return;

    audio.volume = value / 100;
    if (value > 0 && audio.paused) {
      audio.play().catch((e) => console.warn("Audio play error:", e));
    } else if (value === 0 && !audio.paused) {
      audio.pause();
    }
  }, []);

  const activeSounds = sounds.filter((s) => levels[s.id] > 0).length;

  const muteAll = () => {
    const reset: Record<string, number> = {};
    sounds.forEach((s) => {
      reset[s.id] = 0;
      const audio = audioRefs.current[s.id];
      if (audio) {
        audio.pause();
        audio.volume = 0;
      }
    });
    setLevels(reset);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: 11, color: "#6b6b80" }}>
          {activeSounds > 0 ? `${activeSounds} sound${activeSounds !== 1 ? "s" : ""} playing` : "All muted"}
        </span>
        <button
          onClick={muteAll}
          style={{ fontSize: 10, color: "#4a4a5a" }}
          className="hover:text-[#8a8a9a] transition-colors"
        >
          Mute All
        </button>
      </div>

      <div className="space-y-3">
        {sounds.map((sound) => (
          <div key={sound.id} className="flex items-center gap-3">
            <button
              onClick={() => updateLevel(sound.id, levels[sound.id] > 0 ? 0 : 50)}
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
              style={{
                background: levels[sound.id] > 0 ? "rgba(124,92,255,0.15)" : "#1A1A24",
                border: levels[sound.id] > 0 ? "1px solid rgba(124,92,255,0.3)" : "1px solid transparent",
              }}
            >
              <span style={{ fontSize: 13 }}>{sound.emoji}</span>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span style={{ fontSize: 11, color: levels[sound.id] > 0 ? "#c4c4d4" : "#4a4a5a" }}>
                  {sound.label}
                </span>
                <span style={{ fontSize: 10, color: "#3a3a4a" }}>{levels[sound.id]}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={levels[sound.id]}
                onChange={(e) => updateLevel(sound.id, Number(e.target.value))}
                className="focus-slider w-full"
              />
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 10, color: "#2a2a3a", marginTop: 10, textAlign: "center" }}>
        🎧 Use headphones for best experience
      </p>
    </div>
  );
}