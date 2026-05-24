import { useState, useRef, useCallback } from 'react';
import {
  Square, Circle, Minus, Pentagon, Type, Download, Copy,
  ZoomIn, ZoomOut, Grid3X3, Layers, ChevronRight,
} from 'lucide-react';

interface SvgViewerProps { windowId: string }

const templates = {
  logo: `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="90" fill="#3B82F6" opacity="0.2"/>
  <circle cx="100" cy="100" r="60" fill="#3B82F6" opacity="0.4"/>
  <circle cx="100" cy="100" r="30" fill="#3B82F6"/>
  <text x="100" y="108" text-anchor="middle" fill="white" font-size="20" font-family="sans-serif">SVG</text>
</svg>`,
  icon: `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <rect x="8" y="8" width="112" height="112" rx="24" fill="#6366F1"/>
  <path d="M40 90 L64 38 L88 90" stroke="white" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="64" cy="70" r="8" fill="white"/>
</svg>`,
  pattern: `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="checker" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="20" height="20" fill="#E5E7EB"/>
      <rect x="20" y="20" width="20" height="20" fill="#E5E7EB"/>
      <rect x="20" width="20" height="20" fill="#F3F4F6"/>
      <rect y="20" width="20" height="20" fill="#F3F4F6"/>
    </pattern>
  </defs>
  <rect width="200" height="200" fill="url(#checker)"/>
  <circle cx="100" cy="100" r="60" fill="#8B5CF6" opacity="0.8"/>
  <rect x="70" y="70" width="60" height="60" fill="none" stroke="white" stroke-width="4" rx="8"/>
</svg>`,
  chart: `<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="200" fill="#1F2937" rx="8"/>
  <rect x="40" y="140" width="30" height="40" fill="#3B82F6" rx="4"/>
  <rect x="90" y="100" width="30" height="80" fill="#10B981" rx="4"/>
  <rect x="140" y="120" width="30" height="60" fill="#F59E0B" rx="4"/>
  <rect x="190" y="60" width="30" height="120" fill="#EF4444" rx="4"/>
  <rect x="240" y="80" width="30" height="100" fill="#8B5CF6" rx="4"/>
  <line x1="30" y1="180" x2="280" y2="180" stroke="#4B5563" stroke-width="1"/>
</svg>`,
};

