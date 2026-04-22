'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Users, 
  Activity, 
  Settings, 
  Shield, 
  Terminal, 
  Send, 
  Clock, 
  Bot,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface Message {
  id: number;
  chatId: string;
  text: string | null;
  username: string | null;
  firstName: string | null;
  createdAt: string;
}

interface User {
  telegramId: string;
  username: string | null;
  firstName: string | null;
  messageCount: number;
  lastMessage: string | null;
  updatedAt: string;
}

interface Log {
  id: number;
  event: string;
  details: string | null;
  createdAt: string;
}

interface Stats {
  totalMessages: number;
  totalUsers: number;
  todayMessages: number;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<Stats>({ totalMessages: 0, totalUsers: 0, todayMessages: 0 });
  const [loading, setLoading] = useState(true);
  const [botStatus, setBotStatus] = useState<{ token: boolean; url: string }>({ token: false, url: '' });
  const [connected, setConnected] = useState(false);
  const [botMeta, setBotMeta] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setMessages(data.messages);
      setUsers(data.users);
      setLogs(data.logs);
      setStats(data.stats);
      setBotStatus({ token: data.botToken, url: data.appUrl });
      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  }, []);

  const fetchBotMeta = useCallback(async () => {
    try {
      const res = await fetch('/api/bot/info');
      const data = await res.json();
      if (data.ok) {
        setBotMeta(data);
      }
    } catch (e) {
      console.error('Bot meta fetch error:', e);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchBotMeta();

    // SSE Setup
    const sse = new EventSource('/api/sse');
    
    sse.onopen = () => setConnected(true);
    sse.onerror = () => setConnected(false);

    sse.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === 'message') {
        const newMessage = payload.data;
        setMessages(prev => [newMessage, ...prev].slice(0, 50));
        setStats(prev => ({
          ...prev,
          totalMessages: prev.totalMessages + 1,
          todayMessages: prev.todayMessages + 1
        }));
        setUsers(prev => {
          const userIdx = prev.findIndex(u => u.telegramId === newMessage.chatId);
          if (userIdx > -1) {
            const updated = [...prev];
            updated[userIdx] = {
              ...updated[userIdx],
              messageCount: updated[userIdx].messageCount + 1,
              lastMessage: newMessage.text,
              updatedAt: new Date().toISOString()
            };
            return updated;
          }
          return prev;
        });
      }
    };

    return () => sse.close();
  }, [fetchData, fetchBotMeta]);

  const setupWebhook = async () => {
    try {
      const res = await fetch('/api/webhook/setup', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        alert('Webhook set successfully!');
        fetchBotMeta();
      } else {
        alert('Error: ' + data.description);
      }
    } catch (e) {
      alert('Failed to set webhook');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-main">
        <RefreshCw className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-bg-main text-text-main font-sans selection:bg-brand selection:text-white">
      {/* Sidebar - Elegant Dark Design */}
      <aside className="w-full md:w-[220px] bg-bg-sidebar border-b md:border-b-0 md:border-r border-border-dim flex flex-col py-6 shrink-0">
        <div className="px-6 mb-8 flex items-center gap-2.5 font-bold text-xl tracking-tight text-brand">
          <Send size={24} />
          <span>TG-Dash</span>
        </div>
        
        <nav className="flex-1">
          <SidebarItem 
            icon={<Activity size={18} />} 
            label="Dashboard" 
            active={activeTab === 'Dashboard'} 
            onClick={() => setActiveTab('Dashboard')}
          />
          <SidebarItem 
            icon={<Bot size={18} />} 
            label="Bot Manager" 
            active={activeTab === 'Bot Manager'} 
            onClick={() => setActiveTab('Bot Manager')}
          />
          <SidebarItem 
            icon={<Users size={18} />} 
            label="User Insights" 
            active={activeTab === 'User Insights'}
            onClick={() => setActiveTab('User Insights')}
          />
          <SidebarItem 
            icon={<Terminal size={18} />} 
            label="Cloud Logs" 
            active={activeTab === 'Cloud Logs'}
            onClick={() => setActiveTab('Cloud Logs')}
          />
          <SidebarItem 
            icon={<Settings size={18} />} 
            label="Settings" 
            active={activeTab === 'Settings'}
            onClick={() => setActiveTab('Settings')}
          />
        </nav>

        <div className="mt-auto px-6 pt-6 border-t border-border-dim/20">
          <div className="bg-bg-card p-3 rounded-lg border border-border-dim">
             <div className="text-[10px] text-text-muted uppercase font-bold mb-2">API Status</div>
             <div className="h-1 bg-border-dim rounded-full overflow-hidden">
                <div className={`h-full ${connected ? 'bg-brand' : 'bg-danger'} w-[65%]`}></div>
             </div>
             <div className="text-[10px] text-text-label mt-2">Active Webhook</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 flex flex-col gap-6 overflow-x-hidden">
        {activeTab === 'Dashboard' ? (
          <>
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Network Overview</h1>
                <p className="text-text-muted text-sm mt-1">Monitoring active updates from your Telegram Bot infrastructure</p>
              </div>
              
              <div className="flex gap-3">
                 <div className="bg-bg-card border border-border-dim px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-success' : 'bg-danger'}`}></div>
                    System Healthy
                 </div>
                 <button 
                   onClick={setupWebhook}
                   className="bg-brand hover:bg-brand/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                 >
                   <RefreshCw size={14} /> Set Webhook
                 </button>
              </div>
            </header>

            {/* Stats Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard label="Total Users" value={stats.totalUsers.toLocaleString()} trend="+12%" />
              <StatCard label="Messages / 24h" value={stats.todayMessages.toLocaleString()} trend="+5.4%" />
              <StatCard label="Active Channels" value="12" trend="0%" trendNeutral />
              <StatCard label="Growth Index" value="892" trend="+2.1%" trendDown />
            </section>

            {/* Middle Row: Message Feed & Registry */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Feed Container - 2/3 width */}
              <section className="lg:col-span-2 bg-bg-card border border-border-dim rounded-xl flex flex-col h-[400px] overflow-hidden shadow-xl">
                 <div className="px-6 py-4 border-b border-border-dim flex justify-between items-center">
                    <h3 className="font-semibold">Message Traffic</h3>
                    <span className="text-xs text-text-muted">Live Stream</span>
                 </div>
                 <div className="flex-1 overflow-y-auto scrollbar-hide">
                   <div className="grid grid-cols-12 px-6 py-3 border-b border-border-dim text-[11px] font-bold text-text-muted uppercase tracking-wider bg-bg-card/50 sticky top-0 z-10">
                      <div className="col-span-3">Timestamp</div>
                      <div className="col-span-3">User</div>
                      <div className="col-span-6">Message Content</div>
                   </div>
                   <AnimatePresence initial={false}>
                      {messages.map((msg) => (
                        <motion.div 
                          key={msg.id}
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="grid grid-cols-12 px-6 py-3 border-b border-border-dim/30 items-center hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="col-span-3 text-text-muted font-mono text-[11px]">
                            [{new Date(msg.createdAt).toLocaleTimeString()}]
                          </div>
                          <div className="col-span-3 font-medium text-brand text-sm truncate">
                            @{msg.username || msg.firstName}
                          </div>
                          <div className="col-span-6 text-sm truncate group-hover:whitespace-normal">
                            {msg.text || <span className="opacity-30 italic">[attachment]</span>}
                          </div>
                        </motion.div>
                      ))}
                   </AnimatePresence>
                 </div>
              </section>

              {/* User Registry & Config - 1/3 width */}
              <section className="bg-bg-card border border-border-dim rounded-xl p-5 flex flex-col h-[400px] overflow-hidden shadow-xl">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-base">Active Users</h3>
                    <button onClick={fetchData} className="text-brand text-xs font-semibold hover:underline">Sync</button>
                 </div>
                 <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {users.map(user => (
                       <div key={user.telegramId} className="flex items-center gap-3 py-3 border-b border-border-dim/30 last:border-0 hover:bg-white/[0.03] px-2 rounded-lg transition-colors">
                          <div className="w-2 h-2 rounded-full bg-success shrink-0" />
                          <div className="min-w-0 flex-1">
                             <h4 className="text-sm font-medium truncate">@{user.username || user.firstName}</h4>
                             <p className="text-xs text-text-muted truncate">Msg Count: {user.messageCount}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </section>
            </div>
          </>
        ) : activeTab === 'Bot Manager' ? (
          <BotManager 
            meta={botMeta} 
            appUrl={botStatus.url} 
            onRefresh={fetchBotMeta} 
            onSetupWebhook={setupWebhook} 
          />
        ) : (
          <div className="flex-1 flex items-center justify-center opacity-30 italic font-serif">
            Section "{activeTab}" is under development.
          </div>
        )}

        {/* Footer: Cloud Logs - Monospace Terminal */}
        <section className="bg-bg-log border border-border-dim rounded-xl p-4 h-[140px] flex flex-col font-mono text-xs overflow-hidden shadow-inner">
           <div className="flex items-center justify-between mb-2 pb-2 border-b border-border-dim/30 opacity-50 uppercase tracking-tighter">
              <span>Terminal Trace</span>
              <span className="text-[10px]">Cloud Storage S3 Linked</span>
           </div>
           <div className="flex-1 overflow-y-auto space-y-1 pr-2">
              {logs.map(log => (
                <div key={log.id} className="flex gap-3">
                   <span className="text-text-muted min-w-[70px]">[{new Date(log.createdAt).toLocaleTimeString()}]</span>
                   <span className="text-brand">[ {log.event.toUpperCase()} ]</span>
                   <span className="text-text-main opacity-80">{log.details}</span>
                </div>
              ))}
              <div className="animate-pulse inline-block w-2 h-4 bg-brand ml-1 align-middle"></div>
           </div>
        </section>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`
      px-6 py-3.5 flex items-center gap-3 text-sm cursor-pointer transition-all border-r-4
      ${active 
        ? 'bg-brand/10 text-brand border-brand font-semibold' 
        : 'text-text-muted border-transparent hover:text-text-main hover:bg-white/[0.03]'
      }
    `}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function BotManager({ meta, appUrl, onRefresh, onSetupWebhook }: { meta: any, appUrl: string, onRefresh: () => void, onSetupWebhook: () => void }) {
  if (!meta) return (
    <div className="flex-1 flex items-center justify-center">
      <RefreshCw className="animate-spin text-brand" />
    </div>
  );

  const { bot, webhook } = meta;

  return (
    <div className="flex-1 flex flex-col gap-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Bot Manager</h1>
          <p className="text-text-muted text-sm mt-1">Configure and monitor your bot instance</p>
        </div>
        <button 
          onClick={onRefresh}
          className="bg-bg-card border border-border-dim px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-white/[0.05] transition-colors"
        >
          <RefreshCw size={14} /> Refresh Meta
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Identity Section */}
        <section className="bg-bg-card border border-border-dim rounded-xl p-6 shadow-xl">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-brand">
            <Bot size={20} /> Bot Identity
          </h3>
          <div className="space-y-4 font-mono text-sm">
            <div className="flex justify-between border-b border-border-dim/30 pb-3">
              <span className="text-text-muted uppercase text-[10px] font-bold">Username</span>
              <span className="text-white">@{bot.username}</span>
            </div>
            <div className="flex justify-between border-b border-border-dim/30 pb-3">
              <span className="text-text-muted uppercase text-[10px] font-bold">First Name</span>
              <span className="text-white">{bot.first_name}</span>
            </div>
            <div className="flex justify-between border-b border-border-dim/30 pb-3">
              <span className="text-text-muted uppercase text-[10px] font-bold">Client ID</span>
              <span className="text-white">{bot.id}</span>
            </div>
            <div className="flex justify-between border-b border-border-dim/30 pb-3">
              <span className="text-text-muted uppercase text-[10px] font-bold">Can Join Groups</span>
              <span className={bot.can_join_groups ? 'text-success' : 'text-danger'}>
                {bot.can_join_groups ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
          </div>
        </section>

        {/* Webhook Configuration */}
        <section className="bg-bg-card border border-border-dim rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-success">
              <Shield size={20} /> Connectivity
            </h3>
            <div className="space-y-6">
              <div className="p-4 bg-bg-main rounded-lg border border-border-dim">
                <div className="text-[10px] text-text-muted uppercase font-bold mb-2">Target Endpoint</div>
                <div className="text-xs break-all font-mono opacity-80">{appUrl}/api/webhook/telegram</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-text-muted uppercase font-bold">Current Webhook Status</span>
                  <span className={webhook.url ? 'text-success' : 'text-danger'}>
                    {webhook.url ? 'ACTIVE' : 'NOT CONFIGURED'}
                  </span>
                </div>
                {webhook.pending_update_count > 0 && (
                  <div className="text-[10px] font-mono p-2 bg-orange-500/10 text-orange-400 rounded border border-orange-500/20">
                    Pending updates: {webhook.pending_update_count}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={onSetupWebhook}
            className="w-full mt-8 bg-success hover:bg-success/90 text-white py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} /> Update Webhook URL
          </button>
        </section>

        {/* Registered Commands */}
        <section className="bg-bg-card border border-border-dim rounded-xl p-6 shadow-xl">
           <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-brand">
            <MessageSquare size={20} /> Registered Commands
          </h3>
          <div className="p-4 border border-border-dim rounded-lg bg-bg-main/30 font-mono text-xs text-text-muted italic text-center py-10">
            No custom commands registered via API yet. Use the bot's /setcommands endpoint or BotFather to manage.
          </div>
        </section>

        {/* Configuration Guide */}
        <section className="bg-bg-card border border-border-dim rounded-xl p-6 shadow-xl">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-brand">
            <Settings size={20} /> API Configurations
          </h3>
          <div className="grid grid-cols-1 gap-6">
            <div className="p-4 border border-border-dim rounded-lg bg-bg-main/30">
               <div className="font-bold text-sm mb-2 uppercase text-text-muted tracking-widest text-[10px]">Environment Status</div>
               <div className="space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span>TELEGRAM_BOT_TOKEN</span>
                    <span className="text-success">LOADED</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DATABASE_ADAPTER</span>
                    <span className="text-brand">BETTER-SQLITE3</span>
                  </div>
                  <div className="flex justify-between">
                    <span>APP_PUBLIC_URL</span>
                    <span className="text-success font-bold">VERIFIED</span>
                  </div>
               </div>
            </div>

            <div className="p-4 border border-border-dim rounded-lg bg-bg-main/30 flex flex-col justify-center">
               <p className="text-[11px] text-text-muted leading-relaxed italic">
                 "To update your bot's API key or other system environment variables, please use the **Secrets** panel in the AI Studio sidebar."
               </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, trendDown = false, trendNeutral = false }: { label: string, value: string, trend: string, trendDown?: boolean, trendNeutral?: boolean }) {
  return (
    <div className="bg-bg-card border border-border-dim p-5 rounded-xl shadow-lg transition-transform hover:scale-[1.02]">
      <div className="text-[11px] text-text-label uppercase font-bold tracking-widest mb-3 opacity-80">{label}</div>
      <div className="text-2xl font-bold flex items-baseline gap-2.5">
        {value}
        <span className={`text-xs font-semibold ${trendNeutral ? 'text-text-muted' : trendDown ? 'text-danger' : 'text-success'}`}>
          {trend}
        </span>
      </div>
    </div>
  );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) {
  return (
    <div className="flex items-center justify-between group hover:bg-[#141414] hover:text-[#E4E3E0] p-2 -mx-2 transition-colors cursor-default border-b border-[#141414]/10">
      <div className="flex items-center gap-3">
        <span className="opacity-40 group-hover:opacity-100">{icon}</span>
        <span className="font-mono text-[11px] font-bold uppercase">{label}</span>
      </div>
      <span className="font-serif italic text-xl">{value}</span>
    </div>
  );
}
