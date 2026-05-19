'use client';

import { motion, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Video, Zap, Users, Shield, ArrowRight, Sparkles } from 'lucide-react';

export default function LandingHero() {
  const router = useRouter();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 10 },
    },
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden relative font-sans">
      {/* Animated Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/30 blur-[120px] rounded-full pointer-events-none mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />
      <div className="absolute top-[40%] left-[60%] w-[20%] h-[20%] bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none mix-blend-screen animate-pulse" style={{ animationDuration: '6s' }} />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">AuraConnect</span>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <button onClick={() => router.push('/login')} className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
            Sign In
          </button>
          <button onClick={() => router.push('/signup')} className="text-sm font-bold text-white bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-full backdrop-blur-md border border-white/10 transition-all shadow-xl">
            Get Started
          </button>
        </motion.div>
      </nav>

      {/* Main Hero Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6 text-center max-w-5xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold tracking-wide text-zinc-300 uppercase">The future of remote collaboration</span>
          </motion.div>

          {/* Heading */}
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
            Connect clearly. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">Collaborate deeply.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
            Experience real-time video meetings with crystal-clear audio, AI-powered transcription, and interactive whiteboards—designed for the modern workforce.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <button 
              onClick={() => router.push('/signup')}
              className="group relative flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full font-bold text-base hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]"
            >
              <span>Start for free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => router.push('/login')}
              className="flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-zinc-900 border border-zinc-800 text-white rounded-full font-bold text-base hover:bg-zinc-800 active:scale-95 transition-all"
            >
              Sign In
            </button>
          </motion.div>

          {/* Features Grid */}
          <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full text-left">
            {[
              { icon: Zap, title: 'Ultra-Low Latency', desc: 'Powered by WebRTC for instant peer-to-peer media delivery without delays.', color: 'text-amber-400', bg: 'bg-amber-400/10' },
              { icon: Shield, title: 'Secure & Private', desc: 'End-to-end encryption ensures your meetings stay completely confidential.', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
              { icon: Users, title: 'Infinite Canvas', desc: 'Real-time collaborative drawing boards built right into your video calls.', color: 'text-purple-400', bg: 'bg-purple-400/10' },
            ].map((f, i) => (
              <motion.div key={i} variants={itemVariants} className="p-6 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl hover:bg-zinc-900/60 transition-colors group">
                <div className={`w-12 h-12 rounded-2xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
}
