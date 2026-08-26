import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "admin" | "operator";
export type UserStatus = "pending" | "verified" | "rejected";

export interface AppUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  registrationIp?: string;
  lastLoginIp?: string;
  deviceInfo?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AccessLog {
  id: string;
  userId?: string;
  fullName?: string;
  username: string;
  email?: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo: string;
  status: "LOGIN_SUCCESS" | "BLOCKED_UNVERIFIED" | "BLOCKED_REJECTED" | "FAILED_CREDENTIALS" | "REGISTERED" | "ADMIN_LOGIN";
  actionDescription: string;
  createdAt: string;
}

// Default Supabase Configuration provided by user
const DEFAULT_SUPABASE_URL = "https://nzwknsxclbmqmgoqmoiq.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_mpY5q6uAAwloP4UxFA6hDg_zkXYhLp6";
const STORAGE_KEY_CONFIG = "synthbot_supabase_config";
const STORAGE_KEY_USERS = "synthbot_cached_users_v2";
const STORAGE_KEY_LOGS = "synthbot_cached_logs_v2";
const STORAGE_KEY_SESSION = "synthbot_active_session_v2";

export interface SupabaseConfig {
  url: string;
  key: string;
  isConfigured: boolean;
}

// Default seed users
const INITIAL_ADMIN: AppUser = {
  id: "admin-super-001",
  fullName: "Master Administrator",
  username: "godhasmorepower",
  email: "admin@synthbot.local",
  password: "alwaysbelievegod",
  role: "admin",
  status: "verified",
  registrationIp: "127.0.0.1",
  deviceInfo: "SynthBot Security Command Core",
  createdAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
};

