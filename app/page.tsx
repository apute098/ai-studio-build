'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Users, 
  User,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<Stats>({ totalMessages: 0, totalUsers: 0, todayMessages: 0 });
  const [loading, setLoading] = useState(true);
  const [botStatus, setBotStatus] = useState<{ token: boolean; url: string }>({ token: false, url: '' });
  const [connected, setConnected] = useState(false);
  const [botMeta, setBotMeta] = useState<any>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const [isDataSyncing, setIsDataSyncing] = useState(false);

  const fetchData = useCallback(async () => {
    setIsDataSyncing(true);
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
    } finally {
      setIsDataSyncing(false);
    }
  }, []);

  const fetchBotMeta = useCallback(async () => {
    try {
      const res = await fetch('/api/bot/info');
      const data = await res.json();
      // Always set data so we stop infinite spinning even on error
      setBotMeta(data);
    } catch (e) {
      console.error('Bot meta fetch error:', e);
      setBotMeta({ ok: false, error: 'Fetch failed' });
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

  const [isSyncing, setIsSyncing] = useState(false);

  const setupWebhook = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/webhook/setup', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        console.log('Webhook set successfully!');
        fetchBotMeta();
      } else {
        console.error('Error: ' + data.description);
      }
    } catch (e) {
      console.error('Failed to set webhook');
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <RefreshCw className="animate-spin text-purple-400" size={32} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050505] text-white/90 font-sans selection:bg-purple-500/30 selection:text-white relative overflow-hidden">
      {/* VisionOS / iOS Liquid Glass Animated Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/30 blur-[120px] mix-blend-screen opacity-50 animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-cyan-600/20 blur-[150px] mix-blend-screen opacity-60 pointer-events-none" style={{ animation: 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
      <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-indigo-600/20 blur-[100px] mix-blend-screen opacity-40 pointer-events-none" style={{ animation: 'pulse 10s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[60px] pointer-events-none z-0" />

      {/* Mobile Drawer & Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-md"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-[280px] bg-white/[0.04] backdrop-blur-[80px] border-r border-white/10 flex flex-col py-6 shrink-0 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-y-auto overflow-x-hidden md:hidden"
            >
              <div className="px-6 mb-8 flex items-center justify-between font-bold text-xl tracking-tight text-white sticky top-0 z-10 py-2 -mt-2">
                <div className="flex items-center gap-2.5">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl p-1.5 shadow-lg shadow-purple-500/20">
                    <Send size={20} className="text-white" />
                  </div>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">TG-Dash</span>
                </div>
                <button 
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer flex items-center justify-center -mr-2 border border-white/5" 
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close Sidebar"
                >
                  <div className="w-5 h-5 flex items-center justify-center text-white/70 hover:text-white">✕</div>
                </button>
              </div>
              
              <nav className="flex-1 space-y-1 px-3">
                <SidebarItem icon={<Activity size={18} />} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => { setActiveTab('Dashboard'); setMobileMenuOpen(false); }} />
                <SidebarItem icon={<Bot size={18} />} label="Bot Manager" active={activeTab === 'Bot Manager'} onClick={() => { setActiveTab('Bot Manager'); setMobileMenuOpen(false); }} />
                <SidebarItem icon={<Users size={18} />} label="User Insights" active={activeTab === 'User Insights'} onClick={() => { setActiveTab('User Insights'); setMobileMenuOpen(false); }} />
                <SidebarItem icon={<Terminal size={18} />} label="Cloud Logs" active={activeTab === 'Cloud Logs'} onClick={() => { setActiveTab('Cloud Logs'); setMobileMenuOpen(false); }} />
                <SidebarItem icon={<Settings size={18} />} label="Settings" active={activeTab === 'Settings'} onClick={() => { setActiveTab('Settings'); setMobileMenuOpen(false); }} />
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[260px] flex-col py-6 shrink-0 h-screen sticky top-0 bg-white/[0.04] backdrop-blur-[80px] border-r border-white/10 shadow-[4px_0_40px_rgba(0,0,0,0.5)] z-20">
        <div className="px-6 mb-8 flex items-center gap-3 font-bold text-xl tracking-tight text-white">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl p-2 shadow-lg shadow-purple-500/20">
            <Send size={20} className="text-white" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">TG-Dash</span>
        </div>
        
        <nav className="flex-1 space-y-1 px-4">
          <SidebarItem icon={<Activity size={18} />} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
          <SidebarItem icon={<Bot size={18} />} label="Bot Manager" active={activeTab === 'Bot Manager'} onClick={() => setActiveTab('Bot Manager')} />
          <SidebarItem icon={<Users size={18} />} label="User Insights" active={activeTab === 'User Insights'} onClick={() => setActiveTab('User Insights')} />
          <SidebarItem icon={<Terminal size={18} />} label="Cloud Logs" active={activeTab === 'Cloud Logs'} onClick={() => setActiveTab('Cloud Logs')} />
          <SidebarItem icon={<Settings size={18} />} label="Settings" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 flex flex-col gap-6 overflow-x-hidden relative z-10">
        {/* Mobile Header / Hamburger */}
        <header className="md:hidden flex items-center gap-4 mb-2 relative z-10">
            <button 
              onClick={() => setMobileMenuOpen(true)} 
              className="p-2.5 bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl shadow-lg hover:bg-white/10 active:bg-white/20 transition-colors"
            >
                <div className="w-5 h-4 flex flex-col justify-between">
                  <span className="w-full h-[2px] bg-white/80 rounded-full" />
                  <span className="w-full h-[2px] bg-white/80 rounded-full" />
                  <span className="w-full h-[2px] bg-white/80 rounded-full" />
                </div>
            </button>
            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 tracking-tight">TG-Dash</span>
        </header>

        {activeTab === 'Dashboard' ? (
          <motion.div 
             key="dashboard"
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.3 }}
             className="flex flex-col gap-6"
          >
            {/* Header */}
            <header className="hidden md:flex justify-between items-end gap-4 mb-2">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">Network Overview</h1>
                <p className="text-white/50 text-sm mt-1">Monitoring active updates from your Telegram Bot infrastructure</p>
              </div>
              
              <div className="flex gap-3">
                 <button 
                   onClick={setupWebhook}
                   disabled={isSyncing}
                   className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                 >
                   <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} /> {isSyncing ? 'Syncing...' : 'Set Webhook'}
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
              <section className="lg:col-span-2 bg-white/5 backdrop-blur-[30px] border border-white/10 rounded-2xl flex flex-col h-[400px] overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
                 <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                    <h3 className="font-semibold text-white">Message Traffic</h3>
                    <span className="text-xs text-white/50 bg-white/5 px-2 py-1 rounded-md border border-white/10">Live Stream</span>
                 </div>
                 <div className="flex-1 overflow-y-auto scrollbar-hide">
                   <div className="grid grid-cols-12 px-6 py-3 border-b border-white/10 text-[11px] font-bold text-white/40 uppercase tracking-wider bg-white/[0.01] sticky top-0 z-10">
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
                          onClick={() => setSelectedMessage(msg)}
                          className="grid grid-cols-12 px-6 py-3 border-b border-white/5 items-center hover:bg-white/[0.04] transition-colors cursor-pointer"
                        >
                          <div className="col-span-3 text-white/40 font-mono text-[11px]">
                            [{new Date(msg.createdAt).toLocaleTimeString()}]
                          </div>
                          <div className="col-span-3 font-medium text-purple-300 text-sm truncate">
                            @{msg.username || msg.firstName}
                          </div>
                          <div className="col-span-6 text-sm truncate group-hover:whitespace-normal text-white/80 flex items-center gap-1.5">
                            {msg.text ? (
                              msg.text.includes('[') && msg.text.includes(']') && msg.text.startsWith('[') ? (
                                <>
                                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30 whitespace-nowrap">
                                    {msg.text.split(' ')[0]}
                                  </span>
                                  <span>{msg.text.substring(msg.text.indexOf(' ') + 1)}</span>
                                </>
                              ) : (
                                msg.text
                              )
                            ) : (
                              <span className="opacity-30 italic">[attachment]</span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                   </AnimatePresence>
                 </div>
              </section>

              {/* User Registry & Config - 1/3 width */}
              <section className="bg-white/5 backdrop-blur-[30px] border border-white/10 rounded-2xl p-5 flex flex-col h-[400px] overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-base text-white">Active Users</h3>
                    <button 
                      onClick={fetchData} 
                      disabled={isDataSyncing}
                      className="text-purple-400 text-xs font-semibold hover:text-purple-300 disabled:opacity-50 flex items-center gap-1 bg-purple-500/10 px-2 py-1 rounded-md transition-colors"
                    >
                      {isDataSyncing ? <RefreshCw className="animate-spin" size={12} /> : 'Sync'}
                    </button>
                 </div>
                 <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {users.map(user => (
                       <div key={user.telegramId} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.04] px-2 rounded-xl transition-colors">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0" />
                          <div className="min-w-0 flex-1">
                             <h4 className="text-sm font-medium truncate text-white">@{user.username || user.firstName}</h4>
                             <p className="text-xs text-white/40 truncate">Msg Count: {user.messageCount}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </section>
            </div>
          </motion.div>
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
        <section className="bg-black/20 backdrop-blur-3xl border border-white/5 rounded-2xl p-4 h-[140px] flex flex-col font-mono text-xs overflow-hidden shadow-inner relative z-10">
           <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5 text-white/40 uppercase tracking-tighter">
              <span>Terminal Trace</span>
              <span className="text-[10px]">Cloud Storage S3 Linked</span>
           </div>
           <div className="flex-1 overflow-y-auto space-y-1 pr-2">
              {logs.map(log => (
                <div key={log.id} className="flex gap-3">
                   <span className="text-white/30 min-w-[70px]">[{new Date(log.createdAt).toLocaleTimeString()}]</span>
                   <span className="text-purple-400 font-bold">[ {log.event.toUpperCase()} ]</span>
                   <span className="text-white/80">{log.details}</span>
                </div>
              ))}
              <div className="animate-pulse inline-block w-2 h-4 bg-purple-400 ml-1 align-middle"></div>
           </div>
        </section>

      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
              onClick={() => setSelectedMessage(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white/10 backdrop-blur-[60px] border border-white/20 shadow-[0_0_60px_rgba(0,0,0,0.6)] rounded-3xl p-6"
            >
              <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                     <MessageSquare size={20} className="text-purple-400" /> Detail Info
                  </h3>
                  <div className="text-sm font-mono text-white/50 mt-1">
                    {new Date(selectedMessage.createdAt).toLocaleString()}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedMessage(null)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-white/70 hover:text-white"
                >
                  <div className="w-5 h-5 flex items-center justify-center">✕</div>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-[10px] uppercase font-bold text-white/40 tracking-widest mb-2 flex items-center gap-1.5">
                     <User size={14} className="text-emerald-400" /> Sender Profile
                  </div>
                  <div className="text-white bg-black/20 rounded-xl p-4 border border-white/5 flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg shadow-emerald-500/20 flex items-center justify-center text-white font-bold text-xl">
                         {selectedMessage.firstName ? selectedMessage.firstName[0].toUpperCase() : '@'}
                      </div>
                      <div>
                         <div className="font-bold text-lg">{selectedMessage.firstName || 'Unknown'}</div>
                         <div className="text-sm text-white/50 font-mono">@{selectedMessage.username || 'hidden'}</div>
                      </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-white/40 tracking-widest mb-2 flex items-center gap-1.5">
                     <MessageSquare size={14} className="text-cyan-400" /> Content Payload
                  </div>
                  <div className="text-white/90 bg-black/20 rounded-xl p-4 border border-white/5 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar">
                      {selectedMessage.text || <span className="opacity-50 italic">Media / Attachment (No text content)</span>}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`
      px-4 py-3 my-1 flex items-center gap-3 text-sm cursor-pointer transition-all rounded-xl border border-transparent
      ${active 
        ? 'bg-white/10 backdrop-blur-md shadow-inner border-white/10 text-white font-semibold' 
        : 'text-white/50 hover:text-white/90 hover:bg-white/5'
      }
    `}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function BotManager({ meta, appUrl, onRefresh, onSetupWebhook }: { meta: any, appUrl: string, onRefresh: () => Promise<void>, onSetupWebhook: () => Promise<void> }) {
  const [refreshing, setRefreshing] = useState(false);
  const [webhookSyncing, setWebhookSyncing] = useState(false);

  const handleRefresh = async () => {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
  };

  const handleSetupWebhook = async () => {
      setWebhookSyncing(true);
      await onSetupWebhook();
      setWebhookSyncing(false);
  };

  if (!meta) return (
    <div className="flex-1 flex items-center justify-center">
      <RefreshCw className="animate-spin text-brand" />
    </div>
  );

  const bot = meta?.bot || {};
  const webhook = meta?.webhook || {};

  return (
    <div className="flex-1 flex flex-col gap-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Bot Manager</h1>
          <p className="text-white/50 text-sm mt-1">Configure and monitor your bot instance</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-white px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh Meta'}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Identity Section */}
        <section className="bg-white/5 backdrop-blur-[30px] border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-white">
            <Bot size={20} className="text-purple-400" /> Bot Identity
          </h3>
          <div className="space-y-4 font-mono text-sm">
            <div className="flex justify-between border-b border-white/5 pb-3">
              <span className="text-white/50 uppercase text-[10px] font-bold">Username</span>
              <span className="text-white">@{bot.username}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-3">
              <span className="text-white/50 uppercase text-[10px] font-bold">First Name</span>
              <span className="text-white">{bot.first_name}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-3">
              <span className="text-white/50 uppercase text-[10px] font-bold">Client ID</span>
              <span className="text-white">{bot.id}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-3">
              <span className="text-white/50 uppercase text-[10px] font-bold">Can Join Groups</span>
              <span className={bot.can_join_groups ? 'text-emerald-400' : 'text-red-400'}>
                {bot.can_join_groups ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
          </div>
        </section>

        {/* Webhook Configuration */}
        <section className="bg-white/5 backdrop-blur-[30px] border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-white">
              <Shield size={20} className="text-emerald-400" /> Connectivity
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                <div className="text-[10px] text-white/50 uppercase font-bold mb-1">Target Endpoint</div>
                <div className="text-xs break-all font-mono text-white/80">{appUrl}/api/webhook/telegram</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                 <div className="p-2 border border-white/5 rounded-xl bg-black/20">
                    <span className="text-white/50 uppercase font-bold block">Status</span>
                    <span className={webhook.url ? 'text-emerald-400' : 'text-red-400'}>
                      {webhook.url ? 'ACTIVE' : 'NOT CONFIGURED'}
                    </span>
                 </div>
                 <div className="p-2 border border-white/5 rounded-xl bg-black/20">
                    <span className="text-white/50 uppercase font-bold block">Pending</span>
                    <span className={webhook.pending_update_count > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                      {webhook.pending_update_count || 0}
                    </span>
                 </div>
              </div>

              {webhook.last_error_date && (
                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl font-mono text-[10px] text-red-400">
                  <div className="font-bold uppercase mb-1">Last Error</div>
                  <div className="truncate">{webhook.last_error_message || 'Unknown error'}</div>
                </div>
              )}
              
              <div className="text-[10px] text-white/50 font-mono flex justify-between px-1">
                <span>Last Sync</span>
                <span>{webhook.last_error_date ? new Date(webhook.last_error_date * 1000).toLocaleString() : 'N/A'}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleSetupWebhook}
            disabled={webhookSyncing}
            className="w-full mt-8 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} className={webhookSyncing ? 'animate-spin' : ''} /> {webhookSyncing ? 'Syncing...' : 'Update Webhook URL'}
          </button>
        </section>

        {/* Registered Commands */}
        <section className="bg-white/5 backdrop-blur-[30px] border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
           <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
            <MessageSquare size={20} className="text-purple-400" /> Registered Commands
          </h3>
          <div className="p-4 border border-white/5 rounded-xl bg-black/20 font-mono text-xs text-white/40 italic text-center py-10">
            No custom commands registered via API yet. Use the bot's /setcommands endpoint or BotFather to manage.
          </div>
        </section>

        {/* Configuration Guide */}
        <section className="bg-white/5 backdrop-blur-[30px] border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] md:col-span-2 lg:col-span-1">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
            <Settings size={20} className="text-purple-400" /> Environment Variables
          </h3>
          <div className="flex flex-col gap-6">
            <div className="p-4 border border-white/5 rounded-xl bg-black/20">
               <div className="font-bold text-sm mb-4 uppercase text-white/50 tracking-widest text-[10px]">WA Bridge & AI Status</div>
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono text-white/60 truncate">TELEGRAM_BOT_TOKEN</span>
                    <div className={`px-2 py-1 rounded-md text-[10px] font-bold ${meta.bot ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'}`}>
                        {meta.bot ? 'ACTIVE' : 'MISSING'}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono text-white/60 truncate">MONITOR_TOKEN</span>
                    <div className="px-2 py-1 rounded-md text-[10px] font-bold bg-white/5 border border-white/10 text-white/40">PENDING</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono text-white/60 truncate">AI_TOKEN</span>
                    <div className="px-2 py-1 rounded-md text-[10px] font-bold bg-white/5 border border-white/10 text-white/40">PENDING</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono text-white/60 truncate">GEMINI_API_KEY</span>
                    <div className="px-2 py-1 rounded-md text-[10px] font-bold bg-white/5 border border-white/10 text-white/40">SECURED</div>
                  </div>

                  <div className="text-[11px] text-white/40 leading-relaxed pt-2 border-t border-white/5">
                    Navigate to <b>Settings &gt; Secrets</b> to add your `MONITOR_TOKEN` and `AI_TOKEN` for the Loco WA-Bridge.
                    Never hardcode secrets in <code>index.js</code>!
                  </div>
               </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, trendDown = false, trendNeutral = false }: { label: string, value: string, trend: string, trendDown?: boolean, trendNeutral?: boolean }) {
  return (
    <div className="bg-white/5 backdrop-blur-[30px] border border-white/10 p-5 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-transform hover:scale-[1.02]">
      <div className="text-[11px] text-white/50 uppercase font-bold tracking-widest mb-3">{label}</div>
      <div className="text-2xl font-bold flex items-baseline gap-2.5 text-white">
        {value}
        <span className={`text-xs font-semibold ${trendNeutral ? 'text-white/40' : trendDown ? 'text-red-400' : 'text-emerald-400'}`}>
          {trend}
        </span>
      </div>
    </div>
  );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) {
  return (
    <div className="flex items-center justify-between group hover:bg-white/5 hover:text-white p-2 px-3 -mx-3 transition-colors cursor-default border-b border-white/5 rounded-lg text-white/70">
      <div className="flex items-center gap-3">
        <span className="opacity-50 group-hover:opacity-100 group-hover:text-purple-400 transition-colors">{icon}</span>
        <span className="font-mono text-[11px] font-bold uppercase">{label}</span>
      </div>
      <span className="font-serif italic text-xl text-white">{value}</span>
    </div>
  );
}
