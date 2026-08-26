# ESP32 Robotics Control App — UI Plan

## Context

Build a two-screen mobile app UI for an ESP32-controlled mobility/robotics device. The brief calls for a gaming/engineering dashboard aesthetic: deep charcoal/black backgrounds, neon cyan accent (#00F5FF or similar), glassmorphism panels, and a futuristic sans-serif font. The app is a static UI prototype (no real device connection).

## Aesthetic & Design Tokens

**Stance:** Kinetic engineering dashboard — dark, purposeful, high contrast.

**Fonts (Google Fonts via CSS @import in src/index.css):**
- `Rajdhani` — display headings, labels, values (futuristic, condensed)
- `Inter` — body text, inputs, secondary copy
- `JetBrains Mono` — numeric readouts, telemetry values

**Tokens to write into `src/index.css` as CSS custom properties:**
```css
--background: #0a0a0f;        /* pitch black */
--card: #111827;              /* deep charcoal panel */
--primary: #00f0ff;           /* neon cyan */
--accent: #39ff14;            /* electric green (E-STOP contrast) */
--danger: #ff2d2d;            /* emergency red */
--border: rgba(0,240,255,0.2);
--muted-foreground: #6b7280;
```

## File Changes

### `src/index.css`
- Add Google Fonts `@import` at top: Rajdhani (400,600,700), Inter (400,500), JetBrains Mono (400,500)
- Add CSS custom properties (tokens above)
- Add global font-family defaults: `body { font-family: 'Inter', sans-serif; }`
- Add scrollbar hiding utility

### `src/App.tsx`
Replace with a two-screen app using React `useState` to toggle between screens.

---

## Screen 1 — Login Page (Portrait, ~390px wide)

**Layout:** Centered column, full viewport height.

**Components:**
- Logo area: A stylized placeholder logo mark (SVG crest/circuit board icon in cyan) + wordmark "SYNTH-BOT" in Rajdhani bold
- Username/Email input — thin 1px border, on focus: cyan glow via `box-shadow: 0 0 0 1px #00f0ff, 0 0 12px rgba(0,240,255,0.3)`
- Password input — same glow treatment, with password toggle eye icon
- "Connect Device" CTA — full-width button, solid cyan fill, black text, Rajdhani 700, subtle pulse animation on hover
- Biometric row — centered fingerprint SVG icon with label "Use Biometric", subtle opacity treatment
- Background — pitch black with a faint radial gradient bloom in cyan at top

**Glassmorphism card:** The form sits inside a frosted panel: `background: rgba(17,24,39,0.7); backdrop-filter: blur(12px); border: 1px solid rgba(0,240,255,0.15);`

---

## Screen 2 — Telemetry Dashboard (Landscape, ~844×390px)

**Layout:** CSS Grid, 3 equal columns at full width. The app root uses `min-h-screen` with a landscape feel.

### Left Column — Movement Control
- Section label: "MOVEMENT" in Rajdhani caps, muted cyan
- Digital joystick: A large circular pad (SVG + React state) showing a draggable thumb dot. Clicking the 8 directional zones (N/S/E/W + diagonals) highlights the direction. Visual: dark circle, cyan ring border, inner thumb dot with glow.
- Direction state displayed as text: "FORWARD / IDLE / etc."

### Center Column — Live Telemetry
- **Artificial Horizon gauge** (SVG): Circle clipped viewport showing a pitch/roll horizon line. Animates with mock values cycling via `useEffect`. Labels: PITCH +2.4° / ROLL -1.1°
- **Battery indicator**: Horizontal segmented bar (5 segments), percentage readout in JetBrains Mono, color shifts green→yellow→red
- **Connectivity chip**: Small pill showing "ESP32 CONNECTED" with a pulsing green dot, Wi-Fi signal bars icon in cyan

### Right Column — Performance & Safety
- **Speed Limiter**: Vertical range `<input type="range">` styled with a custom cyan thumb and track. Label "MAX RPM" with current value in JetBrains Mono. Range 0–3000 RPM.
- **E-STOP button**: Full-width, tall, vivid red (`#ff2d2d`) with heavy drop shadow and animated ring pulse. Text "E-STOP" in Rajdhani 700, white. On click, toggles an "STOPPED" overlay state.

**Panel treatment:** All three columns are glassmorphism cards (same formula as login).  
**Background:** Dark with a subtle cyan radial grid pattern (CSS background-image linear-gradient grid lines at low opacity).

---

## Navigation

- Login screen has a "Connect Device" button that transitions to Dashboard (simple state toggle, no router needed)
- Dashboard has a small "← Disconnect" link top-left to return to login

---

## Verification

After implementation:
1. Open preview in browser — confirm login renders centered, portrait-style
2. Click "Connect Device" — dashboard appears in landscape layout
3. Hover inputs — cyan glow appears
4. Interact with joystick zones — direction indicator updates
5. Move speed slider — RPM value updates live
6. Click E-STOP — red overlay/state activates
7. Check responsive behavior: on narrow viewport (<768px) dashboard stacks columns vertically
