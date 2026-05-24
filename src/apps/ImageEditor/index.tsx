import { useState, useRef, useEffect, useCallback } from 'react';
import {
  SunMedium, Contrast, Droplets, Palette, Wind, Sparkles,
  RotateCw, RotateCcw, FlipHorizontal, FlipVertical,
  Crop, Undo2, Redo2, Eye, EyeOff, Upload, Download,
  ImagePlus, Maximize2,
} from 'lucide-react';

interface ImageEditorProps { windowId: string }

interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
  sharpen: number;
}

const defaultAdj: Adjustments = { brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0, sharpen: 0 };

const filters = [
  { name: '无', css: '' },
  { name: '灰度', css: 'grayscale(100%)' },
  { name: '怀旧', css: 'sepia(100%)' },
  { name: '反转', css: 'invert(100%)' },
  { name: '复古', css: 'sepia(60%) contrast(90%) brightness(110%)' },
  { name: '暖色', css: 'sepia(30%) saturate(140%) brightness(105%)' },
  { name: '冷色', css: 'hue-rotate(180deg) saturate(120%)' },
];

export default function ImageEditor({ windowId }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [adj, setAdj] = useState<Adjustments>({ ...defaultAdj });
  const [activeFilter, setActiveFilter] = useState('');
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [showOriginal, setShowOriginal] = useState(false);
  const [cropping, setCropping] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropEnd, setCropEnd] = useState<{ x: number; y: number } | null>(null);
  const [rotateAngle, setRotateAngle] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [resizeW, setResizeW] = useState('');
  const [resizeH, setResizeH] = useState('');
  const [lockAspect, setLockAspect] = useState(true);
  const [imgNaturalW, setImgNaturalW] = useState(0);
  const [imgNaturalH, setImgNaturalH] = useState(0);

  const pushUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setUndoStack((s) => [...s, canvas.toDataURL()]);
    setRedoStack([]);
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = image.naturalWidth;
    let h = image.naturalHeight;

    if (rotateAngle % 2 === 1) { [w, h] = [h, w]; }

    canvas.width = w;
    canvas.height = h;

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate((rotateAngle * Math.PI) / 2);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    const adjFilter = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%) hue-rotate(${adj.hue}deg) blur(${adj.blur}px)`;
    const combinedFilter = activeFilter ? `${adjFilter} ${activeFilter}` : adjFilter;
    ctx.filter = combinedFilter;

    ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
    ctx.restore();

    if (adj.sharpen > 0) {
      applySharpen(ctx, canvas.width, canvas.height, adj.sharpen / 100);
    }
  }, [image, adj, activeFilter, rotateAngle, flipH, flipV]);

  useEffect(() => { redraw(); }, [redraw]);

  const applySharpen = (ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) => {
    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;
    const copy = new Uint8ClampedArray(d);
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let val = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              val += copy[((y + ky) * w + (x + kx)) * 4 + c] * kernel[(ky + 1) * 3 + (kx + 1)];
            }
          }
          const idx = (y * w + x) * 4 + c;
          d[idx] = Math.min(255, Math.max(0, copy[idx] + (val - copy[idx]) * amount));
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const handleLoadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setImgNaturalW(img.naturalWidth);
        setImgNaturalH(img.naturalHeight);
        setResizeW(String(img.naturalWidth));
        setResizeH(String(img.naturalHeight));
        setAdj({ ...defaultAdj });
        setActiveFilter('');
        setRotateAngle(0);
        setFlipH(false);
        setFlipV(false);
        setUndoStack([]);
        setRedoStack([]);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, canvasRef.current?.toDataURL() || '']);
    setUndoStack((u) => u.slice(0, -1));
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = prev;
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, canvasRef.current?.toDataURL() || '']);
    setRedoStack((r) => r.slice(0, -1));
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = next;
  };

  const handleRotate = (dir: 'cw' | 'ccw') => {
    if (!image) return;
    pushUndo();
    setRotateAngle((a) => (a + (dir === 'cw' ? 1 : 3)) % 4);
  };

  const handleFlip = (axis: 'h' | 'v') => {
    if (!image) return;
    pushUndo();
    if (axis === 'h') setFlipH((f) => !f);
    else setFlipV((f) => !f);
  };

  const handleCrop = () => {
    if (!cropStart || !cropEnd || !image) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    pushUndo();
    const x = Math.min(cropStart.x, cropEnd.x);
    const y = Math.min(cropStart.y, cropEnd.y);
    const w = Math.abs(cropEnd.x - cropStart.x);
    const h = Math.abs(cropEnd.y - cropStart.y);
    if (w < 2 || h < 2) return;

    const data = ctx.getImageData(x, y, w, h);
    canvas.width = w;
    canvas.height = h;
    ctx.putImageData(data, 0, 0);

    setCropping(false);
    setCropStart(null);
    setCropEnd(null);
    setResizeW(String(w));
    setResizeH(String(h));
  };

  const handleResize = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const w = parseInt(resizeW);
    const h = parseInt(resizeH);
    if (isNaN(w) || isNaN(h) || w < 1 || h < 1) return;

    pushUndo();
    const data = canvas.toDataURL();
    const img = new Image();
    img.onload = () => {
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      setImgNaturalW(w);
      setImgNaturalH(h);
    };
    img.src = data;
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropping) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = e.currentTarget.width / rect.width;
    const scaleY = e.currentTarget.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setCropStart({ x, y });
    setCropEnd({ x, y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropping || !cropStart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = e.currentTarget.width / rect.width;
    const scaleY = e.currentTarget.height / rect.height;
    setCropEnd({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    });
  };

  const updateAdj = (key: keyof Adjustments, val: number) => {
    setAdj((a) => ({ ...a, [key]: val }));
  };

  const sliderItems: { key: keyof Adjustments; label: string; icon: React.ReactNode; min: number; max: number }[] = [
    { key: 'brightness', label: '亮度', icon: <SunMedium size={14} />, min: 0, max: 200 },
    { key: 'contrast', label: '对比度', icon: <Contrast size={14} />, min: 0, max: 200 },
    { key: 'saturation', label: '饱和度', icon: <Droplets size={14} />, min: 0, max: 200 },
    { key: 'hue', label: '色调', icon: <Palette size={14} />, min: 0, max: 360 },
    { key: 'blur', label: '模糊', icon: <Wind size={14} />, min: 0, max: 20 },
    { key: 'sharpen', label: '锐化', icon: <Sparkles size={14} />, min: 0, max: 100 },
  ];

  return (
    <div className="w-full h-full flex text-sm" style={{ background: 'var(--bg-workspace)' }}>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLoadImage} />

      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col border-r overflow-y-auto" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
        {/* Open/Save */}
        <div className="flex items-center gap-1 p-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <button onClick={() => fileRef.current?.click()} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-primary)' }}>
            <Upload size={14} /> 打开
          </button>
          <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-primary)' }}>
            <Download size={14} /> 导出
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 p-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <button onClick={handleUndo} disabled={undoStack.length === 0} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs hover:bg-[var(--bg-hover)] disabled:opacity-40" style={{ color: 'var(--text-primary)' }}>
            <Undo2 size={14} /> 撤销
          </button>
          <button onClick={handleRedo} disabled={redoStack.length === 0} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs hover:bg-[var(--bg-hover)] disabled:opacity-40" style={{ color: 'var(--text-primary)' }}>
            <Redo2 size={14} /> 重做
          </button>
        </div>

        {/* Compare */}
        <div className="flex items-center gap-1 p-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <button
            onMouseDown={() => setShowOriginal(true)}
            onMouseUp={() => setShowOriginal(false)}
            onMouseLeave={() => setShowOriginal(false)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-primary)' }}
          >
            {showOriginal ? <Eye size={14} /> : <EyeOff size={14} />} 对比
          </button>
        </div>

        {/* Adjustments */}
        <div className="p-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">调整</div>
          {sliderItems.map((s) => (
            <div key={s.key} className="mb-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                  {s.icon} {s.label}
                </span>
                <span className="text-xs text-[var(--text-muted)]">{adj[s.key]}{s.key === 'hue' ? '°' : s.key === 'blur' ? 'px' : '%'}</span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                value={adj[s.key]}
                onChange={(e) => updateAdj(s.key, Number(e.target.value))}
                className="w-full"
              />
            </div>
          ))}
          <button onClick={() => setAdj({ ...defaultAdj })} className="w-full py-1 rounded text-xs hover:bg-[var(--bg-hover)] text-[var(--text-muted)]">
            全部重置
          </button>
        </div>

        {/* Filters */}
        <div className="p-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">滤镜</div>
          <div className="grid grid-cols-2 gap-1">
            {filters.map((f) => (
              <button
                key={f.name}
                onClick={() => setActiveFilter(f.css)}
                className="py-1.5 px-2 rounded text-xs text-center transition-colors"
                style={{
                  background: activeFilter === f.css ? 'var(--accent-silver)' : 'var(--bg-input)',
                  color: activeFilter === f.css ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        {/* Transform */}
        <div className="p-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">变换</div>
          <div className="grid grid-cols-2 gap-1 mb-2">
            <button onClick={() => handleRotate('ccw')} className="flex items-center justify-center gap-1 py-1.5 rounded text-xs hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-secondary)' }}>
              <RotateCcw size={14} /> -90
            </button>
            <button onClick={() => handleRotate('cw')} className="flex items-center justify-center gap-1 py-1.5 rounded text-xs hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-secondary)' }}>
              <RotateCw size={14} /> +90
            </button>
            <button onClick={() => handleFlip('h')} className="flex items-center justify-center gap-1 py-1.5 rounded text-xs hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-secondary)' }}>
              <FlipHorizontal size={14} /> 水平翻转
            </button>
            <button onClick={() => handleFlip('v')} className="flex items-center justify-center gap-1 py-1.5 rounded text-xs hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-secondary)' }}>
              <FlipVertical size={14} /> 垂直翻转
            </button>
          </div>
        </div>

        {/* Crop */}
        <div className="p-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">裁剪</div>
          <button
            onClick={() => { setCropping(!cropping); setCropStart(null); setCropEnd(null); }}
            className="w-full flex items-center justify-center gap-1 py-1.5 rounded text-xs mb-1"
            style={{ background: cropping ? 'var(--accent-silver)' : 'var(--bg-input)', color: cropping ? '#fff' : 'var(--text-secondary)' }}
          >
            <Crop size={14} /> {cropping ? '取消裁剪' : '裁剪工具'}
          </button>
          {cropping && cropStart && cropEnd && (
            <button onClick={handleCrop} className="w-full py-1.5 rounded text-xs text-white" style={{ background: 'var(--accent-silver)' }}>
              应用裁剪
            </button>
          )}
        </div>

        {/* Resize */}
        <div className="p-2">
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">调整大小</div>
          <div className="flex items-center gap-1 mb-1">
            <input
              type="number"
              value={resizeW}
              onChange={(e) => {
                setResizeW(e.target.value);
                if (lockAspect && imgNaturalW && imgNaturalH) {
                  setResizeH(String(Math.round(Number(e.target.value) * imgNaturalH / imgNaturalW)));
                }
              }}
              className="flex-1 h-7 px-2 rounded text-xs outline-none"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
              placeholder="宽度"
            />
            <span className="text-xs text-[var(--text-muted)]">x</span>
            <input
              type="number"
              value={resizeH}
              onChange={(e) => {
                setResizeH(e.target.value);
                if (lockAspect && imgNaturalW && imgNaturalH) {
                  setResizeW(String(Math.round(Number(e.target.value) * imgNaturalW / imgNaturalH)));
                }
              }}
              className="flex-1 h-7 px-2 rounded text-xs outline-none"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
              placeholder="高度"
            />
          </div>
          <label className="flex items-center gap-1 text-xs text-[var(--text-muted)] mb-2 cursor-pointer">
            <input type="checkbox" checked={lockAspect} onChange={(e) => setLockAspect(e.target.checked)} />
            锁定宽高比
          </label>
          <button onClick={handleResize} className="w-full py-1.5 rounded text-xs hover:bg-[var(--bg-hover)]" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}>
            <Maximize2 size={14} className="inline mr-1" /> 应用调整
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-4" style={{ background: 'var(--bg-input)' }}>
        {!image ? (
          <div
            className="flex flex-col items-center justify-center gap-3 cursor-pointer p-12 rounded-xl border-2 border-dashed"
            style={{ borderColor: 'var(--border-default)' }}
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus size={48} className="text-[var(--text-muted)]" />
            <span className="text-sm text-[var(--text-muted)]">点击打开图片</span>
          </div>
        ) : (
          <div className="relative inline-block">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full"
              style={{
                maxHeight: 'calc(100vh - 200px)',
                cursor: cropping ? 'crosshair' : 'default',
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={() => { if (cropping && cropStart) handleCrop(); }}
            />
            {cropping && cropStart && cropEnd && (
              <div
                className="absolute border-2 border-blue-400 bg-blue-400/10 pointer-events-none"
                style={{
                  left: `${(Math.min(cropStart.x, cropEnd.x) / (canvasRef.current?.width || 1)) * 100}%`,
                  top: `${(Math.min(cropStart.y, cropEnd.y) / (canvasRef.current?.height || 1)) * 100}%`,
                  width: `${(Math.abs(cropEnd.x - cropStart.x) / (canvasRef.current?.width || 1)) * 100}%`,
                  height: `${(Math.abs(cropEnd.y - cropStart.y) / (canvasRef.current?.height || 1)) * 100}%`,
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
