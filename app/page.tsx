'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { dbHistory, MeetingHistory } from '../lib/supabase';
import LandingHero from './components/LandingHero';
import DashboardLayout from './components/DashboardLayout';

export default function Home() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [historyList, setHistoryList] = useState<MeetingHistory[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Hydrate custom lobby settings and call history list
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('user_display_name');
      const storedEmail = localStorage.getItem('user_email');
      const storedRole = localStorage.getItem('user_role');
      
      if (storedName) setUserName(storedName);
      if (storedEmail) setUserEmail(storedEmail);
      if (storedRole) setUserRole(storedRole);
      
      if (!storedEmail) {
        // Self-healing mechanism: Since the cookie is httpOnly, we MUST call the backend
        // to clear it, then redirect so the middleware no longer blocks /login or /signup.
        fetch('/api/auth/logout', { method: 'POST' })
          .finally(() => {
            // After the cookie is cleared server-side, reload so middleware lets us through.
            setIsLoaded(true);
          });
        return; // Don't proceed with loading history – we are unauthenticated
      }
      
      dbHistory.getHistory().then(history => {
        setHistoryList(history);
        setIsLoaded(true);
      });
    }
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        localStorage.removeItem('user_display_name');
        localStorage.removeItem('user_email');
        setUserName('');
        setUserEmail('');
        router.push('/login');
        router.refresh();
      }
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  // Generate 8-character unique alphanumeric room ID
  const generateShortRoomId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateRoom = () => {
    if (!userName.trim()) {
      alert('Profile name is invalid. Please log in again.');
      return;
    }
    const newRoomId = generateShortRoomId();
    dbHistory.addHistory(newRoomId, userName, 1);
    router.push(`/room/${newRoomId}`);
  };

  const handleJoinRoom = (e: React.FormEvent, roomIdInput: string) => {
    e.preventDefault();
    if (!userName.trim()) {
      alert('Profile name is invalid. Please log in again.');
      return;
    }
    if (!roomIdInput.trim()) {
      alert('Please enter a valid Room ID.');
      return;
    }
    
    let cleanedRoomId = roomIdInput.trim();
    
    if (cleanedRoomId.includes('/room/')) {
      const parts = cleanedRoomId.split('/room/');
      cleanedRoomId = parts[parts.length - 1].split(/[?#]/)[0];
    }
    
    cleanedRoomId = cleanedRoomId
      .replace(/^(room\s*id|room|meeting\s*id|meeting)\s*:?\s*/i, '')
      .replace(/[^a-zA-Z0-9-]/g, '')
      .trim();

    if (!cleanedRoomId) {
      alert('Invalid Room ID format.');
      return;
    }

    dbHistory.addHistory(cleanedRoomId, userName, 1);
    router.push(`/room/${cleanedRoomId}`);
  };

  // Don't flash login if still checking storage
  if (!isLoaded) {
    return <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  // If logged in, show Professional Dashboard
  if (userEmail) {
    return (
      <DashboardLayout 
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        historyList={historyList}
        onLogout={handleLogout}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
      />
    );
  }

  // If not logged in, show beautiful landing page
  return <LandingHero />;
}
