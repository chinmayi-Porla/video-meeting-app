import { createClient } from '@supabase/supabase-js';

// Get environment variables or provide fallback for local testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Initialize Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper check to verify if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL !== undefined &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== undefined &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== '' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== ''
  );
};

// ==========================================
// REAL DATABASE & FALLBACK IMPLEMENTATION
// ==========================================
export interface MeetingHistory {
  id: string;
  roomId: string;
  hostName: string;
  startTime: string;
  duration?: string;
  participantsCount: number;
}

export const dbHistory = {
  getHistory: async (): Promise<MeetingHistory[]> => {
    // 1. Try Supabase first if configured
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('meeting_history')
          .select('*')
          .order('startTime', { ascending: false })
          .limit(10);
          
        if (data && !error) {
          return data as MeetingHistory[];
        }
      } catch (err) {
        console.error('[Supabase] Error fetching history:', err);
      }
    }

    // 2. Local Storage Fallback
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem('meeting_history');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addHistory: async (roomId: string, hostName: string, participantsCount: number) => {
    const newItem: MeetingHistory = {
      id: Math.random().toString(36).substr(2, 9),
      roomId,
      hostName,
      startTime: new Date().toISOString(),
      participantsCount,
    };

    // 1. Try Supabase first if configured
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('meeting_history')
          .insert([newItem]);
          
        if (!error) return; // Success! No need for local storage
      } catch (err) {
        console.error('[Supabase] Error saving history:', err);
      }
    }

    // 2. Local Storage Fallback
    if (typeof window === 'undefined') return;
    try {
      const historyStr = localStorage.getItem('meeting_history');
      const history = historyStr ? JSON.parse(historyStr) : [];
      localStorage.setItem('meeting_history', JSON.stringify([newItem, ...history]));
    } catch (e) {
      console.error('Error saving history to mock DB:', e);
    }
  }
};
