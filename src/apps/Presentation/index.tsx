import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Plus, Trash2, Copy, Square, Circle, Triangle,
  Play, ChevronLeft, ChevronRight, Maximize2, Minimize2,
  Type, Palette, Move,
} from 'lucide-react';

interface PresentationProps {
  windowId: string;
}

interface SlideElement {
  id: string;
  type: 'text' | 'rect' | 'circle' | 'triangle';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  color: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
}

interface Slide {
  id: string;
  elements: SlideElement[];
  backgroundColor: string;
  transition: 'none' | 'fade' | 'slide';
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function createSlide(): Slide {
  return {
    id: generateId(),
    elements: [],
    backgroundColor: '#ffffff',
    transition: 'none',
  };
}

const BG_COLORS = ['#ffffff', '#f3f4f6', '#e5e7eb', '#1e293b', '#1e3a5f', '#2d1b69', '#7c2d12', '#14532d', '#0f172a', '#312e81'];

export default function Presentation({ windowId: _windowId }: PresentationProps) {
  const [slides, setSlides] = useState<Slide[]>([createSlide()]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [presenting, setPresenting] = useState(false);
  const [presentSlide, setPresentSlide] = useState(0);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [transition, setTransition] = useState<'none' | 'fade' | 'slide'>('none');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; elX: number; elY: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const currentSlide = slides[activeSlide];

  const updateSlide = useCallback((index: number, updates: Partial<Slide>) => {
    setSlides((prev) => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  }, []);

  const addSlide = () => {
    const newSlide = createSlide();
    setSlides((prev) => {
      const next = [...prev];
      next.splice(activeSlide + 1, 0, newSlide);
      return next;
    });
    setActiveSlide((prev) => prev + 1);
    setSelectedElement(null);
  };

  const deleteSlide = () => {
    if (slides.length <= 1) return;
    setSlides((prev) => prev.filter((_, i) => i !== activeSlide));
    setActiveSlide((prev) => Math.min(prev, slides.length - 2));
    setSelectedElement(null);
  };

  const duplicateSlide = () => {
    const dup: Slide = JSON.parse(JSON.stringify(currentSlide));
    dup.id = generateId();
    dup.elements = dup.elements.map((el) => ({ ...el, id: generateId() }));
    setSlides((prev) => {
      const next = [...prev];
      next.splice(activeSlide + 1, 0, dup);
      return next;
    });
    setActiveSlide((prev) => prev + 1);
  };

  const addElement = (type: SlideElement['type']) => {
    const el: SlideElement = {
      id: generateId(),
      type,
      x: type === 'text' ? 100 : 200,
      y: type === 'text' ? 100 : 150,
      width: type === 'text' ? 400 : type === 'rect' ? 150 : 120,
      height: type === 'text' ? 60 : type === 'rect' ? 100 : 120,
      content: type === 'text' ? '双击编辑' : undefined,
      color: type === 'text' ? '#000000' : type === 'rect' ? '#4A86E8' : type === 'circle' ? '#FF9900' : '#00FF00',
      fontSize: type === 'text' ? 24 : undefined,
      fontWeight: type === 'text' ? 'normal' : undefined,
    };
    updateSlide(activeSlide, { elements: [...currentSlide.elements, el] });
    setSelectedElement(el.id);
  };

  const updateElement = (elId: string, updates: Partial<SlideElement>) => {
    updateSlide(activeSlide, {
      elements: currentSlide.elements.map((el) => el.id === elId ? { ...el, ...updates } : el),
    });
  };

  const deleteElement = (elId: string) => {
    updateSlide(activeSlide, { elements: currentSlide.elements.filter((el) => el.id !== elId) });
    setSelectedElement(null);
  };

  // Drag
  const handleElementMouseDown = (elId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedElement(elId);
    const el = currentSlide.elements.find((x) => x.id === elId);
    if (!el) return;
    setDragging({ id: elId, startX: e.clientX, startY: e.clientY, elX: el.x, elY: el.y });
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - dragging.startX;
      const dy = e.clientY - dragging.startY;
      updateElement(dragging.id, { x: dragging.elX + dx, y: dragging.elY + dy });
    };
    const handleUp = () => setDragging(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [dragging]);

  // Present mode navigation
  useEffect(() => {
    if (!presenting) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        goToNextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault();
        goToPrevSlide();
      } else if (e.key === 'Escape') {
        setPresenting(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [presenting, presentSlide]);

  const goToNextSlide = useCallback(() => {
    if (presentSlide >= slides.length - 1) return;
    const current = slides[presentSlide];
    if (current.transition !== 'none') {
      setIsTransitioning(true);
      setTimeout(() => {
        setPresentSlide((prev) => Math.min(prev + 1, slides.length - 1));
        setIsTransitioning(false);
      }, 300);
    } else {
      setPresentSlide((prev) => Math.min(prev + 1, slides.length - 1));
    }
  }, [presentSlide, slides]);

  const goToPrevSlide = useCallback(() => {
    setPresentSlide((prev) => Math.max(prev - 1, 0));
  }, []);

  const startPresentation = () => {
    setPresentSlide(activeSlide);
    setPresenting(true);
  };

  const renderElement = (el: SlideElement, scale: number = 1, interactive: boolean = true) => {
    const isSelected = selectedElement === el.id && interactive;
    if (el.type === 'text') {
      return (
        <div
          key={el.id}
          className={interactive ? 'cursor-move' : ''}
          style={{
            position: 'absolute',
            left: el.x * scale,
            top: el.y * scale,
            width: el.width * scale,
            minHeight: el.height * scale,
            outline: isSelected ? '2px solid var(--accent-silver)' : 'none',
            outlineOffset: 2,
          }}
          onMouseDown={interactive ? (e) => handleElementMouseDown(el.id, e) : undefined}
          onDoubleClick={interactive ? () => {
            const text = prompt('编辑文本:', el.content);
            if (text !== null) updateElement(el.id, { content: text });
          } : undefined}
        >
          <div
            contentEditable={false}
            style={{
              color: el.color,
              fontSize: (el.fontSize || 24) * scale,
              fontWeight: el.fontWeight || 'normal',
              padding: 4,
              wordBreak: 'break-word',
              userSelect: 'none',
            }}
          >
            {el.content}
          </div>
          {isSelected && (
            <div className="absolute -top-5 left-0 flex gap-1">
              <input
                type="color"
                value={el.color}
                onChange={(e) => updateElement(el.id, { color: e.target.value })}
                className="w-5 h-5 cursor-pointer border-none"
                title="文字颜色"
              />
              <select
                value={el.fontSize || 24}
                onChange={(e) => updateElement(el.id, { fontSize: parseInt(e.target.value) })}
                className="text-xs px-1 rounded border"
                style={{ background: 'var(--bg-window)', color: 'var(--text-primary)' }}
              >
                {[14, 18, 24, 32, 40, 48, 64].map((s) => (
                  <option key={s} value={s}>{s}px</option>
                ))}
              </select>
              <button
                onClick={() => deleteElement(el.id)}
                className="px-1 text-xs rounded bg-red-500 text-white"
              >
                <Trash2 size={10} />
              </button>
            </div>
          )}
        </div>
      );
    }

    // Shapes
    const shapeStyle: React.CSSProperties = {
      position: 'absolute',
      left: el.x * scale,
      top: el.y * scale,
      width: el.width * scale,
      height: el.height * scale,
      outline: isSelected ? '2px solid var(--accent-silver)' : 'none',
      outlineOffset: 2,
      cursor: interactive ? 'move' : 'default',
    };

    return (
      <div
        key={el.id}
        style={shapeStyle}
        onMouseDown={interactive ? (e) => handleElementMouseDown(el.id, e) : undefined}
      >
        {el.type === 'rect' && (
          <div style={{ width: '100%', height: '100%', background: el.color, borderRadius: 4 }} />
        )}
        {el.type === 'circle' && (
          <div style={{ width: '100%', height: '100%', background: el.color, borderRadius: '50%' }} />
        )}
        {el.type === 'triangle' && (
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon points="50,0 100,100 0,100" fill={el.color} />
          </svg>
        )}
        {isSelected && (
          <div className="absolute -top-5 left-0 flex gap-1">
            <input
              type="color"
              value={el.color}
              onChange={(e) => updateElement(el.id, { color: e.target.value })}
              className="w-5 h-5 cursor-pointer border-none"
            />
            <button
              onClick={() => deleteElement(el.id)}
              className="px-1 text-xs rounded bg-red-500 text-white"
            >
              <Trash2 size={10} />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Present mode
  if (presenting) {
    const slide = slides[presentSlide];
    const transitionClass = slide.transition === 'fade'
      ? (isTransitioning ? 'opacity-0' : 'opacity-100')
      : slide.transition === 'slide'
        ? (isTransitioning ? '-translate-x-full' : 'translate-x-0')
        : '';

    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: '#000000' }}
        onClick={() => {
          // Click to advance
          goToNextSlide();
        }}
      >
        <div
          className={`relative transition-all duration-300 ${transitionClass}`}
          style={{
            width: '100vw',
            height: '100vh',
            background: slide.backgroundColor,
            ...(slide.transition === 'slide' ? { transitionProperty: 'transform' } : {}),
          }}
        >
          {slide.elements.map((el) => renderElement(el, 1, false))}
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <button
            onClick={(e) => { e.stopPropagation(); goToPrevSlide(); }}
            className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-white text-sm font-medium">{presentSlide + 1} / {slides.length}</span>
          <button
            onClick={(e) => { e.stopPropagation(); goToNextSlide(); }}
            className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setPresenting(false); }}
            className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 ml-4"
          >
            <Minimize2 size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex" style={{ background: 'var(--bg-workspace)' }}>
      {/* Slide list panel */}
      <div className="w-44 flex flex-col border-r overflow-y-auto" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
        <div className="flex items-center justify-between p-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <span className="text-xs font-medium text-[var(--text-secondary)]">幻灯片 ({slides.length})</span>
          <button onClick={addSlide} className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--accent-silver)]" title="添加幻灯片">
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              onClick={() => { setActiveSlide(i); setSelectedElement(null); }}
              className={`relative cursor-pointer rounded border-2 transition-all ${
                i === activeSlide ? 'border-[var(--accent-silver)]' : 'border-transparent hover:border-[var(--border-default)]'
              }`}
            >
              <div
                className="relative overflow-hidden rounded-sm"
                style={{
                  background: slide.backgroundColor,
                  aspectRatio: '16/9',
                  transform: 'scale(1)',
                  transformOrigin: 'top left',
                }}
              >
                <div style={{ transform: 'scale(0.17)', transformOrigin: 'top left', width: 570, height: 320 }}>
                  {slide.elements.map((el) => renderElement(el, 1, false))}
                </div>
              </div>
              <div className="absolute bottom-0.5 left-1 text-[9px] text-[var(--text-muted)]">
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main editor */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-1 px-2 py-1.5 border-b" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
          <button onClick={() => addElement('text')} className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]" title="添加文本">
            <Type size={14} />
            <span>文本</span>
          </button>
          <button onClick={() => addElement('rect')} className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]" title="添加矩形">
            <Square size={14} />
          </button>
          <button onClick={() => addElement('circle')} className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]" title="添加圆形">
            <Circle size={14} />
          </button>
          <button onClick={() => addElement('triangle')} className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]" title="添加三角形">
            <Triangle size={14} />
          </button>

