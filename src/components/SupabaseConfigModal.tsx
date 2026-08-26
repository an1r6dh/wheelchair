import React, { useState } from "react";
import { supabaseService, SupabaseConfig } from "../services/supabaseService";

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupabaseConfigModal({ isOpen, onClose }: SupabaseConfigModalProps) {
  const [config, setConfig] = useState<SupabaseConfig>(supabaseService.getConfig());
  const [urlInput, setUrlInput] = useState(config.url);
  const [keyInput, setKeyInput] = useState(config.key);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    supabaseService.saveConfig(urlInput, keyInput);
    setConfig(supabaseService.getConfig());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleCopySql = () => {
    const sqlText = `-- SYNTHBOT ROBOTICS: SUPABASE DATABASE SCHEMA
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    registration_ip TEXT,
    last_login_ip TEXT,
    device_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
    full_name TEXT,
    username TEXT,
    email TEXT,
    ip_address TEXT,
    user_agent TEXT,
    device_info TEXT,
    status TEXT NOT NULL,
    action_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read users" ON public.app_users FOR SELECT USING (true);
CREATE POLICY "Allow anon insert users" ON public.app_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update users" ON public.app_users FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete users" ON public.app_users FOR DELETE USING (true);

CREATE POLICY "Allow anon read logs" ON public.access_logs FOR SELECT USING (true);
CREATE POLICY "Allow anon insert logs" ON public.access_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon delete logs" ON public.access_logs FOR DELETE USING (true);

INSERT INTO public.app_users (
    full_name, username, email, password_hash, role, status, registration_ip, device_info
) VALUES (
    'System Administrator', 'godhasmorepower', 'admin@synthbot.local', 'alwaysbelievegod', 'admin', 'verified', '127.0.0.1', 'SynthBot Admin Core'
) ON CONFLICT (username) DO UPDATE SET role = 'admin', status = 'verified';`;

    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-up">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.362 9.354H12V.3a.3.3 0 0 0-.535-.192L.272 13.913a.3.3 0 0 0 .227.487H12v9.3a.3.3 0 0 0 .535.192l11.193-13.8a.3.3 0 0 0-.366-.738z" />
              </svg>
            </div>
            <div>
              <h3 className="font-tech font-extrabold text-base text-slate-900 tracking-wider">
                SUPABASE DATABASE CONFIG
              </h3>
              <p className="text-[11px] font-mono-tech text-slate-500">
                User Authentication & Security Audit Store
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-all text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-4 text-xs font-mono-tech">
          {/* Status Badge */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              config.isConfigured
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  config.isConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <div>
                <span className="font-bold font-tech text-sm block">
                  {config.isConfigured ? "CONNECTED TO SUPABASE" : "RUNNING WITH LOCAL FALLBACK CACHE"}
                </span>
                <span className="text-[11px] opacity-80">
                  {config.isConfigured
                    ? "Live sync with remote PostgreSQL tables active"
                    : "Add your Supabase Project URL to enable remote cloud sync"}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-3.5">
            <div>
              <label className="text-[11px] font-tech font-bold uppercase text-slate-600 block mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                placeholder="https://your-project-id.supabase.co"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono-tech text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Found in Supabase Dashboard → Project Settings → API
              </span>
            </div>

            <div>
              <label className="text-[11px] font-tech font-bold uppercase text-slate-600 block mb-1">
                Publishable / Anon API Key
              </label>
              <input
                type="text"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono-tech text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {savedSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-tech font-bold text-center animate-scale-in">
                ✓ Configuration Saved Successfully!
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-tech font-bold text-sm tracking-wider shadow-md shadow-blue-500/20 active:scale-95 transition-all"
              >
                SAVE CREDENTIALS
              </button>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-tech font-bold text-xs tracking-wider active:scale-95 transition-all flex items-center gap-1.5"
              >
                {copiedSql ? "✓ COPIED" : "📋 COPY SQL SCHEMA"}
              </button>
            </div>
          </form>

          {/* Quick Setup Instructions */}
          <div className="mt-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600">
            <span className="font-tech font-bold text-slate-800 uppercase block mb-1">
              How to setup tables in Supabase:
            </span>
            <ol className="list-decimal list-inside space-y-1 text-slate-500">
              <li>Open your Supabase project dashboard at <strong className="text-slate-700">supabase.com</strong></li>
              <li>Click on <strong className="text-slate-700">SQL Editor</strong> on the left sidebar</li>
              <li>Click <strong className="text-slate-700">"📋 Copy SQL Schema"</strong> above and paste into SQL Editor</li>
              <li>Click <strong className="text-slate-700">Run</strong> to create <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">app_users</code> & <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">access_logs</code></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
