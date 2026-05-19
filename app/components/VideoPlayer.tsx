'use client';

import { useEffect, useRef, useState } from 'react';
import { BiMicrophoneOff, BiMicrophone } from 'react-icons/bi';

interface VideoPlayerProps {
  stream: MediaStream | null;
  userName: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isCameraOff?: boolean;
  isSpotlight?: boolean; // Large featured tile (speaker view future)
}

export default function VideoPlayer({
  stream,
  userName,
  isLocal = false,
  isMuted = false,
  isCameraOff = false,
  isSpotlight = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Bind video stream to the video element — robust version with play() retry
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    // Only reassign if the stream actually changed
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    // Ensure autoplay fires even if the element was already mounted
    video.play().catch((err) => {
      // DOMException: play() interrupted — safe to ignore (browser handles it)
      if (err.name !== 'AbortError') {
        console.warn('[VideoPlayer] play() failed:', err);
      }
    });
  }, [stream]);

  // Voice Activity Detection (VAD) using Web Audio API
  useEffect(() => {
    // If stream is missing, muted, or doesn't have audio tracks, stop VAD
    if (!stream || isMuted || stream.getAudioTracks().length === 0) {
      setIsSpeaking(false);
      return;
    }

    try {
      // Initialize AudioContext only once per stream setup
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;
      analyserRef.current = analyser;

      // We clone the stream for the audio context so it doesn't affect the video playback
      const audioSource = audioContext.createMediaStreamSource(new MediaStream([stream.getAudioTracks()[0]]));
      audioSource.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkAudioLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;

        // Threshold for speaking detection (adjustable)
        if (average > 15) {
          setIsSpeaking(true);
        } else {
          setIsSpeaking(false);
        }

        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };

      checkAudioLevel();

      // Cleanup
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        audioSource.disconnect();
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      };
    } catch (err) {
      console.error('[VAD] Failed to initialize AudioContext:', err);
    }
  }, [stream, isMuted]);

  return (
    <div 
      className={`relative group overflow-hidden bg-zinc-900 border-2 rounded-2xl w-full h-full flex items-center justify-center shadow-xl transition-all duration-300 ${
        isSpeaking 
          ? 'border-emerald-500 shadow-emerald-500/20' 
          : 'border-zinc-800/80 hover:border-indigo-500/40 hover:shadow-indigo-500/10'
      }`}
    >
      {/* Subtle ambient gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950/60 pointer-events-none z-10" />

      {/* Video Element */}
      {!isCameraOff && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`absolute inset-0 w-full h-full object-cover rounded-2xl ${
            isLocal ? 'scale-x-[-1]' : ''
          } transition-transform duration-300`}
        />
      ) : (
        /* Avatar Placeholder when Camera Off */
        <div className="flex flex-col items-center justify-center gap-3 z-10">
          <div
            className={`rounded-full flex items-center justify-center text-white font-bold select-none transition-all duration-300 ${
              isSpeaking ? 'shadow-lg shadow-emerald-500/40 scale-105' : 'shadow-lg shadow-indigo-500/25'
            }`}
            style={{
              width: 'clamp(56px, 10vw, 96px)',
              height: 'clamp(56px, 10vw, 96px)',
              fontSize: 'clamp(20px, 4vw, 36px)',
              background: isSpeaking 
                ? 'linear-gradient(135deg, #10b981, #059669)' 
                : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            }}
          >
            {userName ? userName.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="flex items-center gap-2 h-6">
            {isSpeaking ? (
              <div className="flex items-center gap-1">
                <div className="w-1 h-3 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_100ms]" />
                <div className="w-1 h-4 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_200ms]" />
                <div className="w-1 h-2 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_300ms]" />
                <div className="w-1 h-5 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_400ms]" />
                <div className="w-1 h-3 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_500ms]" />
              </div>
            ) : (
              <span className="text-zinc-400 text-xs font-semibold tracking-wide">
                Camera Off
              </span>
            )}
          </div>
        </div>
      )}

      {/* Bottom Info Bar */}
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-8 flex items-end justify-between z-20 bg-gradient-to-t from-zinc-950/80 to-transparent pointer-events-none">
        {/* Name Tag */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-950/70 backdrop-blur-md border border-zinc-700/40 shadow-md pointer-events-auto transition-colors">
          {/* Status Indicator */}
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all ${
            isSpeaking ? 'bg-emerald-400 animate-pulse scale-125' : 'bg-zinc-500'
          }`} />
          
          <span className="text-zinc-100 text-xs font-semibold truncate max-w-[120px]">
            {userName}{isLocal && <span className="text-zinc-400 font-normal ml-1">(You)</span>}
          </span>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2">
          {/* Speaking Indicator Icon */}
          {isSpeaking && !isMuted && (
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center backdrop-blur-sm border border-emerald-500/30 flex-shrink-0 pointer-events-auto">
              <BiMicrophone className="w-4 h-4 animate-pulse" />
            </div>
          )}

          {/* Muted Badge */}
          {isMuted && (
            <div className="w-8 h-8 rounded-lg bg-rose-600/90 text-white flex items-center justify-center shadow-lg backdrop-blur-sm border border-rose-400/20 flex-shrink-0 pointer-events-auto">
              <BiMicrophoneOff className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Hover glow border (only if not speaking to avoid clash) */}
      {!isSpeaking && (
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 group-hover:ring-indigo-500/20 transition-all duration-300 pointer-events-none" />
      )}
    </div>
  );
}
