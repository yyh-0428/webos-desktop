import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, Plus, Minus, MapPin, Ruler, Sun, Moon, Mountain, Navigation, Crosshair, Layers, X,
} from 'lucide-react';

interface Marker {
  x: number;
  y: number;
  label: string;
  color: string;
}

interface PresetLocation {
  name: string;
  x: number;
  y: number;
}

const presetLocations: PresetLocation[] = [
  { name: '市政厅', x: 400, y: 300 },
  { name: '中央公园', x: 300, y: 200 },
  { name: '火车站', x: 550, y: 450 },
  { name: '大学', x: 200, y: 400 },
  { name: '购物中心', x: 600, y: 200 },
  { name: '医院', x: 150, y: 150 },
  { name: '机场', x: 700, y: 500 },
  { name: '体育场', x: 450, y: 150 },
];

type MapStyle = 'light' | 'dark' | 'satellite';

const styleColors: Record<MapStyle, {
  bg: string; grid: string; road: string; roadMajor: string;
  building: string; park: string; water: string; text: string;
}> = {
  light: {
    bg: '#F2F0EB', grid: '#E0DDD6', road: '#FFFFFF', roadMajor: '#FFD89B',
    building: '#D4D0C8', park: '#A8D5A2', water: '#89C4E1', text: '#555',
  },
  dark: {
    bg: '#1A1A2E', grid: '#2A2A42', road: '#3A3A56', roadMajor: '#4A4A66',
    building: '#2D2D48', park: '#1A3A2A', water: '#1A2A4A', text: '#AAA',
  },
  satellite: {
    bg: '#2D4A3E', grid: '#3A5A4E', road: '#8A8A7A', roadMajor: '#AAAA8A',
    building: '#6A6A5A', park: '#3A6A3A', water: '#2A4A6A', text: '#CCD',
  },
};