          <div className="w-px h-5 mx-1" style={{ background: 'var(--border-default)' }} />

          {/* Background color */}
          <div className="relative">
            <button
              onClick={() => setShowBgPicker(!showBgPicker)}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
              title="背景颜色"
            >
              <Palette size={14} />
            </button>
            {showBgPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 rounded-lg z-50 border" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                <div className="grid grid-cols-5 gap-1 mb-2">
                  {BG_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => { updateSlide(activeSlide, { backgroundColor: c }); setShowBgPicker(false); }}
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={currentSlide.backgroundColor}
                  onChange={(e) => updateSlide(activeSlide, { backgroundColor: e.target.value })}
                  className="w-full h-6 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Transition */}
          <select
            value={currentSlide.transition}
            onChange={(e) => updateSlide(activeSlide, { transition: e.target.value as Slide['transition'] })}
            className="px-2 py-1 rounded text-xs outline-none border"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' }}
          >
            <option value="none">无切换效果</option>
            <option value="fade">淡入淡出</option>
            <option value="slide">滑动</option>
          </select>

          <div className="flex-1" />

          {/* Actions */}
          <button onClick={duplicateSlide} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]" title="复制幻灯片">
            <Copy size={14} />
          </button>
          <button onClick={deleteSlide} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]" title="删除幻灯片" >
            <Trash2 size={14} />
          </button>

          <div className="w-px h-5 mx-1" style={{ background: 'var(--border-default)' }} />

          <button
            onClick={startPresentation}
            className="flex items-center gap-1 px-3 py-1 rounded text-xs text-white font-medium"
            style={{ background: 'var(--accent-silver)' }}
          >
            <Play size={14} />
            放映
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto" style={{ background: 'var(--bg-workspace)' }}>
          <div
            ref={canvasRef}
            className="relative shadow-lg"
            style={{
              width: 720,
              height: 405,
              background: currentSlide.backgroundColor,
              borderRadius: 4,
            }}
            onClick={() => setSelectedElement(null)}
          >
            {currentSlide.elements.map((el) => renderElement(el))}
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-1 text-xs border-t" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
          <span>第 {activeSlide + 1} 页，共 {slides.length} 页</span>
          <span>{currentSlide.elements.length} 个元素</span>
          <span>{currentSlide.transition !== 'none' ? `切换效果: ${currentSlide.transition === 'fade' ? '淡入淡出' : '滑动'}` : ''}</span>
        </div>
      </div>
    </div>
  );
}
