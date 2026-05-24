import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  FilePlus, FolderOpen, Save, SaveAll, Search, Replace, X, ChevronDown,
  FileCode, Copy, Scissors, ClipboardPaste, WrapText, Settings,
} from 'lucide-react';
import { useFileSystemStore, type FSNode } from '@/stores/useFileSystemStore';

interface Tab {
  id: string | null; // null = unsaved
  name: string;
  content: string;
  language: string;
  savedContent: string;
}

const LANGUAGES: Record<string, string[]> = {
  javascript: ['.js', '.jsx', '.mjs'],
  typescript: ['.ts', '.tsx'],
  python: ['.py', '.pyw'],
  html: ['.html', '.htm'],
  css: ['.css', '.scss', '.less'],
  json: ['.json'],
  markdown: ['.md', '.markdown'],
  text: ['.txt', '.log'],
};

function detectLanguage(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot === -1) return 'text';
  const ext = filename.substring(dot).toLowerCase();
  for (const [lang, exts] of Object.entries(LANGUAGES)) {
    if (exts.includes(ext)) return lang;
  }
  return 'text';
}

// Simple syntax highlighting via regex tokenization
const KEYWORDS: Record<string, RegExp> = {
  javascript: /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|import|export|default|from|async|await|try|catch|finally|throw|typeof|instanceof|in|of|yield|null|undefined|true|false|void|delete|super|with|debugger|static|get|set)\b/g,
  typescript: /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|import|export|default|from|async|await|try|catch|finally|throw|typeof|instanceof|in|of|yield|null|undefined|true|false|void|delete|super|with|debugger|static|get|set|interface|type|enum|namespace|module|declare|implements|abstract|readonly|private|protected|public|as|is|keyof|infer|never|unknown|any|string|number|boolean|symbol|bigint|object|void|never)\b/g,
  python: /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|raise|with|yield|lambda|pass|break|continue|and|or|not|is|in|True|False|None|global|nonlocal|assert|del|async|await|print|self|elif)\b/g,
};

interface SyntaxToken {
  text: string;
  className: string;
}

