import React, { useState, useEffect, useRef, useCallback } from "react";
import LoginScreen from "./components/LoginScreen";
import AdminDashboard from "./components/AdminDashboard";
import { supabaseService, AppUser } from "./services/supabaseService";

// ── TYPES ─────────────────────────────────────────────────────────────
type TabType = "movement" | "telemetry" | "performance";
type SpeedMode = "precision" | "cruise" | "sport" | "turbo";

interface JoystickState {
  x: number; // -1 to 1
  y: number; // -1 to 1
  angle: number; // 0 - 360 deg
  distance: number; // 0 - 1
  active: boolean;
}

// ── ICONS ─────────────────────────────────────────────────────────────
function IconRobot({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  );
}

function IconJoystick({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.4" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 12h12M12 6v12" />
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" fill={active ? "currentColor" : "none"} />
    </svg>
  );
}

function IconTelemetry({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.4" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h4l3 8 4-16 3 8h4" />
      <circle cx="12" cy="12" r="9" strokeOpacity="0.4" />
    </svg>
  );
}

function IconPerformance({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.4" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      <circle cx="12" cy="12" r="4" fill={active ? "currentColor" : "none"} />
    </svg>
  );
}

function IconWifi() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  );
}

function IconFingerprint() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 2C6.48 2 2 6.48 2 12" /><path d="M12 2c5.52 0 10 4.48 10 10" />
      <path d="M5 12c0-3.87 3.13-7 7-7" /><path d="M12 5c3.87 0 7 3.13 7 7" />
      <path d="M8 12c0-2.21 1.79-4 4-4" /><path d="M12 8c2.21 0 4 1.79 4 4" />
      <path d="M10 12c0-1.1.9-2 2-2" /><path d="M12 10c1.1 0 2 .9 2 2v4" />
    </svg>
  );
}

// ── ARTIFICIAL HORIZON GAUGE ──────────────────────────────────────────
function ArtificialHorizon({ pitch, roll }: { pitch: number; roll: number }) {
  const size = 180;
  const cx = size / 2;
  const r = 72;
  const pitchPx = (pitch / 30) * (r * 0.8);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative p-2 rounded-full bg-white border border-slate-200 shadow-md shadow-slate-100 transition-all duration-300">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          <defs>
            <clipPath id="horizon-clip">
              <circle cx={cx} cy={cx} r={r} />
            </clipPath>
            <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <linearGradient id="ground-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
          </defs>

          {/* Rotating Horizon Disk with smooth CSS transition */}
          <g
            clipPath="url(#horizon-clip)"
            transform={`rotate(${roll} ${cx} ${cx})`}
            style={{ transition: "transform 0.15s ease-out" }}
          >
            {/* Sky */}
            <rect x={0} y={0} width={size} height={cx + pitchPx} fill="url(#sky-grad)" />
            {/* Ground */}
            <rect x={0} y={cx + pitchPx} width={size} height={size} fill="url(#ground-grad)" />
            {/* Horizon Center Line */}
            <line x1={0} y1={cx + pitchPx} x2={size} y2={cx + pitchPx} stroke="#ffffff" strokeWidth="2.5" />

            {/* Pitch Ladder Marks */}
            {[-20, -10, 10, 20].map((d) => {
              const y = cx + pitchPx - (d / 30) * (r * 0.8);
              const isMajor = Math.abs(d) % 20 === 0;
              const w = isMajor ? 28 : 16;
              return (
                <g key={d}>
                  <line x1={cx - w} y1={y} x2={cx + w} y2={y} stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" />
                  <text x={cx + w + 4} y={y + 3} fill="rgba(255,255,255,0.9)" fontSize="8" fontFamily="JetBrains Mono" fontWeight="600">
                    {Math.abs(d)}°
                  </text>
                </g>
              );
            })}
          </g>

          {/* Outer Bezel */}
          <circle cx={cx} cy={cx} r={r} stroke="#cbd5e1" strokeWidth="2" fill="none" />
          <circle cx={cx} cy={cx} r={r + 5} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" fill="none" />

          {/* Fixed Aircraft Reference Symbol */}
          <line x1={cx - 34} y1={cx} x2={cx - 10} y2={cx} stroke="#eab308" strokeWidth="3" strokeLinecap="round" />
          <line x1={cx + 10} y1={cx} x2={cx + 34} y2={cx} stroke="#eab308" strokeWidth="3" strokeLinecap="round" />
          <polyline points={`${cx - 10},${cx} ${cx},${cx + 7} ${cx + 10},${cx}`} fill="none" stroke="#eab308" strokeWidth="3" strokeLinecap="round" />
          <circle cx={cx} cy={cx} r={2.5} fill="#eab308" />

          {/* Top Roll Pointer */}
          <polygon points={`${cx},${cx - r + 2} ${cx - 4},${cx - r + 9} ${cx + 4},${cx - r + 9}`} fill="#2563eb" />
        </svg>
      </div>

      {/* Angle Readouts */}
      <div className="flex items-center gap-6 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm font-mono-tech text-xs transition-all">
        <span className="text-slate-600 font-medium">
          PITCH: <strong className={pitch >= 0 ? "text-blue-600" : "text-amber-600"}>{pitch > 0 ? "+" : ""}{pitch.toFixed(1)}°</strong>
        </span>
        <div className="w-px h-3 bg-slate-200" />
        <span className="text-slate-600 font-medium">
          ROLL: <strong className={roll >= 0 ? "text-blue-600" : "text-amber-600"}>{roll > 0 ? "+" : ""}{roll.toFixed(1)}°</strong>
        </span>
      </div>
    </div>
  );
}

