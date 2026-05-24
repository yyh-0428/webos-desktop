import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Copy, Check, RotateCcw, Palette, History } from 'lucide-react';

interface ColorPickerProps {
  windowId: string;
}

// Color conversion utilities
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex: string): [number, number, number] | null {
  const match = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!match) {
    const short = hex.match(/^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i);
    if (!short) return null;
    return [parseInt(short[1] + short[1], 16), parseInt(short[2] + short[2], 16), parseInt(short[3] + short[3], 16)];
  }
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

const MATERIAL_COLORS = [
  { name: '红', shades: ['#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C'] },
  { name: '粉', shades: ['#FCE4EC', '#F8BBD0', '#F48FB1', '#EC407A', '#E91E63', '#D81B60', '#C2185B', '#AD1457', '#880E4F'] },
  { name: '紫', shades: ['#F3E5F5', '#E1BEE7', '#CE93D8', '#AB47BC', '#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A', '#4A148C'] },
  { name: '蓝', shades: ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2', '#1565C0', '#0D47A1'] },
  { name: '青', shades: ['#E0F7FA', '#B2EBF2', '#80DEEA', '#4DD0E1', '#26C6DA', '#00BCD4', '#00ACC1', '#0097A7', '#00838F', '#006064'] },
  { name: '绿', shades: ['#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20'] },
  { name: '黄', shades: ['#FFFDE7', '#FFF9C4', '#FFF59D', '#FFF176', '#FFEE58', '#FFEB3B', '#FDD835', '#FBC02D', '#F9A825', '#F57F17'] },
  { name: '橙', shades: ['#FFF3E0', '#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00', '#EF6C00', '#E65100'] },
  { name: '灰', shades: ['#FAFAFA', '#F5F5F5', '#EEEEEE', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575', '#616161', '#424242', '#212121'] },
];

const TAILWIND_COLORS = [
  { name: 'slate', shades: ['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a'] },
  { name: 'red', shades: ['#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'] },
  { name: 'orange', shades: ['#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12'] },
  { name: 'amber', shades: ['#fffbeb', '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'] },
  { name: 'green', shades: ['#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'] },
  { name: 'blue', shades: ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'] },
  { name: 'violet', shades: ['#f5f3ff', '#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'] },
  { name: 'pink', shades: ['#fdf2f8', '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843'] },
];

export default function ColorPicker({ windowId: _windowId }: ColorPickerProps) {
  const [hue, setHue] = useState(210);
  const [saturation, setSaturation] = useState(80);
  const [lightness, setLightness] = useState(55);
  const [hexInput, setHexInput] = useState('');
  const [rgbInputs, setRgbInputs] = useState({ r: 0, g: 0, b: 0 });
  const [copied, setCopied] = useState<string | null>(null);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [showPresets, setShowPresets] = useState<'material' | 'tailwind'>('material');
  const [isDragging, setIsDragging] = useState(false);

  const gradientRef = useRef<HTMLDivElement>(null);

  const [r, g, b] = hslToRgb(hue, saturation, lightness);
  const hex = rgbToHex(r, g, b);

  // Sync inputs
  useEffect(() => {
    setHexInput(hex);
    setRgbInputs({ r, g, b });
  }, [hex, r, g, b]);

  const updateFromRgb = useCallback((nr: number, ng: number, nb: number) => {
    const [h, s, l] = rgbToHsl(nr, ng, nb);
    setHue(h);
    setSaturation(s);
    setLightness(l);
  }, []);

  const updateFromHex = useCallback((value: string) => {
    setHexInput(value);
    const rgb = hexToRgb(value);
    if (rgb) updateFromRgb(rgb[0], rgb[1], rgb[2]);
  }, [updateFromRgb]);

  const addToRecent = useCallback(() => {
    setRecentColors(prev => {
      const filtered = prev.filter(c => c !== hex);
      return [hex, ...filtered].slice(0, 24);
    });
  }, [hex]);

  const copyValue = (label: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  // Gradient area mouse handling
  const handleGradientMouse = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!gradientRef.current) return;
    const rect = gradientRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setSaturation(Math.round(x * 100));
    setLightness(Math.round((1 - y) * 100));
  }, []);

  const handleGradientDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleGradientMouse(e);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => handleGradientMouse(e);
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, handleGradientMouse]);

  // Generate gradient background for the color area
  const gradientBg = useMemo(() => {
    const [r1, g1, b1] = hslToRgb(hue, 100, 50);
    return `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, rgb(${r1},${g1},${b1}))`;
  }, [hue]);

  const textColor = lightness > 60 ? '#000' : '#fff';

  return (
    <div className="w-full h-full flex flex-col text-sm" style={{ background: 'var(--bg-workspace)' }}>
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Color picker area */}
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
          {/* Color gradient area */}
          <div className="relative">
            <div
              ref={gradientRef}
              className="w-full h-48 rounded-lg cursor-crosshair relative overflow-hidden"
              style={{ background: gradientBg }}
              onMouseDown={handleGradientDown}
            >
              {/* Cursor indicator */}
              <div
                className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  left: `${saturation}%`,
                  top: `${100 - lightness}%`,
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.3)',
                }}
              />
            </div>
          </div>

          {/* Hue slider */}
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">色相</label>
            <div className="relative h-5 rounded-full overflow-hidden">
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
              }} />
              <input
                type="range"
                min={0}
                max={360}
                value={hue}
                onChange={(e) => setHue(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className="absolute top-0 w-1 h-full bg-white rounded shadow pointer-events-none"
                style={{ left: `${(hue / 360) * 100}%`, transform: 'translateX(-50%)' }}
              />
            </div>
          </div>

          {/* Preview swatch */}
          <div className="flex items-center gap-3">
            <div
              className="w-16 h-16 rounded-lg shadow-inner border"
              style={{ background: hex, borderColor: 'var(--border-default)' }}
            />
            <div className="flex-1 space-y-1">
              <div className="text-xs text-[var(--text-muted)]">当前颜色</div>
              <div className="font-mono text-sm text-[var(--text-primary)]">{hex}</div>
              <div className="font-mono text-xs text-[var(--text-muted)]">rgb({r}, {g}, {b})</div>
              <div className="font-mono text-xs text-[var(--text-muted)]">hsl({hue}, {saturation}%, {lightness}%)</div>
            </div>
          </div>

          {/* Input fields */}
          <div className="space-y-3">
            {/* Hex */}
            <div className="flex items-center gap-2">
              <label className="w-10 text-xs text-[var(--text-muted)]">HEX</label>
              <input
                value={hexInput}
                onChange={(e) => updateFromHex(e.target.value)}
                className="flex-1 h-8 px-2 rounded text-xs font-mono outline-none"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
                maxLength={7}
              />
              <button onClick={() => { copyValue('hex', hex); addToRecent(); }} className="p-1.5 rounded hover:bg-[var(--bg-hover)]">
                {copied === 'hex' ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-[var(--text-muted)]" />}
              </button>
            </div>
            {/* RGB */}
            {(['r', 'g', 'b'] as const).map((ch) => (
              <div key={ch} className="flex items-center gap-2">
                <label className="w-10 text-xs text-[var(--text-muted)]">{ch.toUpperCase()}</label>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={rgbInputs[ch]}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    const newRgb = { ...rgbInputs, [ch]: v };
                    setRgbInputs(newRgb);
                    updateFromRgb(newRgb.r, newRgb.g, newRgb.b);
                  }}
                  className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, ${ch === 'r' ? '#000' : ch === 'g' ? '#0f0' : '#00f'}, ${ch === 'r' ? '#f00' : ch === 'g' ? '#0f0' : '#00f'})` }}
                />
                <span className="w-8 text-xs text-right font-mono text-[var(--text-muted)]">{rgbInputs[ch]}</span>
              </div>
            ))}
            {/* HSL */}
            <div className="flex items-center gap-2">
              <label className="w-10 text-xs text-[var(--text-muted)]">S</label>
              <input
                type="range"
                min={0}
                max={100}
                value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
              />
              <span className="w-8 text-xs text-right font-mono text-[var(--text-muted)]">{saturation}%</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-10 text-xs text-[var(--text-muted)]">L</label>
              <input
                type="range"
                min={0}
                max={100}
                value={lightness}
                onChange={(e) => setLightness(Number(e.target.value))}
                className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
              />
              <span className="w-8 text-xs text-right font-mono text-[var(--text-muted)]">{lightness}%</span>
            </div>
          </div>

          {/* Copy buttons */}
          <div className="flex gap-2">
            <button onClick={() => { copyValue('hex', hex); addToRecent(); }} className="flex-1 py-2 rounded text-xs hover:bg-[var(--bg-hover)]" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}>
              {copied === 'hex' ? '已复制!' : '复制 HEX'}
            </button>
            <button onClick={() => { copyValue('rgb', `rgb(${r}, ${g}, ${b})`); addToRecent(); }} className="flex-1 py-2 rounded text-xs hover:bg-[var(--bg-hover)]" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}>
              {copied === 'rgb' ? '已复制!' : '复制 RGB'}
            </button>
            <button onClick={() => { copyValue('hsl', `hsl(${hue}, ${saturation}%, ${lightness}%)`); addToRecent(); }} className="flex-1 py-2 rounded text-xs hover:bg-[var(--bg-hover)]" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}>
              {copied === 'hsl' ? '已复制!' : '复制 HSL'}
            </button>
          </div>
        </div>

        {/* Right: Presets & Recent */}
        <div className="w-64 flex flex-col border-l overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
          {/* Tab selector */}
          <div className="flex border-b" style={{ borderColor: 'var(--border-default)' }}>
            <button onClick={() => setShowPresets('material')} className={`flex-1 py-2 text-xs font-medium ${showPresets === 'material' ? 'text-[var(--text-primary)] border-b-2' : 'text-[var(--text-muted)]'}`} style={showPresets === 'material' ? { borderColor: 'var(--accent-silver)' } : {}}>
              Material
            </button>
            <button onClick={() => setShowPresets('tailwind')} className={`flex-1 py-2 text-xs font-medium ${showPresets === 'tailwind' ? 'text-[var(--text-primary)] border-b-2' : 'text-[var(--text-muted)]'}`} style={showPresets === 'tailwind' ? { borderColor: 'var(--accent-silver)' } : {}}>
              Tailwind
            </button>
            <button onClick={() => setShowPresets('material')} className={`flex-1 py-2 text-xs font-medium text-[var(--text-muted)]`}>
              <History size={14} className="inline" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Recent colors */}
            {recentColors.length > 0 && (
              <div>
                <div className="text-xs text-[var(--text-muted)] mb-2 flex items-center gap-1"><History size={12} /> 最近使用</div>
                <div className="flex flex-wrap gap-1.5">
                  {recentColors.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => { const rgb = hexToRgb(c); if (rgb) updateFromRgb(rgb[0], rgb[1], rgb[2]); }}
                      className="w-7 h-7 rounded border hover:scale-110 transition-transform"
                      style={{ background: c, borderColor: 'var(--border-default)' }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Color presets */}
            {(showPresets === 'material' ? MATERIAL_COLORS : TAILWIND_COLORS).map((group) => (
              <div key={group.name}>
                <div className="text-xs text-[var(--text-muted)] mb-1.5 capitalize">{group.name}</div>
                <div className="flex gap-1">
                  {group.shades.map((shade, si) => (
                    <button
                      key={si}
                      onClick={() => { const rgb = hexToRgb(shade); if (rgb) updateFromRgb(rgb[0], rgb[1], rgb[2]); addToRecent(); }}
                      className="flex-1 h-6 first:rounded-l last:rounded-r hover:scale-y-125 transition-transform"
                      style={{ background: shade }}
                      title={shade}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
