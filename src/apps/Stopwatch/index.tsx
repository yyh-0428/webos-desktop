import { useState, useCallback, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flag } from 'lucide-react';

interface Lap {
  id: number;
  lapTime: number;
  totalTime: number;
}

function formatTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}

function formatLapTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);
  if (minutes > 0) return `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  return `${seconds}.${centiseconds.toString().padStart(2, '0')}s`;
}

export default function Stopwatch({ windowId }: { windowId: string }) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [showSplit, setShowSplit] = useState(false);
  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const lastLapRef = useRef<number>(0);

  const update = useCallback(() => {
    if (startTimeRef.current) setElapsed(Date.now() - startTimeRef.current);
    animFrameRef.current = requestAnimationFrame(update);
  }, []);

  const start = useCallback(() => {
    if (!isRunning) {
      startTimeRef.current = Date.now() - elapsed;
      animFrameRef.current = requestAnimationFrame(update);
      setIsRunning(true);
    }
  }, [isRunning, elapsed, update]);

  const pause = useCallback(() => {
    if (isRunning) { cancelAnimationFrame(animFrameRef.current); setIsRunning(false); }
  }, [isRunning]);

  const reset = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    setIsRunning(false);
    setElapsed(0);
    setLaps([]);
    lastLapRef.current = 0;
  }, []);

  const lap = useCallback(() => {
    if (isRunning) {
      const lapTime = elapsed - lastLapRef.current;
      lastLapRef.current = elapsed;
      setLaps(prev => [{ id: prev.length + 1, lapTime, totalTime: elapsed }, ...prev]);
    }
  }, [isRunning, elapsed]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') { e.preventDefault(); isRunning ? pause() : start(); }
      if (e.code === 'KeyL') { e.preventDefault(); lap(); }
      if (e.code === 'KeyR') { e.preventDefault(); reset(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isRunning, start, pause, lap, reset]);

  useEffect(() => () => cancelAnimationFrame(animFrameRef.current), []);

  const bestLapId = laps.length >= 2
    ? laps.reduce((best, l) => l.lapTime < laps.find(x => x.id === best)!.lapTime ? l.id : best, laps[0].id)
    : null;
  const worstLapId = laps.length >= 2
    ? laps.reduce((worst, l) => l.lapTime > laps.find(x => x.id === worst)!.lapTime ? l.id : worst, laps[0].id)
    : null;

  return (
    <div className="w-full h-full flex flex-col items-center p-4" style={{ background: 'var(--bg-workspace)' }}>
      {/* Time display */}
      <div className="text-center mb-6 mt-4">
        <div className="text-5xl font-mono font-light tracking-wider" style={{ color: 'var(--text-primary)', letterSpacing: '0.1em' }}>
          {formatTime(elapsed)}
        </div>
        {isRunning && <div className="text-xs mt-1" style={{ color: 'var(--accent-silver)' }}>运行中...</div>}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={reset} className="p-3 rounded-full hover:bg-[var(--bg-hover)] transition-colors" style={{ color: 'var(--text-secondary)', background: 'var(--bg-input)' }} title="重置 (R)">
          <RotateCcw size={20} />
        </button>
        <button onClick={isRunning ? pause : start} className="p-4 rounded-full text-white transition-all hover:opacity-90" style={{ background: isRunning ? '#ef4444' : '#22c55e' }} title={isRunning ? '暂停 (空格)' : '开始 (空格)'}>
          {isRunning ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button onClick={lap} disabled={!isRunning} className="p-3 rounded-full hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-30" style={{ color: 'var(--text-secondary)', background: 'var(--bg-input)' }} title="计圈 (L)">
          <Flag size={20} />
        </button>
      </div>

      {/* Lap/Split toggle */}
      {laps.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => setShowSplit(false)} className={`px-2.5 py-0.5 rounded text-[10px] transition-colors ${!showSplit ? 'text-white' : 'text-[var(--text-secondary)]'}`} style={!showSplit ? { background: 'var(--accent-dark-gray)' } : { background: 'var(--bg-input)' }}>计圈时间</button>
          <button onClick={() => setShowSplit(true)} className={`px-2.5 py-0.5 rounded text-[10px] transition-colors ${showSplit ? 'text-white' : 'text-[var(--text-secondary)]'}`} style={showSplit ? { background: 'var(--accent-dark-gray)' } : { background: 'var(--bg-input)' }}>分段时间</button>
        </div>
      )}

      {/* Laps list */}
      <div className="w-full max-w-sm flex-1 overflow-y-auto rounded-lg" style={{ background: 'var(--bg-window)' }}>
        {laps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32">
            <Flag size={20} style={{ color: 'var(--text-muted)' }} />
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>按下计圈记录分段</p>
          </div>
        ) : (
          <div>
            <div className="grid items-center px-3 py-1.5 text-[10px] font-medium border-b" style={{ gridTemplateColumns: '30px 1fr 1fr', borderColor: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)' }}>
              <span>圈数</span><span className="text-right">{showSplit ? '分段' : '计圈时间'}</span><span className="text-right">总计</span>
            </div>
            {laps.map((lapEntry, index) => {
              const isBest = lapEntry.id === bestLapId;
              const isWorst = lapEntry.id === worstLapId;
              const displayTime = showSplit ? laps[laps.length - 1 - index].totalTime : lapEntry.lapTime;
              return (
                <div key={lapEntry.id} className="grid items-center px-3 py-1.5 border-b last:border-b-0 transition-colors" style={{ gridTemplateColumns: '30px 1fr 1fr', borderColor: 'rgba(0,0,0,0.04)', background: isBest ? 'rgba(34,197,94,0.08)' : isWorst ? 'rgba(239,68,68,0.08)' : 'transparent' }}>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{lapEntry.id}</span>
                  <span className="text-xs font-mono text-right" style={{ color: isBest ? '#22c55e' : isWorst ? '#ef4444' : 'var(--text-primary)' }}>
                    {formatLapTime(displayTime)}
                    {isBest && <span className="text-[9px] ml-1">最佳</span>}
                    {isWorst && <span className="text-[9px] ml-1">最差</span>}
                  </span>
                  <span className="text-xs font-mono text-right" style={{ color: 'var(--text-muted)' }}>{formatLapTime(lapEntry.totalTime)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Keyboard hints */}
      <div className="flex items-center gap-3 mt-3 text-[9px]" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-0.5"><kbd className="px-1 py-0.5 rounded" style={{ background: 'var(--bg-input)', border: '1px solid rgba(0,0,0,0.06)' }}>Space</kbd> 开始/暂停</span>
        <span className="flex items-center gap-0.5"><kbd className="px-1 py-0.5 rounded" style={{ background: 'var(--bg-input)', border: '1px solid rgba(0,0,0,0.06)' }}>L</kbd> 计圈</span>
        <span className="flex items-center gap-0.5"><kbd className="px-1 py-0.5 rounded" style={{ background: 'var(--bg-input)', border: '1px solid rgba(0,0,0,0.06)' }}>R</kbd> 重置</span>
      </div>
    </div>
  );
}
