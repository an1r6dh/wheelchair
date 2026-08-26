import React, { useState, useEffect } from "react";
import { supabaseService, AppUser } from "../services/supabaseService";
import SupabaseConfigModal from "./SupabaseConfigModal";

interface LoginScreenProps {
  onLoginSuccess: (user: AppUser) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  // Target Device select
  const [targetDevice, setTargetDevice] = useState("ESP32-S3-DevKitC-1 (192.168.4.1)");

  // UI status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepMessage, setStepMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [clientIp, setClientIp] = useState("Detecting IP...");
  const [deviceSummary, setDeviceSummary] = useState("");

  useEffect(() => {
    supabaseService.getClientIp().then(setClientIp);
    setDeviceSummary(supabaseService.getDeviceSummary());
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setPendingNotice(null);
    setSuccessMessage(null);

    const loginId = identifier.trim();
    const loginPass = password;

    if (!loginId || !loginPass) {
      setErrorMessage("Please enter both your username/email and passkey.");
      return;
    }

    setIsSubmitting(true);
    setStepMessage("Resolving operator identity...");

    setTimeout(async () => {
      setStepMessage("Verifying security verification status...");
      const result = await supabaseService.loginUser(loginId, loginPass);
      setIsSubmitting(false);

      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        if (result.isPendingVerification) {
          setPendingNotice(result.message);
        } else {
          setErrorMessage(result.message);
        }
      }
    }, 600);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPendingNotice(null);
    setSuccessMessage(null);

    if (!fullName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword) {
      setErrorMessage("Please complete all registration fields.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage("Passkey must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);
    setStepMessage("Registering operator in database...");

    setTimeout(async () => {
      const res = await supabaseService.registerUser({
        fullName,
        username: regUsername,
        email: regEmail,
        password: regPassword,
      });
      setIsSubmitting(false);

      if (res.success) {
        setSuccessMessage(
          `Registration submitted for ${fullName}! Your account status is PENDING admin verification. You will be able to log in once approved by the administrator.`
        );
        // Reset form
        setFullName("");
        setRegUsername("");
        setRegEmail("");
        setRegPassword("");
        setRegConfirmPassword("");
        setActiveTab("login");
      } else {
        setErrorMessage(res.message);
      }
    }, 700);
  };

  const config = supabaseService.getConfig();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between p-4 py-8 items-center font-sans">
      {/* ── TOP BAR WITH SUPABASE STATUS ─────────────────────────────── */}
      <div className="w-full max-w-md flex items-center justify-between px-2 mb-2 font-mono-tech text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-600 font-semibold text-[11px]">Wheelchair Access Gateway v2.5</span>
        </div>

        <button
          onClick={() => setShowConfigModal(true)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
            config.isConfigured
              ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
              : "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
          }`}
          title="Supabase Database Settings"
        >
          <span className="text-[10px]">⚡</span>
          <span className="font-tech font-bold text-[11px]">
            {config.isConfigured ? "Supabase Cloud" : "Local Database"}
          </span>
          <span className="text-slate-400 ml-0.5">⚙</span>
        </button>
      </div>

      {/* ── MAIN AUTHENTICATION CARD ─────────────────────────────────── */}
      <div className="w-full max-w-md animate-scale-in">
        <div className="p-7 md:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-300/60 transition-all">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="inline-flex p-2 rounded-2xl bg-slate-900 border border-sky-400/40 shadow-xl shadow-blue-500/30 mb-3 animate-pulse-glow">
              <img src="/favicon.svg" alt="Wheelchair Logo" className="w-12 h-12 object-contain" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 font-tech tracking-wider">
              WHEELCHAIR MOBILITY
            </h1>
            <p className="text-xs text-slate-500 font-mono-tech mt-0.5">
              AI SMART WHEELCHAIR & TELEMETRY DASHBOARD
            </p>
          </div>

          {/* ── TAB SWITCHER: SIGN IN / REGISTER ──────────────────────── */}
          <div className="flex p-1 rounded-2xl bg-slate-100 border border-slate-200 mb-5">
            <button
              onClick={() => {
                setActiveTab("login");
                setErrorMessage(null);
                setPendingNotice(null);
              }}
              className={`flex-1 py-2 text-xs font-tech font-bold uppercase tracking-wider rounded-xl transition-all ${
                activeTab === "login"
                  ? "bg-white text-blue-600 shadow-md shadow-slate-200 font-extrabold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign In
            </button>

            <button
              onClick={() => {
                setActiveTab("register");
                setErrorMessage(null);
                setPendingNotice(null);
              }}
              className={`flex-1 py-2 text-xs font-tech font-bold uppercase tracking-wider rounded-xl transition-all ${
                activeTab === "register"
                  ? "bg-white text-blue-600 shadow-md shadow-slate-200 font-extrabold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Register
            </button>
          </div>

          {/* ── NOTIFICATIONS & ALERTS ─────────────────────────────────── */}
          {successMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono-tech animate-fade-up">
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 text-base">✓</span>
                <div>
                  <strong className="block font-bold font-tech text-sm text-emerald-900">
                    Registration Submitted
                  </strong>
                  <span>{successMessage}</span>
                </div>
              </div>
            </div>
          )}

          {pendingNotice && (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-mono-tech animate-fade-up">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 text-base">⏳</span>
                <div>
                  <strong className="block font-bold font-tech text-sm text-amber-950 uppercase tracking-wide">
                    Verification Pending
                  </strong>
                  <p className="mt-0.5 text-[11px] leading-relaxed">{pendingNotice}</p>
                  <p className="mt-2 text-[10px] text-amber-700 bg-amber-100/70 p-1.5 rounded-lg border border-amber-200">
                    ℹ Your account has been registered in the system. An administrator will review and verify your access.
                  </p>
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono-tech animate-fade-up flex items-start gap-2">
              <span className="text-red-500 text-base">✕</span>
              <div>
                <strong className="block font-bold font-tech text-sm">Authentication Error</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* ── PROGRESS SPINNER ───────────────────────────────────────── */}
          {isSubmitting ? (
            <div className="py-10 flex flex-col items-center gap-4 animate-fade-up">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-ping opacity-60" />
                <div className="w-12 h-12 rounded-full border-3 border-blue-600 border-t-transparent animate-radar" />
                <span className="text-blue-600 font-mono-tech text-xs font-bold">🔒</span>
              </div>
              <div className="text-center">
                <span className="text-sm font-bold font-tech text-slate-900 tracking-wide block">
                  SYNCHRONIZING ACCESS
                </span>
                <span className="text-xs text-blue-600 font-mono-tech animate-pulse">{stepMessage}</span>
              </div>
            </div>
          ) : (
            <>
              {/* ── TAB 1: SIGN IN ──────────────────────────────────────── */}
              {activeTab === "login" && (
                <form onSubmit={handleLogin} className="flex flex-col gap-3.5 animate-fade-up">
                  <div>
                    <label className="text-[11px] font-tech font-bold uppercase text-slate-500 block mb-1">
                      Username / Email
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your username or email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono-tech text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-tech font-bold uppercase text-slate-500 block mb-1">
                      Passkey
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono-tech text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-tech font-bold uppercase text-slate-500 block mb-1">
                      Target Vehicle
                    </label>
                    <select
                      value={targetDevice}
                      onChange={(e) => setTargetDevice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono-tech text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                    >
                      <option>ESP32-S3-DevKitC-1 (192.168.4.1)</option>
                      <option>ESP32-WROOM-32 (Bluetooth BLE)</option>
                      <option>Local Serial (/dev/ttyUSB0)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-tech text-base font-extrabold tracking-wider shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    SIGN IN & CONNECT
                  </button>

                  <div className="pt-2 flex items-center justify-between text-xs font-tech text-slate-500">
                    <span>Don't have an account?</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("register")}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Register New Operator →
                    </button>
                  </div>
                </form>
              )}

              {/* ── TAB 2: REGISTER NEW OPERATOR ────────────────────────── */}
              {activeTab === "register" && (
                <form onSubmit={handleRegister} className="flex flex-col gap-3 animate-fade-up">
                  <div>
                    <label className="text-[11px] font-tech font-bold uppercase text-slate-500 block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono-tech text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-tech font-bold uppercase text-slate-500 block mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        placeholder="john_robot"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono-tech text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-tech font-bold uppercase text-slate-500 block mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="john@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono-tech text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-tech font-bold uppercase text-slate-500 block mb-1">
                        Passkey
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono-tech text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-tech font-bold uppercase text-slate-500 block mb-1">
                        Confirm Passkey
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono-tech text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono-tech text-slate-500">
                    ℹ <strong className="text-slate-700">Verification Policy:</strong> New accounts are registered in <strong>PENDING</strong> status and require administrator authorization before vehicle control is granted.
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-tech text-sm font-extrabold tracking-wider shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    CREATE OPERATOR ACCOUNT
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* ── FOOTER: DETECTED CLIENT METADATA ────────────────────────── */}
        <div className="mt-4 p-3 rounded-2xl bg-white/70 border border-slate-200/80 shadow-sm text-center font-mono-tech text-[11px] text-slate-500 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>
              Client IP: <strong className="text-slate-700">{clientIp}</strong>
            </span>
          </div>
          <span className="text-[10px] text-slate-400 truncate max-w-xs">{deviceSummary}</span>
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-400 font-mono-tech mt-4">
        SynthBot Security Core v2.5 · Supabase Powered
      </div>

      <SupabaseConfigModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} />
    </div>
  );
}
