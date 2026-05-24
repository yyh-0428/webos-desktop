import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera as CameraIcon, SwitchCamera, Download, Timer, Trash2,
  Circle, StopCircle, X, ImageIcon,
} from 'lucide-react';

interface CapturedPhoto {
  id: number;
  dataUrl: string;
  timestamp: number;
}

const TIMER_OPTIONS = [0, 3, 5, 10];

export default function Camera({ windowId: _windowId }: { windowId: string }) {
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [selectedPhoto, setSelectedPhoto] = useState<CapturedPhoto | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownRef = useRef<number | null>(null);

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraReady(true);
      setCameraError(false);
    } catch {
      setCameraReady(false);
      setCameraError(true);
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [startCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror if front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 300);

    const dataUrl = canvas.toDataURL('image/png');
    setPhotos(prev => [{ id: Date.now(), dataUrl, timestamp: Date.now() }, ...prev]);
  }, [facingMode]);

  const handleCapture = useCallback(() => {
    if (timerSeconds > 0) {
      setCountdown(timerSeconds);
    } else {
      capturePhoto();
    }
  }, [timerSeconds, capturePhoto]);

  // Countdown effect
  useEffect(() => {
    if (countdown === null || countdown <= 0) {
      if (countdown === 0) {
        capturePhoto();
        setCountdown(null);
      }
      return;
    }
    countdownRef.current = window.setTimeout(() => {
      setCountdown(c => c !== null ? c - 1 : null);
    }, 1000);
    return () => { if (countdownRef.current) clearTimeout(countdownRef.current); };
  }, [countdown, capturePhoto]);

  const switchCamera = useCallback(() => {
    setFacingMode(m => m === 'user' ? 'environment' : 'user');
  }, []);

  const downloadPhoto = useCallback((photo: CapturedPhoto) => {
    const a = document.createElement('a');
    a.href = photo.dataUrl;
    a.download = `photo_${new Date(photo.timestamp).toISOString().replace(/[:.]/g, '-')}.png`;
    a.click();
  }, []);

  const deletePhoto = useCallback((id: number) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
    if (selectedPhoto?.id === id) setSelectedPhoto(null);
  }, [selectedPhoto]);

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: 'var(--bg-workspace)', color: 'var(--text-primary)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b shrink-0" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-window)' }}>
        <div className="flex items-center gap-2">
          <CameraIcon size={16} style={{ color: 'var(--accent-silver)' }} />
          <span className="text-sm font-medium">相机</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
            {photos.length} 张照片
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1">
            <Timer size={12} style={{ color: 'var(--text-muted)' }} />
            {TIMER_OPTIONS.map(t => (
              <button key={t} onClick={() => setTimerSeconds(t)}
                className="px-1.5 py-0.5 rounded text-[10px] transition-colors"
                style={{
                  background: timerSeconds === t ? 'var(--accent-silver)' : 'var(--bg-input)',
                  color: timerSeconds === t ? '#fff' : 'var(--text-secondary)',
                }}>
                {t === 0 ? '关闭' : `${t}秒`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Main preview area */}
        <div className="flex-1 flex flex-col items-center justify-center relative" style={{ background: '#1a1a1a' }}>
          {cameraReady ? (
            <>
              <video ref={videoRef} autoPlay playsInline muted
                className="max-w-full max-h-full object-contain"
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} />
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full flex items-center justify-center animate-pulse"
                style={{ background: 'var(--bg-window)' }}>
                <CameraIcon size={40} style={{ color: 'var(--accent-silver)' }} />
              </div>
              {cameraError ? (
                <div className="text-center">
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>相机不可用</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>请授予相机权限或使用带相机的设备</p>
                  <button onClick={startCamera} className="mt-3 px-4 py-2 rounded-lg text-xs font-medium"
                    style={{ background: 'var(--accent-silver)', color: '#fff' }}>
                    重试
                  </button>
                </div>
              ) : (
                <p className="text-sm animate-pulse" style={{ color: 'var(--text-secondary)' }}>正在初始化相机...</p>
              )}
            </div>
          )}

          {/* Countdown overlay */}
          {countdown !== null && countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
              <div className="text-8xl font-bold text-white animate-pulse">{countdown}</div>
            </div>
          )}

          {/* Flash effect */}
          {flash && (
            <div className="absolute inset-0 bg-white z-30 animate-[flash_0.3s_ease-out]" />
          )}

          {/* Bottom controls */}
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6 z-10">
            <button onClick={switchCamera}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
              <SwitchCamera size={18} />
            </button>

            <button onClick={handleCapture} disabled={countdown !== null}
              className="w-16 h-16 rounded-full flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50"
              style={{ background: '#fff', border: '3px solid rgba(255,255,255,0.5)' }}>
              <div className="w-12 h-12 rounded-full" style={{ background: '#ef4444' }} />
            </button>

            <div className="w-10 h-10" /> {/* Spacer for symmetry */}
          </div>
        </div>

        {/* Photo gallery sidebar */}
        <div className="w-48 flex flex-col border-l shrink-0" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-window)' }}>
          <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-default)' }}>
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>相册</span>
            {photos.length > 0 && (
              <button onClick={() => setPhotos([])} className="p-1 rounded hover:bg-[var(--bg-hover)]" title="清空全部" style={{ color: 'var(--text-muted)' }}>
                <Trash2 size={12} />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {photos.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8">
                <ImageIcon size={24} style={{ color: 'var(--text-muted)' }} />
                <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>暂无照片</p>
              </div>
            )}
            {photos.map(photo => (
              <div key={photo.id} className="group relative rounded-lg overflow-hidden cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}>
                <img src={photo.dataUrl} alt="Captured" className="w-full aspect-[4/3] object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button onClick={e => { e.stopPropagation(); downloadPhoto(photo); }}
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/40">
                    <Download size={12} style={{ color: '#fff' }} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); deletePhoto(photo.id); }}
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/40">
                    <Trash2 size={12} style={{ color: '#fff' }} />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 px-1.5 py-0.5 text-[9px]" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                  {formatTime(photo.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Photo viewer modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img src={selectedPhoto.dataUrl} alt="Photo" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" />
            <div className="absolute top-2 right-2 flex gap-2">
              <button onClick={() => downloadPhoto(selectedPhoto)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-black/50 hover:bg-black/70">
                <Download size={14} style={{ color: '#fff' }} />
              </button>
              <button onClick={() => setSelectedPhoto(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-black/50 hover:bg-black/70">
                <X size={14} style={{ color: '#fff' }} />
              </button>
            </div>
            <div className="absolute bottom-2 left-2 text-xs text-white/80 bg-black/50 px-2 py-1 rounded">
              {formatTime(selectedPhoto.timestamp)}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes flash {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
