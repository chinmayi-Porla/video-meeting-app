import { useState, useRef, useCallback } from 'react';

export function useScreenRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async (localAudioStream: MediaStream | null) => {
    try {
      // 1. Request Screen & System Audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: true, // Captures system audio
      });

      const tracks = [...displayStream.getTracks()];

      // 2. Mix in Local Microphone Audio if available
      if (localAudioStream) {
        const audioTracks = localAudioStream.getAudioTracks();
        if (audioTracks.length > 0) {
          // Note: In a production app, we would use an AudioContext to mix the system audio 
          // and microphone audio into a single track, but some browsers support passing multiple audio tracks.
          // To ensure compatibility, we'll construct a new stream with the video and first available audio.
          // Mixing properly:
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const destination = audioContext.createMediaStreamDestination();
          
          if (displayStream.getAudioTracks().length > 0) {
            const systemSource = audioContext.createMediaStreamSource(new MediaStream([displayStream.getAudioTracks()[0]]));
            systemSource.connect(destination);
          }
          
          const micSource = audioContext.createMediaStreamSource(new MediaStream([audioTracks[0]]));
          micSource.connect(destination);
          
          tracks.push(destination.stream.getAudioTracks()[0]);
        }
      }

      // Create final composite stream
      // We only want 1 video track and 1 mixed audio track
      const videoTrack = displayStream.getVideoTracks()[0];
      const audioTrack = tracks.find(t => t.kind === 'audio');
      
      const combinedStream = new MediaStream([
        videoTrack,
        ...(audioTrack ? [audioTrack] : [])
      ]);
      
      streamRef.current = combinedStream;

      // 3. Initialize MediaRecorder
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      const recorder = new MediaRecorder(combinedStream, MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        // Create and download the video file
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `Meeting_Recording_${new Date().toISOString().replace(/:/g, '-')}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);

        // Reset state
        setIsRecording(false);
        setRecordingTime(0);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      // Handle user clicking "Stop sharing" on the browser native bar
      videoTrack.onended = () => {
        stopRecording();
      };

      // 4. Start Recording
      recorder.start(1000); // collect chunks every second
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        console.warn('Screen recording cancelled by user.');
      } else {
        console.error('Error starting screen recording:', err);
        alert('Could not start screen recording. Please check permissions.');
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return {
    isRecording,
    recordingTime: formatTime(recordingTime),
    startRecording,
    stopRecording
  };
}
