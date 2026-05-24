import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, MicOff, Pause, Play, Square, Trash2, Save, Volume2,
  StopCircle, SkipBack, Edit3, Check, X,
} from 'lucide-react';

interface Recording {
  id: number;
  name: string;
  duration: number;
  blob: Blob | null;
  url: string;
  timestamp: number;
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export default function VoiceRecorder({ windowId: _windowId }: { windowId: string }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [playProgress, setPlayProgress] = useState(0);
  const [playDuration, setPlayDuration] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [mediaSupported, setMediaSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playTimerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Check MediaRecorder support
  useEffect(() => {
    setMediaSupported(typeof MediaRecorder !== 'undefined');
  }, []);

  // Waveform bars state
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(32).fill(0.05));

  const updateWaveform = useCallback(() => {
    if (!analyserRef.current || !isRecording || isPaused) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    const bars = Array.from({ length: 32 }, (_, i) => {
      const idx = Math.floor((i / 32) * data.length);
      return data[idx] / 255;
    });
    setWaveformBars(bars);

    // Compute volume level
    const sum = data.reduce((a, b) => a + b, 0);
    setVolumeLevel(sum / data.length / 255);

    animFrameRef.current = requestAnimationFrame(updateWaveform);
  }, [isRecording, isPaused]);

  useEffect(() => {
    if (isRecording && !isPaused) {
      animFrameRef.current = requestAnimationFrame(updateWaveform);
    }
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isRecording, isPaused, updateWaveform]);

  // Mock waveform when no MediaRecorder
  useEffect(() => {
    if (!mediaSupported && isRecording && !isPaused) {
      const interval = setInterval(() => {
        setWaveformBars(Array.from({ length: 32 }, () => 0.1 + Math.random() * 0.8));
        setVolumeLevel(0.3 + Math.random() * 0.5);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [mediaSupported, isRecording, isPaused]);

  const startRecording = useCallback(async () => {
    if (mediaSupported) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;

        const recorder = new MediaRecorder(stream);
        chunksRef.current = [];
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          const newRec: Recording = {
            id: Date.now(),
            name: `录音 ${recordings.length + 1}`,
            duration: recordTime,
            blob,
            url,
            timestamp: Date.now(),
          };
          setRecordings(prev => [newRec, ...prev]);
          stream.getTracks().forEach(t => t.stop());
        };
        recorder.start(100);
        mediaRecorderRef.current = recorder;
      } catch {
        // Fallback to mock
        setMediaSupported(false);
      }
    }

    setIsRecording(true);
    setIsPaused(false);
    setRecordTime(0);
    setVolumeLevel(0);
  }, [mediaSupported, recordings.length, recordTime]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    if (!mediaSupported) {
      const newRec: Recording = {
        id: Date.now(),
        name: `录音 ${recordings.length + 1}`,
        duration: recordTime,
        blob: null,
        url: '',
        timestamp: Date.now(),
      };
      setRecordings(prev => [newRec, ...prev]);
    }

    setIsRecording(false);
    setIsPaused(false);
    setWaveformBars(Array(32).fill(0.05));
    setVolumeLevel(0);
  }, [mediaSupported, recordings.length, recordTime]);

  const togglePause = useCallback(() => {
    if (!mediaSupported) {
      setIsPaused(p => !p);
      return;
    }
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
      } else {
        mediaRecorderRef.current.pause();
      }
    }
    setIsPaused(p => !p);
  }, [isPaused, mediaSupported]);

  // Timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = window.setInterval(() => {
        setRecordTime(t => t + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording, isPaused]);

  // Playback
  const playRecording = useCallback((rec: Recording) => {
    if (playingId === rec.id) {
      // Stop playing
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      setPlayingId(null);
      setPlayProgress(0);
      return;
    }

    if (!rec.url) return;

    if (audioRef.current) { audioRef.current.pause(); }
    const audio = new Audio(rec.url);
    audioRef.current = audio;
    setPlayingId(rec.id);
    setPlayProgress(0);
    setPlayDuration(rec.duration);

    audio.play();
    playTimerRef.current = window.setInterval(() => {
      if (audio.ended) {
        setPlayingId(null);
        setPlayProgress(0);
        if (playTimerRef.current) clearInterval(playTimerRef.current);
        return;
      }
      setPlayProgress(audio.currentTime);
      setPlayDuration(audio.duration || rec.duration);
    }, 100);

    audio.onended = () => {
      setPlayingId(null);
      setPlayProgress(0);
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [playingId]);

  const deleteRecording = useCallback((id: number) => {
    if (playingId === id) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      setPlayingId(null);
    }
    setRecordings(prev => {
      const rec = prev.find(r => r.id === id);
      if (rec?.url) URL.revokeObjectURL(rec.url);
      return prev.filter(r => r.id !== id);
    });
  }, [playingId]);

  const startEdit = useCallback((rec: Recording) => {
    setEditingId(rec.id);
    setEditName(rec.name);
  }, []);

  const saveEdit = useCallback(() => {
    if (editingId !== null) {
      setRecordings(prev => prev.map(r => r.id === editingId ? { ...r, name: editName } : r));
    }
    setEditingId(null);
    setEditName('');
  }, [editingId, editName]);

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      recordings.forEach(r => { if (r.url) URL.revokeObjectURL(r.url); });
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col" style={{ background: 'var(--bg-workspace)', color: 'var(--text-primary)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b shrink-0" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-window)' }}>
        <div className="flex items-center gap-2">
          <Mic size={16} style={{ color: 'var(--accent-silver)' }} />
          <span className="text-sm font-medium">录音机</span>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {recordings.length} 条录音
        </span>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Main recording area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {/* Waveform visualization */}
          <div className="flex items-end gap-0.5 h-32 mb-6 w-full max-w-md">
            {waveformBars.map((h, i) => (
              <div key={i} className="flex-1 rounded-t transition-all"
                style={{
                  height: `${Math.max(4, h * 128)}px`,
                  background: isRecording && !isPaused
                    ? `hsl(${200 + i * 3}, 70%, ${40 + h * 30}%)`
                    : 'var(--bg-input)',
                  transition: isRecording ? 'height 0.05s ease' : 'height 0.3s ease',
                }} />
            ))}
          </div>

          {/* Recording timer */}
          <div className="text-4xl font-mono font-light mb-2" style={{ color: 'var(--text-primary)' }}>
            {formatDuration(recordTime)}
          </div>

          {/* Volume indicator */}
          {isRecording && (
            <div className="flex items-center gap-2 mb-4 w-48">
              <Volume2 size={14} style={{ color: 'var(--text-muted)' }} />
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
                <div className="h-full rounded-full transition-all" style={{
                  width: `${volumeLevel * 100}%`,
                  background: volumeLevel > 0.8 ? '#ef4444' : volumeLevel > 0.5 ? '#f59e0b' : 'var(--accent-silver)',
                }} />
              </div>
            </div>
          )}

          {/* Status text */}
          <div className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
            {isRecording ? (isPaused ? '录制已暂停' : '录制中...') : '按下按钮开始录制'}
            {!mediaSupported && isRecording && (
              <span className="block mt-1 text-[10px]">（模拟模式 - MediaRecorder 不可用）</span>
            )}
          </div>

          {/* Record controls */}
          <div className="flex items-center gap-4">
            {isRecording ? (
              <>
                <button onClick={togglePause}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-95"
                  style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}>
                  {isPaused ? <Play size={20} /> : <Pause size={20} />}
                </button>
                <button onClick={stopRecording}
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-transform active:scale-95"
                  style={{ background: '#ef4444', color: '#fff' }}>
                  <Square size={24} fill="currentColor" />
                </button>
                <div className="w-12 h-12" />
              </>
            ) : (
              <>
                <div className="w-12 h-12" />
                <button onClick={startRecording}
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-transform active:scale-95"
                  style={{ background: '#ef4444', color: '#fff' }}>
                  <Mic size={28} />
                </button>
                <div className="w-12 h-12" />
              </>
            )}
          </div>
        </div>

        {/* Recordings list sidebar */}
        <div className="w-64 flex flex-col border-l shrink-0" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-window)' }}>
          <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>录音列表</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {recordings.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <MicOff size={24} style={{ color: 'var(--text-muted)' }} />
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>暂无录音</p>
              </div>
            )}
            {recordings.map(rec => (
              <div key={rec.id} className="px-3 py-2.5 border-b transition-colors hover:bg-[var(--bg-hover)]"
                style={{ borderColor: 'var(--border-default)' }}>
                <div className="flex items-center gap-2 mb-1.5">
                  {editingId === rec.id ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        className="flex-1 text-xs px-1.5 py-0.5 rounded outline-none"
                        style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--accent-silver)' }}
                        autoFocus onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }} />
                      <button onClick={saveEdit} className="p-0.5" style={{ color: 'var(--accent-silver)' }}><Check size={12} /></button>
                      <button onClick={() => setEditingId(null)} className="p-0.5" style={{ color: 'var(--text-muted)' }}><X size={12} /></button>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs font-medium flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{rec.name}</span>
                      <button onClick={() => startEdit(rec)} className="p-0.5 opacity-0 group-hover:opacity-100 hover:opacity-100" style={{ color: 'var(--text-muted)' }}>
                        <Edit3 size={10} />
                      </button>
                    </>
                  )}
                </div>

                {/* Progress bar for playing */}
                {playingId === rec.id && rec.url && (
                  <div className="mb-1.5">
                    <div className="w-full h-1 rounded-full" style={{ background: 'var(--bg-input)' }}>
                      <div className="h-full rounded-full" style={{ width: `${playDuration > 0 ? (playProgress / playDuration) * 100 : 0}%`, background: 'var(--accent-silver)' }} />
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{formatDuration(playProgress)}</span>
                      <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{formatDuration(playDuration)}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {formatDuration(rec.duration)} | {new Date(rec.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => playRecording(rec)}
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--bg-hover)]"
                      style={{ color: playingId === rec.id ? 'var(--accent-silver)' : 'var(--text-secondary)' }}
                      disabled={!rec.url}>
                      {playingId === rec.id ? <StopCircle size={12} /> : <Play size={12} />}
                    </button>
                    <button onClick={() => deleteRecording(rec.id)}
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--bg-hover)]"
                      style={{ color: 'var(--text-muted)' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
