'use client';

import { useState, useEffect, useRef } from 'react';
import { BiX, BiUser, BiCaptions, BiMicrophone, BiVideo, BiMicrophoneOff, BiVideoOff } from 'react-icons/bi';

interface ParticipantInfo {
  socketId: string;
  userId: string;
  name: string;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
}

interface TranscriptItem {
  userName: string;
  text: string;
  timestamp: string;
}

interface SidebarProps {
  participants: ParticipantInfo[];
  localUserName: string;
  isLocalAudioMuted: boolean;
  isLocalVideoOff: boolean;
  isTranscribing: boolean;
  onClose: () => void;
}

export default function Sidebar({
  participants,
  localUserName,
  isLocalAudioMuted,
  isLocalVideoOff,
  isTranscribing,
  onClose,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'people' | 'captions'>('people');
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const recognitionRef = useRef<any>(null);
  const transcriptsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcripts
  useEffect(() => {
    transcriptsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Handle Browser Speech Recognition API (Speech-to-Text)
  useEffect(() => {
    if (typeof window !== 'undefined' && isTranscribing) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        console.log('[AI Transcription] Starting speech recognition API...');
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = false;
        recog.lang = 'en-US';

        recog.onresult = (event: any) => {
          const resultIndex = event.resultIndex;
          const transcriptText = event.results[resultIndex][0].transcript;
          
          if (transcriptText.trim()) {
            setTranscripts((prev) => [
              ...prev,
              {
                userName: localUserName,
                text: transcriptText.trim(),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }
        };

        recog.onerror = (e: any) => {
          console.warn('[AI Transcription] Speech recognition error/unsupported state:', e);
        };

        recog.onend = () => {
          // Restart recognition if it ends while transcribing is still active
          if (isTranscribing && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch {
              // ignore overlap
            }
          }
        };

        recognitionRef.current = recog;
        try {
          recog.start();
        } catch (err) {
          console.error('[AI Transcription] Error starting speech recognition:', err);
        }
      } else {
        // Fallback simulated transcription if browser Speech Recognition is not supported
        console.log('[AI Transcription] WebSpeech API not supported in this browser. Running fallback demo simulation.');
        const mockInterval = setInterval(() => {
          const mockPhrases = [
            "We should structure the WebRTC endpoints step-by-step.",
            "Supabase real-time is extremely fast for synchronization.",
            "Don't forget to enable noise cancellation in getMediaConstraints.",
            "Can everyone see my shared desktop screen?",
            "Let's finalize this meeting summary report."
          ];
          const randomPhrase = mockPhrases[Math.floor(Math.random() * mockPhrases.length)];
          const names = [localUserName, ...participants.map(p => p.name)];
          const randomName = names[Math.floor(Math.random() * names.length)];
          
          setTranscripts((prev) => [
            ...prev,
            {
              userName: randomName,
              text: randomPhrase,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }, 15000); // Add a mock transcript line every 15 seconds

        return () => clearInterval(mockInterval);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
        recognitionRef.current = null;
      }
    };
  }, [isTranscribing, localUserName, participants]);

  return (
    <div className="flex flex-col h-full bg-zinc-950/45 backdrop-blur-md border-l border-zinc-800/80 w-80 shadow-2xl flex-shrink-0 animate-slide-in">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-800/60 bg-zinc-950/80">
        <h2 className="text-zinc-100 font-semibold text-sm tracking-wide">Meeting Details</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
        >
          <BiX className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-zinc-800/60 bg-zinc-950/40 p-1">
        <button
          onClick={() => setActiveTab('people')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'people'
              ? 'bg-zinc-900 border border-zinc-800 text-indigo-400'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <BiUser className="w-4 h-4" />
          <span>People ({participants.length + 1})</span>
        </button>
        <button
          onClick={() => setActiveTab('captions')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'captions'
              ? 'bg-zinc-900 border border-zinc-800 text-indigo-400'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <BiCaptions className="w-4 h-4" />
          <span>AI Transcript</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {activeTab === 'people' ? (
          /* TAB 1: People */
          <div className="space-y-4">
            <h3 className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
              Participants List
            </h3>
            <div className="space-y-2">
              {/* Local Host */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-xs">
                    {localUserName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-zinc-100 text-xs font-medium">{localUserName} (You)</span>
                    <span className="text-[9px] text-zinc-500">Meeting Host</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isLocalAudioMuted ? (
                    <BiMicrophoneOff className="w-4 h-4 text-rose-500" />
                  ) : (
                    <BiMicrophone className="w-4 h-4 text-emerald-500" />
                  )}
                  {isLocalVideoOff ? (
                    <BiVideoOff className="w-4 h-4 text-rose-500" />
                  ) : (
                    <BiVideo className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
              </div>

              {/* Remote Participants */}
              {participants.map((participant, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold text-xs border border-zinc-700">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-zinc-200 text-xs font-medium">{participant.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {participant.audioEnabled === false ? (
                      <BiMicrophoneOff className="w-4 h-4 text-rose-500" />
                    ) : (
                      <BiMicrophone className="w-4 h-4 text-emerald-400" />
                    )}
                    {participant.videoEnabled === false ? (
                      <BiVideoOff className="w-4 h-4 text-rose-500" />
                    ) : (
                      <BiVideo className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* TAB 2: AI Captioning/Transcription */
          <div className="flex flex-col h-full">
            {!isTranscribing ? (
              <div className="flex flex-col items-center justify-center text-center p-6 my-auto">
                <span className="text-3xl mb-2 animate-pulse">🎙️</span>
                <p className="text-zinc-400 font-semibold text-xs">AI Captioning is Off</p>
                <p className="text-zinc-600 text-[10px] mt-1 leading-relaxed">
                  Turn on AI live transcription using the Closed Captions icon in the control bar to view speech text logs here.
                </p>
              </div>
            ) : (
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                    Live Transcription Timeline
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[8px] font-bold uppercase tracking-wider animate-pulse">
                    Live STT Active
                  </span>
                </div>
                
                <div className="space-y-3">
                  {transcripts.length === 0 ? (
                    <p className="text-zinc-500 text-[10px] italic text-center py-8">
                      Listening for voice speech activity...
                    </p>
                  ) : (
                    transcripts.map((t, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/40 space-y-1 animate-fade-in"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-indigo-400 font-semibold">
                            {t.userName}
                          </span>
                          <span className="text-[8px] text-zinc-600 font-medium">{t.timestamp}</span>
                        </div>
                        <p className="text-zinc-200 text-xs leading-relaxed font-medium">
                          {t.text}
                        </p>
                      </div>
                    ))
                  )}
                  <div ref={transcriptsEndRef} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