export default function Maps({ windowId: _windowId }: { windowId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [markers, setMarkers] = useState<Marker[]>(
    presetLocations.map(loc => ({ x: loc.x, y: loc.y, label: loc.name, color: '#E53935' }))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [mapStyle, setMapStyle] = useState<MapStyle>('light');
  const [measureMode, setMeasureMode] = useState(false);
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measureEnd, setMeasureEnd] = useState<{ x: number; y: number } | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const colors = styleColors[mapStyle];

  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, w, h);

    ctx.translate(w / 2 + panX, h / 2 + panY);
    ctx.scale(zoom, zoom);
    ctx.translate(-400, -300);

    // Grid
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= 800; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke();
    }
    for (let y = 0; y <= 600; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke();
    }

    // Water features
    ctx.fillStyle = colors.water;
    ctx.beginPath();
    ctx.moveTo(0, 500);
    ctx.quadraticCurveTo(200, 480, 350, 520);
    ctx.quadraticCurveTo(500, 560, 650, 530);
    ctx.quadraticCurveTo(750, 510, 800, 540);
    ctx.lineTo(800, 600);
    ctx.lineTo(0, 600);
    ctx.closePath();
    ctx.fill();

    // Parks
    ctx.fillStyle = colors.park;
    ctx.fillRect(250, 160, 120, 90);
    ctx.fillRect(500, 350, 80, 60);
    ctx.fillRect(100, 280, 60, 50);

    // Park labels
    ctx.fillStyle = colors.text;
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('中央公园', 310, 210);
    ctx.fillText('河滨公园', 540, 385);

    // Minor roads
    ctx.strokeStyle = colors.road;
    ctx.lineWidth = 2;
    // Horizontal
    for (let y = 100; y <= 500; y += 80) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke();
    }
    // Vertical
    for (let x = 100; x <= 700; x += 80) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 550); ctx.stroke();
    }

    // Major roads
    ctx.strokeStyle = colors.roadMajor;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 300); ctx.lineTo(800, 300); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(400, 0); ctx.lineTo(400, 600); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 150); ctx.lineTo(800, 450); ctx.stroke();

    // Buildings
    ctx.fillStyle = colors.building;
    const buildings = [
      [380, 280, 40, 30], [420, 280, 30, 25], [380, 310, 35, 20],
      [200, 180, 25, 20], [220, 200, 30, 25], [560, 180, 35, 30],
      [150, 380, 30, 25], [180, 390, 25, 30], [500, 430, 40, 25],
      [620, 180, 30, 35], [650, 200, 25, 25], [680, 480, 35, 30],
      [300, 120, 25, 20], [450, 120, 35, 25], [100, 120, 30, 25],
    ];
    buildings.forEach(([x, y, w, h]) => {
      ctx.fillRect(x, y, w, h);
    });

    // Building area label
    ctx.fillStyle = colors.text;
    ctx.font = '8px sans-serif';
    ctx.fillText('市中心', 400, 270);
    ctx.fillText('大学区', 180, 370);
    ctx.fillText('商业区', 620, 175);

    // Markers
    markers.forEach(marker => {
      ctx.fillStyle = marker.color;
      ctx.beginPath();
      ctx.moveTo(marker.x, marker.y - 20);
      ctx.bezierCurveTo(marker.x - 10, marker.y - 20, marker.x - 10, marker.y - 8, marker.x, marker.y);
      ctx.bezierCurveTo(marker.x + 10, marker.y - 8, marker.x + 10, marker.y - 20, marker.x, marker.y - 20);
      ctx.fill();

      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(marker.x, marker.y - 12, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = colors.text;
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(marker.label, marker.x, marker.y - 25);
    });

    // Measurement line
    if (measureStart && measureEnd) {
      ctx.strokeStyle = '#FF5722';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(measureStart.x, measureStart.y);
      ctx.lineTo(measureEnd.x, measureEnd.y);
      ctx.stroke();
      ctx.setLineDash([]);

      const dx = measureEnd.x - measureStart.x;
      const dy = measureEnd.y - measureStart.y;
      const dist = Math.round(Math.sqrt(dx * dx + dy * dy) / 10);
      const midX = (measureStart.x + measureEnd.x) / 2;
      const midY = (measureStart.y + measureEnd.y) / 2;

      ctx.fillStyle = '#FF5722';
      ctx.beginPath();
      ctx.arc(midX, midY - 5, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${dist}km`, midX, midY - 2);
    }

    ctx.restore();

    // Mini-map
    const mmW = 100;
    const mmH = 75;
    const mmX = w - mmW - 10;
    const mmY = h - mmH - 10;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(mmX - 2, mmY - 2, mmW + 4, mmH + 4);
    ctx.fillStyle = colors.bg;
    ctx.fillRect(mmX, mmY, mmW, mmH);

    // Mini-map content (simplified)
    ctx.fillStyle = colors.road;
    ctx.fillRect(mmX + mmW * 0.3, mmY, 1, mmH);
    ctx.fillRect(mmX, mmY + mmH * 0.4, mmW, 1);
    ctx.fillStyle = colors.park;
    ctx.fillRect(mmX + 25, mmY + 15, 15, 12);
    ctx.fillStyle = colors.water;
    ctx.fillRect(mmX, mmY + mmH * 0.75, mmW, mmH * 0.25);

    // Viewport indicator
    ctx.strokeStyle = '#FF5722';
    ctx.lineWidth = 1.5;
    const vpW = (w / zoom) * (mmW / 800);
    const vpH = (h / zoom) * (mmH / 600);
    const vpX = mmX + mmW / 2 - panX / zoom * (mmW / 800) - vpW / 2;
    const vpY = mmY + mmH / 2 - panY / zoom * (mmH / 600) - vpH / 2;
    ctx.strokeRect(vpX, vpY, vpW, vpH);

    // Mini-map markers
    markers.forEach(marker => {
      ctx.fillStyle = '#E53935';
      const mx = mmX + (marker.x / 800) * mmW;
      const my = mmY + (marker.y / 600) * mmH;
      ctx.beginPath();
      ctx.arc(mx, my, 2, 0, Math.PI * 2);
      ctx.fill();
    });

  }, [zoom, panX, panY, markers, colors, measureStart, measureEnd]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    const container = containerRef.current;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    drawMap();
  }, [drawMap]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      drawMap();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawMap]);

  const screenToWorld = (sx: number, sy: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const w = canvas.width;
    const h = canvas.height;
    const wx = (sx - w / 2 - panX) / zoom + 400;
    const wy = (sy - h / 2 - panY) / zoom + 300;
    return { x: wx, y: wy };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (measureMode) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(sx, sy);

    if (measureMode && measureStart) {
      setMeasureEnd(world);
      drawMap();
    }

    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.max(0.3, Math.min(5, z + delta)));
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(sx, sy);

    if (measureMode) {
      if (!measureStart) {
        setMeasureStart(world);
        setMeasureEnd(world);
      } else {
        setMeasureEnd(world);
        setMeasureMode(false);
      }
      return;
    }

    // Place marker on click
    const label = `标记点 ${markers.length + 1}`;
    setMarkers(prev => [...prev, { x: world.x, y: world.y, label, color: '#1E88E5' }]);
  };

  const handleSearch = () => {
    const q = searchQuery.toLowerCase();
    const found = presetLocations.find(loc => loc.name.toLowerCase().includes(q));
    if (found) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      setPanX(-(found.x - 400) * zoom);
      setPanY(-(found.y - 300) * zoom);
      setShowSearchResults(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const goToLocation = (loc: PresetLocation) => {
    setPanX(-(loc.x - 400) * zoom);
    setPanY(-(loc.y - 300) * zoom);
    setShowSearchResults(false);
    setSearchQuery(loc.name);
  };

  const clearMarkers = () => {
    setMarkers([]);
    setMeasureStart(null);
    setMeasureEnd(null);
  };

  const resetView = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const filteredLocations = searchQuery
    ? presetLocations.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : presetLocations;

  return (
    <div className="w-full h-full flex flex-col text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 h-10 shrink-0" style={{ background: 'var(--bg-window)', borderBottom: '1px solid var(--border-default)' }}>
        {/* Search */}
        <div className="flex-1 max-w-xs relative">
          <div className="flex items-center h-7 rounded-lg px-2.5 gap-2" style={{ background: 'var(--bg-input)' }}>
            <Search size={13} className="text-[var(--text-muted)] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => setShowSearchResults(true)}
              placeholder="搜索地点..."
              className="flex-1 bg-transparent outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>
          {showSearchResults && filteredLocations.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg z-20 overflow-hidden" style={{ background: 'var(--bg-window)', border: '1px solid var(--border-default)' }}>
              {filteredLocations.map((loc, i) => (
                <button
                  key={i}
                  onClick={() => goToLocation(loc)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <MapPin size={12} className="text-[var(--accent-silver)]" />
                  {loc.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-5 w-px" style={{ background: 'var(--border-default)' }} />

        {/* Zoom controls */}
        <button onClick={() => setZoom(z => Math.min(5, z + 0.2))}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors">
          <Plus size={14} />
        </button>
        <span className="text-[10px] text-[var(--text-muted)] w-8 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors">
          <Minus size={14} />
        </button>

        <button onClick={resetView}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors">
          <Crosshair size={14} />
        </button>

        <div className="h-5 w-px" style={{ background: 'var(--border-default)' }} />

        {/* Measure tool */}
        <button
          onClick={() => { setMeasureMode(!measureMode); setMeasureStart(null); setMeasureEnd(null); }}
          className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
            measureMode ? 'bg-[var(--accent-silver)] text-white' : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'
          }`}
          title="测量距离"
        >
          <Ruler size={14} />
        </button>

        {/* Map style */}
        <div className="flex items-center gap-0.5 ml-auto">
          {([
            { id: 'light' as MapStyle, icon: Sun, label: '日间' },
            { id: 'dark' as MapStyle, icon: Moon, label: '夜间' },
            { id: 'satellite' as MapStyle, icon: Mountain, label: '卫星' },
          ]).map(style => {
            const Icon = style.icon;
            return (
              <button
                key={style.id}
                onClick={() => setMapStyle(style.id)}
                className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
                  mapStyle === style.id ? 'bg-[var(--accent-silver)] text-white' : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                }`}
                title={style.label}
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>

        <button onClick={clearMarkers}
          className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] px-2 transition-colors">
          清除
        </button>
      </div>

      {/* Map canvas */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onClick={handleCanvasClick}
          className="w-full h-full"
          style={{ cursor: measureMode ? 'crosshair' : isDragging ? 'grabbing' : 'grab' }}
        />

        {/* Measure mode indicator */}
        {measureMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-[11px] text-white"
            style={{ background: 'rgba(229, 57, 53, 0.9)' }}>
            {measureStart ? '点击设置终点' : '点击设置起点'}
          </div>
        )}

        {/* Location pills */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 max-w-[200px]">
          {presetLocations.slice(0, 4).map((loc, i) => (
            <button
              key={i}
              onClick={() => goToLocation(loc)}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] text-[var(--text-primary)] backdrop-blur-sm transition-colors hover:opacity-80"
              style={{ background: 'rgba(var(--bg-window-rgb, 255,255,255), 0.8)', border: '1px solid var(--border-default)' }}
            >
              <MapPin size={9} className="text-[var(--accent-silver)]" />
              {loc.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
