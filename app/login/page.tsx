'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video, Mail, Lock, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const justRegistered = searchParams?.get('registered') === 'true';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && Object.keys(data.errors).length > 0) {
          const firstKey = Object.keys(data.errors)[0];
          if (data.errors[firstKey] && data.errors[firstKey].length > 0) {
            throw new Error(data.errors[firstKey][0]);
          }
        }
        throw new Error(data.message || data.error || 'Login failed');
      }

      localStorage.setItem('user_display_name', data.user?.name || email.split('@')[0]);
      localStorage.setItem('user_email', data.user?.email || email);
      
      const redirectTo = searchParams?.get('redirectTo');
      if (redirectTo) {
        router.push(decodeURIComponent(redirectTo));
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f13] flex font-sans text-zinc-100 overflow-hidden">
      
      {/* Left Side: Split Hero */}
      <div className="hidden lg:flex flex-1 relative bg-[#16161c] flex-col justify-between p-12 border-r border-white/5 overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[100px] rounded-full pointer-events-none mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />

        {/* Brand */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">AuraConnect</span>
        </motion.div>

        {/* Marketing Copy */}
        <div className="relative z-10 max-w-lg">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
            className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 leading-tight"
          >
            Welcome back to <br/> your remote workspace.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }}
            className="text-lg text-zinc-400 leading-relaxed mb-8"
          >
            Connect instantly with peer-to-peer video, collaborate on infinite whiteboards, and leverage AI transcription.
          </motion.p>

          {/* Social Proof */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/5 w-fit"
          >
            <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#16161c] bg-zinc-800 flex items-center justify-center overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                </div>
              ))}
            </div>
            <div className="text-sm">
              <p className="font-bold text-white">Join 10,000+ users</p>
              <p className="text-zinc-500">collaborating every day.</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md p-8 sm:p-10 bg-[#16161c]/80 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-2xl relative z-10"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-white mb-2">Sign in</h2>
            <p className="text-zinc-400 text-sm">Enter your email and password to access your dashboard.</p>
          </div>

          {justRegistered && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center font-medium">
              🎉 Account created! Please sign in to continue.
            </motion.div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-300 ml-1">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0f0f13] border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-600"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-semibold text-zinc-300">Password</label>
                <a href="#" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0f0f13] border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-600"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all mt-6 disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-8">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-zinc-500 uppercase font-semibold">Or continue with</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex justify-center items-center py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
            </button>
            <button className="flex justify-center items-center py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors">
              <img src="https://www.svgrepo.com/show/512317/github-142.svg" className="w-5 h-5 invert opacity-70" alt="Github" />
            </button>
          </div>

          <p className="text-center text-sm text-zinc-500 mt-8">
            Don't have an account?{' '}
            <button onClick={() => router.push('/signup')} className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
              Sign up
            </button>
          </p>
        </motion.div>
      </div>

    </div>
  );
}
