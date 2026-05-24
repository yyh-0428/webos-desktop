import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, Volume1, VolumeX, Search, ListMusic, Disc3,
  ChevronDown, ChevronUp, Music, User, Album,
} from 'lucide-react';

interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  gradient: string;
}

const PLAYLIST: Song[] = [
  { id: 1, title: 'Midnight Drive', artist: 'Neon Pulse', album: 'City Lights', duration: 234, gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { id: 2, title: 'Ocean Waves', artist: 'Calm Shore', album: 'Serenity', duration: 198, gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
  { id: 3, title: 'Electric Dreams', artist: 'Synthwave Riders', album: 'Retro Future', duration: 312, gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { id: 4, title: 'Mountain Echo', artist: 'Wild Horizons', album: 'Peak', duration: 267, gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { id: 5, title: 'Starlight Serenade', artist: 'Luna Nova', album: 'Celestial', duration: 189, gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
  { id: 6, title: 'Urban Jungle', artist: 'BeatSmith', album: 'Concrete Beats', duration: 245, gradient: 'linear-gradient(135deg, #fccb90, #d57eeb)' },
  { id: 7, title: 'Rainy Afternoon', artist: 'Calm Shore', album: 'Serenity', duration: 201, gradient: 'linear-gradient(135deg, #89f7fe, #66a6ff)' },
  { id: 8, title: 'Neon Streets', artist: 'Neon Pulse', album: 'City Lights', duration: 278, gradient: 'linear-gradient(135deg, #fddb92, #d1fdff)' },
  { id: 9, title: 'Firefly Dance', artist: 'Luna Nova', album: 'Celestial', duration: 156, gradient: 'linear-gradient(135deg, #c3cfe2, #f5f7fa)' },
  { id: 10, title: 'Desert Wind', artist: 'Wild Horizons', album: 'Peak', duration: 293, gradient: 'linear-gradient(135deg, #f6d365, #fda085)' },
  { id: 11, title: 'Pixel Party', artist: 'BeatSmith', album: 'Concrete Beats', duration: 220, gradient: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)' },
  { id: 12, title: 'Gravity Falls', artist: 'Synthwave Riders', album: 'Retro Future', duration: 345, gradient: 'linear-gradient(135deg, #e0c3fc, #8ec5fc)' },
];

type ViewMode = 'playlist' | 'album' | 'artist';
type RepeatMode = 'off' | 'all' | 'one';

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function MusicPlayer({ windowId: _windowId }: { windowId: string }) {
  const [songs] = useState<Song[]>(PLAYLIST);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [prevVolume, setPrevVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('playlist');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const progressRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  const currentSong = songs[currentIndex];

  const filteredSongs = useMemo(() => {
    if (!search.trim()) return songs;
    const q = search.toLowerCase();
    return songs.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q) || s.album.toLowerCase().includes(q));
  }, [songs, search]);

  const albums = useMemo(() => {
    const map = new Map<string, Song[]>();
    songs.forEach(s => { if (!map.has(s.album)) map.set(s.album, []); map.get(s.album)!.push(s); });
    return map;
  }, [songs]);

  const artists = useMemo(() => {
    const map = new Map<string, Song[]>();
    songs.forEach(s => { if (!map.has(s.artist)) map.set(s.artist, []); map.get(s.artist)!.push(s); });
    return map;
  }, [songs]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setProgress(prev => {
          if (prev >= currentSong.duration) {
            handleNext();
            return 0;
          }
          return prev + 0.25;
        });
      }, 250);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, currentSong]);

  const handlePlayPause = useCallback(() => setIsPlaying(p => !p), []);

  const handleNext = useCallback(() => {
    if (repeat === 'one') { setProgress(0); return; }
    if (shuffle) {
      let next: number;
      do { next = Math.floor(Math.random() * songs.length); } while (next === currentIndex && songs.length > 1);
      setCurrentIndex(next);
    } else {
      setCurrentIndex(prev => {
        const next = prev + 1;
        if (next >= songs.length) return repeat === 'all' ? 0 : prev;
        return next;
      });
    }
    setProgress(0);
  }, [shuffle, repeat, songs.length, currentIndex]);

  const handlePrev = useCallback(() => {
    if (progress > 3) { setProgress(0); return; }
    setCurrentIndex(prev => (prev - 1 + songs.length) % songs.length);
    setProgress(0);
  }, [progress, songs.length]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setProgress(pct * currentSong.duration);
  }, [currentSong]);

  const toggleMute = useCallback(() => {
    if (isMuted) { setVolume(prevVolume); setIsMuted(false); }
    else { setPrevVolume(volume); setVolume(0); setIsMuted(true); }
  }, [isMuted, volume, prevVolume]);

  const cycleRepeat = useCallback(() => {
    setRepeat(r => r === 'off' ? 'all' : r === 'all' ? 'one' : 'off');
  }, []);

  const selectSong = useCallback((song: Song) => {
    const idx = songs.findIndex(s => s.id === song.id);
    if (idx >= 0) { setCurrentIndex(idx); setProgress(0); setIsPlaying(true); }
  }, [songs]);

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;

  const eqBars = isPlaying ? [0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.3, 0.7, 0.5, 0.6] : [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];

  return (
    <div className="w-full h-full flex flex-col" style={{ background: 'var(--bg-workspace)', color: 'var(--text-primary)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b shrink-0" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-window)' }}>
        <div className="flex items-center gap-2">
          <Music size={16} style={{ color: 'var(--accent-silver)' }} />
          <span className="text-sm font-medium">音乐播放器</span>
        </div>
        <div className="flex items-center gap-1">
          {(['playlist', 'album', 'artist'] as ViewMode[]).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className="px-2 py-1 rounded text-xs capitalize transition-colors"
              style={{ background: viewMode === mode ? 'var(--accent-silver)' : 'transparent', color: viewMode === mode ? '#fff' : 'var(--text-secondary)' }}>
              {mode === 'playlist' ? <ListMusic size={12} className="inline mr-1" /> : mode === 'album' ? <Album size={12} className="inline mr-1" /> : <User size={12} className="inline mr-1" />}
              {mode === 'playlist' ? '播放列表' : mode === 'album' ? '专辑' : '艺术家'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-64 flex flex-col border-r shrink-0" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-window)' }}>
            {/* Search */}
            <div className="p-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md" style={{ background: 'var(--bg-input)' }}>
                <Search size={14} style={{ color: 'var(--text-muted)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索歌曲..."
                  className="flex-1 bg-transparent text-xs outline-none" style={{ color: 'var(--text-primary)' }} />
              </div>
            </div>

            {/* Song list */}
            <div className="flex-1 overflow-y-auto">
              {viewMode === 'playlist' && filteredSongs.map(song => {
                const isActive = song.id === currentSong.id;
                return (
                  <button key={song.id} onClick={() => selectSong(song)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors"
                    style={{ background: isActive ? 'var(--bg-hover)' : 'transparent' }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                    <div className="w-8 h-8 rounded shrink-0" style={{ background: song.gradient }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: isActive ? 'var(--accent-silver)' : 'var(--text-primary)' }}>{song.title}</div>
                      <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{song.artist}</div>
                    </div>
                    <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>{formatTime(song.duration)}</span>
                  </button>
                );
              })}

              {viewMode === 'album' && Array.from(albums.entries()).map(([album, albumSongs]) => (
                <div key={album}>
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{album}</div>
                  {albumSongs.filter(s => !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.artist.toLowerCase().includes(search.toLowerCase())).map(song => (
                    <button key={song.id} onClick={() => selectSong(song)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left"
                      style={{ background: song.id === currentSong.id ? 'var(--bg-hover)' : 'transparent' }}>
                      <div className="w-6 h-6 rounded shrink-0" style={{ background: song.gradient }} />
                      <div className="text-xs truncate" style={{ color: song.id === currentSong.id ? 'var(--accent-silver)' : 'var(--text-primary)' }}>{song.title}</div>
                    </button>
                  ))}
                </div>
              ))}

              {viewMode === 'artist' && Array.from(artists.entries()).map(([artist, artistSongs]) => (
                <div key={artist}>
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{artist}</div>
                  {artistSongs.filter(s => !search || s.title.toLowerCase().includes(search.toLowerCase())).map(song => (
                    <button key={song.id} onClick={() => selectSong(song)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left"
                      style={{ background: song.id === currentSong.id ? 'var(--bg-hover)' : 'transparent' }}>
                      <div className="text-xs truncate" style={{ color: song.id === currentSong.id ? 'var(--accent-silver)' : 'var(--text-primary)' }}>{song.title}</div>
                      <span className="text-[10px] ml-auto shrink-0" style={{ color: 'var(--text-muted)' }}>{formatTime(song.duration)}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 min-w-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute top-12 right-3 p-1 rounded" style={{ color: 'var(--text-muted)' }}>
            {sidebarOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>

          {/* Album art */}
          <div className="w-48 h-48 rounded-2xl mb-6 shadow-lg relative overflow-hidden" style={{ background: currentSong.gradient }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <Disc3 size={64} className={isPlaying ? 'animate-spin' : ''} style={{ color: 'rgba(255,255,255,0.4)', animationDuration: '3s' }} />
            </div>
          </div>

          {/* Song info */}
          <div className="text-center mb-4">
            <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{currentSong.title}</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{currentSong.artist}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{currentSong.album}</div>
          </div>

          {/* Equalizer visualization */}
          <div className="flex items-end gap-1 h-10 mb-4">
            {eqBars.map((h, i) => (
              <div key={i} className="w-2 rounded-t transition-all"
                style={{
                  height: `${h * 40}px`,
                  background: 'var(--accent-silver)',
                  animation: isPlaying ? `eq-bounce ${0.4 + Math.random() * 0.6}s ease-in-out infinite alternate` : 'none',
                  animationDelay: `${i * 0.05}s`,
                }} />
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-md mb-3">
            <div ref={progressRef} onClick={handleProgressClick}
              className="w-full h-1.5 rounded-full cursor-pointer relative" style={{ background: 'var(--bg-input)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${(progress / currentSong.duration) * 100}%`, background: 'var(--accent-silver)' }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{formatTime(progress)}</span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{formatTime(currentSong.duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => setShuffle(!shuffle)} className="p-2 rounded-full transition-colors"
              style={{ color: shuffle ? 'var(--accent-silver)' : 'var(--text-muted)' }}>
              <Shuffle size={16} />
            </button>
            <button onClick={handlePrev} className="p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors" style={{ color: 'var(--text-primary)' }}>
              <SkipBack size={20} />
            </button>
            <button onClick={handlePlayPause} className="w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-95"
              style={{ background: 'var(--accent-silver)', color: '#fff' }}>
              {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
            </button>
            <button onClick={handleNext} className="p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors" style={{ color: 'var(--text-primary)' }}>
              <SkipForward size={20} />
            </button>
            <button onClick={cycleRepeat} className="p-2 rounded-full transition-colors"
              style={{ color: repeat !== 'off' ? 'var(--accent-silver)' : 'var(--text-muted)' }}>
              <RepeatIcon size={16} />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 w-40">
            <button onClick={toggleMute} className="p-1" style={{ color: 'var(--text-secondary)' }}>
              <VolumeIcon size={16} />
            </button>
            <input type="range" min={0} max={1} step={0.01} value={isMuted ? 0 : volume}
              onChange={e => { setVolume(Number(e.target.value)); setIsMuted(false); }}
              className="flex-1 h-1 accent-[var(--accent-silver)] cursor-pointer" />
          </div>
        </div>
      </div>

      {/* Bottom queue bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-t shrink-0" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-window)' }}>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>队列: {songs.length} 首歌曲</span>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>|</span>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          当前: {currentIndex + 1}/{songs.length}
        </span>
        {shuffle && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-input)', color: 'var(--accent-silver)' }}>随机播放</span>}
        {repeat !== 'off' && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-input)', color: 'var(--accent-silver)' }}>循环 {repeat === 'one' ? '单曲' : '全部'}</span>}
      </div>

      <style>{`
        @keyframes eq-bounce {
          0% { height: 4px; }
          100% { height: 40px; }
        }
      `}</style>
    </div>
  );
}
