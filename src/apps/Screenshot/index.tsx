import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Monitor, AppWindow, SquareDashed, Camera, Timer,
  ArrowRight, Square, Type, Highlighter,
  Save, Copy, RotateCcw, Download,
} from 'lucide-react';

interface ScreenshotProps { windowId: string }

type CaptureMode = 'fullscreen' | 'window' | 'selection';
type DelayTime = 0 | 3 | 5 | 10;
type AnnotationTool = 'arrow' | 'rect' | 'text' | 'highlight';
type Annotation = {
  tool: AnnotationTool;
  x1: number; y1: number; x2: number; y2: number;
  text?: string; color: string;
};

export default function Screenshot({ windowId }: ScreenshotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captureMode, setCaptureMode] = useState<CaptureMode>('fullscreen');
  const [delay, setDelay] = useState<DelayTime>(0);
  const [captured, setCaptured] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [annoTool, setAnnoTool] = useState<AnnotationTool>('arrow');
  const [annoColor, setAnnoColor] = useState('#FF0000');
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);

  const ANNO_COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FF6600', '#FFFFFF'];

  const generateScreenshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 800;
    canvas.height = 500;

    // Simulate a captured screen with a gradient background
    const grad = ctx.createLinearGradient(0, 0, 800, 500);
    grad.addColorStop(0, '#1e3a5f');
    grad.addColorStop(0.5, '#2d5a8e');
    grad.addColorStop(1, '#1e3a5f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 500);

    // Simulate some UI elements
    // Top panel
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, 800, 36);

    // Window
    ctx.fillStyle = '#2a2a3e';
    ctx.roundRect(100, 80, 600, 350, 12);
    ctx.fill();

    // Title bar
    ctx.fillStyle = '#3a3a4e';
    ctx.beginPath();
    ctx.roundRect(100, 80, 600, 32, [12, 12, 0, 0]);
    ctx.fill();

    // Window dots
    ctx.fillStyle = '#FF5F57'; ctx.beginPath(); ctx.arc(120, 96, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FEBC2E'; ctx.beginPath(); ctx.arc(138, 96, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#28C840'; ctx.beginPath(); ctx.arc(156, 96, 5, 0, Math.PI * 2); ctx.fill();

    // Content area
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(110, 120, 580, 300);

    // Some text lines
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '14px monospace';
    for (let i = 0; i < 8; i++) {
      const w = 100 + Math.random() * 300;
      ctx.fillStyle = ['rgba(100,200,255,0.5)', 'rgba(200,100,255,0.5)', 'rgba(100,255,150,0.5)', 'rgba(255,200,100,0.5)'][i % 4];
      ctx.fillRect(125, 135 + i * 30, w, 16);
    }

    // Screenshot captured text
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(250, 210, 300, 80);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('截图已捕获', 400, 245);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`${captureMode === 'fullscreen' ? '全屏' : captureMode === 'window' ? '窗口' : '选区'} 模式 - ${new Date().toLocaleTimeString()}`, 400, 275);
    ctx.textAlign = 'start';

    // Taskbar
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 460, 800, 40);

    setAnnotations([]);
    setCaptured(true);
  }, [captureMode]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Redraw the base screenshot
    generateScreenshot();

    // Draw annotations
    for (const anno of annotations) {
      ctx.strokeStyle = anno.color;
      ctx.fillStyle = anno.color;
      ctx.lineWidth = 3;

      switch (anno.tool) {
        case 'arrow': {
          const dx = anno.x2 - anno.x1;
          const dy = anno.y2 - anno.y1;
          const angle = Math.atan2(dy, dx);
          ctx.beginPath();
          ctx.moveTo(anno.x1, anno.y1);
          ctx.lineTo(anno.x2, anno.y2);
          ctx.stroke();
          // Arrowhead
          const headLen = 15;
          ctx.beginPath();
          ctx.moveTo(anno.x2, anno.y2);
          ctx.lineTo(anno.x2 - headLen * Math.cos(angle - 0.4), anno.y2 - headLen * Math.sin(angle - 0.4));
          ctx.moveTo(anno.x2, anno.y2);
          ctx.lineTo(anno.x2 - headLen * Math.cos(angle + 0.4), anno.y2 - headLen * Math.sin(angle + 0.4));
          ctx.stroke();
          break;
        }
        case 'rect': {
          ctx.strokeRect(anno.x1, anno.y1, anno.x2 - anno.x1, anno.y2 - anno.y1);
          break;
        }
        case 'text': {
          ctx.font = '16px sans-serif';
          ctx.fillText(anno.text || '备注', anno.x1, anno.y1);
          break;
        }
        case 'highlight': {
          ctx.fillStyle = anno.color + '40';
          ctx.fillRect(anno.x1, anno.y1, anno.x2 - anno.x1, anno.y2 - anno.y1);
          break;
        }
      }
    }
  }, [annotations, generateScreenshot]);

  useEffect(() => { if (captured) redrawCanvas(); }, [captured, redrawCanvas]);

  const handleCapture = () => {
    if (delay === 0) {
      generateScreenshot();
    } else {
      setCountdown(delay);
      let remaining = delay;
      const interval = setInterval(() => {
        remaining--;
        setCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          setCountdown(null);
          generateScreenshot();
        }
      }, 1000);
    }
  };

  const handleReset = () => {
    setCaptured(false);
    setAnnotations([]);
    setCountdown(null);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!captured) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = e.currentTarget.width / rect.width;
    const scaleY = e.currentTarget.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setDrawing(true);
    setStartPos({ x, y });
    setCurrentPos({ x, y });

    if (annoTool === 'text') {
      const text = prompt('输入标注文本:');
      if (text) {
        setAnnotations((a) => [...a, { tool: 'text', x1: x, y1: y, x2: x, y2: y, text, color: annoColor }]);
      }
      setDrawing(false);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing || !captured) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = e.currentTarget.width / rect.width;
    const scaleY = e.currentTarget.height / rect.height;
    setCurrentPos({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    });
  };

  const handleCanvasMouseUp = () => {
    if (!drawing || !startPos || !currentPos) { setDrawing(false); return; }
    if (annoTool !== 'text') {
      setAnnotations((a) => [...a, {
        tool: annoTool,
        x1: startPos.x, y1: startPos.y,
        x2: currentPos.x, y2: currentPos.y,
        color: annoColor,
      }]);
    }
    setDrawing(false);
    setStartPos(null);
    setCurrentPos(null);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `screenshot-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    } catch {
      // Fallback - just download
      handleSave();
    }
  };

  const modes: { id: CaptureMode; icon: React.ReactNode; label: string }[] = [
    { id: 'fullscreen', icon: <Monitor size={16} />, label: '全屏' },
    { id: 'window', icon: <AppWindow size={16} />, label: '窗口' },
    { id: 'selection', icon: <SquareDashed size={16} />, label: '选区' },
  ];

  const delays: { value: DelayTime; label: string }[] = [
    { value: 0, label: '无' },
    { value: 3, label: '3s' },
    { value: 5, label: '5s' },
    { value: 10, label: '10s' },
  ];

  const annoTools: { id: AnnotationTool; icon: React.ReactNode; label: string }[] = [
    { id: 'arrow', icon: <ArrowRight size={14} />, label: '箭头' },
    { id: 'rect', icon: <Square size={14} />, label: '矩形' },
    { id: 'text', icon: <Type size={14} />, label: '文本' },
    { id: 'highlight', icon: <Highlighter size={14} />, label: '高亮' },
  ];

  return (
    <div className="w-full h-full flex flex-col text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {!captured ? (
        /* Capture options */
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-window)' }}>
            <Camera size={40} className="text-[var(--accent-silver)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">截图</h2>

          {/* Mode selection */}
          <div className="flex gap-2">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setCaptureMode(m.id)}
                className="flex flex-col items-center gap-2 px-5 py-4 rounded-lg transition-colors"
                style={{
                  background: captureMode === m.id ? 'var(--accent-silver)' : 'var(--bg-window)',
                  color: captureMode === m.id ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${captureMode === m.id ? 'var(--accent-silver)' : 'var(--border-default)'}`,
                }}
              >
                {m.icon}
                <span className="text-xs">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Delay */}
          <div className="flex items-center gap-2">
            <Timer size={16} className="text-[var(--text-muted)]" />
            <span className="text-xs text-[var(--text-muted)]">延迟:</span>
            {delays.map((d) => (
              <button
                key={d.value}
                onClick={() => setDelay(d.value)}
                className="px-3 py-1 rounded text-xs"
                style={{
                  background: delay === d.value ? 'var(--accent-silver)' : 'var(--bg-input)',
                  color: delay === d.value ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Capture button */}
          <button
            onClick={handleCapture}
            disabled={countdown !== null}
            className="flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{ background: 'var(--accent-silver)', color: '#fff' }}
          >
            <Camera size={18} />
            {countdown !== null ? `${countdown} 秒后截图...` : '截图'}
          </button>
        </div>
      ) : (
        /* Captured view */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Annotation toolbar */}
          <div className="flex items-center gap-1 px-2 py-1.5 border-b" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
            <span className="text-xs text-[var(--text-muted)] mr-1">标注:</span>
            {annoTools.map((t) => (
              <button
                key={t.id}
                onClick={() => setAnnoTool(t.id)}
                title={t.label}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
                style={{
                  background: annoTool === t.id ? 'var(--accent-silver)' : 'transparent',
                  color: annoTool === t.id ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}

            <div className="w-px h-6 mx-1" style={{ background: 'var(--border-default)' }} />

            {ANNO_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setAnnoColor(c)}
                className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  background: c,
                  borderColor: annoColor === c ? 'var(--text-primary)' : 'transparent',
                }}
              />
            ))}

            <div className="flex-1" />

            <button onClick={handleReset} title="新截图" className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
              <RotateCcw size={14} /> 新截图
            </button>
            <button onClick={handleSave} title="保存" className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
              <Save size={14} /> 保存
            </button>
            <button onClick={handleCopy} title="复制" className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
              <Copy size={14} /> 复制
            </button>
            <button onClick={handleSave} title="下载" className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
              <Download size={14} />
            </button>
          </div>

          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center overflow-auto p-4" style={{ background: 'var(--bg-input)' }}>
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full shadow-lg rounded"
              style={{ cursor: annoTool === 'text' ? 'text' : 'crosshair' }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between px-3 py-1 text-xs border-t" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
            <span>{captureMode === 'fullscreen' ? '全屏' : captureMode === 'window' ? '窗口' : '选区'}截图</span>
            <span>{annotations.length} 个标注</span>
            <span>800 x 500</span>
          </div>
        </div>
      )}
    </div>
  );
}