export default function SvgViewer({ windowId }: SvgViewerProps) {
  const [code, setCode] = useState(templates.logo);
  const [fillColor, setFillColor] = useState('#3B82F6');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [layers, setLayers] = useState<string[]>(['circle', 'text']);
  const [selectedTemplate, setSelectedTemplate] = useState('logo');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertShape = useCallback((tag: string, attrs: string) => {
    const el = `<${tag} ${attrs} fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
    const ta = textareaRef.current;
    if (ta) {
      const pos = ta.selectionStart;
      const before = code.slice(0, pos);
      const after = code.slice(pos);
      setCode(before + '\n  ' + el + after);
    } else {
      setCode(code + '\n  ' + el);
    }
  }, [code, fillColor, strokeColor, strokeWidth]);

  const shapeButtons = [
    { label: '矩形', icon: <Square size={14} />, fn: () => insertShape('rect', 'x="20" y="20" width="100" height="80" rx="4"') },
    { label: '圆形', icon: <Circle size={14} />, fn: () => insertShape('circle', 'cx="100" cy="100" r="50"') },
    { label: '线条', icon: <Minus size={14} />, fn: () => insertShape('line', 'x1="20" y1="20" x2="180" y2="180"') },
    { label: '多边形', icon: <Pentagon size={14} />, fn: () => insertShape('polygon', 'points="100,10 190,90 150,180 50,180 10,90"') },
    { label: '文字', icon: <Type size={14} />, fn: () => {
      insertShape('text', 'x="50" y="50" font-size="24" font-family="sans-serif"');
      setCode((prev) => prev.replace(/\/>$/, '>Text</text>'));
    } },
  ];

  const parseLayers = (svgCode: string): string[] => {
    const matches = svgCode.match(/<(rect|circle|ellipse|line|polygon|polyline|path|text)[^>]*\/?>/g) || [];
    return matches.map((m, i) => {
      const tag = m.match(/<(\w+)/)?.[1] || 'element';
      const id = m.match(/id="([^"]+)"/)?.[1];
      return id ? `${tag}#${id}` : `${tag}[${i}]`;
    });
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setLayers(parseLayers(newCode));
  };

  const loadTemplate = (name: keyof typeof templates) => {
    setSelectedTemplate(name);
    setCode(templates[name]);
    setLayers(parseLayers(templates[name]));
  };

  const handleExport = () => {
    const blob = new Blob([code], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'drawing.svg';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  const parsedLayers = parseLayers(code);

  return (
    <div className="w-full h-full flex flex-col text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b flex-wrap" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
        {/* Shape tools */}
        {shapeButtons.map((s) => (
          <button
            key={s.label}
            onClick={s.fn}
            title={s.label}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {s.icon} {s.label}
          </button>
        ))}

        <div className="w-px h-6 mx-1" style={{ background: 'var(--border-default)' }} />

        {/* Colors */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-[var(--text-muted)]">填充</span>
          <input type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)} className="w-6 h-6 cursor-pointer border-0 p-0 bg-transparent" />
          <span className="text-xs text-[var(--text-muted)]">描边</span>
          <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} className="w-6 h-6 cursor-pointer border-0 p-0 bg-transparent" />
          <span className="text-xs text-[var(--text-muted)]">W</span>
          <input
            type="number"
            min={0}
            max={20}
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="w-12 h-6 px-1 rounded text-xs outline-none"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
          />
        </div>

        <div className="w-px h-6 mx-1" style={{ background: 'var(--border-default)' }} />

        {/* Grid */}
        <button onClick={() => setShowGrid(!showGrid)} title="网格" className="w-8 h-8 flex items-center justify-center rounded text-[var(--text-secondary)]" style={{ background: showGrid ? 'var(--bg-hover)' : 'transparent' }}>
          <Grid3X3 size={16} />
        </button>

        <div className="flex-1" />

        {/* Zoom */}
        <button onClick={() => setZoom(Math.max(0.25, zoom - 0.25))} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
          <ZoomOut size={14} />
        </button>
        <span className="text-xs text-[var(--text-muted)] w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(Math.min(4, zoom + 0.25))} className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
          <ZoomIn size={14} />
        </button>

        <div className="w-px h-6 mx-1" style={{ background: 'var(--border-default)' }} />

        <button onClick={handleCopy} title="复制 SVG" className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
          <Copy size={14} />
        </button>
        <button onClick={handleExport} title="导出 SVG" className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
          <Download size={14} />
        </button>
      </div>

      {/* Templates */}
      <div className="flex items-center gap-1 px-2 py-1 border-b" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
        <span className="text-xs text-[var(--text-muted)] mr-1">模板:</span>
        {(Object.keys(templates) as (keyof typeof templates)[]).map((t) => (
          <button
            key={t}
            onClick={() => loadTemplate(t)}
            className="px-2 py-0.5 rounded text-xs capitalize"
            style={{
              background: selectedTemplate === t ? 'var(--accent-silver)' : 'var(--bg-input)',
              color: selectedTemplate === t ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code editor */}
        <div className="w-1/2 flex flex-col border-r" style={{ borderColor: 'var(--border-default)' }}>
          <div className="px-3 py-1 text-xs font-medium text-[var(--text-muted)] border-b" style={{ borderColor: 'var(--border-default)' }}>
            SVG 代码
          </div>
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="flex-1 p-3 outline-none resize-none font-mono text-xs leading-relaxed"
            style={{ background: 'var(--bg-workspace)', color: 'var(--text-primary)' }}
            spellCheck={false}
          />
        </div>

        {/* Preview + Layers */}
        <div className="w-1/2 flex flex-col">
          {/* Preview */}
          <div className="flex-1 flex items-center justify-center overflow-auto p-4 relative" style={{ background: 'var(--bg-input)' }}>
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
                  backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                }}
              />
            )}
            <div
              className="bg-white rounded shadow-lg overflow-hidden"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
              dangerouslySetInnerHTML={{ __html: code }}
            />
          </div>

          {/* Layers panel */}
          <div className="h-32 border-t overflow-y-auto" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-window)' }}>
            <div className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-[var(--text-muted)]">
              <Layers size={12} /> 元素 ({parsedLayers.length})
            </div>
            {parsedLayers.map((layer, i) => (
              <div key={i} className="flex items-center gap-1 px-4 py-0.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] cursor-default">
                <ChevronRight size={10} className="text-[var(--text-muted)]" />
                {layer}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
