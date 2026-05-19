import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from './supabase';

const DB_FILE_PATH = path.join(process.cwd(), 'db.json');

// Interface definition for users
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

// Ensure the local database file exists
const initLocalDB = () => {
  if (!fs.existsSync(DB_FILE_PATH)) {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify({ users: [] }, null, 2));
  }
};

export const db = {
  // 1. Get user by email
  getUserByEmail: async (email: string): Promise<UserRecord | null> => {
    const formattedEmail = email.toLowerCase().trim();

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('users_auth')
          .select('*')
          .eq('email', formattedEmail)
          .single();
        
        if (data) return data as UserRecord;
        if (error && error.code !== 'PGRST116') {
          console.error('[DB] Supabase error in getUserByEmail:', error);
        }
      } catch (err) {
        console.error('[DB] Supabase crash in getUserByEmail, falling back to local:', err);
      }
    }

    // Local JSON DB fallback
    initLocalDB();
    try {
      const fileData = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const json = JSON.parse(fileData);
      const user = json.users.find((u: any) => u.email === formattedEmail);
      return user || null;
    } catch (e) {
      console.error('[DB] Local file error in getUserByEmail:', e);
      return null;
    }
  },

  // 2. Insert new user profile
  createUser: async (name: string, email: string, passwordHash: string): Promise<UserRecord | null> => {
    const formattedEmail = email.toLowerCase().trim();
    const newUser: UserRecord = {
      id: Math.random().toString(36).substring(2, 11),
      name,
      email: formattedEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('users_auth')
          .insert([newUser])
          .select()
          .single();

        if (data) return data as UserRecord;
        console.error('[DB] Supabase error creating user:', error);
      } catch (err) {
        console.error('[DB] Supabase crash creating user, falling back to local:', err);
      }
    }

    // Local JSON DB fallback
    initLocalDB();
    try {
      const fileData = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const json = JSON.parse(fileData);
      json.users.push(newUser);
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(json, null, 2));
      return newUser;
    } catch (e) {
      console.error('[DB] Local file error creating user:', e);
      return null;
    }
  },

  // 3. Delete user profile
  deleteUser: async (email: string): Promise<boolean> => {
    const formattedEmail = email.toLowerCase().trim();

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('users_auth')
          .delete()
          .eq('email', formattedEmail);
        
        if (!error) return true;
        console.error('[DB] Supabase error deleting user:', error);
      } catch (err) {
        console.error('[DB] Supabase crash deleting user, falling back to local:', err);
      }
    }

    // Local JSON DB fallback
    initLocalDB();
    try {
      const fileData = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const json = JSON.parse(fileData);
      const initialLength = json.users.length;
      json.users = json.users.filter((u: any) => u.email !== formattedEmail);
      
      if (json.users.length < initialLength) {
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(json, null, 2));
        return true;
      }
      return false; // User not found
    } catch (e) {
      console.error('[DB] Local file error deleting user:', e);
      return false;
    }
  }
};
