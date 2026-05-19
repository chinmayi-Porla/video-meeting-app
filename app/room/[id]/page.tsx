'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWebRTC } from '../../../hooks/useWebRTC';
import { getSocket } from '../../../lib/socket';
import VideoPlayer from '../../components/VideoPlayer';
import Controls from '../../components/Controls';
import Chat from '../../components/Chat';
import Sidebar from '../../components/Sidebar';
import Whiteboard from '../../components/Whiteboard';
import { useScreenRecorder } from '../../../hooks/useScreenRecorder';
import { BiCopy, BiShareAlt, BiVideo } from 'react-icons/bi';

interface ChatMessage {
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  
  // Safe dynamic parameters parsing compatible across Next versions
  const roomId = typeof params?.id === 'string' ? params.id : '';

  const socket = getSocket();

  const [userName, setUserName] = useState('');
  const [isLobbyReady, setIsLobbyReady] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Panel state toggles
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);

  // Chat messaging
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // User ID generated once per tab session
  const [userId] = useState(() => Math.random().toString(36).substr(2, 9));

  // Initialize WebRTC custom hook
  const {
    localStream,
    remoteStreams,
    isMuted,
    isCameraOff,
    isScreenSharing,
    participants,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    startCall,
    leaveCall,
  } = useWebRTC({
    roomId,
    userId,
    userName,
  });

  // Initialize Screen Recording custom hook
  const { isRecording, recordingTime, startRecording, stopRecording } = useScreenRecorder();

  // 1. Load user display name from authenticated session details
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('user_display_name');
      if (storedName) {
        setUserName(storedName);
        setIsLobbyReady(true);
      } else {
        // Fallback to anonymous if storage is empty
        const promptName = prompt('Please enter your display name to join the meeting:');
        if (promptName && promptName.trim()) {
          setUserName(promptName.trim());
          localStorage.setItem('user_display_name', promptName.trim());
          setIsLobbyReady(true);
        } else {
          router.push('/');
        }
      }
    }
  }, [router]);

  // 2. Start the call once lobby details are ready
  useEffect(() => {
    if (isLobbyReady && userName && roomId) {
      console.log(`[Meeting Room] Initializing call stream in Room: ${roomId}`);
      startCall();

      // Listen for text message broadcasts
      socket.on('receive-message', (msg: ChatMessage) => {
        setMessages((prev) => [...prev, msg]);
        if (!isChatOpen) {
          setUnreadCount((c) => c + 1);
        }
      });

      return () => {
        socket.off('receive-message');
        leaveCall();
      };
    }
  }, [isLobbyReady, userName, roomId]);

  // 3. Clear unread message notifications when opening chat panel
  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
    }
  }, [isChatOpen]);

  // 4. Send message dispatch function
  const handleSendMessage = (text: string) => {
    const timestamp = new Date().toISOString();
    socket.emit('send-message', {
      roomId,
      message: text,
      senderId: userId,
      senderName: userName,
      timestamp,
    });
  };

  // 5. Copy Room link invite helper
  const handleCopyInvite = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // 6. Graceful Leave Meeting redirect
  const handleLeaveCall = () => {
    leaveCall();
    router.push('/');
  };

  // Calculate dynamic grid columns & rows — Zoom-style gallery fill
  const activeRemoteCount = Object.keys(remoteStreams).length;
  const totalTiles = activeRemoteCount + 1; // Remotes + local self-view

  const getGridStyle = (): React.CSSProperties => {
    // Calculate optimal columns for the tile count
    let cols: number;
    if (totalTiles === 1) cols = 1;
    else if (totalTiles === 2) cols = 2;
    else if (totalTiles <= 4) cols = 2;
    else if (totalTiles <= 6) cols = 3;
    else if (totalTiles <= 9) cols = 3;
    else cols = 4;

    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridAutoRows: '1fr',
      gap: '10px',
      width: '100%',
      height: '100%',
      padding: '12px',
    };
  };

  if (!isLobbyReady || !roomId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold tracking-wide">Preparing media connections...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-zinc-100 flex flex-col font-sans overflow-hidden">
      
      {/* Top Header Bar */}
      <header className="px-6 py-4 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/60 flex items-center justify-between z-20">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <BiVideo className="w-5 h-5 text-indigo-500" />
          <span className="text-sm font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            AuraConnect Room
          </span>
          <span className="hidden sm:inline-block text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-lg text-zinc-400 font-semibold uppercase tracking-wide">
            Room: {roomId}
          </span>
        </div>

        {/* Action button bar */}
        <div className="flex items-center gap-4">
          {/* Recording Indicator */}
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full animate-pulse">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              <span className="text-rose-500 text-xs font-bold font-mono tracking-widest">{recordingTime}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyInvite}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 flex items-center gap-2 shadow-sm ${
              copiedLink
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-200'
            }`}
          >
            <BiCopy className="w-4 h-4" />
            <span>{copiedLink ? 'Copied Link!' : 'Copy Invite Link'}</span>
          </button>
          
          <button
            onClick={handleCopyInvite}
            title="Invite collaborators"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 active:scale-95 transition-all"
          >
            <BiShareAlt className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mid Canvas: Videos layout & Sidebars */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        
        {/* Main interactive Video player tiles grid */}
        <div className="flex-1 overflow-hidden relative">
          <div style={getGridStyle()}>
            
            {/* 1. Local User self video tile */}
            <VideoPlayer
              stream={localStream}
              userName={userName}
              isLocal={true}
              isMuted={isMuted}
              isCameraOff={isCameraOff}
            />

            {/* 2. Map of Inbound Active Streams */}
            {Object.entries(remoteStreams).map(([socketId, data]) => {
              const pInfo = participants.find((p) => p.socketId === socketId);
              return (
                <VideoPlayer
                  key={socketId}
                  stream={data.stream}
                  userName={data.userName}
                  isMuted={pInfo?.audioEnabled === false}
                  isCameraOff={pInfo?.videoEnabled === false}
                />
              );
            })}

          </div>
        </div>

        {/* Inbound Right-sided sliding Chat panel */}
        {isChatOpen && (
          <Chat
            messages={messages}
            currentUserId={userId}
            onSendMessage={handleSendMessage}
            onClose={() => setIsChatOpen(false)}
          />
        )}

        {/* Inbound Right-sided sliding Sidebar Panel (Participants / captions) */}
        {isSidebarOpen && (
          <Sidebar
            participants={participants}
            localUserName={userName}
            isLocalAudioMuted={isMuted}
            isLocalVideoOff={isCameraOff}
            isTranscribing={isTranscribing}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Collaborative Whiteboard Overlay */}
        {isWhiteboardOpen && (
          <Whiteboard roomId={roomId} onClose={() => setIsWhiteboardOpen(false)} />
        )}

      </div>

      {/* Floating Bottom Control panel */}
      <div className="py-6 px-4 bg-gradient-to-t from-black via-black/90 to-transparent flex items-center justify-center z-20">
        <Controls
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          isScreenSharing={isScreenSharing}
          isRecording={isRecording}
          isWhiteboardOpen={isWhiteboardOpen}
          isChatOpen={isChatOpen}
          isSidebarOpen={isSidebarOpen}
          isTranscribing={isTranscribing}
          unreadCount={unreadCount}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onToggleScreenShare={toggleScreenShare}
          onToggleRecording={() => isRecording ? stopRecording() : startRecording(localStream)}
          onToggleWhiteboard={() => {
            setIsWhiteboardOpen(!isWhiteboardOpen);
            setIsSidebarOpen(false);
            setIsChatOpen(false);
          }}
          onToggleChat={() => {
            setIsChatOpen(!isChatOpen);
            setIsSidebarOpen(false);
          }}
          onToggleSidebar={() => {
            setIsSidebarOpen(!isSidebarOpen);
            setIsChatOpen(false);
          }}
          onToggleTranscription={() => {
            setIsTranscribing(!isTranscribing);
            if (!isSidebarOpen) {
              setIsSidebarOpen(true);
            }
          }}
          onLeave={handleLeaveCall}
        />
      </div>

    </div>
  );
}
