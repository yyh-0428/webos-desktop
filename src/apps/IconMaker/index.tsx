import { useState, useRef, useCallback } from 'react';
import {
  Pencil, PaintBucket, Eraser, Pipette, Undo2, Redo2, Trash2,
  Download, Grid3X3, ZoomIn, ZoomOut, Copy,
} from 'lucide-react';

interface IconMakerProps { windowId: string }

type Tool = 'pencil' | 'fill' | 'eraser' | 'eyedropper';

const PRESETS = [16, 32, 64, 128];
const PREVIEW_SIZES = [16, 32, 64, 128];

const PALETTE = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FF6600', '#9933FF', '#33CC33', '#FF3366',
  '#6633CC', '#3399FF', '#FF9900', '#999999', '#333333', '#666666',
  '#CCCCCC', '#FFD700', '#8B4513', '#2E8B57', '#DC143C', '#4169E1',
];

const templates: Record<string, (string | null)[][]> = {
  heart: Array.from({ length: 16 }, (_, y) =>
    Array.from({ length: 16 }, (_, x) => {
      const cx = x - 7.5, cy = y - 5.5;
      const d1 = Math.sqrt((cx + 2.5) ** 2 + (cy + 2) ** 2);
      const d2 = Math.sqrt((cx - 2.5) ** 2 + (cy + 2) ** 2);
      if (y >= 3 && y <= 12 && ((d1 < 4.5 && y < 7) || (d2 < 4.5 && y < 7) || (Math.abs(cx) < 5 - (y - 7) * 0.6 && y >= 7)))
        return '#FF3366';
      return null;
    })
  ),
  star: Array.from({ length: 16 }, (_, y) =>
    Array.from({ length: 16 }, (_, x) => {
      const cx = x - 7.5, cy = y - 7.5;
      const angle = Math.atan2(cy, cx);
      const dist = Math.sqrt(cx * cx + cy * cy);
      const starAngle = ((angle + Math.PI) / (Math.PI * 2) * 5) % 1;
      const isStar = dist < 6 && (dist < 3 || (starAngle > 0.3 && starAngle < 0.7) || dist < 2);
      return isStar ? '#FFD700' : null;
    })
  ),
  smiley: (() => {
    const grid: (string | null)[][] = Array.from({ length: 16 }, () => Array(16).fill(null));
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const dx = x - 7.5, dy = y - 7.5;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 7 && d > 6) grid[y][x] = '#FFD700';
        if (d <= 6) grid[y][x] = '#FFEE88';
        if (d < 1.2 && ((x === 5 && y === 5) || (x === 10 && y === 5))) grid[y][x] = '#333333';
        if (y === 9 && x >= 4 && x <= 11 && Math.abs(dx) < 4) grid[y][x] = '#333333';
        if (y === 10 && (x === 4 || x === 11) && Math.abs(dx) < 5) grid[y][x] = '#333333';
      }
    }
    return grid;
  })(),
};

