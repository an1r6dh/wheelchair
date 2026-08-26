# SynthBot — AI Wheelchair & Robotics Mobility Control System

A high-performance robotics telemetry, motion control, and safety dashboard built for an ESP32-controlled AI mobility / smart wheelchair device.

Features a responsive design that functions seamlessly as a **Mobile App (Android APK via Capacitor)** and a **Web Application (React 19 + Vite)**.

---

## 🌟 Key Features

### 1. 🎮 Operator Control & Movement
- **Analog 360° Touch / Mouse Joystick**: Real-time directional vectoring with polar angle, X/Y coordinate normalization, and heading indicators (FWD, REV, LEFT, RIGHT).
- **Speed Modes**:
  - `Precision` (25% power limit) — Ideal for tight indoor navigation.
  - `Cruise` (50% power limit) — Smooth standard mobility mode.
  - `Sport` (75% power limit) — Enhanced outdoor mobility.
  - `Turbo` (100% max output) — Full motor power.
- **Directional HUD**: Real-time heading status (e.g., *NORTH-WEST (315°)*, *FORWARD*, *IDLE*).

### 2. 📊 Live Telemetry & Vitals
- **Artificial Horizon Gauge**: SVG flight-grade gyro visualization with animated pitch ladder, roll pointer, and degree readouts.
- **Power Monitoring**: Battery percentage, cell voltage (12.4V), and discharge rate (2.1A).
- **Wireless Signal Health**: RSSI dBm signal meter, packet rate (`pkt/s`), and zero-loss verification.
- **Microcontroller Diagnostics**: ESP32 core temperature, live motor RPM, system uptime, and device IP address.

### 3. 🛑 Performance & Hardware Safety Interlocks
- **RPM Speed Limiter**: Dynamic governor range slider (0–3000 RPM) with instant one-tap preset buttons (600, 1200, 2400, 3000 RPM).
- **Tactile Emergency Killswitch (E-STOP)**: High-visibility emergency stop with safety trip latch and clear status feedback.
- **Autonomous Safety Policies**:
  - *Ultrasonic Obstacle Guard*: Automatic braking when obstacles are detected within 20cm.
  - *Gyro Tilt Auto-Cutoff*: Throttle cut if pitch/roll exceeds 35°.
  - *Loss of Signal Failsafe*: Safe vehicle deceleration on timeout (>500ms).

### 4. 🔐 Security, RBAC & Operator Verification
- **Role-Based Access Control**:
  - **Operator Role**: Accesses motion controls and telemetry once verified.
  - **Administrator Role**: Accesses the security management console and approval dashboard.
- **Approval Pipeline**: New registrations are placed in `pending` status until approved by an Admin.
- **Audit Access Logging**: Records user IP address, device fingerprints, timestamp, and status for all login attempts (`LOGIN_SUCCESS`, `BLOCKED_UNVERIFIED`, `ADMIN_LOGIN`, etc.).
- **Dual-Mode Persistence**: Seamless real-time sync with Supabase PostgreSQL with transparent local cache fallback.

---

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript 5.7, Vite 8
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`), Custom keyframes & glassmorphism
- **Mobile Packaging**: Capacitor 8.5 (`@capacitor/android`, `@capacitor/core`)
- **Backend / Database**: Supabase PostgreSQL (`@supabase/supabase-js`)
- **Fonts**: `Rajdhani` (futuristic headings), `JetBrains Mono` (telemetry readouts), `Inter` (body copy)

---

## 💻 Getting Started

### 1. Prerequisites
- Node.js 20+ / 22+
- `pnpm` (or `npm`)
- JDK 21 & Android SDK (only for building Android APKs)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/an1r6dh/wheelchair.git
cd wheelchair

# Install dependencies
pnpm install
```

### 3. Running the Web App (Development)
```bash
pnpm run dev
```
Open your browser at `http://localhost:5173` or the preview port.

### 4. Building the Production Web App
```bash
pnpm run build
```
The optimized web assets will be generated in `dist/`.

### 5. Building the Android APK
```bash
pnpm run build:apk
```
This script compiles the web app, syncs with Capacitor, builds with Gradle using JDK 21, and produces `synthbot-app.apk` in the root directory.

---

## 🗄️ Database Setup (Supabase)

To connect your own Supabase instance:
1. Open [`supabase_schema.sql`](file:///home/anirudh-veda/Downloads/Mobile%20App%20UI%20Design%20%281%29/supabase_schema.sql) and run the script in your **Supabase Project -> SQL Editor**.
2. Update your `.env` or click the ⚙️ database icon in the app login screen:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Default Super Admin Credentials
- **Username**: `godhasmorepower`
- **Passkey**: `alwaysbelievegod`

---

## 📄 License
This project is licensed under the MIT License.
