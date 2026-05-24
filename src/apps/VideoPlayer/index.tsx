import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play, Pause, Square, SkipBack, SkipForward, Volume2, Volume1, VolumeX,
  Maximize, Minimize, Film, Gauge, ChevronLeft,
} from 'lucide-react';

interface Video {
  id: number;
  title: string;
  duration: number; // seconds
  resolution: string;
  gradient: string;
}

const VIDEOS: Video[] = [
  { id: 1, title: 'Mountain Sunrise Timelapse', duration: 184, resolution: '1920x1080', gradient: 'linear-gradient(135deg, #f97316, #fbbf24)' },
  { id: 2, title: 'Ocean Waves 4K', duration: 312, resolution: '3840x2160', gradient: 'linear-gradient(135deg, #0ea5e9, #06b6d4)' },
  { id: 3, title: 'City Traffic Night', duration: 245, resolution: '1920x1080', gradient: 'linear-gradient(135deg, #1e1b4b, #7c3aed)' },
  { id: 4, title: 'Forest Walk POV', duration: 420, resolution: '2560x1440', gradient: 'linear-gradient(135deg, #166534, #4ade80)' },
  { id: 5, title: 'Northern Lights', duration: 198, resolution: '3840x2160', gradient: 'linear-gradient(135deg, #059669, #a78bfa)' },
  { id: 6, title: 'Rain on Window', duration: 270, resolution: '1920x1080', gradient: 'linear-gradient(135deg, #475569, #94a3b8)' },
  { id: 7, title: 'Fireplace Loop', duration: 600, resolution: '1920x1080', gradient: 'linear-gradient(135deg, #dc2626, #f97316)' },
  { id: 8, title: 'Abstract Particles', duration: 156, resolution: '2560x1440', gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)' },
];

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const SPEEDS = [0.5, 1, 1.5, 2];