export default function IconMaker({ windowId }: IconMakerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gridSize, setGridSize] = useState(16);
  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState('#000000');
  const [pixels, setPixels] = useState<(string | null)[][]>(() =>
    Array.from({ length: 16 }, () => Array(16).fill(null))
  );
  const [undoStack, setUndoStack] = useState<(string | null)[][][]>([]);
  const [redoStack, setRedoStack] = useState<(string | null)[][][]>([]);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(20);

  const pushUndo = useCallback(() => {
    setUndoStack((s) => [...s, pixels.map((r) => [...r])]);
    setRedoStack([]);
  }, [pixels]);

  const resizeGrid = (size: number) => {
    setGridSize(size);
    setPixels(Array.from({ length: size }, () => Array(size).fill(null)));
    setUndoStack([]);
    setRedoStack([]);
    setZoom(Math.max(4, Math.min(32, Math.floor(400 / size))));
  };

  const setPixel = (x: number, y: number, c: string | null) => {
    setPixels((prev) => {
      const next = prev.map((r) => [...r]);
      next[y][x] = c;
      return next;
    });
  };

  const floodFill = (startX: number, startY: number, targetColor: string | null, fillColor: string) => {
    if (targetColor === fillColor) return;
    const stack: [number, number][] = [[startX, startY]];
    const visited = new Set<string>();
    const newPixels = pixels.map((r) => [...r]);

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;
      if (x < 0 || x >= gridSize || y < 0 || y >= gridSize || visited.has(key)) continue;
      if (newPixels[y][x] !== targetColor) continue;
      visited.add(key);
      newPixels[y][x] = fillColor;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    setPixels(newPixels);
  };

  const handleCellClick = (x: number, y: number) => {
    if (tool === 'pencil') {
      pushUndo();
      setPixel(x, y, color);
    } else if (tool === 'eraser') {
      pushUndo();
      setPixel(x, y, null);
    } else if (tool === 'fill') {
      pushUndo();
      floodFill(x, y, pixels[y][x], color);
    } else if (tool === 'eyedropper') {
      const c = pixels[y][x];
      if (c) {
        setColor(c);
        setTool('pencil');
      }
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    setRedoStack((r) => [...r, pixels]);
    setPixels(undoStack[undoStack.length - 1]);
    setUndoStack((u) => u.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    setUndoStack((u) => [...u, pixels]);
    setPixels(redoStack[redoStack.length - 1]);
    setRedoStack((r) => r.slice(0, -1));
  };

  const handleClear = () => {
    pushUndo();
    setPixels(Array.from({ length: gridSize }, () => Array(gridSize).fill(null)));
  };

  const loadTemplate = (name: keyof typeof templates) => {
    pushUndo();
    const tmpl = templates[name];
    const size = tmpl.length;
    setGridSize(size);
    setPixels(tmpl.map((r) => [...r]));
    setZoom(Math.max(4, Math.min(32, Math.floor(400 / size))));
  };

  const exportPNG = () => {
    const canvas = document.createElement('canvas');
    canvas.width = gridSize;
    canvas.height = gridSize;
    const ctx = canvas.getContext('2d')!;
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (pixels[y][x]) {
          ctx.fillStyle = pixels[y][x]!;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    const link = document.createElement('a');
    link.download = `icon-${gridSize}x${gridSize}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const renderPreview = (size: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = gridSize;
    canvas.height = gridSize;
    const ctx = canvas.getContext('2d')!;
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (pixels[y][x]) {
          ctx.fillStyle = pixels[y][x]!;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    return (
      <canvas
        width={gridSize}
        height={gridSize}
        style={{ width: size, height: size, imageRendering: 'pixelated' }}
        ref={(el) => {
          if (el) {
            const ectx = el.getContext('2d')!;
            ectx.clearRect(0, 0, gridSize, gridSize);
            for (let y = 0; y < gridSize; y++) {
              for (let x = 0; x < gridSize; x++) {
                if (pixels[y][x]) {
                  ectx.fillStyle = pixels[y][x]!;
                  ectx.fillRect(x, y, 1, 1);
                }
              }
            }
          }
        }}
        className="border"
        style={{ width: size, height: size, imageRendering: 'pixelated', borderColor: 'var(--border-default)' }}
      />
    );
  };

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: 'pencil', icon: <Pencil size={16} />, label: '铅笔' },
    { id: 'fill', icon: <PaintBucket size={16} />, label: '填充' },
    { id: 'eraser', icon: <Eraser size={16} />, label: '橡皮擦' },
    { id: 'eyedropper', icon: <Pipette size={16} />, label: '吸管' },
  ];

  return (
    <div className="w-full h-full flex flex-col text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
        {/* Tools */}
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

        <div className="w-px h-6 mx-1" style={{ background: 'var(--border-default)' }} />

        {/* Color */}
        <div className="w-7 h-7 rounded border" style={{ background: color, borderColor: 'var(--border-default)' }} />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-7 h-7 cursor-pointer border-0 p-0 bg-transparent" />

        <div className="w-px h-6 mx-1" style={{ background: 'var(--border-default)' }} />

        {/* Size presets */}
        {PRESETS.map((s) => (
          <button
            key={s}
            onClick={() => resizeGrid(s)}
            className="px-2 py-0.5 rounded text-xs"
            style={{
              background: gridSize === s ? 'var(--accent-silver)' : 'var(--bg-input)',
              color: gridSize === s ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {s}x{s}
          </button>
        ))}

        <div className="w-px h-6 mx-1" style={{ background: 'var(--border-default)' }} />

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

        <button onClick={() => setZoom(Math.max(4, zoom - 2))} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
          <ZoomOut size={14} />
        </button>
        <span className="text-xs text-[var(--text-muted)] w-8 text-center">{zoom}px</span>
        <button onClick={() => setZoom(Math.min(40, zoom + 2))} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
          <ZoomIn size={14} />
        </button>

        <div className="w-px h-6 mx-1" style={{ background: 'var(--border-default)' }} />

        <button onClick={exportPNG} title="导出 PNG" className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
          <Download size={16} />
        </button>
      </div>

      {/* Palette */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
        {PALETTE.map((c) => (
          <button
            key={c}
            onClick={() => { setColor(c); setTool('pencil'); }}
            className="w-5 h-5 rounded-sm border transition-transform hover:scale-110"
            style={{
              background: c,
              borderColor: color === c ? 'var(--text-primary)' : 'var(--border-default)',
              transform: color === c ? 'scale(1.2)' : undefined,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center overflow-auto p-4" style={{ background: 'var(--bg-input)' }}>
          <div
            className="inline-grid"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, ${zoom}px)`,
              gridTemplateRows: `repeat(${gridSize}, ${zoom}px)`,
              gap: showGrid ? '1px' : '0px',
              background: showGrid ? '#ccc' : 'transparent',
            }}
          >
            {pixels.map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  onClick={() => handleCellClick(x, y)}
                  onMouseDown={(e) => {
                    if (e.buttons === 1 && (tool === 'pencil' || tool === 'eraser')) {
                      const handler = () => handleCellClick(x, y);
                      const move = (me: MouseEvent) => {
                        const rect = (e.target as HTMLElement).parentElement?.getBoundingClientRect();
                        if (!rect) return;
                        const gx = Math.floor((me.clientX - rect.left) / (zoom + (showGrid ? 1 : 0)));
                        const gy = Math.floor((me.clientY - rect.top) / (zoom + (showGrid ? 1 : 0)));
                        if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) {
                          handler();
                        }
                      };
                      window.addEventListener('mousemove', move);
                      window.addEventListener('mouseup', () => {
                        window.removeEventListener('mousemove', move);
                      }, { once: true });
                    }
                  }}
                  style={{
                    background: cell || '#FFFFFF',
                    cursor: tool === 'eyedropper' ? 'crosshair' : 'pointer',
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* Preview sidebar */}
        <div className="w-40 border-l flex flex-col p-3 gap-3" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-window)' }}>
          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">预览</div>
          {PREVIEW_SIZES.map((s) => (
            <div key={s} className="flex flex-col items-center gap-1">
              <div className="bg-white rounded border flex items-center justify-center" style={{ borderColor: 'var(--border-default)', width: Math.min(s + 8, 120), height: Math.min(s + 8, 120) }}>
                {renderPreview(s)}
              </div>
              <span className="text-xs text-[var(--text-muted)]">{s}px</span>
            </div>
          ))}

          <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mt-2">模板</div>
          {Object.keys(templates).map((name) => (
            <button
              key={name}
              onClick={() => loadTemplate(name as keyof typeof templates)}
              className="py-1.5 rounded text-xs hover:bg-[var(--bg-hover)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {name === 'heart' ? '心形' : name === 'star' ? '星星' : '笑脸'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
