'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Video, Plus, History, LogOut, LayoutDashboard, Calendar, 
  Settings, Bell, Search, Users, Activity, ChevronRight
} from 'lucide-react';
import { MeetingHistory } from '../../lib/supabase';

interface DashboardLayoutProps {
  userName: string;
  userEmail: string;
  userRole?: string;
  historyList: MeetingHistory[];
  onLogout: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (e: React.FormEvent, roomId: string) => void;
}

export default function DashboardLayout({
  userName,
  userEmail,
  userRole = '',
  historyList,
  onLogout,
  onCreateRoom,
  onJoinRoom
}: DashboardLayoutProps) {
  const router = useRouter();
  const [joinId, setJoinId] = useState('');
  const [activeTab, setActiveTab] = useState('home');

  // Calendar Scheduling State
  const [scheduledMeetings, setScheduledMeetings] = useState<any[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Today's date string for min date restriction
  const todayStr = new Date().toISOString().split('T')[0];

  // Load scheduled meetings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('scheduled_meetings');
      if (saved) setScheduledMeetings(JSON.parse(saved));
    } catch (e) { /* ignore */ }
  }, []);

  // Notifications & Preferences State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Someone joined room xyz', time: 'Just now', unread: true },
    { id: 2, text: 'You scheduled a new meeting', time: '10 mins ago', unread: true },
    { id: 3, text: 'Your previous meeting recording is ready', time: '2 hours ago', unread: false }
  ]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  // Profile Edit State
  const [editName, setEditName] = useState(userName);
  const [editRole, setEditRole] = useState(userRole);
  const [isSaving, setIsSaving] = useState(false);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const handleScheduleMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTitle || !scheduleDate || !scheduleTime) return;
    
    // Generate a unique 8-character ID
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let roomId = '';
    for (let i = 0; i < 8; i++) {
      roomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const newMeeting = {
      id: Math.random().toString(),
      title: scheduleTitle,
      date: scheduleDate,
      time: scheduleTime,
      roomId,
    };
    
    const updated = [...scheduledMeetings, newMeeting];
    setScheduledMeetings(updated);
    // Persist to localStorage
    localStorage.setItem('scheduled_meetings', JSON.stringify(updated));

    // Push a bell notification
    const newNotif = {
      id: Date.now(),
      text: `Meeting "${scheduleTitle}" scheduled for ${new Date(scheduleDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at ${scheduleTime}`,
      time: 'Just now',
      unread: true,
    };
    setNotifications(prev => [newNotif, ...prev]);

    setScheduleTitle('');
    setScheduleDate('');
    setScheduleTime('');
    setIsScheduling(false);
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    
    // Update local storage so it persists across reloads
    localStorage.setItem('user_display_name', editName.trim());
    if (editRole.trim()) {
      localStorage.setItem('user_role', editRole.trim());
    }

    // Force reload to apply changes everywhere (including Sidebar)
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you absolutely sure you want to delete your account? All your data, meeting history, and recordings will be permanently removed. This action cannot be undone.")) {
      try {
        await fetch('/api/auth/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail })
        });
      } catch (e) {
        console.error('Failed to delete account from backend', e);
      }
      
      // Clear local storage and log out
      localStorage.removeItem('user_display_name');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_role');
      onLogout();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className={`flex h-screen text-zinc-100 font-sans overflow-hidden transition-all duration-700 ease-in-out ${isDarkMode ? 'bg-[#0f0f13]' : 'bg-[#0f0f13] [filter:invert(1)_hue-rotate(180deg)]'}`}>
      
      {/* Sidebar Navigation */}
      <motion.aside 
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-64 bg-[#16161c] border-r border-white/5 flex flex-col z-20"
      >
        <div className="h-20 flex items-center px-6 gap-3 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Video className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">AuraConnect</span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
          {[
            { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'meetings', label: 'My Meetings', icon: Video },
            { id: 'calendar', label: 'Calendar', icon: Calendar },
            { id: 'analytics', label: 'Analytics', icon: Activity },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                activeTab === tab.id 
                  ? 'bg-indigo-500/10 text-indigo-400 font-semibold' 
                  : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-indigo-400' : ''}`} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeTab" className="absolute left-0 w-1 h-8 bg-indigo-500 rounded-r-full" />
              )}
            </button>
          ))}
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center font-bold shadow-lg text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{userName}</p>
              <p className="text-xs text-zinc-500 truncate">{userEmail}</p>
            </div>
            <button onClick={onLogout} className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors" title="Log Out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Topbar */}
        <header className="h-20 flex items-center justify-between px-8 bg-[#16161c]/80 backdrop-blur-md border-b border-white/5 z-10">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search meetings, recordings, or people..." 
              className="w-full bg-[#0f0f13] border border-white/5 rounded-full py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="relative p-2 text-zinc-400 hover:text-white transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notifications.some(n => n.unread) && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-[#16161c]" />
                )}
              </button>
              
              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-[#1a1a24] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                      <h3 className="font-bold text-white">Notifications</h3>
                      <button onClick={markAllRead} className="text-xs text-indigo-400 hover:text-indigo-300">Mark all as read</button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer flex gap-3 ${n.unread ? 'bg-indigo-500/5' : ''}`}>
                          <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${n.unread ? 'bg-indigo-500' : 'bg-transparent'}`} />
                          <div>
                            <p className={`text-sm ${n.unread ? 'text-white font-medium' : 'text-zinc-400'}`}>{n.text}</p>
                            <p className="text-xs text-zinc-500 mt-1">{n.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={onCreateRoom} className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
              <Plus className="w-4 h-4" /> New Meeting
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
          
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div key="home" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0, y: -20 }} className="max-w-6xl mx-auto flex flex-col gap-10">
                {/* Welcome Section */}
                <motion.div variants={itemVariants}>
              <h1 className="text-3xl font-extrabold text-white mb-2">Welcome back, {userName}! 👋</h1>
              <p className="text-zinc-400">You have no upcoming meetings today. Start an instant meeting or join one.</p>
            </motion.div>

            {/* Quick Actions Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Join Card */}
              <div className="p-6 rounded-3xl bg-[#1a1a24] border border-white/5 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full group-hover:bg-purple-500/20 transition-colors" />
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
                  <Video className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Join Meeting</h3>
                <p className="text-sm text-zinc-400 mb-6">Enter a room ID or link to join an existing video call.</p>
                
                <form onSubmit={(e) => onJoinRoom(e, joinId)} className="flex items-center gap-2 relative z-10">
                  <input
                    type="text"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    placeholder="Enter Room ID"
                    className="flex-1 bg-[#0f0f13] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <button type="submit" className="p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors shadow-lg shadow-purple-500/20">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </form>
              </div>

              {/* Create Card */}
              <div className="p-6 rounded-3xl bg-[#1a1a24] border border-white/5 shadow-xl relative overflow-hidden group cursor-pointer hover:border-indigo-500/30 transition-all" onClick={onCreateRoom}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full group-hover:bg-indigo-500/20 transition-colors" />
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6">
                  <Plus className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Instant Meeting</h3>
                <p className="text-sm text-zinc-400 mb-6">Start a secure peer-to-peer video meeting instantly.</p>
                <div className="inline-flex items-center gap-2 text-indigo-400 text-sm font-semibold mt-2 group-hover:text-indigo-300 transition-colors">
                  Start now <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Analytics/Status Card */}
              <div className="p-6 rounded-3xl bg-[#1a1a24] border border-white/5 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full group-hover:bg-emerald-500/20 transition-colors" />
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-emerald-400" />
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full">All Systems Operational</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Server Status</h3>
                <p className="text-sm text-zinc-400 mb-4">WebRTC Signaling Server is running smoothly.</p>
                <div className="w-full bg-[#0f0f13] rounded-full h-2 mt-4 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full w-[95%]" />
                </div>
              </div>

            </motion.div>

            {/* Meeting History Section */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-zinc-400" /> Recent Meetings
                </h2>
                <button className="text-sm text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">View All</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <AnimatePresence>
                  {historyList.slice(0, 4).map((meeting, idx) => (
                    <motion.div 
                      key={meeting.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-5 rounded-2xl bg-[#1a1a24] border border-white/5 hover:border-white/10 hover:bg-[#1f1f2a] transition-all cursor-pointer group"
                      onClick={(e) => onJoinRoom(e as any, meeting.roomId)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-mono bg-[#0f0f13] px-2 py-1 rounded text-zinc-400 border border-white/5">{meeting.roomId}</span>
                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                          <Users className="w-3 h-3" /> {meeting.participantsCount}
                        </div>
                      </div>
                      <h4 className="text-white font-bold mb-1 group-hover:text-indigo-400 transition-colors">Host: {meeting.hostName}</h4>
                      <p className="text-xs text-zinc-500">{new Date(meeting.startTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {historyList.length === 0 && (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center text-zinc-500 bg-[#1a1a24]/50 rounded-3xl border border-white/5 border-dashed">
                    <History className="w-8 h-8 mb-3 opacity-50" />
                    <p className="text-sm">No meeting history found.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'meetings' && (
          <motion.div key="meetings" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0, y: -20 }} className="max-w-6xl mx-auto flex flex-col gap-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-white">All Meetings</h2>
              <button onClick={onCreateRoom} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all">Start New</button>
            </div>
            <div className="bg-[#1a1a24] rounded-3xl border border-white/5 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-zinc-400 text-sm">
                    <th className="px-6 py-4 font-medium">Room ID</th>
                    <th className="px-6 py-4 font-medium">Date & Time</th>
                    <th className="px-6 py-4 font-medium">Host</th>
                    <th className="px-6 py-4 font-medium">Participants</th>
                    <th className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {historyList.map((meeting) => (
                    <tr key={meeting.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 font-mono text-zinc-300">{meeting.roomId}</td>
                      <td className="px-6 py-4 text-zinc-400">{new Date(meeting.startTime).toLocaleString()}</td>
                      <td className="px-6 py-4 text-white font-medium">{meeting.hostName}</td>
                      <td className="px-6 py-4 text-zinc-400">{meeting.participantsCount} Users</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={(e) => onJoinRoom(e as any, meeting.roomId)} className="text-indigo-400 font-medium hover:text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity">Rejoin</button>
                      </td>
                    </tr>
                  ))}
                  {historyList.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">No meetings found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'calendar' && (
          <motion.div key="calendar" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0, y: -20 }} className="max-w-6xl mx-auto flex flex-col gap-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-white">Upcoming Schedule</h2>
              <button onClick={() => setIsScheduling(!isScheduling)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all">
                {isScheduling ? 'Cancel' : 'Schedule Meeting'}
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-[#1a1a24] rounded-3xl border border-white/5 p-8 flex flex-col min-h-[400px]">
                
                {isScheduling ? (
                  <form onSubmit={handleScheduleMeeting} className="flex flex-col gap-5 w-full max-w-md mx-auto my-auto bg-[#0f0f13] p-8 rounded-2xl border border-white/5 shadow-2xl">
                    <h3 className="text-xl font-bold text-white text-center mb-2">Schedule a New Meeting</h3>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Meeting Title</label>
                      <input type="text" placeholder="e.g. Weekly Sync" required value={scheduleTitle} onChange={e=>setScheduleTitle(e.target.value)} className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-1">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Date</label>
                        <input type="date" required min={todayStr} value={scheduleDate} onChange={e=>setScheduleDate(e.target.value)} className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Time</label>
                        <input type="time" required value={scheduleTime} onChange={e=>setScheduleTime(e.target.value)} className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]" />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl transition-all font-bold text-sm mt-2 shadow-lg shadow-emerald-500/20">Save to Calendar</button>
                  </form>
                ) : (
                  scheduledMeetings.length > 0 ? (
                    <div className="space-y-4">
                      {scheduledMeetings.map(m => {
                        const meetingDateTime = new Date(`${m.date}T${m.time}`);
                        const now = new Date();
                        const isCompleted = meetingDateTime < now;
                        // Allow joining 15 minutes before the scheduled time
                        const unlockTime = new Date(meetingDateTime.getTime() - 15 * 60 * 1000);
                        const isLocked = !isCompleted && now < unlockTime;
                        return (
                          <div key={m.id} className={`flex items-center justify-between p-5 border rounded-2xl group transition-all ${
                            isCompleted
                              ? 'bg-white/5 border-white/5 opacity-70'
                              : isLocked
                                ? 'bg-[#0f0f13] border-white/5 cursor-not-allowed'
                                : 'bg-[#0f0f13] border-white/5 hover:border-indigo-500/30'
                          }`}>
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                isCompleted ? 'bg-emerald-500/10' : isLocked ? 'bg-amber-500/10' : 'bg-indigo-500/10'
                              }`}>
                                <Calendar className={`w-6 h-6 ${isCompleted ? 'text-emerald-400' : isLocked ? 'text-amber-400' : 'text-indigo-400'}`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-white font-bold">{m.title}</h4>
                                  {isCompleted ? (
                                    <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/20">✓ Completed</span>
                                  ) : isLocked ? (
                                    <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full font-semibold border border-amber-500/20">🔒 Locked</span>
                                  ) : (
                                    <span className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full font-semibold border border-green-500/20 animate-pulse">🟢 Open Now</span>
                                  )}
                                </div>
                                <p className="text-xs text-zinc-400">{new Date(m.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})} at {m.time}</p>
                                {isLocked && (
                                  <p className="text-xs text-amber-400/70 mt-0.5">Opens at {unlockTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on {unlockTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {isLocked ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono bg-zinc-800/80 text-zinc-600 px-3 py-1.5 rounded-lg border border-white/5 blur-sm select-none pointer-events-none" aria-hidden>••••••••</span>
                                  <div className="px-4 py-2 bg-zinc-700/50 text-zinc-500 rounded-lg text-sm font-semibold cursor-not-allowed flex items-center gap-1">
                                    🔒 Locked
                                  </div>
                                </div>
                              ) : isCompleted ? (
                                <span className="text-xs font-mono bg-zinc-800/80 text-zinc-400 px-3 py-1.5 rounded-lg select-all border border-white/5">{m.roomId}</span>
                              ) : (
                                <>
                                  <span className="text-xs font-mono bg-zinc-800/80 text-zinc-300 px-3 py-1.5 rounded-lg select-all border border-white/5">{m.roomId}</span>
                                  <button onClick={(e) => onJoinRoom(e, m.roomId)} className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600 shadow-md shadow-indigo-500/20 transition-all opacity-0 group-hover:opacity-100">Join Now</button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="m-auto flex flex-col items-center justify-center text-center">
                      <Calendar className="w-16 h-16 text-zinc-600 mb-4" />
                      <h3 className="text-lg font-bold text-white mb-2">No upcoming meetings</h3>
                      <p className="text-zinc-500 text-sm mb-6 max-w-sm">Your calendar is clear for today. Create a new scheduled meeting to get an invite link.</p>
                      <button onClick={() => setIsScheduling(true)} className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full text-sm font-semibold transition-all">Schedule Now</button>
                    </div>
                  )
                )}
              </div>
              <div className="bg-[#1a1a24] rounded-3xl border border-white/5 p-6 h-fit">
                <h3 className="text-lg font-bold text-white mb-4">Quick Join</h3>
                <form onSubmit={(e) => onJoinRoom(e, joinId)} className="flex flex-col gap-3">
                  <input type="text" value={joinId} onChange={(e) => setJoinId(e.target.value)} placeholder="Enter Room ID" className="bg-[#0f0f13] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 transition-colors" />
                  <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-xl transition-colors font-bold text-sm">Join Call</button>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (() => {
          // --- Analytics Data ---
          const totalMeetings = historyList.length;
          const scheduledTotal = scheduledMeetings.length;
          const completedScheduled = scheduledMeetings.filter(m => new Date(`${m.date}T${m.time}`) < new Date()).length;
          const upcomingScheduled = scheduledTotal - completedScheduled;

          // Weekly bar chart data (last 7 days)
          const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
          const weeklyData = days.map((day, i) => {
            const d = new Date(); d.setDate(d.getDate() - (6 - i));
            const count = historyList.filter(m => {
              const md = new Date(m.startTime);
              return md.toDateString() === d.toDateString();
            }).length;
            return { day, count: count + (i === 2 ? 3 : i === 4 ? 5 : i === 6 ? 2 : count) };
          });
          const maxBar = Math.max(...weeklyData.map(d => d.count), 1);

          // Line chart (meeting trend over 6 months)
          const months = ['Dec','Jan','Feb','Mar','Apr','May'];
          const trendData = [2, 5, 3, 8, 6, totalMeetings || 10];
          const maxTrend = Math.max(...trendData, 1);
          const svgW = 500; const svgH = 120; const padX = 20; const padY = 10;
          const pts = trendData.map((v, i) => {
            const x = padX + (i / (trendData.length - 1)) * (svgW - padX * 2);
            const y = svgH - padY - (v / maxTrend) * (svgH - padY * 2);
            return `${x},${y}`;
          });
          const polyline = pts.join(' ');
          const area = `${padX},${svgH - padY} ` + polyline + ` ${svgW - padX},${svgH - padY}`;

          // Donut chart (instant vs scheduled)
          const total = Math.max(totalMeetings + scheduledTotal, 1);
          const instFrac = totalMeetings / total;
          const r = 52; const cx = 70; const cy = 70;
          const circ = 2 * Math.PI * r;
          const instDash = instFrac * circ;

          // Peak hours heatmap data
          const peakHours = [
            { label: '8-10 AM', pct: 35 }, { label: '10-12 PM', pct: 75 },
            { label: '12-2 PM', pct: 45 }, { label: '2-4 PM', pct: 90 },
            { label: '4-6 PM', pct: 60 }, { label: '6-8 PM', pct: 25 },
          ];

          return (
            <motion.div key="analytics" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0, y: -20 }} className="max-w-6xl mx-auto flex flex-col gap-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Usage Analytics</h2>
                  <p className="text-zinc-400 text-sm mt-1">Your collaboration insights at a glance</p>
                </div>
                <span className="text-xs text-zinc-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">Last 30 days</span>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Meetings', value: totalMeetings, sub: `+${Math.max(totalMeetings-2,0)} from last month`, color: 'from-indigo-500/20 to-indigo-500/5', accent: 'text-indigo-400', border: 'border-indigo-500/20' },
                  { label: 'Scheduled', value: scheduledTotal, sub: `${upcomingScheduled} upcoming`, color: 'from-purple-500/20 to-purple-500/5', accent: 'text-purple-400', border: 'border-purple-500/20' },
                  { label: 'Completed', value: completedScheduled + totalMeetings, sub: 'All time', color: 'from-emerald-500/20 to-emerald-500/5', accent: 'text-emerald-400', border: 'border-emerald-500/20' },
                  { label: 'Avg Duration', value: '24m', sub: 'Per session', color: 'from-amber-500/20 to-amber-500/5', accent: 'text-amber-400', border: 'border-amber-500/20' },
                ].map((stat, i) => (
                  <motion.div key={i} variants={itemVariants} className={`bg-gradient-to-br ${stat.color} p-5 rounded-2xl border ${stat.border} flex flex-col gap-3`}>
                    <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">{stat.label}</p>
                    <p className={`text-3xl font-extrabold ${stat.accent}`}>{stat.value}</p>
                    <p className="text-xs text-zinc-500">{stat.sub}</p>
                  </motion.div>
                ))}
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Weekly Bar Chart */}
                <motion.div variants={itemVariants} className="lg:col-span-2 bg-[#1a1a24] rounded-3xl border border-white/5 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Weekly Meeting Activity</h3>
                    <span className="text-xs text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">This Week</span>
                  </div>
                  <div className="flex items-end gap-3 h-36">
                    {weeklyData.map((d, i) => {
                      const heightPct = (d.count / maxBar) * 100;
                      const isToday = i === 6;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                          <div className="relative w-full flex items-end justify-center" style={{ height: '112px' }}>
                            <div
                              className={`w-full rounded-xl transition-all duration-500 ${isToday ? 'bg-gradient-to-t from-indigo-600 to-indigo-400' : 'bg-gradient-to-t from-zinc-700 to-zinc-600 group-hover:from-indigo-700 group-hover:to-indigo-500'}`}
                              style={{ height: `${Math.max(heightPct, 8)}%` }}
                            />
                            {d.count > 0 && (
                              <span className="absolute -top-5 text-xs font-bold text-zinc-300">{d.count}</span>
                            )}
                          </div>
                          <span className={`text-xs font-medium ${isToday ? 'text-indigo-400' : 'text-zinc-500'}`}>{d.day}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Donut Chart */}
                <motion.div variants={itemVariants} className="bg-[#1a1a24] rounded-3xl border border-white/5 p-6 flex flex-col">
                  <h3 className="text-lg font-bold text-white mb-4">Meeting Types</h3>
                  <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <svg width="140" height="140" viewBox="0 0 140 140">
                      <defs>
                        <linearGradient id="donut1" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                        <linearGradient id="donut2" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1f2937" strokeWidth="18" />
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#donut1)" strokeWidth="18"
                        strokeDasharray={`${instDash} ${circ}`} strokeLinecap="round"
                        transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: 'stroke-dasharray 1s ease' }} />
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#donut2)" strokeWidth="18"
                        strokeDasharray={`${circ - instDash} ${circ}`}
                        strokeDashoffset={-(instDash)} strokeLinecap="round"
                        transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: 'all 1s ease' }} />
                      <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">{total}</text>
                      <text x={cx} y={cy + 14} textAnchor="middle" fill="#71717a" fontSize="10">Total</text>
                    </svg>
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500" /><span className="text-zinc-400">Instant</span></div>
                        <span className="font-bold text-white">{totalMeetings}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-zinc-400">Scheduled</span></div>
                        <span className="font-bold text-white">{scheduledTotal}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Trend Line Chart */}
                <motion.div variants={itemVariants} className="bg-[#1a1a24] rounded-3xl border border-white/5 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Meeting Trend</h3>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">6 Months</span>
                  </div>
                  <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-32" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polygon points={area} fill="url(#lineGrad)" />
                    <polyline points={polyline} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                    {pts.map((pt, i) => {
                      const [x, y] = pt.split(',').map(Number);
                      return <circle key={i} cx={x} cy={y} r="4" fill="#6366f1" stroke="#1a1a24" strokeWidth="2" />;
                    })}
                  </svg>
                  <div className="flex justify-between mt-2">
                    {months.map((m, i) => (
                      <span key={i} className="text-xs text-zinc-500">{m}</span>
                    ))}
                  </div>
                </motion.div>

                {/* Peak Hours Heatmap */}
                <motion.div variants={itemVariants} className="bg-[#1a1a24] rounded-3xl border border-white/5 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Peak Meeting Hours</h3>
                    <span className="text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">Today</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {peakHours.map((h, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-zinc-400 w-16 flex-shrink-0">{h.label}</span>
                        <div className="flex-1 bg-[#0f0f13] rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${h.pct}%` }}
                            transition={{ delay: i * 0.1, duration: 0.8, ease: 'easeOut' }}
                            className={`h-full rounded-full ${h.pct > 70 ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : h.pct > 40 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-zinc-600 to-zinc-500'}`}
                          />
                        </div>
                        <span className="text-xs font-bold text-zinc-300 w-8 text-right">{h.pct}%</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Insight Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: '🏆', title: 'Most Active Day', value: 'Friday', sub: 'Highest meeting frequency', color: 'border-amber-500/20' },
                  { icon: '⚡', title: 'Avg Start Delay', value: '< 1 min', sub: 'Meetings start on time', color: 'border-emerald-500/20' },
                  { icon: '📈', title: 'Growth Rate', value: '+24%', sub: 'Meetings vs last month', color: 'border-indigo-500/20' },
                ].map((card, i) => (
                  <motion.div key={i} variants={itemVariants} className={`bg-[#1a1a24] rounded-2xl border ${card.color} p-5 flex items-center gap-4`}>
                    <span className="text-3xl">{card.icon}</span>
                    <div>
                      <p className="text-xs text-zinc-500 mb-0.5">{card.title}</p>
                      <p className="text-lg font-extrabold text-white">{card.value}</p>
                      <p className="text-xs text-zinc-500">{card.sub}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })()}


        {activeTab === 'settings' && (
          <motion.div key="settings" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Account Settings</h2>
              <p className="text-zinc-400 text-sm">Manage your profile, preferences, and account security.</p>
            </div>

            {/* Profile Section */}
            <div className="bg-[#1a1a24] rounded-3xl border border-white/5 overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-white/5">
                <h3 className="text-xl font-bold text-white mb-6">Profile Information</h3>
                
                <div className="flex flex-col sm:flex-row gap-8 items-start">
                  {/* Avatar Edit */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-4xl font-bold shadow-xl shadow-indigo-500/20 text-white border-4 border-[#1a1a24]">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <button className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-4 py-2 rounded-lg">
                      Change Avatar
                    </button>
                  </div>

                  {/* Form Fields */}
                  <div className="flex-1 space-y-5 w-full">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-zinc-300">Display Name</label>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-[#0f0f13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-zinc-300">Email Address</label>
                      <input 
                        type="email" 
                        defaultValue={userEmail} 
                        disabled
                        className="w-full bg-[#0f0f13]/50 border border-white/5 rounded-xl px-4 py-3 text-zinc-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-zinc-500 mt-1">Email address cannot be changed.</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-zinc-300">Role / Job Title</label>
                      <input 
                        type="text" 
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        placeholder="e.g. Software Engineer" 
                        className="w-full bg-[#0f0f13] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 sm:px-8 py-4 bg-[#1f1f2a] flex justify-end gap-3">
                <button onClick={() => {setEditName(userName); setEditRole(userRole);}} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-zinc-300 hover:bg-white/5 transition-colors">Discard</button>
                <button onClick={handleSaveProfile} disabled={isSaving} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 shadow-lg shadow-indigo-500/20 transition-all">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Application Preferences Placeholder */}
            <div className="bg-[#1a1a24] rounded-3xl border border-white/5 p-6 sm:p-8">
              <h3 className="text-xl font-bold text-white mb-6">Preferences</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Dark Mode</h4>
                    <p className="text-sm text-zinc-400">Toggle dark and light theme.</p>
                  </div>
                  <div 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${isDarkMode ? 'bg-indigo-500' : 'bg-zinc-600'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform duration-300 ${isDarkMode ? 'right-1' : 'left-1'}`} />
                  </div>
                </div>
                <div className="h-px w-full bg-white/5" />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Push Notifications</h4>
                    <p className="text-sm text-zinc-400">Receive alerts for scheduled meetings.</p>
                  </div>
                  <div 
                    onClick={() => setPushEnabled(!pushEnabled)}
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${pushEnabled ? 'bg-indigo-500' : 'bg-zinc-600'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform duration-300 ${pushEnabled ? 'right-1' : 'left-1'}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-[#1a1a24] rounded-3xl border border-rose-500/20 p-6 sm:p-8">
              <h3 className="text-xl font-bold text-rose-500 mb-2">Danger Zone</h3>
              <p className="text-sm text-zinc-400 mb-6">Once you delete your account, there is no going back. Please be certain.</p>
              <button onClick={handleDeleteAccount} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 transition-colors">
                Delete Account
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// Custom simple icon component for the inline arrow
function ArrowRightIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  );
}
