import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Pencil, Paintbrush, Eraser, Minus, Square, Circle, PaintBucket, Type,
  Undo2, Redo2, Trash2, Save, Grid3X3, ZoomIn, ZoomOut, Download,
} from 'lucide-react';
import { useFileSystemStore } from '@/stores/useFileSystemStore';

interface PaintProps { windowId: string }

type Tool = 'pencil' | 'brush' | 'eraser' | 'line' | 'rect' | 'circle' | 'fill' | 'text';

const COLORS = [
  '#000000','#FFFFFF','#FF0000','#00FF00','#0000FF','#FFFF00','#FF00FF','#00FFFF',
  '#FF6600','#9933FF','#33CC33','#FF3366','#6633CC','#3399FF','#FF9900','#999999',
  '#333333','#666666','#CCCCCC','#FFD700','#8B4513','#2E8B57','#DC143C','#4169E1',
];

export default function Paint({ windowId }: PaintProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [opacity, setOpacity] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [canvasSize] = useState({ w: 800, h: 600 });

  const createFile = useFileSystemStore((s) => s.createFile);
  const currentDirectory = useFileSystemStore((s) => s.currentDirectory);

  const pushUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setUndoStack((s) => [...s, canvas.toDataURL()]);
    setRedoStack([]);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvasSize.w;
    canvas.height = canvasSize.h;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);
    pushUndo();
  }, []);

  const getPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  };

  const drawLine = (ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getPos(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    if (tool === 'fill') {
      pushUndo();
      floodFill(canvas, Math.round(pos.x), Math.round(pos.y), color);
      return;
    }

    if (tool === 'text') {
      pushUndo();
      const text = prompt('请输入文字:');
      if (text) {
        ctx.fillStyle = color;
        ctx.font = `${brushSize * 4}px sans-serif`;
        ctx.globalAlpha = opacity;
        ctx.fillText(text, pos.x, pos.y);
        ctx.globalAlpha = 1;
      }
      return;
    }

    setDrawing(true);
    setStartPos(pos);
    pushUndo();

    if (tool === 'pencil' || tool === 'brush' || tool === 'eraser') {
      ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
      ctx.lineWidth = tool === 'brush' ? brushSize * 2 : brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing) return;
    const pos = getPos(e);
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    if (tool === 'pencil' || tool === 'brush' || tool === 'eraser') {
      ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
      ctx.lineWidth = tool === 'brush' ? brushSize * 2 : brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = opacity;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    } else if (tool === 'line' || tool === 'rect' || tool === 'circle') {
      const octx = overlay?.getContext('2d');
      if (!overlay || !octx || !startPos) return;
      overlay.width = canvasSize.w;
      overlay.height = canvasSize.h;
      octx.strokeStyle = color;
      octx.lineWidth = brushSize;
      octx.globalAlpha = opacity;
      octx.clearRect(0, 0, overlay.width, overlay.height);

      if (tool === 'line') {
        octx.beginPath();
        octx.moveTo(startPos.x, startPos.y);
        octx.lineTo(pos.x, pos.y);
        octx.stroke();
      } else if (tool === 'rect') {
        octx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
      } else if (tool === 'circle') {
        const rx = Math.abs(pos.x - startPos.x) / 2;
        const ry = Math.abs(pos.y - startPos.y) / 2;
        const cx = startPos.x + (pos.x - startPos.x) / 2;
        const cy = startPos.y + (pos.y - startPos.y) / 2;
        octx.beginPath();
        octx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        octx.stroke();
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!drawing) return;
    const pos = getPos(e);
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !startPos) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.globalAlpha = opacity;

    if (tool === 'line') {
      drawLine(ctx, startPos.x, startPos.y, pos.x, pos.y);
    } else if (tool === 'rect') {
      ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
    } else if (tool === 'circle') {
      const rx = Math.abs(pos.x - startPos.x) / 2;
      const ry = Math.abs(pos.y - startPos.y) / 2;
      const cx = startPos.x + (pos.x - startPos.x) / 2;
      const cy = startPos.y + (pos.y - startPos.y) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    if (overlay) {
      const octx = overlay.getContext('2d');
      octx?.clearRect(0, 0, overlay.width, overlay.height);
    }

    setDrawing(false);
    setStartPos(null);
  };

  const floodFill = (canvas: CanvasRenderingContext2D['canvas'], x: number, y: number, fillColor: string) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const target = getPixel(data, x, y, canvas.width);
    const fill = hexToRgba(fillColor);
    if (target[0] === fill[0] && target[1] === fill[1] && target[2] === fill[2]) return;

    const stack: [number, number][] = [[x, y]];
    const visited = new Set<number>();

    while (stack.length > 0) {
      const [cx, cy] = stack.pop()!;
      const idx = (cy * canvas.width + cx) * 4;
      if (cx < 0 || cx >= canvas.width || cy < 0 || cy >= canvas.height) continue;
      if (visited.has(idx)) continue;
      const px = getPixel(data, cx, cy, canvas.width);
      if (!matchPixel(px, target)) continue;

      visited.add(idx);
      data[idx] = fill[0];
      data[idx + 1] = fill[1];
      data[idx + 2] = fill[2];
      data[idx + 3] = fill[3];

      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const getPixel = (data: Uint8ClampedArray, x: number, y: number, w: number): [number, number, number, number] => {
    const i = (y * w + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  };

  const matchPixel = (a: [number, number, number, number], b: [number, number, number, number]) =>
    a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && Math.abs(a[3] - b[3]) < 32;

  const hexToRgba = (hex: string): [number, number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b, 255];
  };

  const handleUndo = () => {
    if (undoStack.length <= 1) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const prev = undoStack[undoStack.length - 2];
    setRedoStack((r) => [...r, undoStack[undoStack.length - 1]]);
    setUndoStack((u) => u.slice(0, -1));
    const img = new Image();
    img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0); };
    img.src = prev;
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, next]);
    setRedoStack((r) => r.slice(0, -1));
    const img = new Image();
    img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0); };
    img.src = next;
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    pushUndo();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    createFile('painting.png', currentDirectory, dataUrl);
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'painting.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: 'pencil', icon: <Pencil size={16} />, label: '铅笔' },
    { id: 'brush', icon: <Paintbrush size={16} />, label: '画笔' },
    { id: 'eraser', icon: <Eraser size={16} />, label: '橡皮擦' },
    { id: 'line', icon: <Minus size={16} />, label: '线条' },
    { id: 'rect', icon: <Square size={16} />, label: '矩形' },
    { id: 'circle', icon: <Circle size={16} />, label: '圆形' },
    { id: 'fill', icon: <PaintBucket size={16} />, label: '填充' },
    { id: 'text', icon: <Type size={16} />, label: '文字' },
  ];

  return (
    <div className="w-full h-full flex flex-col text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b flex-wrap" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
        {/* Tools */}
        <div className="flex items-center gap-0.5 mr-2">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={t.label}
              className="w-8 h-8 flex items-center justify-center rounded transition-colors"
              style={{
                background: tool === t.id ? 'var(--accent-silver)' : 'transparent',
                color: tool === t.id ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {t.icon}
            </button>
          ))}
        </div>

        <div className="w-px h-6 mx-1" style={{ background: 'var(--border-default)' }} />

        {/* Color */}
        <div className="flex items-center gap-0.5 mr-2">
          <div className="w-7 h-7 rounded border" style={{ background: color, borderColor: 'var(--border-default)' }} />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-7 h-7 cursor-pointer border-0 p-0 bg-transparent"
          />
        </div>

        <div className="w-px h-6 mx-1" style={{ background: 'var(--border-default)' }} />

        {/* Size */}
        <div className="flex items-center gap-1 mr-2">
          <span className="text-xs text-[var(--text-muted)]">大小</span>
          <input
            type="range"
            min={1}
            max={50}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-20"
          />
          <span className="text-xs text-[var(--text-muted)] w-6">{brushSize}</span>
        </div>

        <div className="w-px h-6 mx-1" style={{ background: 'var(--border-default)' }} />

        {/* Opacity */}
        <div className="flex items-center gap-1 mr-2">
          <span className="text-xs text-[var(--text-muted)]">不透明度</span>
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-16"
          />
          <span className="text-xs text-[var(--text-muted)] w-8">{Math.round(opacity * 100)}%</span>
        </div>

        <div className="w-px h-6 mx-1" style={{ background: 'var(--border-default)' }} />

        {/* Actions */}
        <button onClick={handleUndo} title="撤销" className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
          <Undo2 size={16} />
        </button>
        <button onClick={handleRedo} title="重做" className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
          <Redo2 size={16} />
        </button>
        <button onClick={handleClear} title="清空" className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
          <Trash2 size={16} />
        </button>
        <button onClick={() => setShowGrid(!showGrid)} title="网格" className="w-8 h-8 flex items-center justify-center rounded text-[var(--text-secondary)]" style={{ background: showGrid ? 'var(--bg-hover)' : 'transparent' }}>
          <Grid3X3 size={16} />
        </button>

        <div className="flex-1" />

        <button onClick={() => setZoom(Math.max(0.25, zoom - 0.25))} className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
          <ZoomOut size={16} />
        </button>
        <span className="text-xs text-[var(--text-muted)] w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(Math.min(4, zoom + 0.25))} className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
          <ZoomIn size={16} />
        </button>

        <div className="w-px h-6 mx-1" style={{ background: 'var(--border-default)' }} />

        <button onClick={handleSave} title="保存到文件系统" className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
          <Save size={16} />
        </button>
        <button onClick={handleExport} title="下载" className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
          <Download size={16} />
        </button>
      </div>

      {/* Color palette */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className="w-5 h-5 rounded-sm border transition-transform hover:scale-110"
            style={{
              background: c,
              borderColor: color === c ? 'var(--text-primary)' : 'var(--border-default)',
              transform: color === c ? 'scale(1.2)' : undefined,
            }}
          />
        ))}
      </div>

      {/* Canvas area */}
      <div ref={containerRef} className="flex-1 overflow-auto relative" style={{ background: 'var(--bg-input)' }}>
        <div
          className="relative inline-block m-4"
          style={{
            width: canvasSize.w * zoom,
            height: canvasSize.h * zoom,
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}
        >
          <canvas
            ref={canvasRef}
            width={canvasSize.w}
            height={canvasSize.h}
            style={{ width: canvasSize.w * zoom, height: canvasSize.h * zoom, imageRendering: zoom >= 2 ? 'pixelated' : 'auto' }}
            className="cursor-crosshair bg-white"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { if (drawing) handleMouseUp({} as React.MouseEvent); }}
          />
          <canvas
            ref={overlayRef}
            width={canvasSize.w}
            height={canvasSize.h}
            style={{ width: canvasSize.w * zoom, height: canvasSize.h * zoom, position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          />
          {showGrid && (
            <svg
              style={{ position: 'absolute', top: 0, left: 0, width: canvasSize.w * zoom, height: canvasSize.h * zoom, pointerEvents: 'none' }}
            >
              {Array.from({ length: Math.ceil(canvasSize.w / 20) }, (_, i) => (
                <line key={`v${i}`} x1={i * 20 * zoom} y1={0} x2={i * 20 * zoom} y2={canvasSize.h * zoom} stroke="rgba(0,0,0,0.1)" strokeWidth={0.5} />
              ))}
              {Array.from({ length: Math.ceil(canvasSize.h / 20) }, (_, i) => (
                <line key={`h${i}`} x1={0} y1={i * 20 * zoom} x2={canvasSize.w * zoom} y2={i * 20 * zoom} stroke="rgba(0,0,0,0.1)" strokeWidth={0.5} />
              ))}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
