-- ==============================================================================
-- SYNTHBOT ROBOTICS: SUPABASE DATABASE SCHEMA & ACCESS CONTROL
-- Run this script in your Supabase Project -> SQL Editor to initialize tables,
-- RLS policies, and default Admin account.
-- ==============================================================================

-- 1. Create table for registered App Users & Operators
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

-- 2. Create table for Activity & Access Audit Logs
CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
    full_name TEXT,
    username TEXT,
    email TEXT,
    ip_address TEXT,
    user_agent TEXT,
    device_info TEXT,
    status TEXT NOT NULL, -- 'LOGIN_SUCCESS', 'BLOCKED_UNVERIFIED', 'FAILED_CREDENTIALS', 'REGISTERED', 'ADMIN_LOGIN'
    action_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for high-speed queries and security auditing
CREATE INDEX IF NOT EXISTS idx_app_users_username ON public.app_users(username);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON public.app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_status ON public.app_users(status);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON public.access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_ip ON public.access_logs(ip_address);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies allowing full read/write from the app client
-- (Drop existing policies if any to prevent conflicts)
DROP POLICY IF EXISTS "Allow anon read users" ON public.app_users;
DROP POLICY IF EXISTS "Allow anon insert users" ON public.app_users;
DROP POLICY IF EXISTS "Allow anon update users" ON public.app_users;
DROP POLICY IF EXISTS "Allow anon delete users" ON public.app_users;

CREATE POLICY "Allow anon read users" ON public.app_users FOR SELECT USING (true);
CREATE POLICY "Allow anon insert users" ON public.app_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update users" ON public.app_users FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete users" ON public.app_users FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow anon read logs" ON public.access_logs;
DROP POLICY IF EXISTS "Allow anon insert logs" ON public.access_logs;
DROP POLICY IF EXISTS "Allow anon delete logs" ON public.access_logs;

CREATE POLICY "Allow anon read logs" ON public.access_logs FOR SELECT USING (true);
CREATE POLICY "Allow anon insert logs" ON public.access_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon delete logs" ON public.access_logs FOR DELETE USING (true);

-- 6. Insert Default Super Admin: godhasmorepower
INSERT INTO public.app_users (
    full_name,
    username,
    email,
    password_hash,
    role,
    status,
    registration_ip,
    device_info
) VALUES (
    'System Administrator',
    'godhasmorepower',
    'admin@synthbot.local',
    'alwaysbelievegod',
    'admin',
    'verified',
    '127.0.0.1',
    'SynthBot Super Admin Terminal'
)
ON CONFLICT (username) DO UPDATE
SET 
    role = 'admin',
    status = 'verified',
    password_hash = 'alwaysbelievegod';

-- 7. Insert Initial Demo Verified & Pending Operators for testing
INSERT INTO public.app_users (
    full_name,
    username,
    email,
    password_hash,
    role,
    status,
    registration_ip,
    device_info
) VALUES 
(
    'Alex Rivera',
    'alex_pilot',
    'alex@synthbot.io',
    'pilot123',
    'operator',
    'verified',
    '192.168.1.104',
    'Linux Chrome 124.0'
),
(
    'Sarah Chen',
    'sarah_robotics',
    'sarah@synthbot.io',
    'sarah123',
    'operator',
    'pending',
    '192.168.1.115',
    'Android Mobile Capacitor'
)
ON CONFLICT (username) DO NOTHING;

-- Verification query
SELECT id, full_name, username, role, status, created_at FROM public.app_users;
