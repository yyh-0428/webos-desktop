import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ZoomIn, ZoomOut, RotateCcw, RotateCw, Maximize, Minimize,
  Image, ChevronLeft, ChevronRight, Play, Pause, Info, RefreshCw,
} from 'lucide-react';

interface ImageItem {
  id: number;
  name: string;
  width: number;
  height: number;
  size: string;
  format: string;
  gradient: string;
}

const IMAGES: ImageItem[] = [
  { id: 1, name: 'sunset_beach.jpg', width: 1920, height: 1080, size: '2.4 MB', format: 'JPEG', gradient: 'linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)' },
  { id: 2, name: 'mountain_view.png', width: 2560, height: 1440, size: '5.1 MB', format: 'PNG', gradient: 'linear-gradient(135deg, #0ea5e9, #10b981, #84cc16)' },
  { id: 3, name: 'city_night.jpg', width: 3840, height: 2160, size: '4.8 MB', format: 'JPEG', gradient: 'linear-gradient(135deg, #1e1b4b, #3730a3, #6366f1)' },
  { id: 4, name: 'flower_macro.tiff', width: 1600, height: 1200, size: '8.2 MB', format: 'TIFF', gradient: 'linear-gradient(135deg, #ec4899, #f43f5e, #ef4444)' },
  { id: 5, name: 'forest_path.webp', width: 1920, height: 1280, size: '1.8 MB', format: 'WebP', gradient: 'linear-gradient(135deg, #166534, #15803d, #22c55e)' },
  { id: 6, name: 'abstract_art.png', width: 1024, height: 1024, size: '3.2 MB', format: 'PNG', gradient: 'linear-gradient(135deg, #f59e0b, #d946ef, #0891b2)' },
  { id: 7, name: 'snow_mountain.jpg', width: 2560, height: 1707, size: '3.9 MB', format: 'JPEG', gradient: 'linear-gradient(135deg, #e2e8f0, #94a3b8, #475569)' },
  { id: 8, name: 'ocean_drone.jpg', width: 3840, height: 2160, size: '6.3 MB', format: 'JPEG', gradient: 'linear-gradient(135deg, #0284c7, #06b6d4, #67e8f9)' },
  { id: 9, name: 'autumn_leaves.png', width: 1920, height: 1080, size: '4.1 MB', format: 'PNG', gradient: 'linear-gradient(135deg, #b45309, #d97706, #fbbf24)' },
  { id: 10, name: 'milky_way.tiff', width: 4096, height: 2731, size: '12.5 MB', format: 'TIFF', gradient: 'linear-gradient(135deg, #0f172a, #1e3a5f, #7c3aed)' },
];