function tokenizeLine(line: string, language: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  const kw = KEYWORDS[language];
  if (!kw) return [{ text: line, className: '' }];

  // Match strings, comments, keywords, numbers
  const regex = /(["'`])(?:(?!\1|\\).|\\.)*\1|\/\/.*$|#.*$|\b\d+\.?\d*\b/g;
  let lastIndex = 0;
  const matches: { start: number; end: number; type: string; text: string }[] = [];

  // Find all keyword matches
  const kwRegex = new RegExp(kw.source, kw.flags);
  let m: RegExpExecArray | null;
  while ((m = kwRegex.exec(line)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, type: 'keyword', text: m[0] });
  }

  // Find string/comment/number matches
  const tokenRegex = /(["'`])(?:(?!\1|\\).|\\.)*\1|\/\/.*$|#.*$|\b\d+\.?\d*\b/g;
  while ((m = tokenRegex.exec(line)) !== null) {
    const text = m[0];
    let type = 'number';
    if (text.startsWith('//') || text.startsWith('#')) type = 'comment';
    else if (text.startsWith('"') || text.startsWith("'") || text.startsWith('`')) type = 'string';
    matches.push({ start: m.index, end: m.index + text.length, type, text });
  }

  // Sort and merge
  matches.sort((a, b) => a.start - b.start);
  const filtered = matches.filter((m, i) => {
    if (i === 0) return true;
    return m.start >= matches[i - 1].end;
  });

  for (const match of filtered) {
    if (match.start > lastIndex) {
      tokens.push({ text: line.substring(lastIndex, match.start), className: '' });
    }
    tokens.push({ text: match.text, className: `syntax-${match.type}` });
    lastIndex = match.end;
  }
  if (lastIndex < line.length) {
    tokens.push({ text: line.substring(lastIndex), className: '' });
  }

  return tokens.length > 0 ? tokens : [{ text: line, className: '' }];
}

interface CodeEditorProps {
  windowId: string;
}

export default function CodeEditor({ windowId: _windowId }: CodeEditorProps) {
  const [tabs, setTabs] = useState<Tab[]>([{
    id: null, name: '未命名.js', content: '', language: 'javascript', savedContent: '',
  }]);
  const [activeTab, setActiveTab] = useState(0);
  const [findOpen, setFindOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [wordWrap, setWordWrap] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumRef = useRef<HTMLDivElement>(null);

  const nodes = useFileSystemStore((s) => s.nodes);
  const getChildren = useFileSystemStore((s) => s.getChildren);
  const currentDirectory = useFileSystemStore((s) => s.currentDirectory);
  const readFile = useFileSystemStore((s) => s.readFile);
  const writeFile = useFileSystemStore((s) => s.writeFile);

  const currentTab = tabs[activeTab] || tabs[0];
  const content = currentTab?.content || '';
  const lines = content.split('\n');

  // Cursor position tracking
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);

  // Check for pending file open from FileManager
  useEffect(() => {
    const pending = (window as any).__pendingFileOpen;
    if (pending && pending.appId === 'codeeditor') {
      const node = nodes.find((n) => n.id === pending.fileId);
      if (node && node.type === 'file') {
        const data = readFile(pending.fileId) || '';
        openFileInTab(pending.fileId, pending.fileName || node.name, data);
      }
      (window as any).__pendingFileOpen = null;
    }
  }, [nodes, readFile]);

  const openFileInTab = (id: string | null, name: string, data: string) => {
    const lang = detectLanguage(name);
    const existing = tabs.findIndex((t) => t.id === id && id !== null);
    if (existing >= 0) {
      setActiveTab(existing);
      return;
    }
    const newTab: Tab = { id, name, content: data, language: lang, savedContent: data };
    setTabs([...tabs, newTab]);
    setActiveTab(tabs.length);
  };

  const updateContent = (newContent: string) => {
    const updated = [...tabs];
    updated[activeTab] = { ...updated[activeTab], content: newContent };
    setTabs(updated);
  };

  const handleNew = () => {
    const newTab: Tab = { id: null, name: `未命名.${tabs.length + 1}.js`, content: '', language: 'javascript', savedContent: '' };
    setTabs([...tabs, newTab]);
    setActiveTab(tabs.length);
  };

  const handleOpen = (nodeId: string) => {
    const fs = useFileSystemStore.getState();
    const node = fs.getNode(nodeId);
    if (!node || node.type !== 'file') return;
    const data = readFile(nodeId) || '';
    openFileInTab(nodeId, node.name, data);
    setShowOpenDialog(false);
  };

  const handleSave = () => {
    if (currentTab.id) {
      writeFile(currentTab.id, currentTab.content);
      const updated = [...tabs];
      updated[activeTab] = { ...updated[activeTab], savedContent: updated[activeTab].content };
      setTabs(updated);
    } else {
      setSaveName(currentTab.name);
      setShowSaveDialog(true);
    }
  };

  const handleSaveAs = () => {
    if (!saveName.trim()) return;
    const fs = useFileSystemStore.getState();
    fs.createFile(saveName, currentDirectory, currentTab.content);
    const updated = [...tabs];
    updated[activeTab] = { ...updated[activeTab], id: `new-${Date.now()}`, name: saveName, savedContent: currentTab.content, language: detectLanguage(saveName) };
    setTabs(updated);
    setShowSaveDialog(false);
  };

  const closeTab = (idx: number) => {
    if (tabs.length === 1) return;
    const updated = tabs.filter((_, i) => i !== idx);
    setTabs(updated);
    if (activeTab >= updated.length) setActiveTab(updated.length - 1);
    else if (activeTab > idx) setActiveTab(activeTab - 1);
  };

  const handleFindNext = useCallback(() => {
    if (!findText || !textareaRef.current) return;
    const ta = textareaRef.current;
    const searchFrom = ta.selectionEnd;
    const haystack = caseSensitive ? content : content.toLowerCase();
    const needle = caseSensitive ? findText : findText.toLowerCase();
    let idx = haystack.indexOf(needle, searchFrom);
    if (idx === -1) idx = haystack.indexOf(needle, 0); // wrap
    if (idx >= 0) {
      ta.focus();
      ta.setSelectionRange(idx, idx + findText.length);
    }
  }, [content, findText, caseSensitive]);

  const handleReplaceAll = useCallback(() => {
    if (!findText) return;
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    updateContent(content.replace(regex, replaceText));
  }, [content, findText, replaceText, caseSensitive]);

  const handleReplaceCurrent = useCallback(() => {
    if (!findText || !textareaRef.current) return;
    const ta = textareaRef.current;
    const selected = content.substring(ta.selectionStart, ta.selectionEnd);
    const matches = caseSensitive ? selected === findText : selected.toLowerCase() === findText.toLowerCase();
    if (matches) {
      const before = content.substring(0, ta.selectionStart);
      const after = content.substring(ta.selectionEnd);
      updateContent(before + replaceText + after);
    }
    handleFindNext();
  }, [content, findText, replaceText, caseSensitive, handleFindNext]);

  const updateCursor = () => {
    if (!textareaRef.current) return;
    const ta = textareaRef.current;
    const textBefore = content.substring(0, ta.selectionStart);
    const linesBefore = textBefore.split('\n');
    setCursorLine(linesBefore.length);
    setCursorCol(linesBefore[linesBefore.length - 1].length + 1);
  };

  // Sync scroll between line numbers and textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumRef.current) {
      lineNumRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setFindOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        handleNew();
      }
      if (e.key === 'Escape' && findOpen) {
        setFindOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [findOpen, currentTab]);

  // Handle tab key in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      updateContent(newContent);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
    updateCursor();
  };

  const fileIcon = (name: string) => {
    const lang = detectLanguage(name);
    const colors: Record<string, string> = {
      javascript: '#f7df1e', typescript: '#3178c6', python: '#3776ab',
      html: '#e34c26', css: '#563d7c', json: '#000',
    };
    return <FileCode size={14} style={{ color: colors[lang] || 'var(--text-muted)' }} />;
  };

  return (
    <div className="w-full h-full flex flex-col text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {/* Syntax highlighting styles */}
      <style>{`
        .syntax-keyword { color: #c586c0; }
        .syntax-string { color: #ce9178; }
        .syntax-comment { color: #6a9955; }
        .syntax-number { color: #b5cea8; }
      `}</style>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
        <button onClick={handleNew} className="p-1 rounded hover:bg-[var(--bg-hover)]" title="新建 (Ctrl+N)"><FilePlus size={14} className="text-[var(--text-secondary)]" /></button>
        <button onClick={() => setShowOpenDialog(true)} className="p-1 rounded hover:bg-[var(--bg-hover)]" title="打开"><FolderOpen size={14} className="text-[var(--text-secondary)]" /></button>
        <button onClick={handleSave} className="p-1 rounded hover:bg-[var(--bg-hover)]" title="保存 (Ctrl+S)"><Save size={14} className="text-[var(--text-secondary)]" /></button>
        <div className="w-px h-4 mx-1" style={{ background: 'var(--border-default)' }} />
        <button onClick={() => setFindOpen(!findOpen)} className="p-1 rounded hover:bg-[var(--bg-hover)]" title="查找 (Ctrl+F)"><Search size={14} className="text-[var(--text-secondary)]" /></button>
        <div className="w-px h-4 mx-1" style={{ background: 'var(--border-default)' }} />
        <button onClick={() => setWordWrap(!wordWrap)} className={`p-1 rounded hover:bg-[var(--bg-hover)] ${wordWrap ? 'bg-[var(--bg-hover)]' : ''}`} title="自动换行"><WrapText size={14} className="text-[var(--text-secondary)]" /></button>
        <div className="flex-1" />
        <span className="text-xs text-[var(--text-muted)]">{fontSize}px</span>
        <button onClick={() => setFontSize(Math.max(8, fontSize - 1))} className="px-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">-</button>
        <button onClick={() => setFontSize(Math.min(32, fontSize + 1))} className="px-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">+</button>
      </div>

      {/* Find/Replace bar */}
      {findOpen && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
          <div className="flex items-center gap-1 flex-1">
            <Search size={14} className="text-[var(--text-muted)]" />
            <input
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleFindNext(); }}
              placeholder="查找..."
              className="h-7 px-2 rounded text-xs outline-none flex-1"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
              autoFocus
            />
            <button onClick={() => setCaseSensitive(!caseSensitive)} className={`px-1.5 py-0.5 rounded text-xs font-mono ${caseSensitive ? 'bg-[var(--accent-silver)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`} title="区分大小写">Aa</button>
            <button onClick={handleFindNext} className="px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-secondary)' }}>下一个</button>
          </div>
          <button onClick={() => setShowReplace(!showReplace)} className="p-1 rounded hover:bg-[var(--bg-hover)]"><Replace size={14} className="text-[var(--text-secondary)]" /></button>
          <button onClick={() => setFindOpen(false)} className="p-1 rounded hover:bg-[var(--bg-hover)]"><X size={14} className="text-[var(--text-muted)]" /></button>
        </div>
      )}
      {findOpen && showReplace && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
          <div className="flex items-center gap-1 flex-1">
            <Replace size={14} className="text-[var(--text-muted)]" />
            <input
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="替换..."
              className="h-7 px-2 rounded text-xs outline-none flex-1"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
            />
            <button onClick={handleReplaceCurrent} className="px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-secondary)' }}>替换</button>
            <button onClick={handleReplaceAll} className="px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-secondary)' }}>全部</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center overflow-x-auto border-b" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)', minHeight: 32 }}>
        {tabs.map((tab, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r whitespace-nowrap ${i === activeTab ? 'bg-[var(--bg-workspace)]' : 'hover:bg-[var(--bg-hover)]'}`}
            style={{ borderColor: 'var(--border-default)', color: i === activeTab ? 'var(--text-primary)' : 'var(--text-muted)' }}
            onClick={() => setActiveTab(i)}
          >
            {fileIcon(tab.name)}
            <span>{tab.name}</span>
            {tab.content !== tab.savedContent && <span className="w-2 h-2 rounded-full bg-[var(--accent-silver)]" />}
            <button onClick={(e) => { e.stopPropagation(); closeTab(i); }} className="ml-1 p-0.5 rounded hover:bg-[var(--bg-hover)]"><X size={10} /></button>
          </div>
        ))}
        <button onClick={handleNew} className="px-2 py-1.5 hover:bg-[var(--bg-hover)]"><FilePlus size={12} className="text-[var(--text-muted)]" /></button>
      </div>

      {/* Editor */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line numbers */}
        <div
          ref={lineNumRef}
          className="w-14 py-2 text-right pr-3 select-none overflow-hidden shrink-0"
          style={{ background: 'var(--bg-window)', color: 'var(--text-muted)', fontSize, fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace", lineHeight: '1.6' }}
        >
          {lines.map((_, i) => (
            <div key={i} style={{ lineHeight: '1.6' }}>{i + 1}</div>
          ))}
        </div>

        {/* Code area with syntax highlighting overlay */}
        <div className="flex-1 relative overflow-hidden">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => updateContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={updateCursor}
            onClick={updateCursor}
            onScroll={handleScroll}
            className="absolute inset-0 w-full h-full p-2 outline-none resize-none font-mono leading-relaxed z-10"
            style={{
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize,
              whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
              overflowWrap: wordWrap ? 'break-word' : 'normal',
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              lineHeight: '1.6',
              caretColor: 'var(--text-primary)',
              tabSize: 2,
            }}
            spellCheck={false}
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 text-xs border-t" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-4">
          <span>第 {cursorLine} 行，第 {cursorCol} 列</span>
          <span>{lines.length} 行</span>
          <span>{content.length} 字符</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{currentTab.language}</span>
          <span>UTF-8</span>
          <span>空格: 2</span>
        </div>
      </div>

      {/* Open dialog */}
      {showOpenDialog && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-96 rounded-xl p-4" style={{ background: 'var(--bg-window)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <h3 className="text-sm font-semibold mb-3 text-[var(--text-primary)]">打开文件</h3>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {getChildren(currentDirectory).filter((n) => n.type === 'file').map((node) => (
                <button key={node.id} onClick={() => handleOpen(node.id)} className="w-full text-left px-3 py-2 rounded hover:bg-[var(--bg-hover)] text-sm text-[var(--text-primary)] flex items-center gap-2">
                  {fileIcon(node.name)}
                  {node.name}
                </button>
              ))}
              {getChildren(currentDirectory).filter((n) => n.type === 'file').length === 0 && (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">当前目录没有文件</p>
              )}
            </div>
            <button onClick={() => setShowOpenDialog(false)} className="w-full mt-3 py-2 rounded text-sm hover:bg-[var(--bg-hover)]" style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>取消</button>
          </div>
        </div>
      )}

      {/* Save dialog */}
      {showSaveDialog && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-80 rounded-xl p-4" style={{ background: 'var(--bg-window)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <h3 className="text-sm font-semibold mb-3 text-[var(--text-primary)]">另存为</h3>
            <input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="文件名" autoFocus className="w-full h-9 px-3 rounded text-sm outline-none mb-3" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }} />
            <div className="flex gap-2">
              <button onClick={() => setShowSaveDialog(false)} className="flex-1 py-2 rounded text-sm hover:bg-[var(--bg-hover)]" style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>取消</button>
              <button onClick={handleSaveAs} className="flex-1 py-2 rounded text-sm text-white" style={{ background: 'var(--accent-silver)' }}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
