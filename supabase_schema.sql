-- AuraConnect Supabase Database Schema

-- 1. Create users_auth table for authentication
CREATE TABLE public.users_auth (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS) for users_auth
ALTER TABLE public.users_auth ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for signup)
CREATE POLICY "Allow public inserts" ON public.users_auth FOR INSERT WITH CHECK (true);

-- Allow users to read their own data (by email or id)
-- For a simple implementation, if you query by email on login, you might need a service role key 
-- or a policy that allows reading if the email matches.
CREATE POLICY "Allow reading users" ON public.users_auth FOR SELECT USING (true);


-- 2. Create meeting_history table
CREATE TABLE public.meeting_history (
    id TEXT PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "hostName" TEXT NOT NULL,
    "startTime" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    duration TEXT,
    "participantsCount" INTEGER NOT NULL DEFAULT 1
);

-- Set up Row Level Security (RLS) for meeting_history
ALTER TABLE public.meeting_history ENABLE ROW LEVEL SECURITY;

-- Allow public to insert meeting history (since we don't have strict user sessions tied to Supabase Auth)
CREATE POLICY "Allow public inserts on meeting history" ON public.meeting_history FOR INSERT WITH CHECK (true);

-- Allow public to read meeting history
CREATE POLICY "Allow public selects on meeting history" ON public.meeting_history FOR SELECT USING (true);


-- 3. Create meeting_transcripts table (Optional)
CREATE TABLE public.meeting_transcripts (
    id TEXT PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    text TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS) for meeting_transcripts
ALTER TABLE public.meeting_transcripts ENABLE ROW LEVEL SECURITY;

-- Allow public to insert transcriptions
CREATE POLICY "Allow public inserts on meeting transcripts" ON public.meeting_transcripts FOR INSERT WITH CHECK (true);

-- Allow public to read transcriptions
CREATE POLICY "Allow public selects on meeting transcripts" ON public.meeting_transcripts FOR SELECT USING (true);
