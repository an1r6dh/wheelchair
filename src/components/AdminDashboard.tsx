import React, { useState, useEffect } from "react";
import { supabaseService, AppUser, AccessLog, UserStatus } from "../services/supabaseService";
import SupabaseConfigModal from "./SupabaseConfigModal";

interface AdminDashboardProps {
  currentUser: AppUser;
  onLaunchRobotControl: () => void;
  onLogout: () => void;
}

export default function AdminDashboard({
  currentUser,
  onLaunchRobotControl,
  onLogout,
}: AdminDashboardProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "logs">("users");
  const [userFilter, setUserFilter] = useState<"all" | "pending" | "verified" | "rejected">("all");
  const [logFilter, setLogFilter] = useState<"all" | "SUCCESS" | "BLOCKED" | "ADMIN">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [fetchedUsers, fetchedLogs] = await Promise.all([
      supabaseService.getAllUsers(),
      supabaseService.getAccessLogs(),
    ]);
    setUsers(fetchedUsers);
    setLogs(fetchedLogs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      supabaseService.getAllUsers().then(setUsers);
      supabaseService.getAccessLogs().then(setLogs);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (userId: string, status: UserStatus, name: string) => {
    await supabaseService.updateUserStatus(userId, status);
    const updatedUsers = await supabaseService.getAllUsers();
    const updatedLogs = await supabaseService.getAccessLogs();
    setUsers(updatedUsers);
    setLogs(updatedLogs);
    setActionSuccessMessage(`User "${name}" status updated to ${status.toUpperCase()}`);
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${name}"?`)) return;
    const ok = await supabaseService.deleteUser(userId);
    if (ok) {
      const updatedUsers = await supabaseService.getAllUsers();
      setUsers(updatedUsers);
      setActionSuccessMessage(`User "${name}" was deleted successfully.`);
      setTimeout(() => setActionSuccessMessage(null), 3000);
    }
  };

  const pendingCount = users.filter((u) => u.status === "pending").length;
  const verifiedCount = users.filter((u) => u.status === "verified").length;
  const totalCount = users.length;

  const filteredUsers = users.filter((u) => {
    if (userFilter !== "all" && u.status !== userFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.registrationIp && u.registrationIp.includes(q)) ||
        (u.lastLoginIp && u.lastLoginIp.includes(q))
      );
    }
    return true;
  });

  const filteredLogs = logs.filter((l) => {
    if (logFilter === "SUCCESS" && l.status !== "LOGIN_SUCCESS") return false;
    if (logFilter === "BLOCKED" && !l.status.startsWith("BLOCKED")) return false;
    if (logFilter === "ADMIN" && l.status !== "ADMIN_LOGIN") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (l.fullName && l.fullName.toLowerCase().includes(q)) ||
        l.username.toLowerCase().includes(q) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        l.ipAddress.toLowerCase().includes(q) ||
        l.deviceInfo.toLowerCase().includes(q) ||
        l.actionDescription.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const config = supabaseService.getConfig();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* ── TOP ADMIN SECURITY HEADER ───────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-slate-950/90 border-b border-slate-800 backdrop-blur-md px-4 py-3 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-sky-400/40 p-1 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/25">
              <img src="/favicon.svg" alt="Wheelchair Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-tech font-extrabold text-lg tracking-wider text-white">
                  WHEELCHAIR SECURITY COMMAND
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-[10px] font-mono-tech text-indigo-300 font-bold uppercase">
                  SUPER ADMIN
                </span>
              </div>
              <span className="text-[11px] font-mono-tech text-slate-400">
                Operator Verification & Access Audit Center · Logged in as:{" "}
                <strong className="text-indigo-400">@{currentUser.username}</strong>
              </span>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 font-tech text-xs">
            <button
              onClick={() => setShowConfigModal(true)}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                config.isConfigured
                  ? "bg-emerald-950/60 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60"
                  : "bg-amber-950/60 border-amber-700/60 text-amber-300 hover:bg-amber-900/60"
              }`}
              title="Configure Supabase Database"
            >
              <span className={`w-2 h-2 rounded-full ${config.isConfigured ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span>{config.isConfigured ? "Supabase Connected" : "Local Database"}</span>
            </button>

            <button
              onClick={onLaunchRobotControl}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wider shadow-md shadow-blue-600/30 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>🤖 ROBOT CONTROL</span>
            </button>

            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950 hover:text-red-400 border border-slate-700 text-slate-300 transition-all font-bold"
            >
              SIGN OUT
            </button>
          </div>
        </div>
      </header>

      {/* ── ACTION NOTIFICATION ─────────────────────────────────────── */}
      {actionSuccessMessage && (
        <div className="bg-emerald-600 text-white text-center py-2 px-4 font-mono-tech text-xs font-bold animate-fade-up">
          ✓ {actionSuccessMessage}
        </div>
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto w-full p-4 md:p-6 flex-1 flex flex-col gap-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 font-mono-tech">
          {/* Card 1: Total Users */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-md">
            <span className="text-[11px] text-slate-400 uppercase font-semibold font-tech block">Total Registered</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold text-white">{totalCount}</span>
              <span className="text-xs text-slate-400 font-tech">ACCOUNTS</span>
            </div>
          </div>

          {/* Card 2: Verified Users */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-emerald-900/50 shadow-md">
            <span className="text-[11px] text-emerald-400 uppercase font-semibold font-tech block">Verified Operators</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold text-emerald-400">{verifiedCount}</span>
              <span className="text-xs text-emerald-500/80 font-tech">AUTHORIZED</span>
            </div>
          </div>

          {/* Card 3: Pending Verifications */}
          <div
            onClick={() => {
              setActiveTab("users");
              setUserFilter("pending");
            }}
            className={`p-4 rounded-2xl border shadow-md cursor-pointer transition-all ${
              pendingCount > 0
                ? "bg-amber-950/40 border-amber-600/70 hover:bg-amber-950/60"
                : "bg-slate-800/80 border-slate-700/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-amber-400 uppercase font-semibold font-tech block">Pending Verification</span>
              {pendingCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />}
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold text-amber-400">{pendingCount}</span>
              <span className="text-xs text-amber-500/80 font-tech">REQUIRES APPROVAL</span>
            </div>
          </div>

          {/* Card 4: Total Logs */}
          <div
            onClick={() => setActiveTab("logs")}
            className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-md cursor-pointer hover:bg-slate-800 transition-all"
          >
            <span className="text-[11px] text-blue-400 uppercase font-semibold font-tech block">Audit & IP Logs</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold text-blue-400">{logs.length}</span>
              <span className="text-xs text-blue-400/80 font-tech">ENTRIES</span>
            </div>
          </div>
        </div>

        {/* ── TABS & SEARCH BAR ─────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-950 border border-slate-800 max-w-sm">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex-1 py-2 px-4 rounded-xl text-xs font-tech font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === "users"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>OPERATOR DIRECTORY</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-mono-tech font-extrabold">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("logs")}
              className={`flex-1 py-2 px-4 rounded-xl text-xs font-tech font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === "logs"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>ACCESS & IP AUDIT LOGS</span>
              <span className="text-[10px] font-mono-tech opacity-70">({logs.length})</span>
            </button>
          </div>

          {/* Search Input & Filters */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 md:w-72">
              <input
                type="text"
                placeholder={`Search ${activeTab === "users" ? "operators, emails, IPs..." : "logs, actions, IPs..."}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2 pl-9 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono-tech focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 placeholder:text-slate-500"
              />
              <span className="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
            </div>

            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-mono-tech"
              title="Refresh Data"
            >
              🔄
            </button>
          </div>
        </div>

        {/* ── TAB 1: USERS DIRECTORY & VERIFICATION CONTROL ─────────── */}
        {activeTab === "users" && (
          <div className="flex flex-col gap-3">
            {/* Filter pills */}
            <div className="flex items-center gap-2 font-tech text-xs">
              <span className="text-slate-400 text-[11px] uppercase font-bold mr-1">Status Filter:</span>
              {(["all", "pending", "verified", "rejected"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setUserFilter(filter)}
                  className={`px-3 py-1 rounded-xl uppercase font-bold transition-all ${
                    userFilter === filter
                      ? "bg-slate-700 text-white border border-slate-500 shadow-sm"
                      : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {filter} {filter === "pending" && pendingCount > 0 ? `(${pendingCount})` : ""}
                </button>
              ))}
            </div>

            {/* Users Table */}
            <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono-tech text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-tech uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Operator Identity</th>
                      <th className="p-3.5">Email & Credentials</th>
                      <th className="p-3.5">IP & Device Metadata</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 font-mono-tech">
                          No operators match the selected criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                          {/* Identity */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white font-tech ${
                                  u.role === "admin"
                                    ? "bg-gradient-to-tr from-amber-500 to-indigo-600"
                                    : u.status === "verified"
                                    ? "bg-emerald-600"
                                    : "bg-slate-700"
                                }`}
                              >
                                {u.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-slate-100 block text-sm font-sans">
                                  {u.fullName}
                                </span>
                                <span className="text-slate-400 text-[11px]">@{u.username}</span>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="p-3.5">
                            <span className="text-slate-300 block">{u.email}</span>
                            <span className="text-[10px] text-slate-500 font-tech uppercase font-bold">
                              Role: <strong className={u.role === "admin" ? "text-amber-400" : "text-blue-400"}>{u.role}</strong>
                            </span>
                          </td>

                          {/* IP & Device */}
                          <td className="p-3.5">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-500 uppercase">Reg IP:</span>
                                <span className="text-slate-300 font-semibold">{u.registrationIp || "127.0.0.1"}</span>
                              </div>
                              {u.lastLoginIp && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-500 uppercase">Last IP:</span>
                                  <span className="text-blue-400">{u.lastLoginIp}</span>
                                </div>
                              )}
                              <span className="text-[10px] text-slate-500 truncate max-w-[200px]">
                                {u.deviceInfo || "Desktop Browser"}
                              </span>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="p-3.5">
                            {u.status === "verified" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-600/60 text-emerald-400 text-[11px] font-bold">
                                <span>🛡</span> VERIFIED
                              </span>
                            ) : u.status === "pending" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-600/60 text-amber-400 text-[11px] font-bold animate-pulse">
                                <span>⏳</span> PENDING
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-950/80 border border-red-600/60 text-red-400 text-[11px] font-bold">
                                <span>🚫</span> REJECTED
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right">
                            {u.username === "godhasmorepower" ? (
                              <span className="text-amber-400 font-tech font-bold text-xs uppercase">
                                Super Administrator
                              </span>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5 font-tech">
                                {u.status !== "verified" && (
                                  <button
                                    onClick={() => handleStatusChange(u.id, "verified", u.fullName)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all active:scale-95 flex items-center gap-1"
                                    title="Approve and Verify Operator"
                                  >
                                    <span>✓</span> VERIFY
                                  </button>
                                )}

                                {u.status !== "rejected" && (
                                  <button
                                    onClick={() => handleStatusChange(u.id, "rejected", u.fullName)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-900/70 text-amber-300 hover:text-amber-200 border border-slate-700 text-xs font-bold transition-all active:scale-95"
                                    title="Revoke / Suspend Access"
                                  >
                                    REVOKE
                                  </button>
                                )}

                                <button
                                  onClick={() => handleDeleteUser(u.id, u.fullName)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 border border-slate-700 transition-all text-xs"
                                  title="Delete User"
                                >
                                  🗑
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: LIVE ACCESS & IP AUDIT LOGS ────────────────────── */}
        {activeTab === "logs" && (
          <div className="flex flex-col gap-3">
            {/* Filter pills */}
            <div className="flex items-center gap-2 font-tech text-xs">
              <span className="text-slate-400 text-[11px] uppercase font-bold mr-1">Log Filter:</span>
              {(["all", "SUCCESS", "BLOCKED", "ADMIN"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setLogFilter(filter)}
                  className={`px-3 py-1 rounded-xl uppercase font-bold transition-all ${
                    logFilter === filter
                      ? "bg-slate-700 text-white border border-slate-500 shadow-sm"
                      : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Logs List */}
            <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono-tech text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-tech uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5">Operator Identity</th>
                      <th className="p-3.5">Client IP Address</th>
                      <th className="p-3.5">Device / Platform</th>
                      <th className="p-3.5">Audit Status & Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 font-mono-tech">
                          No audit records found.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((l) => {
                        const dateStr = new Date(l.createdAt).toLocaleString();
                        const isSuccess = l.status === "LOGIN_SUCCESS" || l.status === "ADMIN_LOGIN";
                        const isBlocked = l.status.startsWith("BLOCKED");

                        return (
                          <tr key={l.id} className="hover:bg-slate-900/50 transition-colors">
                            {/* Timestamp */}
                            <td className="p-3.5 text-slate-400 whitespace-nowrap">{dateStr}</td>

                            {/* User */}
                            <td className="p-3.5">
                              <span className="font-bold text-slate-100 block">{l.fullName || l.username}</span>
                              <span className="text-slate-500 text-[10px]">@{l.username}</span>
                            </td>

                            {/* IP */}
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-blue-400 font-bold">
                                {l.ipAddress}
                              </span>
                            </td>

                            {/* Device */}
                            <td className="p-3.5 text-slate-400 text-[11px] truncate max-w-[180px]">
                              {l.deviceInfo}
                            </td>

                            {/* Status */}
                            <td className="p-3.5">
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${
                                    isSuccess
                                      ? "bg-emerald-950/80 border border-emerald-600/60 text-emerald-400"
                                      : isBlocked
                                      ? "bg-red-950/80 border border-red-600/60 text-red-400 animate-pulse"
                                      : "bg-amber-950/80 border border-amber-600/60 text-amber-400"
                                  }`}
                                >
                                  {l.status}
                                </span>
                                <span className="text-[10px] text-slate-400">{l.actionDescription}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <SupabaseConfigModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} />
    </div>
  );
}
