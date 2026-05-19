import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../lib/socket';

interface UserInfo {
  socketId: string;
  userId: string;
  name: string;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
}

interface useWebRTCOptions {
  roomId: string;
  userId: string;
  userName: string;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export const useWebRTC = ({ roomId, userId, userName }: useWebRTCOptions) => {
  const socket = getSocket();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, { stream: MediaStream; userName: string }>>({});
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<UserInfo[]>([]);

  // Refs for WebRTC connections
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peersMediaStateRef = useRef<Record<string, { audio: boolean; video: boolean }>>({});
  
  // ICE candidate queues to prevent adding candidates before setRemoteDescription completes
  const iceCandidatesQueueRef = useRef<Record<string, RTCIceCandidateInit[]>>({});

  // 1. Initialize local media stream
  const initLocalStream = async () => {
    try {
      console.log('[WebRTC] Requesting local camera/mic stream...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.warn('[WebRTC] Error acquiring local media:', error);
      // Fallback for audio only if camera is unavailable or in use
      try {
        console.log('[WebRTC] Retrying with audio only fallback...');
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        setLocalStream(audioOnlyStream);
        localStreamRef.current = audioOnlyStream;
        setIsCameraOff(true);
        return audioOnlyStream;
      } catch (audioErr) {
        console.warn('[WebRTC] Microphone or Camera unavailable/in-use. Joining in listen-only/mute mode:', audioErr);
        setLocalStream(null);
        localStreamRef.current = null;
        setIsCameraOff(true);
        setIsMuted(true);
        return null;
      }
    }
  };

  // Helper to process queued ICE candidates once remoteDescription is set
  const processQueuedCandidates = async (socketId: string, pc: RTCPeerConnection) => {
    const queue = iceCandidatesQueueRef.current[socketId] || [];
    console.log(`[WebRTC] Processing ${queue.length} queued ICE candidates for socket ${socketId}`);
    
    for (const candidateInit of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
      } catch (err) {
        console.error(`[WebRTC] Error adding queued ICE candidate for socket ${socketId}:`, err);
      }
    }
    delete iceCandidatesQueueRef.current[socketId];
  };

  // Create standard peer connection
  const createPeerConnection = (targetSocketId: string, remoteUserName: string, currentLocalStream: MediaStream | null) => {
    console.log(`[WebRTC] Creating RTCPeerConnection for ${remoteUserName} (${targetSocketId})`);
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to peer connection if stream is active
    if (currentLocalStream) {
      currentLocalStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, currentLocalStream);
      });
    }

    // Handle ICE Candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          targetSocketId,
          candidate: event.candidate,
        });
      }
    };

    // Handle inbound Remote Stream tracks
    peerConnection.ontrack = (event) => {
      console.log(`[WebRTC] Inbound stream track received from ${remoteUserName}`);
      const remoteStream = event.streams[0];
      setRemoteStreams((prev) => ({
        ...prev,
        [targetSocketId]: {
          stream: remoteStream,
          userName: remoteUserName,
        },
      }));
    };

    // Diagnostics / connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`[WebRTC] Peer connection state with ${remoteUserName}:`, peerConnection.connectionState);
      if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed') {
        handlePeerDisconnect(targetSocketId);
      }
    };

    peersRef.current[targetSocketId] = peerConnection;
    return peerConnection;
  };

  // Peer cleanup
  const handlePeerDisconnect = (socketId: string) => {
    if (peersRef.current[socketId]) {
      peersRef.current[socketId].close();
      delete peersRef.current[socketId];
    }
    setRemoteStreams((prev) => {
      const copy = { ...prev };
      delete copy[socketId];
      return copy;
    });
    setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
    delete iceCandidatesQueueRef.current[socketId];
  };

  // Toggle local Audio mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        socket.emit('toggle-media', { roomId, type: 'audio', enabled: audioTrack.enabled });
      }
    }
  };

  // Toggle local Video active status
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
        socket.emit('toggle-media', { roomId, type: 'video', enabled: videoTrack.enabled });
      }
    }
  };

  // Toggle Screen Sharing
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        console.log('[WebRTC] Requesting screen share stream...');
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);

        const screenTrack = stream.getVideoTracks()[0];

        // Replace local video track with screen track on all peers
        Object.entries(peersRef.current).forEach(([socketId, pc]) => {
          const senders = pc.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        });

        // Listen for when user stops screen share from browser controls
        screenTrack.onended = () => {
          stopScreenShareDirect();
        };
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          console.warn('[WebRTC] Screen share cancelled by user.');
        } else {
          console.error('[WebRTC] Screen share failed:', err);
        }
      }
    } else {
      stopScreenShareDirect();
    }
  };

  const stopScreenShareDirect = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);

    // Restore camera track to all active peer connections
    if (localStreamRef.current) {
      const cameraTrack = localStreamRef.current.getVideoTracks()[0];
      if (cameraTrack) {
        Object.entries(peersRef.current).forEach(([socketId, pc]) => {
          const senders = pc.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(cameraTrack);
          }
        });
      }
    }
  };

  // Join the actual room call
  const startCall = async () => {
    if (!socket.connected) {
      socket.connect();
    }

    // Initialize camera stream
    const currentLocalStream = await initLocalStream();

    // Signal server about joining
    socket.emit('join-room', { roomId, userId, userName });

    // Handle existing users in the room
    socket.on('all-users', async (existingUsers: UserInfo[]) => {
      console.log(`[WebRTC] Found ${existingUsers.length} existing users in the room:`, existingUsers);
      setParticipants(existingUsers);

      // We initiate connections with all existing users (offer/answer handshake)
      for (const peer of existingUsers) {
        const pc = createPeerConnection(peer.socketId, peer.name, currentLocalStream);
        
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          console.log(`[WebRTC] Sending SDP Offer to ${peer.name}`);
          
          socket.emit('offer', {
            targetSocketId: peer.socketId,
            offer,
            senderId: userId,
            senderName: userName,
          });
        } catch (err) {
          console.error('[WebRTC] Error initiating offer:', err);
        }
      }
    });

    // Handle other users joining later
    socket.on('user-joined', (newParticipant: UserInfo) => {
      console.log(`[WebRTC] User joined the call: ${newParticipant.name}`);
      setParticipants((prev) => {
        if (!prev.some((p) => p.socketId === newParticipant.socketId)) {
          return [...prev, newParticipant];
        }
        return prev;
      });
    });

    // Handle SDP offer from inbound peer connection
    socket.on('offer', async ({ senderSocketId, senderId, senderName, offer }) => {
      console.log(`[WebRTC] Received SDP Offer from ${senderName}`);
      
      // Update participants list
      setParticipants((prev) => {
        if (!prev.some((p) => p.socketId === senderSocketId)) {
          return [...prev, { socketId: senderSocketId, userId: senderId, name: senderName }];
        }
        return prev;
      });

      const pc = createPeerConnection(senderSocketId, senderName, localStreamRef.current || currentLocalStream);
      
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        console.log(`[WebRTC] Sending SDP Answer back to ${senderName}`);
        socket.emit('answer', {
          targetSocketId: senderSocketId,
          answer,
        });

        // Remote description is set successfully, process any queued candidates
        await processQueuedCandidates(senderSocketId, pc);

      } catch (err) {
        console.error('[WebRTC] Error responding to offer:', err);
      }
    });

    // Handle SDP answer from outbound peer connection
    socket.on('answer', async ({ senderSocketId, answer }) => {
      console.log(`[WebRTC] Received SDP Answer from socket ${senderSocketId}`);
      const pc = peersRef.current[senderSocketId];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          // Remote description set successfully, process queued candidates
          await processQueuedCandidates(senderSocketId, pc);
        } catch (err) {
          console.error('[WebRTC] Error setting remote description answer:', err);
        }
      }
    });

    // Handle remote ICE candidate
    socket.on('ice-candidate', async ({ senderSocketId, candidate }) => {
      const pc = peersRef.current[senderSocketId];
      
      if (pc && pc.remoteDescription) {
        // Safe to add immediately
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('[WebRTC] Error adding ICE candidate directly:', err);
        }
      } else {
        // Queue until remote description is loaded
        if (!iceCandidatesQueueRef.current[senderSocketId]) {
          iceCandidatesQueueRef.current[senderSocketId] = [];
        }
        iceCandidatesQueueRef.current[senderSocketId].push(candidate);
        // console.log(`[WebRTC] Queued ICE candidate from socket ${senderSocketId} (remoteDesc is not loaded yet)`);
      }
    });

    // Handle user leaving the room
    socket.on('user-left', (leftSocketId: string) => {
      console.log(`[WebRTC] User left the call. Socket: ${leftSocketId}`);
      handlePeerDisconnect(leftSocketId);
    });

    // Handle user controls status
    socket.on('peer-media-toggled', ({ socketId, type, enabled }) => {
      console.log(`[WebRTC] Peer toggled media - Socket: ${socketId}, Type: ${type}, Enabled: ${enabled}`);
      if (!peersMediaStateRef.current[socketId]) {
        peersMediaStateRef.current[socketId] = { audio: true, video: true };
      }
      if (type === 'audio') peersMediaStateRef.current[socketId].audio = enabled;
      if (type === 'video') peersMediaStateRef.current[socketId].video = enabled;

      // Force participant state re-render
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.socketId === socketId) {
            return {
              ...p,
              audioEnabled: type === 'audio' ? enabled : p.audioEnabled,
              videoEnabled: type === 'video' ? enabled : p.videoEnabled,
            };
          }
          return p;
        })
      );
    });
  };

  const leaveCall = () => {
    console.log('[WebRTC] Cleaning up and leaving call...');
    
    // Stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    // Stop screen share tracks
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);

    // Close all WebRTC peer connections
    Object.keys(peersRef.current).forEach((socketId) => {
      peersRef.current[socketId].close();
    });
    peersRef.current = {};
    setRemoteStreams({});
    setParticipants([]);
    iceCandidatesQueueRef.current = {};

    // Turn off socket listeners
    socket.off('all-users');
    socket.off('user-joined');
    socket.off('offer');
    socket.off('answer');
    socket.off('ice-candidate');
    socket.off('user-left');
    socket.off('peer-media-toggled');
    socket.disconnect();
  };

  useEffect(() => {
    return () => {
      leaveCall();
    };
  }, []);

  return {
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
  };
};