// ── TOUCH & MOUSE ANALOG JOYSTICK ──────────────────────────────────────
function TouchJoystick({ onMove, onRelease }: { onMove: (state: JoystickState) => void; onRelease: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const radius = 68;

  const handlePointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angleRad = Math.atan2(dy, dx);
      let deg = (angleRad * (180 / Math.PI) + 90) % 360;
      if (deg < 0) deg += 360;

      const clampedDist = Math.min(dist, radius);
      const normDist = clampedDist / radius;
      const clampedX = Math.cos(angleRad) * clampedDist;
      const clampedY = Math.sin(angleRad) * clampedDist;

      setPosition({ x: clampedX, y: clampedY });
      onMove({
        x: Number((clampedX / radius).toFixed(2)),
        y: Number((-clampedY / radius).toFixed(2)),
        angle: Math.round(deg),
        distance: Number(normDist.toFixed(2)),
        active: true,
      });
    },
    [onMove, radius]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    handlePointer(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      handlePointer(e.clientX, e.clientY);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      setPosition({ x: 0, y: 0 });
      onRelease();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`relative w-48 h-48 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-all duration-200 touch-none ${
          isDragging
            ? "bg-slate-50 border-2 border-blue-500 shadow-xl shadow-blue-500/20 scale-[1.02]"
            : "bg-gradient-to-b from-white to-slate-50 border border-slate-200 shadow-lg shadow-slate-200/50 hover:border-slate-300"
        }`}
      >
        {/* Cardinal Markers */}
        <span className="absolute top-2 text-[11px] font-bold font-tech text-blue-600 tracking-wider">FWD</span>
        <span className="absolute bottom-2 text-[11px] font-bold font-tech text-slate-400 tracking-wider">REV</span>
        <span className="absolute left-3 text-[11px] font-bold font-tech text-slate-400 tracking-wider">LEFT</span>
        <span className="absolute right-3 text-[11px] font-bold font-tech text-slate-400 tracking-wider">RIGHT</span>

        {/* Outer Ring & Guides */}
        <div className="absolute inset-4 rounded-full border border-dashed border-slate-300 pointer-events-none" />
        <div className="absolute inset-10 rounded-full border border-slate-200 pointer-events-none" />

        {/* Center Crosshairs */}
        <div className="absolute w-full h-px bg-slate-200 pointer-events-none" />
        <div className="absolute h-full w-px bg-slate-200 pointer-events-none" />

        {/* Dynamic Joystick Thumb */}
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            isDragging
              ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/40 border-2 border-white scale-105"
              : "bg-white border-2 border-slate-300 shadow-md hover:scale-105"
          }`}
        >
          <div className={`w-6 h-6 rounded-full ${isDragging ? "bg-white" : "bg-blue-600"} shadow-inner transition-colors`} />
        </div>
      </div>
    </div>
  );
}

// ── PAGE 1: MOVEMENT CONTROL TAB ──────────────────────────────────────
function MovementTab({
  rpm,
  estop,
  onTriggerEstop,
}: {
  rpm: number;
  estop: boolean;
  onTriggerEstop: () => void;
}) {
  const [joyState, setJoyState] = useState<JoystickState>({ x: 0, y: 0, angle: 0, distance: 0, active: false });
  const [speedMode, setSpeedMode] = useState<SpeedMode>("cruise");
  const [lastCommand, setLastCommand] = useState("IDLE (0, 0)");

  const handleJoystickMove = (state: JoystickState) => {
    setJoyState(state);
    let dir = "FORWARD";
    if (state.angle > 330 || state.angle <= 30) dir = "FORWARD";
    else if (state.angle > 30 && state.angle <= 60) dir = "FWD-RIGHT";
    else if (state.angle > 60 && state.angle <= 120) dir = "RIGHT";
    else if (state.angle > 120 && state.angle <= 150) dir = "REV-RIGHT";
    else if (state.angle > 150 && state.angle <= 210) dir = "REVERSE";
    else if (state.angle > 210 && state.angle <= 240) dir = "REV-LEFT";
    else if (state.angle > 240 && state.angle <= 300) dir = "LEFT";
    else dir = "FWD-LEFT";

    const power = Math.round(state.distance * 100);
    setLastCommand(`${dir} · ${power}% (${state.x.toFixed(2)}, ${state.y.toFixed(2)})`);
  };

  const handleJoystickRelease = () => {
    setJoyState({ x: 0, y: 0, angle: 0, distance: 0, active: false });
    setLastCommand("IDLE (0, 0)");
  };

  const handleDpadClick = (dir: string, x: number, y: number, angle: number) => {
    setJoyState({ x, y, angle, distance: 0.8, active: true });
    setLastCommand(`${dir} · 80% (${x}, ${y})`);
    setTimeout(() => {
      setJoyState({ x: 0, y: 0, angle: 0, distance: 0, active: false });
      setLastCommand("IDLE (0, 0)");
    }, 400);
  };

  return (
    <div className="flex flex-col gap-4 pb-28 max-w-md mx-auto w-full px-4">
      {/* Top Movement Header Card */}
      <div className="animate-fade-up stagger-1 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-tech text-blue-600 font-bold">Motor Motion Bus</span>
            <h2 className="text-lg font-bold text-slate-900 font-tech tracking-wide">DRIVE CONTROLLER</h2>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 font-mono-tech text-xs transition-all">
            <div className={`w-2 h-2 rounded-full transition-colors ${joyState.active ? "bg-blue-600 animate-ping" : "bg-emerald-500"}`} />
            <span className="text-slate-700 font-semibold">{joyState.active ? "ENGAGED" : "READY"}</span>
          </div>
        </div>

        {/* Live Vector Telemetry Pill */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between font-mono-tech text-xs transition-all">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">CURRENT VECTOR</span>
            <span className="text-blue-600 font-bold text-sm transition-all">{lastCommand}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">MAGNITUDE</span>
            <span className="text-slate-900 font-bold text-sm">{Math.round(joyState.distance * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Main Analog Joystick Arena */}
      <div className="animate-fade-up stagger-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md shadow-slate-200/40 flex flex-col items-center justify-center transition-all">
        <TouchJoystick onMove={handleJoystickMove} onRelease={handleJoystickRelease} />

        {/* Speed Profile Mode Switcher */}
        <div className="w-full mt-6 pt-4 border-t border-slate-100">
          <div className="text-xs font-tech uppercase text-slate-500 font-bold mb-2.5 flex justify-between">
            <span>Drive Velocity Mode</span>
            <span className="text-blue-600 font-mono-tech uppercase font-semibold transition-all">{speedMode}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(["precision", "cruise", "sport", "turbo"] as SpeedMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setSpeedMode(mode)}
                className={`py-2 rounded-xl text-xs font-tech font-bold uppercase transition-all duration-200 active:scale-95 ${
                  speedMode === mode
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.03]"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200"
                }`}
              >
                {mode === "precision" ? "25%" : mode === "cruise" ? "50%" : mode === "sport" ? "75%" : "100%"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick D-Pad Cardinal Tap Triggers */}
      <div className="animate-fade-up stagger-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <span className="text-xs uppercase tracking-wider font-tech text-slate-500 font-bold block mb-3">
          Step Precision Movement
        </span>
        <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
          <div />
          <button
            onClick={() => handleDpadClick("STEP FORWARD", 0, 0.8, 0)}
            className="p-3 rounded-xl bg-slate-50 hover:bg-blue-600 hover:text-white border border-slate-200 font-bold text-slate-800 transition-all duration-150 active:scale-90 text-center flex items-center justify-center shadow-sm"
          >
            ▲
          </button>
          <div />
          <button
            onClick={() => handleDpadClick("STEP LEFT", -0.8, 0, 270)}
            className="p-3 rounded-xl bg-slate-50 hover:bg-blue-600 hover:text-white border border-slate-200 font-bold text-slate-800 transition-all duration-150 active:scale-90 text-center flex items-center justify-center shadow-sm"
          >
            ◀
          </button>
          <button
            onClick={() => handleJoystickRelease()}
            className="p-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 font-bold text-red-600 text-xs transition-all duration-150 active:scale-90 flex items-center justify-center font-tech"
          >
            HALT
          </button>
          <button
            onClick={() => handleDpadClick("STEP RIGHT", 0.8, 0, 90)}
            className="p-3 rounded-xl bg-slate-50 hover:bg-blue-600 hover:text-white border border-slate-200 font-bold text-slate-800 transition-all duration-150 active:scale-90 text-center flex items-center justify-center shadow-sm"
          >
            ▶
          </button>
          <div />
          <button
            onClick={() => handleDpadClick("STEP REVERSE", 0, -0.8, 180)}
            className="p-3 rounded-xl bg-slate-50 hover:bg-blue-600 hover:text-white border border-slate-200 font-bold text-slate-800 transition-all duration-150 active:scale-90 text-center flex items-center justify-center shadow-sm"
          >
            ▼
          </button>
          <div />
        </div>
      </div>
    </div>
  );
}

// ── PAGE 2: LIVE TELEMETRY TAB ─────────────────────────────────────────
function TelemetryTab({
  pitch,
  roll,
  battery,
  temp,
  rpm,
}: {
  pitch: number;
  roll: number;
  battery: number;
  temp: number;
  rpm: number;
}) {
  const [rssi, setRssi] = useState(-52);
  const [packetRate, setPacketRate] = useState(138);

  useEffect(() => {
    const interval = setInterval(() => {
      setRssi(-50 - Math.floor(Math.random() * 6));
      setPacketRate(130 + Math.floor(Math.random() * 20));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-4 pb-28 max-w-md mx-auto w-full px-4">
      {/* Telemetry Header */}
      <div className="animate-fade-up stagger-1 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm transition-all">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] uppercase tracking-wider font-tech text-blue-600 font-bold">6-Axis IMU & Telemetry</span>
          <span className="text-[11px] font-mono-tech font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 transition-all">
            STREAMING 50Hz
          </span>
        </div>
        <h2 className="text-lg font-bold text-slate-900 font-tech tracking-wide">ATTITUDE & SENSORS</h2>
      </div>

      {/* Artificial Horizon Card */}
      <div className="animate-fade-up stagger-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md shadow-slate-200/40 flex flex-col items-center transition-all">
        <ArtificialHorizon pitch={pitch} roll={roll} />
      </div>

      {/* Power & Wireless Matrix */}
      <div className="animate-fade-up stagger-3 grid grid-cols-2 gap-3">
        {/* Battery Monitor */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-tech uppercase text-slate-500 font-bold">Battery Pack</span>
            <span className={`text-xs font-bold font-mono-tech transition-colors ${battery > 40 ? "text-emerald-600" : "text-amber-600"}`}>
              {battery}%
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-500 ease-out ${
                battery > 40 ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-amber-500"
              }`}
              style={{ width: `${battery}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] font-mono-tech text-slate-500">
            <span>12.4 V</span>
            <span>2.1 A</span>
          </div>
        </div>

        {/* Link Quality */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-tech uppercase text-slate-500 font-bold">Signal Link</span>
            <span className="text-xs font-bold font-mono-tech text-blue-600 transition-all">{rssi} dBm</span>
          </div>

          <div className="flex items-center gap-1 h-3 mb-2">
            {[1, 2, 3, 4, 5].map((bar) => (
              <div
                key={bar}
                className={`flex-1 rounded-sm transition-all duration-300 ${
                  bar <= 4 ? "bg-blue-600" : "bg-slate-200"
                }`}
                style={{ height: `${bar * 20}%` }}
              />
            ))}
          </div>

          <div className="flex justify-between text-[11px] font-mono-tech text-slate-500">
            <span>{packetRate} pkt/s</span>
            <span>0% loss</span>
          </div>
        </div>
      </div>

      {/* Sensor Vitals Grid */}
      <div className="animate-fade-up stagger-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <span className="text-xs uppercase tracking-wider font-tech text-slate-500 font-bold block mb-3">
          Onboard Microcontroller Metrics
        </span>
        <div className="grid grid-cols-2 gap-2 font-mono-tech">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 transition-all hover:bg-slate-100/70">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">CORE TEMP</span>
            <span className="text-base font-bold text-slate-900">{temp.toFixed(1)}°C</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 transition-all hover:bg-slate-100/70">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">MOTOR RPM</span>
            <span className="text-base font-bold text-blue-600">{rpm}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 transition-all hover:bg-slate-100/70">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">UPTIME</span>
            <span className="text-base font-bold text-slate-900">00:48:22</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 transition-all hover:bg-slate-100/70">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">ESP32 IP</span>
            <span className="text-base font-bold text-slate-700">192.168.4.1</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PAGE 3: PERFORMANCE & SAFETY TAB ──────────────────────────────────
function PerformanceTab({
  rpm,
  setRpm,
  estop,
  setEstop,
}: {
  rpm: number;
  setRpm: (v: number) => void;
  estop: boolean;
  setEstop: (v: boolean) => void;
}) {
  const [collisionGuard, setCollisionGuard] = useState(true);
  const [tiltCutoff, setTiltCutoff] = useState(true);
  const [failsafe, setFailsafe] = useState(true);

  return (
    <div className="flex flex-col gap-4 pb-28 max-w-md mx-auto w-full px-4">
      {/* Header */}
      <div className="animate-fade-up stagger-1 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm transition-all">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] uppercase tracking-wider font-tech text-blue-600 font-bold">Speed Limiter & Safety</span>
          <span className={`text-[11px] font-mono-tech font-semibold px-2.5 py-0.5 rounded-full border transition-all duration-300 ${
            estop
              ? "text-red-700 bg-red-50 border-red-200 animate-pulse"
              : "text-emerald-700 bg-emerald-50 border-emerald-200"
          }`}>
            {estop ? "EMERGENCY HALTED" : "SYSTEM ARMED"}
          </span>
        </div>
        <h2 className="text-lg font-bold text-slate-900 font-tech tracking-wide">PERFORMANCE & GOVERNOR</h2>
      </div>

      {/* Speed Limiter Card */}
      <div className="animate-fade-up stagger-2 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-md shadow-slate-200/40 transition-all">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-tech text-slate-500 font-bold block">
              Max Motor Speed
            </span>
            <span className="text-2xl font-bold font-mono-tech text-blue-600 transition-all">
              {rpm} <span className="text-sm text-slate-400 font-normal">RPM</span>
            </span>
          </div>
          <div className="px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 font-mono-tech text-xs text-slate-700 font-medium transition-all">
            {Math.round((rpm / 3000) * 100)}% Cap
          </div>
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min={0}
          max={3000}
          step={50}
          value={rpm}
          onChange={(e) => setRpm(Number(e.target.value))}
          className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-4 transition-all"
        />

        {/* Quick RPM Presets */}
        <div className="grid grid-cols-4 gap-2">
          {[600, 1200, 2400, 3000].map((val) => (
            <button
              key={val}
              onClick={() => setRpm(val)}
              className={`py-2 rounded-xl text-xs font-mono-tech font-bold transition-all duration-200 active:scale-95 ${
                rpm === val
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.03]"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200"
              }`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      {/* Giant Tactile E-STOP Button */}
      <div className="animate-fade-up stagger-2 p-6 rounded-2xl bg-white border border-red-200 shadow-md shadow-red-500/10 flex flex-col items-center">
        <button
          onClick={() => setEstop(!estop)}
          className={`w-full py-6 rounded-2xl font-tech text-2xl font-extrabold uppercase tracking-wider transition-all duration-200 active:scale-95 flex flex-col items-center justify-center gap-1 cursor-pointer ${
            estop
              ? "bg-red-600 text-white shadow-xl shadow-red-500/50 border-4 border-red-300 animate-pulse"
              : "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/35 border-2 border-red-400 hover:scale-[1.01]"
          }`}
        >
          <span>⚠ {estop ? "RESUME OPERATION" : "EMERGENCY STOP (E-STOP)"}</span>
          <span className="text-xs font-mono-tech opacity-90 tracking-normal font-normal">
            {estop ? "Motors locked · Tap to clear safety trip" : "Instantly cuts all motor power"}
          </span>
        </button>
      </div>

      {/* Autonomous Safety Overrides */}
      <div className="animate-fade-up stagger-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <span className="text-xs uppercase tracking-wider font-tech text-slate-500 font-bold block mb-3">
          Hardware Safety Policies
        </span>
        <div className="flex flex-col gap-2.5">
          {/* Toggle 1 */}
          <div
            onClick={() => setCollisionGuard(!collisionGuard)}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/80 transition-all select-none"
          >
            <div>
              <span className="text-sm font-semibold text-slate-900 block">Ultrasonic Obstacle Guard</span>
              <span className="text-xs text-slate-500">Auto-brakes if obstacle is under 20cm</span>
            </div>
            <div className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 ${collisionGuard ? "bg-blue-600" : "bg-slate-300"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${collisionGuard ? "translate-x-6" : "translate-x-1"}`} />
            </div>
          </div>

          {/* Toggle 2 */}
          <div
            onClick={() => setTiltCutoff(!tiltCutoff)}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/80 transition-all select-none"
          >
            <div>
              <span className="text-sm font-semibold text-slate-900 block">Gyro Tilt Auto-Cutoff</span>
              <span className="text-xs text-slate-500">Kills throttle if pitch/roll exceeds 35°</span>
            </div>
            <div className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 ${tiltCutoff ? "bg-blue-600" : "bg-slate-300"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${tiltCutoff ? "translate-x-6" : "translate-x-1"}`} />
            </div>
          </div>

          {/* Toggle 3 */}
          <div
            onClick={() => setFailsafe(!failsafe)}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/80 transition-all select-none"
          >
            <div>
              <span className="text-sm font-semibold text-slate-900 block">Loss of Signal Failsafe</span>
              <span className="text-xs text-slate-500">Brakes vehicle after 500ms timeout</span>
            </div>
            <div className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 ${failsafe ? "bg-blue-600" : "bg-slate-300"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${failsafe ? "translate-x-6" : "translate-x-1"}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ROOT APP COMPONENT ────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => supabaseService.getSession());
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(() => {
    const session = supabaseService.getSession();
    return session?.role === "admin";
  });
  const [activeTab, setActiveTab] = useState<TabType>("movement");
  const [slideDirection, setSlideDirection] = useState<"right" | "left">("right");
  const [rpm, setRpm] = useState(1400);
  const [estop, setEstop] = useState(false);
  const [pitch, setPitch] = useState(2.4);
  const [roll, setRoll] = useState(-1.2);
  const [battery, setBattery] = useState(78);
  const [temp, setTemp] = useState(38.4);

  // Tab mapping for transition direction calculation
  const tabOrder: Record<TabType, number> = {
    movement: 0,
    telemetry: 1,
    performance: 2,
  };

  const handleTabChange = (newTab: TabType) => {
    if (newTab === activeTab) return;
    const currentIdx = tabOrder[activeTab];
    const nextIdx = tabOrder[newTab];
    setSlideDirection(nextIdx > currentIdx ? "right" : "left");
    setActiveTab(newTab);
  };

  // Live gyro simulator
  useEffect(() => {
    if (!currentUser) return;
    const id = setInterval(() => {
      setPitch((p) => Math.max(-28, Math.min(28, p + (Math.random() - 0.5) * 0.8)));
      setRoll((r) => Math.max(-28, Math.min(28, r + (Math.random() - 0.5) * 0.6)));
      setTemp((t) => Number((38.0 + Math.sin(Date.now() / 10000) * 1.5).toFixed(1)));
    }, 400);
    return () => clearInterval(id);
  }, [currentUser]);

  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    if (user.role === "admin") {
      setShowAdminPanel(true);
    } else {
      setShowAdminPanel(false);
    }
  };

  const handleLogout = () => {
    supabaseService.clearSession();
    setCurrentUser(null);
    setShowAdminPanel(false);
  };

  // 1. If not authenticated, show LoginScreen
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. If Admin and in Admin Panel Mode, show Admin Dashboard
  if (currentUser.role === "admin" && showAdminPanel) {
    return (
      <AdminDashboard
        currentUser={currentUser}
        onLaunchRobotControl={() => setShowAdminPanel(false)}
        onLogout={handleLogout}
      />
    );
  }

  // 3. Authenticated Robot Control Screen
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between animate-fade-up">
      {/* ── TOP MOBILE APP HEADER BAR ─────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 border-b border-slate-200/80 backdrop-blur-md px-4 py-2.5 shadow-sm transition-all">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Logo & Device Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-sky-400/40 p-0.5 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              <img src="/favicon.svg" alt="Wheelchair Logo" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-tech font-extrabold text-sm tracking-wider text-slate-900">WHEELCHAIR AI</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="text-[10px] font-mono-tech text-slate-500 block font-medium">ESP32-S3 · 192.168.4.1</span>
            </div>
          </div>

          {/* User Profile Badge & Admin Switch / Logout */}
          <div className="flex items-center gap-2 font-mono-tech text-xs">
            {/* Operator info pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold truncate max-w-[80px]">
                {currentUser.username}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-tech font-extrabold">
                {currentUser.role === "admin" ? "ADMIN" : "VERIFIED"}
              </span>
            </div>

            {/* Admin Console Shortcut */}
            {currentUser.role === "admin" && (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="p-1.5 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-tech font-bold text-xs transition-all active:scale-90 flex items-center gap-1"
                title="Open Security Admin Console"
              >
                <span>👑</span>
                <span className="hidden sm:inline">ADMIN</span>
              </button>
            )}

            {/* Disconnect / Logout */}
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-200 text-slate-500 transition-all duration-200 active:scale-90 text-xs cursor-pointer"
              title="Disconnect and Sign Out"
            >
              ✕
            </button>
          </div>
        </div>
      </header>

      {/* ── ACTIVE TAB CONTENT WITH ANIMATED TRANSITIONS ───────────────── */}
      <main className="flex-1 pt-4 overflow-y-auto">
        <div
          key={activeTab}
          className={slideDirection === "right" ? "animate-slide-right" : "animate-slide-left"}
        >
          {activeTab === "movement" && (
            <MovementTab rpm={rpm} estop={estop} onTriggerEstop={() => setEstop(true)} />
          )}
          {activeTab === "telemetry" && (
            <TelemetryTab pitch={pitch} roll={roll} battery={battery} temp={temp} rpm={estop ? 0 : rpm} />
          )}
          {activeTab === "performance" && (
            <PerformanceTab rpm={rpm} setRpm={setRpm} estop={estop} setEstop={setEstop} />
          )}
        </div>
      </main>

      {/* ── BOTTOM NAVIGATION BAR WITH FLUID SLIDING PILL INDICATOR ───── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200/80 backdrop-blur-xl px-4 py-2 shadow-lg shadow-slate-200/50">
        <div className="max-w-md mx-auto relative flex items-center justify-around">
          {/* Animated background slider pill */}
          <div
            className="absolute top-1 bottom-1 rounded-2xl bg-blue-50 border border-blue-200/80 transition-all duration-300 ease-out pointer-events-none"
            style={{
              width: "calc(33.333% - 10px)",
              left: `calc(${tabOrder[activeTab] * 33.333}% + 5px)`,
            }}
          />

          {/* Tab 1: Movement */}
          <button
            onClick={() => handleTabChange("movement")}
            className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-2 rounded-2xl transition-all duration-200 relative z-10 cursor-pointer active:scale-95 ${
              activeTab === "movement"
                ? "text-blue-600 font-bold scale-[1.04]"
                : "text-slate-400 hover:text-slate-600 font-medium"
            }`}
          >
            <div className="relative">
              <IconJoystick active={activeTab === "movement"} />
              {activeTab === "movement" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-600 animate-scale-in" />
              )}
            </div>
            <span className="text-[11px] font-tech uppercase tracking-wider">Movement</span>
          </button>

          {/* Tab 2: Telemetry */}
          <button
            onClick={() => handleTabChange("telemetry")}
            className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-2 rounded-2xl transition-all duration-200 relative z-10 cursor-pointer active:scale-95 ${
              activeTab === "telemetry"
                ? "text-blue-600 font-bold scale-[1.04]"
                : "text-slate-400 hover:text-slate-600 font-medium"
            }`}
          >
            <div className="relative">
              <IconTelemetry active={activeTab === "telemetry"} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              {activeTab === "telemetry" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-600 animate-scale-in" />
              )}
            </div>
            <span className="text-[11px] font-tech uppercase tracking-wider">Telemetry</span>
          </button>

          {/* Tab 3: Performance & Safety */}
          <button
            onClick={() => handleTabChange("performance")}
            className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-2 rounded-2xl transition-all duration-200 relative z-10 cursor-pointer active:scale-95 ${
              activeTab === "performance"
                ? "text-blue-600 font-bold scale-[1.04]"
                : "text-slate-400 hover:text-slate-600 font-medium"
            }`}
          >
            <div className="relative">
              <IconPerformance active={activeTab === "performance"} />
              {estop && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping ring-2 ring-white" />
              )}
              {activeTab === "performance" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-600 animate-scale-in" />
              )}
            </div>
            <span className="text-[11px] font-tech uppercase tracking-wider">Performance</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