export default function ImageViewer({ windowId: _windowId }: { windowId: string }) {
  const [images] = useState<ImageItem[]>(IMAGES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [fitToWindow, setFitToWindow] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [slideshow, setSlideshow] = useState(false);
  const [slideshowInterval, setSlideshowInterval] = useState(3);

  const containerRef = useRef<HTMLDivElement>(null);
  const slideshowRef = useRef<number | null>(null);

  const currentImage = images[currentIndex];

  // Slideshow
  useEffect(() => {
    if (slideshow) {
      slideshowRef.current = window.setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % images.length);
        setZoom(1);
        setRotation(0);
        setPanX(0);
        setPanY(0);
      }, slideshowInterval * 1000);
    } else if (slideshowRef.current) {
      clearInterval(slideshowRef.current);
    }
    return () => { if (slideshowRef.current) clearInterval(slideshowRef.current); };
  }, [slideshow, slideshowInterval, images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          navigateImage(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigateImage(1);
          break;
        case '+': case '=':
          e.preventDefault();
          setZoom(z => Math.min(5, z + 0.25));
          break;
        case '-':
          e.preventDefault();
          setZoom(z => Math.max(0.1, z - 0.25));
          break;
        case '0':
          e.preventDefault();
          resetView();
          break;
        case 'r':
          e.preventDefault();
          setRotation(r => (r + 90) % 360);
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [images.length]);

  const navigateImage = useCallback((dir: number) => {
    setCurrentIndex(prev => {
      const next = prev + dir;
      if (next < 0) return images.length - 1;
      if (next >= images.length) return 0;
      return next;
    });
    setZoom(1);
    setRotation(0);
    setPanX(0);
    setPanY(0);
  }, [images.length]);

  const resetView = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPanX(0);
    setPanY(0);
    setFitToWindow(true);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom(z => Math.max(0.1, Math.min(5, z + delta)));
    setFitToWindow(false);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  }, [panX, panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

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

  const imageTransform = `translate(${panX}px, ${panY}px) scale(${fitToWindow ? 1 : zoom}) rotate(${rotation}deg)`;

  return (
    <div className="w-full h-full flex flex-col" style={{ background: 'var(--bg-workspace)', color: 'var(--text-primary)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b shrink-0" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-window)' }}>
        <div className="flex items-center gap-2">
          <Image size={16} style={{ color: 'var(--accent-silver)' }} />
          <span className="text-sm font-medium">图片查看器</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{currentIndex + 1} / {images.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowInfo(!showInfo)} className="p-1.5 rounded hover:bg-[var(--bg-hover)]" style={{ color: showInfo ? 'var(--accent-silver)' : 'var(--text-secondary)' }}>
            <Info size={14} />
          </button>
          <button onClick={toggleFullscreen} className="p-1.5 rounded hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-secondary)' }}>
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b shrink-0" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-window)' }}>
        <div className="flex items-center gap-1">
          <button onClick={() => { setZoom(z => Math.min(5, z + 0.25)); setFitToWindow(false); }}
            className="p-1.5 rounded hover:bg-[var(--bg-hover)]" title="放大" style={{ color: 'var(--text-secondary)' }}>
            <ZoomIn size={14} />
          </button>
          <button onClick={() => { setZoom(z => Math.max(0.1, z - 0.25)); setFitToWindow(false); }}
            className="p-1.5 rounded hover:bg-[var(--bg-hover)]" title="缩小" style={{ color: 'var(--text-secondary)' }}>
            <ZoomOut size={14} />
          </button>
          <span className="text-[10px] w-10 text-center font-mono" style={{ color: 'var(--text-muted)' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={resetView} className="p-1.5 rounded hover:bg-[var(--bg-hover)]" title="重置" style={{ color: 'var(--text-secondary)' }}>
            <RefreshCw size={14} />
          </button>

          <div className="w-px h-4 mx-1" style={{ background: 'var(--border-default)' }} />

          <button onClick={() => setRotation(r => (r - 90) % 360)} className="p-1.5 rounded hover:bg-[var(--bg-hover)]" title="向左旋转" style={{ color: 'var(--text-secondary)' }}>
            <RotateCcw size={14} />
          </button>
          <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-1.5 rounded hover:bg-[var(--bg-hover)]" title="向右旋转" style={{ color: 'var(--text-secondary)' }}>
            <RotateCw size={14} />
          </button>

          <div className="w-px h-4 mx-1" style={{ background: 'var(--border-default)' }} />

          <button onClick={() => setFitToWindow(!fitToWindow)} className="px-2 py-1 rounded text-[10px] hover:bg-[var(--bg-hover)]"
            style={{ background: fitToWindow ? 'var(--accent-silver)' : 'transparent', color: fitToWindow ? '#fff' : 'var(--text-secondary)' }}>
            适应
          </button>
          <button onClick={() => { setZoom(1); setFitToWindow(false); }} className="px-2 py-1 rounded text-[10px] hover:bg-[var(--bg-hover)]"
            style={{ color: !fitToWindow && zoom === 1 ? 'var(--accent-silver)' : 'var(--text-secondary)' }}>
            1:1
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => setSlideshow(!slideshow)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] hover:bg-[var(--bg-hover)]"
            style={{ background: slideshow ? 'var(--accent-silver)' : 'transparent', color: slideshow ? '#fff' : 'var(--text-secondary)' }}>
            {slideshow ? <Pause size={10} /> : <Play size={10} />}
            幻灯片
          </button>
          {slideshow && (
            <select value={slideshowInterval} onChange={e => setSlideshowInterval(Number(e.target.value))}
              className="text-[10px] px-1 py-0.5 rounded" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}>
              <option value={2}>2s</option>
              <option value={3}>3s</option>
              <option value={5}>5s</option>
              <option value={10}>10s</option>
            </select>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Main image area */}
        <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-hidden relative"
          style={{ background: 'var(--bg-input)', cursor: isDragging ? 'grabbing' : 'grab' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}>
          {/* Navigation arrows */}
          <button onClick={() => navigateImage(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'var(--bg-window)', color: 'var(--text-secondary)', opacity: 0.8 }}>
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => navigateImage(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'var(--bg-window)', color: 'var(--text-secondary)', opacity: 0.8 }}>
            <ChevronRight size={18} />
          </button>

          {/* Image display */}
          <div style={{ transform: imageTransform, transition: isDragging ? 'none' : 'transform 0.2s ease' }}>
            <div className="rounded-lg shadow-xl" style={{
              width: fitToWindow ? '80%' : `${currentImage.width * 0.4}px`,
              maxWidth: fitToWindow ? '600px' : undefined,
              aspectRatio: `${currentImage.width} / ${currentImage.height}`,
              maxHeight: fitToWindow ? '70vh' : undefined,
              background: currentImage.gradient,
              margin: '0 auto',
            }}>
              <div className="w-full h-full flex items-center justify-center opacity-20">
                <Image size={64} style={{ color: '#fff' }} />
              </div>
            </div>
          </div>

          {/* Info panel */}
          {showInfo && (
            <div className="absolute top-3 right-3 rounded-lg p-3 text-xs shadow-lg z-10"
              style={{ background: 'var(--bg-window)', border: '1px solid var(--border-default)' }}>
              <div className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{currentImage.name}</div>
              <div className="space-y-1" style={{ color: 'var(--text-secondary)' }}>
                <div>尺寸: {currentImage.width} x {currentImage.height}</div>
                <div>大小: {currentImage.size}</div>
                <div>格式: {currentImage.format}</div>
                <div>缩放: {Math.round(zoom * 100)}%</div>
                <div>旋转: {rotation}度</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="flex items-center gap-1 px-3 py-2 border-t overflow-x-auto shrink-0" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-window)' }}>
        {images.map((img, idx) => (
          <button key={img.id} onClick={() => {
            setCurrentIndex(idx);
            setZoom(1);
            setRotation(0);
            setPanX(0);
            setPanY(0);
          }}
            className="shrink-0 rounded overflow-hidden transition-all"
            style={{
              width: 56, height: 40,
              border: idx === currentIndex ? '2px solid var(--accent-silver)' : '2px solid transparent',
              opacity: idx === currentIndex ? 1 : 0.6,
            }}>
            <div className="w-full h-full" style={{ background: img.gradient }} />
          </button>
        ))}
      </div>
    </div>
  );
}