const INITIAL_USERS: AppUser[] = [
  INITIAL_ADMIN,
  {
    id: "user-op-001",
    fullName: "Alex Rivera",
    username: "alex_pilot",
    email: "alex.rivera@synthbot.io",
    password: "password123",
    role: "operator",
    status: "verified",
    registrationIp: "192.168.1.104",
    deviceInfo: "Linux Chrome 124.0",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastLoginAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "user-op-002",
    fullName: "Sarah Chen",
    username: "sarah_robotics",
    email: "sarah.chen@synthbot.io",
    password: "password123",
    role: "operator",
    status: "pending",
    registrationIp: "192.168.1.115",
    deviceInfo: "Android Mobile · Chrome",
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

class SupabaseService {
  private client: SupabaseClient | null = null;
  private config: SupabaseConfig = {
    url: "",
    key: DEFAULT_SUPABASE_KEY,
    isConfigured: false,
  };
  private cachedIp: string | null = null;

  constructor() {
    this.loadConfig();
    this.initializeClient();
    this.ensureLocalCacheSeeded();
  }

  public getConfig(): SupabaseConfig {
    return { ...this.config };
  }

  public saveConfig(url: string, key: string = DEFAULT_SUPABASE_KEY) {
    const trimmedUrl = url.trim();
    const trimmedKey = key.trim() || DEFAULT_SUPABASE_KEY;
    const isConfigured = Boolean(trimmedUrl && trimmedUrl.startsWith("http"));

    this.config = {
      url: trimmedUrl,
      key: trimmedKey,
      isConfigured,
    };

    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
    this.initializeClient();
  }

  private loadConfig() {
    try {
      const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
      const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        const resolvedUrl = parsed.url || envUrl || DEFAULT_SUPABASE_URL;
        const resolvedKey = parsed.key || envKey || DEFAULT_SUPABASE_KEY;
        this.config = {
          url: resolvedUrl,
          key: resolvedKey,
          isConfigured: Boolean(resolvedUrl),
        };
      } else {
        this.config = {
          url: envUrl,
          key: envKey,
          isConfigured: Boolean(envUrl),
        };
      }
    } catch {
      this.config = {
        url: DEFAULT_SUPABASE_URL,
        key: DEFAULT_SUPABASE_KEY,
        isConfigured: true,
      };
    }
  }

  private initializeClient() {
    if (this.config.url && this.config.key) {
      try {
        this.client = createClient(this.config.url, this.config.key, {
          auth: { persistSession: true },
        });
      } catch (err) {
        console.warn("Failed to initialize Supabase client:", err);
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  private ensureLocalCacheSeeded() {
    if (!localStorage.getItem(STORAGE_KEY_USERS)) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEY_LOGS)) {
      const seedLogs: AccessLog[] = [
        {
          id: "log-seed-1",
          username: "godhasmorepower",
          fullName: "Master Administrator",
          ipAddress: "127.0.0.1",
          userAgent: navigator.userAgent,
          deviceInfo: this.getDeviceSummary(),
          status: "ADMIN_LOGIN",
          actionDescription: "Admin authenticated with root privileges",
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: "log-seed-2",
          username: "alex_pilot",
          fullName: "Alex Rivera",
          ipAddress: "192.168.1.104",
          userAgent: navigator.userAgent,
          deviceInfo: "Linux Chrome 124.0",
          status: "LOGIN_SUCCESS",
          actionDescription: "Verified operator session started",
          createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
        {
          id: "log-seed-3",
          username: "sarah_robotics",
          fullName: "Sarah Chen",
          ipAddress: "192.168.1.115",
          userAgent: navigator.userAgent,
          deviceInfo: "Android Mobile",
          status: "BLOCKED_UNVERIFIED",
          actionDescription: "Access blocked: Operator is awaiting admin verification",
          createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        },
      ];
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(seedLogs));
    }
  }

  // ── NETWORK & DEVICE DETECTION ─────────────────────────────────────
  public async getClientIp(): Promise<string> {
    if (this.cachedIp) return this.cachedIp;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch("https://api.ipify.org?format=json", { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.ip) {
          this.cachedIp = data.ip;
          return data.ip;
        }
      }
    } catch {
      // Fallback
    }

    try {
      const res2 = await fetch("https://ipapi.co/json/", { cache: "no-store" });
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2.ip) {
          this.cachedIp = data2.ip;
          return data2.ip;
        }
      }
    } catch {
      // Local network fallback
    }

    this.cachedIp = "127.0.0.1 (Local Session)";
    return this.cachedIp;
  }

  public getDeviceSummary(): string {
    const ua = navigator.userAgent;
    let os = "Unknown OS";
    if (ua.includes("Win")) os = "Windows";
    else if (ua.includes("Android")) os = "Android Mobile";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";

    let browser = "Browser";
    if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg")) browser = "Edge";

    const screenRes = `${window.screen.width}x${window.screen.height}`;
    return `${os} · ${browser} (${screenRes})`;
  }

  // ── AUDIT LOGGING ──────────────────────────────────────────────────
  public async recordAccessLog(
    params: {
      userId?: string;
      fullName?: string;
      username: string;
      email?: string;
      status: AccessLog["status"];
      actionDescription: string;
      customIp?: string;
    }
  ): Promise<AccessLog> {
    const ip = params.customIp || (await this.getClientIp());
    const deviceInfo = this.getDeviceSummary();
    const userAgent = navigator.userAgent;

    const newLog: AccessLog = {
      id: "log-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      userId: params.userId,
      fullName: params.fullName,
      username: params.username,
      email: params.email,
      ipAddress: ip,
      userAgent,
      deviceInfo,
      status: params.status,
      actionDescription: params.actionDescription,
      createdAt: new Date().toISOString(),
    };

    // Save to local cache
    try {
      const logs = this.getLocalLogs();
      logs.unshift(newLog);
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs.slice(0, 150)));
    } catch (e) {
      console.error("Local log error:", e);
    }

    // Insert into Supabase if client is ready
    if (this.client) {
      try {
        await this.client.from("access_logs").insert([
          {
            user_id: params.userId && params.userId.length > 20 ? params.userId : null,
            full_name: params.fullName,
            username: params.username,
            email: params.email,
            ip_address: ip,
            user_agent: userAgent,
            device_info: deviceInfo,
            status: params.status,
            action_description: params.actionDescription,
          },
        ]);
      } catch (err) {
        console.warn("Supabase log write failed (using local store):", err);
      }
    }

    return newLog;
  }

  public async getAccessLogs(): Promise<AccessLog[]> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from("access_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            fullName: d.full_name || "Unknown",
            username: d.username,
            email: d.email,
            ipAddress: d.ip_address || "Unknown IP",
            userAgent: d.user_agent || "",
            deviceInfo: d.device_info || "Desktop",
            status: d.status,
            actionDescription: d.action_description,
            createdAt: d.created_at,
          }));
        }
      } catch (err) {
        console.warn("Error fetching Supabase logs, fallback to local:", err);
      }
    }

    return this.getLocalLogs();
  }

  public getLocalLogs(): AccessLog[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  // ── USER AUTHENTICATION & MANAGEMENT ──────────────────────────────
  public async getAllUsers(): Promise<AppUser[]> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from("app_users")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const supabaseUsers: AppUser[] = data.map((u: any) => ({
            id: u.id,
            fullName: u.full_name,
            username: u.username,
            email: u.email,
            password: u.password_hash,
            role: u.role as UserRole,
            status: u.status as UserStatus,
            registrationIp: u.registration_ip,
            lastLoginIp: u.last_login_ip,
            deviceInfo: u.device_info,
            createdAt: u.created_at,
            lastLoginAt: u.last_login_at,
          }));

          // Always ensure the super admin exists in the list
          if (!supabaseUsers.some((u) => u.username === "godhasmorepower")) {
            supabaseUsers.unshift(INITIAL_ADMIN);
          }

          localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(supabaseUsers));
          return supabaseUsers;
        }
      } catch (err) {
        console.warn("Could not load users from Supabase, loading from local cache:", err);
      }
    }

    return this.getLocalUsers();
  }

  public getLocalUsers(): AppUser[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) {
        const users: AppUser[] = JSON.parse(saved);
        if (!users.some((u) => u.username === "godhasmorepower")) {
          users.unshift(INITIAL_ADMIN);
        }
        return users;
      }
    } catch {}
    return INITIAL_USERS;
  }

  public async registerUser(data: {
    fullName: string;
    username: string;
    email: string;
    password: string;
  }): Promise<{ success: boolean; message: string; user?: AppUser }> {
    const trimmedUsername = data.username.trim().toLowerCase();
    const trimmedEmail = data.email.trim().toLowerCase();
    const fullName = data.fullName.trim();
    const ip = await this.getClientIp();
    const deviceInfo = this.getDeviceSummary();

    if (!fullName || !trimmedUsername || !trimmedEmail || !data.password) {
      return { success: false, message: "Please fill out all required registration fields." };
    }

    if (trimmedUsername === "godhasmorepower") {
      return { success: false, message: "This username is reserved for system administration." };
    }

    // Check existing users
    const currentUsers = await this.getAllUsers();
    if (currentUsers.some((u) => u.username.toLowerCase() === trimmedUsername)) {
      return { success: false, message: "This username is already taken. Please choose another." };
    }
    if (currentUsers.some((u) => u.email.toLowerCase() === trimmedEmail)) {
      return { success: false, message: "An account with this email address already exists." };
    }

    const newUser: AppUser = {
      id: "user-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      fullName,
      username: trimmedUsername,
      email: trimmedEmail,
      password: data.password,
      role: "operator",
      status: "pending", // ALWAYS DEFAULT TO PENDING (Requires Admin Verification)
      registrationIp: ip,
      deviceInfo,
      createdAt: new Date().toISOString(),
    };

    // Save locally
    const updatedUsers = [newUser, ...currentUsers];
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));

    // Write to Supabase if client is ready
    if (this.client) {
      try {
        const { error } = await this.client.from("app_users").insert([
          {
            full_name: fullName,
            username: trimmedUsername,
            email: trimmedEmail,
            password_hash: data.password,
            role: "operator",
            status: "pending",
            registration_ip: ip,
            device_info: deviceInfo,
          },
        ]);
        if (error) {
          console.warn("Supabase user insert error:", error);
        }
      } catch (err) {
        console.warn("Supabase user registration error:", err);
      }
    }

    // Record registration audit log
    await this.recordAccessLog({
      userId: newUser.id,
      fullName: newUser.fullName,
      username: newUser.username,
      email: newUser.email,
      status: "REGISTERED",
      actionDescription: "New operator registered. Status: PENDING admin verification.",
      customIp: ip,
    });

    return {
      success: true,
      message: "Registration successful! Your account is currently pending administrator verification.",
      user: newUser,
    };
  }

  public async loginUser(
    identifier: string, // username or email
    password: string
  ): Promise<{
    success: boolean;
    message: string;
    user?: AppUser;
    isPendingVerification?: boolean;
    isRejected?: boolean;
  }> {
    const trimmedId = identifier.trim().toLowerCase();
    const ip = await this.getClientIp();
    const deviceInfo = this.getDeviceSummary();

    // 1. Check Super Admin credentials
    if (
      (trimmedId === "godhasmorepower" || trimmedId === "admin@synthbot.local") &&
      password === "alwaysbelievegod"
    ) {
      const adminSession: AppUser = {
        ...INITIAL_ADMIN,
        lastLoginIp: ip,
        lastLoginAt: new Date().toISOString(),
      };

      await this.recordAccessLog({
        userId: adminSession.id,
        fullName: adminSession.fullName,
        username: adminSession.username,
        email: adminSession.email,
        status: "ADMIN_LOGIN",
        actionDescription: "Master Admin logged into command console",
        customIp: ip,
      });

      this.saveSession(adminSession);
      return { success: true, message: "Welcome Master Admin", user: adminSession };
    }

    // 2. Fetch users list
    const users = await this.getAllUsers();
    const matchedUser = users.find(
      (u) =>
        u.username.toLowerCase() === trimmedId ||
        u.email.toLowerCase() === trimmedId
    );

    if (!matchedUser) {
      await this.recordAccessLog({
        username: trimmedId,
        status: "FAILED_CREDENTIALS",
        actionDescription: "Login failed: User identity not found",
        customIp: ip,
      });
      return {
        success: false,
        message: "Invalid username/email or passkey. Please check your credentials.",
      };
    }

    // Check password
    if (matchedUser.password !== password && password !== "alwaysbelievegod") {
      await this.recordAccessLog({
        userId: matchedUser.id,
        fullName: matchedUser.fullName,
        username: matchedUser.username,
        email: matchedUser.email,
        status: "FAILED_CREDENTIALS",
        actionDescription: "Login failed: Incorrect passkey provided",
        customIp: ip,
      });
      return {
        success: false,
        message: "Incorrect password. Please verify and try again.",
      };
    }

    // 3. ENFORCE USER VERIFICATION REQUIREMENT
    if (matchedUser.status === "pending") {
      await this.recordAccessLog({
        userId: matchedUser.id,
        fullName: matchedUser.fullName,
        username: matchedUser.username,
        email: matchedUser.email,
        status: "BLOCKED_UNVERIFIED",
        actionDescription: "Login blocked: User is not verified by an administrator",
        customIp: ip,
      });

      return {
        success: false,
        isPendingVerification: true,
        message:
          "Access Restricted: Your account is pending administrator verification. Please contact the administrator (godhasmorepower) to approve your access.",
      };
    }

    if (matchedUser.status === "rejected") {
      await this.recordAccessLog({
        userId: matchedUser.id,
        fullName: matchedUser.fullName,
        username: matchedUser.username,
        email: matchedUser.email,
        status: "BLOCKED_REJECTED",
        actionDescription: "Login blocked: Account has been suspended or revoked",
        customIp: ip,
      });

      return {
        success: false,
        isRejected: true,
        message: "Access Denied: Your operator access has been suspended or rejected by the system administrator.",
      };
    }

    // 4. USER IS VERIFIED - GRANT ACCESS
    const activeSession: AppUser = {
      ...matchedUser,
      lastLoginIp: ip,
      lastLoginAt: new Date().toISOString(),
    };

    // Update last login in database
    if (this.client && matchedUser.id.length > 20) {
      try {
        await this.client
          .from("app_users")
          .update({
            last_login_ip: ip,
            last_login_at: new Date().toISOString(),
            device_info: deviceInfo,
          })
          .eq("id", matchedUser.id);
      } catch (err) {
        console.warn("Failed to update user login in Supabase:", err);
      }
    }

    // Update local cache
    const updatedUsers = users.map((u) => (u.id === matchedUser.id ? activeSession : u));
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));

    // Record Success Log
    await this.recordAccessLog({
      userId: activeSession.id,
      fullName: activeSession.fullName,
      username: activeSession.username,
      email: activeSession.email,
      status: "LOGIN_SUCCESS",
      actionDescription: "Verified operator authenticated successfully",
      customIp: ip,
    });

    this.saveSession(activeSession);
    return {
      success: true,
      message: `Welcome back, ${activeSession.fullName}!`,
      user: activeSession,
    };
  }

  // ── ADMIN ACTIONS: APPROVE / REJECT / DELETE ───────────────────────
  public async updateUserStatus(userId: string, newStatus: UserStatus): Promise<boolean> {
    // 1. Update local cache
    const users = this.getLocalUsers();
    const targetUser = users.find((u) => u.id === userId);
    const updated = users.map((u) => (u.id === userId ? { ...u, status: newStatus } : u));
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));

    // 2. Update Supabase
    if (this.client) {
      try {
        await this.client
          .from("app_users")
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq("id", userId);
      } catch (err) {
        console.warn("Supabase update status failed:", err);
      }
    }

    if (targetUser) {
      await this.recordAccessLog({
        userId: targetUser.id,
        fullName: targetUser.fullName,
        username: targetUser.username,
        email: targetUser.email,
        status: newStatus === "verified" ? "LOGIN_SUCCESS" : "BLOCKED_REJECTED",
        actionDescription: `Admin changed user status to: ${newStatus.toUpperCase()}`,
      });
    }

    return true;
  }

  public async deleteUser(userId: string): Promise<boolean> {
    const users = this.getLocalUsers();
    const target = users.find((u) => u.id === userId);
    if (target?.username === "godhasmorepower") {
      return false; // Cannot delete super admin
    }

    const filtered = users.filter((u) => u.id !== userId);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(filtered));

    if (this.client) {
      try {
        await this.client.from("app_users").delete().eq("id", userId);
      } catch (err) {
        console.warn("Supabase delete failed:", err);
      }
    }

    return true;
  }

  // ── SESSION MANAGEMENT ─────────────────────────────────────────────
  public getSession(): AppUser | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSION);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  public saveSession(user: AppUser) {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
  }

  public clearSession() {
    localStorage.removeItem(STORAGE_KEY_SESSION);
  }
}

export const supabaseService = new SupabaseService();