export default function VideoPlayer({ windowId: _windowId }: { windowId: string }) {
  const [videos] = useState<Video[]>(VIDEOS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [prevVolume, setPrevVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const progressRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimer = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const currentVideo = videos[currentIndex];

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setProgress(prev => {
          if (prev >= currentVideo.duration) {
            setIsPlaying(false);
            return currentVideo.duration;
          }
          return prev + (0.1 * speed);
        });
      }, 100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, speed, currentVideo]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          setIsPlaying(p => !p);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setProgress(p => Math.max(0, p - 10));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setProgress(p => Math.min(currentVideo.duration, p + 10));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(v => Math.min(1, v + 0.1));
          setIsMuted(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(v => Math.max(0, v - 0.1));
          break;
        case 'f':
          toggleFullscreen();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentVideo]);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = window.setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    resetControlsTimer();
    return () => { if (controlsTimer.current) clearTimeout(controlsTimer.current); };
  }, [isPlaying]);

  const handlePlayPause = useCallback(() => setIsPlaying(p => !p), []);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
  }, []);

  const handleSkip = useCallback((seconds: number) => {
    setProgress(p => Math.max(0, Math.min(currentVideo.duration, p + seconds)));
  }, [currentVideo]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setProgress(pct * currentVideo.duration);
  }, [currentVideo]);

  const toggleMute = useCallback(() => {
    if (isMuted) { setVolume(prevVolume); setIsMuted(false); }
    else { setPrevVolume(volume); setVolume(0); setIsMuted(true); }
  }, [isMuted, volume, prevVolume]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  const selectVideo = useCallback((idx: number) => {
    setCurrentIndex(idx);
    setProgress(0);
    setIsPlaying(false);
  }, []);

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="w-full h-full flex flex-col" style={{ background: 'var(--bg-workspace)', color: 'var(--text-primary)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b shrink-0" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-window)' }}>
        <div className="flex items-center gap-2">
          <Film size={16} style={{ color: 'var(--accent-silver)' }} />
          <span className="text-sm font-medium">视频播放器</span>
        </div>
        <button onClick={() => setShowSidebar(!showSidebar)} className="p-1 rounded hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-secondary)' }}>
          <ChevronLeft size={16} className={showSidebar ? '' : 'rotate-180'} />
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Video area */}
        <div ref={containerRef} className="flex-1 flex flex-col relative"
          onMouseMove={resetControlsTimer}
          style={{ background: '#000' }}>
          {/* Video display */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0" style={{ background: currentVideo.gradient, opacity: isPlaying ? 0.9 : 0.7 }} />

            {/* Fake video content */}
            <div className="relative z-10 flex flex-col items-center">
              {isPlaying && (
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="w-1.5 rounded-full" style={{
                      height: `${20 + Math.random() * 30}px`,
                      background: 'rgba(255,255,255,0.6)',
                      animation: `vid-bar ${0.3 + Math.random() * 0.5}s ease-in-out infinite alternate`,
                      animationDelay: `${i * 0.1}s`,
                    }} />
                  ))}
                </div>
              )}
              {!isPlaying && progress === 0 && (
                <button onClick={handlePlayPause}
                  className="w-20 h-20 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 transition-colors">
                  <Play size={36} className="ml-1" style={{ color: '#fff' }} />
                </button>
              )}
              {!isPlaying && progress > 0 && (
                <button onClick={handlePlayPause}
                  className="w-20 h-20 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 transition-colors">
                  <Play size={36} className="ml-1" style={{ color: '#fff' }} />
                </button>
              )}
            </div>

            {/* Video info overlay */}
            <div className={`absolute top-0 left-0 right-0 p-3 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}
              style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}>
              <div className="text-white text-sm font-medium">{currentVideo.title}</div>
              <div className="text-white/60 text-xs">{currentVideo.resolution}</div>
            </div>
          </div>

          {/* Controls overlay */}
          <div className={`absolute bottom-0 left-0 right-0 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
            {/* Progress */}
            <div className="px-3 pt-3">
              <div ref={progressRef} onClick={handleProgressClick}
                className="w-full h-1.5 rounded-full cursor-pointer group relative" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <div className="h-full rounded-full" style={{ width: `${(progress / currentVideo.duration) * 100}%`, background: 'var(--accent-silver)' }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `calc(${(progress / currentVideo.duration) * 100}% - 6px)`, background: 'var(--accent-silver)' }} />
              </div>
            </div>

            {/* Buttons row */}
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-3">
                <button onClick={handlePlayPause} className="hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button onClick={handleStop} className="hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  <Square size={18} />
                </button>
                <button onClick={() => handleSkip(-10)} className="hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  <SkipBack size={18} />
                </button>
                <button onClick={() => handleSkip(10)} className="hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  <SkipForward size={18} />
                </button>

                {/* Volume */}
                <div className="flex items-center gap-1.5 group/vol">
                  <button onClick={toggleMute} className="hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    <VolumeIcon size={18} />
                  </button>
                  <input type="range" min={0} max={1} step={0.01} value={isMuted ? 0 : volume}
                    onChange={e => { setVolume(Number(e.target.value)); setIsMuted(false); }}
                    className="w-20 h-1 accent-white cursor-pointer opacity-0 group-hover/vol:opacity-100 transition-opacity" />
                </div>

                <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {formatTime(progress)} / {formatTime(currentVideo.duration)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Speed */}
                <div className="relative">
                  <button onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-white/10 transition-colors"
                    style={{ color: 'rgba(255,255,255,0.8)' }}>
                    <Gauge size={14} />
                    {speed}x
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 mb-1 rounded-lg overflow-hidden shadow-lg"
                      style={{ background: 'var(--bg-window)', border: '1px solid var(--border-default)' }}>
                      {SPEEDS.map(s => (
                        <button key={s} onClick={() => { setSpeed(s); setShowSpeedMenu(false); }}
                          className="block w-full px-4 py-1.5 text-xs text-left hover:bg-[var(--bg-hover)] transition-colors whitespace-nowrap"
                          style={{ color: speed === s ? 'var(--accent-silver)' : 'var(--text-primary)' }}>
                          {s}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fullscreen */}
                <button onClick={toggleFullscreen} className="hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="w-56 flex flex-col border-l shrink-0" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-window)' }}>
            <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>视频库</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {videos.map((video, idx) => (
                <button key={video.id} onClick={() => selectVideo(idx)}
                  className="w-full text-left p-2.5 transition-colors border-b"
                  style={{ borderColor: 'var(--border-default)', background: idx === currentIndex ? 'var(--bg-hover)' : 'transparent' }}
                  onMouseEnter={e => { if (idx !== currentIndex) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { if (idx !== currentIndex) e.currentTarget.style.background = 'transparent'; }}>
                  <div className="flex gap-2">
                    <div className="w-16 h-10 rounded shrink-0" style={{ background: video.gradient }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: idx === currentIndex ? 'var(--accent-silver)' : 'var(--text-primary)' }}>{video.title}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatTime(video.duration)}</div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{video.resolution}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Shortcuts info */}
            <div className="px-3 py-2 border-t text-[10px]" style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
              <div className="font-medium mb-1">快捷键</div>
              <div>空格: 播放/暂停</div>
              <div>方向键: 快进快退 / 音量</div>
              <div>F: 全屏</div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes vid-bar {
          0% { height: 8px; }
          100% { height: 40px; }
        }
      `}</style>
    </div>
  );
}
