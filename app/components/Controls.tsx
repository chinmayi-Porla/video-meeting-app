'use client';

import {
  BiMicrophone,
  BiMicrophoneOff,
  BiVideo,
  BiVideoOff,
  BiDesktop,
  BiChat,
  BiSupport,
  BiLogOut,
  BiShow,
  BiDisc,
  BiPen,
  BiHand
} from 'react-icons/bi';

interface ControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  isWhiteboardOpen: boolean;
  isChatOpen: boolean;
  isSidebarOpen: boolean;
  isTranscribing: boolean;
  unreadCount?: number;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleRecording: () => void;
  onToggleWhiteboard: () => void;
  onToggleChat: () => void;
  onToggleSidebar: () => void;
  onToggleTranscription: () => void;
  onLeave: () => void;
}

export default function Controls({
  isMuted,
  isCameraOff,
  isScreenSharing,
  isRecording,
  isWhiteboardOpen,
  isChatOpen,
  isSidebarOpen,
  isTranscribing,
  unreadCount = 0,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onToggleRecording,
  onToggleWhiteboard,
  onToggleChat,
  onToggleSidebar,
  onToggleTranscription,
  onLeave,
}: ControlsProps) {
  return (
    <div className="flex flex-col items-center gap-4 relative z-50 mb-6">
      
      {/* Top Tier: Main Media Controls Capsule */}
      <div className="flex items-center gap-3 px-5 py-3 rounded-[2.5rem] bg-[#1a1a24]/90 backdrop-blur-xl border border-white/5 shadow-2xl">
        
        {/* 1. Mute Microphone */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
            isMuted
              ? 'bg-[#2b2b36] text-white hover:bg-[#363644]'
              : 'bg-[#2b2b36] text-white hover:bg-[#363644]'
          }`}
        >
          {isMuted ? <BiMicrophoneOff className="w-5 h-5" /> : <BiMicrophone className="w-5 h-5" />}
        </button>

        {/* 2. Toggle Camera */}
        <button
          onClick={onToggleCamera}
          title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
            isCameraOff
              ? 'bg-[#2b2b36] text-white hover:bg-[#363644]'
              : 'bg-[#2b2b36] text-white hover:bg-[#363644]'
          }`}
        >
          {isCameraOff ? <BiVideoOff className="w-5 h-5" /> : <BiVideo className="w-5 h-5" />}
        </button>

        {/* 3. Screen Share (Prominent Purple Pill) */}
        <button
          onClick={onToggleScreenShare}
          title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
          className={`h-12 px-6 rounded-full flex items-center justify-center gap-2 font-semibold transition-all duration-200 ${
            isScreenSharing
              ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20'
              : 'bg-[#8b5cf6] text-white hover:bg-[#7c3aed] shadow-lg shadow-[#8b5cf6]/20'
          }`}
        >
          <BiDesktop className="w-5 h-5" />
          <span>{isScreenSharing ? 'Stop' : 'Share'}</span>
        </button>

        {/* 4. Transcription / Captions */}
        <button
          onClick={onToggleTranscription}
          title="Live Captions"
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
            isTranscribing
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
              : 'bg-[#2b2b36] text-white hover:bg-[#363644]'
          }`}
        >
          <BiShow className="w-5 h-5" />
        </button>

        {/* 5. Settings / Sidebar */}
        <button
          onClick={onToggleSidebar}
          title="Room Details"
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
            isSidebarOpen
              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
              : 'bg-[#2b2b36] text-white hover:bg-[#363644]'
          }`}
        >
          <BiSupport className="w-5 h-5" />
        </button>

        {/* 6. Leave Meeting */}
        <button
          onClick={onLeave}
          title="Leave Meeting"
          className="w-12 h-12 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 transition-all duration-200 ml-1"
        >
          <BiLogOut className="w-5 h-5 translate-x-0.5" />
        </button>
      </div>

      {/* Bottom Tier: Secondary Action Floating Buttons */}
      <div className="flex items-center gap-4">
        {/* Whiteboard / Draw */}
        <button
          onClick={onToggleWhiteboard}
          title="Open Whiteboard"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border border-white/5 shadow-lg ${
            isWhiteboardOpen
              ? 'bg-[#8b5cf6] text-white shadow-[#8b5cf6]/30'
              : 'bg-[#2b2b36] text-white hover:bg-[#363644]'
          }`}
        >
          <BiPen className="w-4 h-4" />
        </button>

        {/* Record */}
        <button
          onClick={onToggleRecording}
          title={isRecording ? 'Stop Recording' : 'Record Meeting'}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border border-white/5 shadow-lg ${
            isRecording
              ? 'bg-rose-600 text-white shadow-rose-500/30 animate-pulse'
              : 'bg-[#2b2b36] text-white hover:bg-[#363644]'
          }`}
        >
          <BiDisc className={`w-4 h-4 ${isRecording ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
        </button>

        {/* Chat */}
        <button
          onClick={onToggleChat}
          title="Open Chat"
          className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border border-white/5 shadow-lg ${
            isChatOpen
              ? 'bg-[#8b5cf6] text-white shadow-[#8b5cf6]/30'
              : 'bg-[#8b5cf6] text-white hover:bg-[#7c3aed]'
          }`}
        >
          <BiChat className="w-4 h-4" />
          {unreadCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center border border-zinc-950 animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

    </div>
  );
}
