import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Heading1, Heading2, Heading3,
  Download, Type, PaintBucket, ChevronDown,
} from 'lucide-react';

const FONT_FAMILIES = [
  'Arial',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
];

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36];

const TEXT_COLORS = [
  '#000000', '#434343', '#666666', '#999999',
  '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF',
  '#F3F3F3', '#FFFFFF', '#980000', '#FF0000',
  '#FF9900', '#FFFF00', '#00FF00', '#00FFFF',
  '#4A86E8', '#0000FF', '#9900FF', '#FF00FF',
];

const HIGHLIGHT_COLORS = [
  'transparent', '#FFFF00', '#00FF00', '#00FFFF',
  '#FF9900', '#FF00FF', '#4A86E8', '#FF0000',
  '#999999', '#EFEFEF',
];

interface WriterProps {
  windowId: string;
}

export default function Writer({ windowId: _windowId }: WriterProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(16);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showFontFamilyDropdown, setShowFontFamilyDropdown] = useState(false);
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const updateCounts = useCallback(() => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const trimmed = text.trim();
    setCharCount(trimmed.length);
    setWordCount(trimmed === '' ? 0 : trimmed.split(/\s+/).filter(Boolean).length);
  }, []);

  const handleInput = useCallback(() => {
    updateCounts();
  }, [updateCounts]);

  const handleFontFamilyChange = (family: string) => {
    setFontFamily(family);
    execCommand('fontName', family);
    setShowFontFamilyDropdown(false);
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    // contentEditable uses 1-7 for fontSize, so we use a CSS approach
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = `${size}pt`;
      range.surroundContents(span);
    }
    setShowFontSizeDropdown(false);
  };

  const handleHeading = (tag: string) => {
    execCommand('formatBlock', tag);
  };

  const handleExportText = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const isActive = (command: string): boolean => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  };

  const ToolbarButton = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${active ? 'bg-[var(--accent-silver)] text-white' : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="w-full h-full flex flex-col" style={{ background: 'var(--bg-workspace)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b flex-wrap" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
        {/* Font Family */}
        <div className="relative">
          <button
            onClick={() => { setShowFontFamilyDropdown(!showFontFamilyDropdown); setShowFontSizeDropdown(false); }}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)] text-[var(--text-primary)]"
            style={{ minWidth: 110 }}
          >
            <span className="truncate">{fontFamily}</span>
            <ChevronDown size={12} />
          </button>
          {showFontFamilyDropdown && (
            <div className="absolute top-full left-0 mt-1 w-44 py-1 rounded-lg z-50 border" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              {FONT_FAMILIES.map((f) => (
                <button
                  key={f}
                  onClick={() => handleFontFamilyChange(f)}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--bg-hover)] ${fontFamily === f ? 'text-[var(--accent-silver)] font-medium' : 'text-[var(--text-primary)]'}`}
                  style={{ fontFamily: f }}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 mx-1" style={{ background: 'var(--border-default)' }} />

        {/* Font Size */}
        <div className="relative">
          <button
            onClick={() => { setShowFontSizeDropdown(!showFontSizeDropdown); setShowFontFamilyDropdown(false); }}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)] text-[var(--text-primary)]"
            style={{ minWidth: 45 }}
          >
            <span>{fontSize}pt</span>
            <ChevronDown size={12} />
          </button>
          {showFontSizeDropdown && (
            <div className="absolute top-full left-0 mt-1 w-20 py-1 rounded-lg z-50 border max-h-48 overflow-y-auto" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              {FONT_SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleFontSizeChange(s)}
                  className={`w-full text-left px-3 py-1 text-sm hover:bg-[var(--bg-hover)] ${fontSize === s ? 'text-[var(--accent-silver)] font-medium' : 'text-[var(--text-primary)]'}`}
                >
                  {s}pt
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 mx-1" style={{ background: 'var(--border-default)' }} />

        {/* Headings */}
        <ToolbarButton onClick={() => handleHeading('H1')} title="标题 1"><Heading1 size={15} /></ToolbarButton>
        <ToolbarButton onClick={() => handleHeading('H2')} title="标题 2"><Heading2 size={15} /></ToolbarButton>
        <ToolbarButton onClick={() => handleHeading('H3')} title="标题 3"><Heading3 size={15} /></ToolbarButton>
        <ToolbarButton onClick={() => handleHeading('p')} title="正文"><Type size={15} /></ToolbarButton>

        <div className="w-px h-5 mx-1" style={{ background: 'var(--border-default)' }} />

        {/* Text formatting */}
        <ToolbarButton onClick={() => execCommand('bold')} active={isActive('bold')} title="粗体"><Bold size={15} /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand('italic')} active={isActive('italic')} title="斜体"><Italic size={15} /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand('underline')} active={isActive('underline')} title="下划线"><Underline size={15} /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand('strikeThrough')} active={isActive('strikeThrough')} title="删除线"><Strikethrough size={15} /></ToolbarButton>

        <div className="w-px h-5 mx-1" style={{ background: 'var(--border-default)' }} />

        {/* Text Color */}
        <div className="relative">
          <button
            onClick={() => { setShowTextColorPicker(!showTextColorPicker); setShowHighlightPicker(false); }}
            className="p-1.5 rounded hover:bg-[var(--bg-hover)] flex items-center gap-0.5"
            title="文字颜色"
          >
            <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>A</span>
            <div className="w-4 h-1 rounded-sm" style={{ background: '#000000' }} />
          </button>
          {showTextColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 rounded-lg z-50 border" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <div className="grid grid-cols-5 gap-1">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => { execCommand('foreColor', c); setShowTextColorPicker(false); }}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Highlight Color */}
        <div className="relative">
          <button
            onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowTextColorPicker(false); }}
            className="p-1.5 rounded hover:bg-[var(--bg-hover)] flex items-center gap-0.5"
            title="高亮颜色"
          >
            <PaintBucket size={15} />
          </button>
          {showHighlightPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 rounded-lg z-50 border" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <div className="grid grid-cols-5 gap-1">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => { execCommand('hiliteColor', c); setShowHighlightPicker(false); }}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ background: c === 'transparent' ? 'white' : c }}
                    title={c === 'transparent' ? '无' : c}
                  >
                    {c === 'transparent' && <span className="text-xs text-red-500">/</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 mx-1" style={{ background: 'var(--border-default)' }} />

        {/* Alignment */}
        <ToolbarButton onClick={() => execCommand('justifyLeft')} title="左对齐"><AlignLeft size={15} /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand('justifyCenter')} title="居中对齐"><AlignCenter size={15} /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand('justifyRight')} title="右对齐"><AlignRight size={15} /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand('justifyFull')} title="两端对齐"><AlignJustify size={15} /></ToolbarButton>

        <div className="w-px h-5 mx-1" style={{ background: 'var(--border-default)' }} />

        {/* Lists */}
        <ToolbarButton onClick={() => execCommand('insertUnorderedList')} title="无序列表"><List size={15} /></ToolbarButton>
        <ToolbarButton onClick={() => execCommand('insertOrderedList')} title="有序列表"><ListOrdered size={15} /></ToolbarButton>

        <div className="flex-1" />

        {/* Export */}
        <button
          onClick={handleExportText}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
          title="导出为文本"
        >
          <Download size={14} />
          <span>导出</span>
        </button>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-auto p-6" style={{ background: 'var(--bg-workspace)' }}>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          className="mx-auto outline-none min-h-full leading-relaxed"
          style={{
            maxWidth: 816,
            minHeight: 1056,
            padding: '72px 72px',
            background: 'white',
            color: '#1a1a1a',
            fontSize: `${fontSize}pt`,
            fontFamily,
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            borderRadius: 4,
          }}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 text-xs border-t" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
        <span>{wordCount} 字</span>
        <span>{charCount} 字符</span>
        <span>{fontFamily} - {fontSize}pt</span>
      </div>
    </div>
  );
}
