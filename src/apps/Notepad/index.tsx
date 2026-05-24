import { useState, useRef, useCallback, useEffect } from 'react';
import {
  FilePlus, FolderOpen, Save, SaveAll, Scissors, Copy, ClipboardPaste,
  RotateCcw, RotateCw, Search, WrapText, X, Plus,
} from 'lucide-react';
import { useFileSystemStore, type FSNode } from '@/stores/useFileSystemStore';

interface NotepadProps {
  windowId: string;
}

interface OpenFile {
  id: string | null; // null = unsaved
  name: string;
  content: string;
  savedContent: string;
  wordWrap: boolean;
  tabSize: number;
}

function createUntitled(): OpenFile {
  return {
    id: null,
    name: '未命名',
    content: '',
    savedContent: '',
    wordWrap: true,
    tabSize: 4,
  };
}

export default function Notepad({ windowId: _windowId }: NotepadProps) {
  const [files, setFiles] = useState<OpenFile[]>([createUntitled()]);
  const [activeTab, setActiveTab] = useState(0);
  const [showFind, setShowFind] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nodes = useFileSystemStore((s) => s.nodes);
  const readFile = useFileSystemStore((s) => s.readFile);
  const writeFile = useFileSystemStore((s) => s.writeFile);
  const createFile = useFileSystemStore((s) => s.createFile);
  const currentDirectory = useFileSystemStore((s) => s.currentDirectory);
  const getChildren = useFileSystemStore((s) => s.getChildren);

  const currentFile = files[activeTab];

  // Check for pending file open from FileManager
  useEffect(() => {
    const pending = (window as any).__pendingFileOpen;
    if (pending && pending.appId === 'notepad') {
      const node = nodes.find((n) => n.id === pending.fileId);
      if (node && node.type === 'file') {
        const content = readFile(pending.fileId) || '';
        const newFile: OpenFile = {
          id: pending.fileId,
          name: node.name,
          content,
          savedContent: content,
          wordWrap: true,
          tabSize: 4,
        };
        const existingIdx = files.findIndex((f) => f.id === pending.fileId);
        if (existingIdx >= 0) {
          setActiveTab(existingIdx);
        } else {
          setFiles((prev) => [...prev, newFile]);
          setActiveTab(files.length);
        }
      }
      (window as any).__pendingFileOpen = null;
    }
  }, [nodes, readFile]);

  // Update cursor position
  const updateCursorPos = useCallback(() => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const text = textarea.value.substring(0, textarea.selectionStart);
    const lines = text.split('\n');
    setCursorPos({ line: lines.length, col: lines[lines.length - 1].length + 1 });
  }, []);

  const updateFileContent = useCallback((content: string) => {
    setFiles((prev) => {
      const next = [...prev];
      next[activeTab] = { ...next[activeTab], content };
      return next;
    });
  }, [activeTab]);

  // Auto-save
  useEffect(() => {
    if (!currentFile?.id) return;
    if (currentFile.content === currentFile.savedContent) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      writeFile(currentFile.id!, currentFile.content);
      setFiles((prev) => {
        const next = [...prev];
        next[activeTab] = { ...next[activeTab], savedContent: currentFile.content };
        return next;
      });
    }, 2000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [currentFile?.content, currentFile?.id, activeTab]);

  const handleNew = () => {
    setFiles((prev) => [...prev, createUntitled()]);
    setActiveTab(files.length);
  };

  const handleOpen = (nodeId: string) => {
    const fs = useFileSystemStore.getState();
    const node = fs.getNode(nodeId);
    if (!node || node.type !== 'file') return;
    const content = readFile(nodeId) || '';
    const existingIdx = files.findIndex((f) => f.id === nodeId);
    if (existingIdx >= 0) {
      setActiveTab(existingIdx);
    } else {
      const newFile: OpenFile = {
        id: nodeId,
        name: node.name,
        content,
        savedContent: content,
        wordWrap: true,
        tabSize: 4,
      };
      setFiles((prev) => [...prev, newFile]);
      setActiveTab(files.length);
    }
    setShowOpenDialog(false);
  };

  const handleSave = () => {
    if (currentFile.id) {
      writeFile(currentFile.id, currentFile.content);
      setFiles((prev) => {
        const next = [...prev];
        next[activeTab] = { ...next[activeTab], savedContent: currentFile.content };
        return next;
      });
    } else {
      setSaveName(currentFile.name === '未命名' ? '' : currentFile.name);
      setShowSaveDialog(true);
    }
  };

  const handleSaveAs = () => {
    if (!saveName.trim()) return;
    createFile(saveName, currentDirectory, currentFile.content);
    const fs = useFileSystemStore.getState();
    const newNode = fs.getChildren(currentDirectory).find((n) => n.name === saveName && n.type === 'file');
    setFiles((prev) => {
      const next = [...prev];
      next[activeTab] = { ...next[activeTab], name: saveName, savedContent: currentFile.content, id: newNode?.id || null };
      return next;
    });
    setShowSaveDialog(false);
  };

  const handleUndo = () => document.execCommand('undo');
  const handleRedo = () => document.execCommand('redo');
  const handleCut = () => document.execCommand('cut');
  const handleCopy = () => document.execCommand('copy');
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent = currentFile.content.substring(0, start) + text + currentFile.content.substring(end);
        updateFileContent(newContent);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + text.length;
        }, 0);
      }
    } catch { /* clipboard access denied */ }
  };
  const handleSelectAll = () => textareaRef.current?.select();

  const handleFindNext = useCallback(() => {
    if (!findText || !textareaRef.current) return;
    const text = currentFile.content;
    const startIdx = textareaRef.current.selectionEnd;
    const idx = text.toLowerCase().indexOf(findText.toLowerCase(), startIdx);
    if (idx >= 0) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(idx, idx + findText.length);
    } else {
      const wrapIdx = text.toLowerCase().indexOf(findText.toLowerCase());
      if (wrapIdx >= 0) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(wrapIdx, wrapIdx + findText.length);
      }
    }
  }, [findText, currentFile?.content]);

  const handleReplace = useCallback(() => {
    if (!textareaRef.current || !findText) return;
    const textarea = textareaRef.current;
    const selected = currentFile.content.substring(textarea.selectionStart, textarea.selectionEnd);
    if (selected.toLowerCase() === findText.toLowerCase()) {
      const newContent = currentFile.content.substring(0, textarea.selectionStart) + replaceText + currentFile.content.substring(textarea.selectionEnd);
      updateFileContent(newContent);
    }
    handleFindNext();
  }, [findText, replaceText, currentFile?.content, updateFileContent, handleFindNext]);

  const handleReplaceAll = useCallback(() => {
    if (!findText) return;
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newContent = currentFile.content.replace(regex, replaceText);
    updateFileContent(newContent);
  }, [findText, replaceText, currentFile?.content, updateFileContent]);

  const closeTab = (index: number) => {
    if (files.length <= 1) return;
    const file = files[index];
    if (file.content !== file.savedContent) {
      if (!confirm(`"${file.name}" 有未保存的更改，确定关闭吗？`)) return;
    }
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (activeTab >= files.length - 1) setActiveTab(Math.max(0, files.length - 2));
    else if (activeTab > index) setActiveTab(activeTab - 1);
  };

  // Handle Tab key for indentation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const spaces = ' '.repeat(currentFile.tabSize);
      const newContent = currentFile.content.substring(0, start) + spaces + currentFile.content.substring(textarea.selectionEnd);
      updateFileContent(newContent);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + currentFile.tabSize;
      }, 0);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); handleNew(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); setShowFind(true); setShowReplace(false); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') { e.preventDefault(); setShowFind(true); setShowReplace(true); }
  }, [currentFile?.tabSize, currentFile?.content, updateFileContent, handleSave]);

  const lineCount = currentFile ? currentFile.content.split('\n').length : 0;
  const isModified = currentFile ? currentFile.content !== currentFile.savedContent : false;
  const textFiles = nodes.filter((n) => n.type === 'file' && (n.mimeType === 'text/plain' || n.name.endsWith('.txt') || n.name.endsWith('.md') || n.name.endsWith('.json') || n.name.endsWith('.js') || n.name.endsWith('.ts') || n.name.endsWith('.py') || n.name.endsWith('.css') || n.name.endsWith('.html')));

  return (
    <div className="w-full h-full flex flex-col" style={{ background: 'var(--bg-workspace)' }}>
      {/* Menu bar */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
        <div className="relative group">
          <button className="px-2 py-1 rounded text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]">文件</button>
          <div className="absolute top-full left-0 w-44 py-1 rounded-lg hidden group-hover:block z-50 border" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <button onClick={handleNew} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"><FilePlus size={14} /> 新建</button>
            <button onClick={() => setShowOpenDialog(true)} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"><FolderOpen size={14} /> 打开</button>
            <div className="h-px my-1" style={{ background: 'var(--border-default)' }} />
            <button onClick={handleSave} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"><Save size={14} /> 保存 <span className="ml-auto text-[10px] text-[var(--text-muted)]">Ctrl+S</span></button>
            <button onClick={() => { setSaveName(currentFile.name === '未命名' ? '' : currentFile.name); setShowSaveDialog(true); }} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"><SaveAll size={14} /> 另存为</button>
          </div>
        </div>
        <div className="relative group">
          <button className="px-2 py-1 rounded text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]">编辑</button>
          <div className="absolute top-full left-0 w-44 py-1 rounded-lg hidden group-hover:block z-50 border" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <button onClick={handleUndo} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"><RotateCcw size={14} /> 撤销</button>
            <button onClick={handleRedo} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"><RotateCw size={14} /> 重做</button>
            <div className="h-px my-1" style={{ background: 'var(--border-default)' }} />
            <button onClick={handleCut} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"><Scissors size={14} /> 剪切</button>
            <button onClick={handleCopy} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"><Copy size={14} /> 复制</button>
            <button onClick={handlePaste} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"><ClipboardPaste size={14} /> 粘贴</button>
            <div className="h-px my-1" style={{ background: 'var(--border-default)' }} />
            <button onClick={handleSelectAll} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">全选</button>
            <button onClick={() => { setShowFind(true); setShowReplace(false); }} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"><Search size={14} /> 查找 <span className="ml-auto text-[10px] text-[var(--text-muted)]">Ctrl+F</span></button>
            <button onClick={() => { setShowFind(true); setShowReplace(true); }} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">查找和替换 <span className="ml-auto text-[10px] text-[var(--text-muted)]">Ctrl+H</span></button>
          </div>
        </div>
        <div className="relative group">
          <button className="px-2 py-1 rounded text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]">视图</button>
          <div className="absolute top-full left-0 w-44 py-1 rounded-lg hidden group-hover:block z-50 border" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <button onClick={() => {
              setFiles((prev) => {
                const next = [...prev];
                next[activeTab] = { ...next[activeTab], wordWrap: !next[activeTab].wordWrap };
                return next;
              });
            }} className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2">
              <WrapText size={14} /> 自动换行 {currentFile?.wordWrap ? '开' : '关'}
            </button>
            <div className="px-3 py-1">
              <span className="text-xs text-[var(--text-muted)]">字体大小</span>
              <div className="flex items-center gap-2 mt-1">
                <button onClick={() => setFontSize(Math.max(8, fontSize - 1))} className="px-2 py-0.5 rounded text-xs hover:bg-[var(--bg-hover)]" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}>-</button>
                <span className="text-xs text-[var(--text-primary)] w-8 text-center">{fontSize}</span>
                <button onClick={() => setFontSize(Math.min(32, fontSize + 1))} className="px-2 py-0.5 rounded text-xs hover:bg-[var(--bg-hover)]" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}>+</button>
              </div>
            </div>
            <div className="px-3 py-1">
              <span className="text-xs text-[var(--text-muted)]">制表符大小</span>
              <div className="flex items-center gap-1 mt-1">
                {[2, 4, 8].map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setFiles((prev) => {
                        const next = [...prev];
                        next[activeTab] = { ...next[activeTab], tabSize: size };
                        return next;
                      });
                    }}
                    className={`px-2 py-0.5 rounded text-xs ${currentFile?.tabSize === size ? 'bg-[var(--accent-silver)] text-white' : 'hover:bg-[var(--bg-hover)]'}`}
                    style={currentFile?.tabSize !== size ? { background: 'var(--bg-input)', color: 'var(--text-primary)' } : {}}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 text-xs text-[var(--text-muted)] truncate text-center">
          {currentFile?.name || '未命名'}{isModified ? ' *' : ''}
        </div>
      </div>

      {/* File tabs */}
      {files.length > 1 && (
        <div className="flex items-center border-b overflow-x-auto" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
          {files.map((file, i) => (
            <div
              key={i}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs cursor-pointer border-r transition-colors ${
                i === activeTab
                  ? 'bg-[var(--bg-workspace)] text-[var(--text-primary)] font-medium'
                  : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'
              }`}
              style={{ borderColor: 'var(--border-default)' }}
              onClick={() => setActiveTab(i)}
            >
              <span className="max-w-[100px] truncate">{file.name}{file.content !== file.savedContent ? ' *' : ''}</span>
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(i); }}
                className="p-0.5 rounded hover:bg-[var(--bg-hover)]"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          <button
            onClick={handleNew}
            className="p-1.5 hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
            title="新建标签"
          >
            <Plus size={12} />
          </button>
        </div>
      )}

      {/* Find/Replace bar */}
      {showFind && (
        <div className="flex flex-col gap-1 px-3 py-2 border-b" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
          <div className="flex items-center gap-2">
            <Search size={14} className="text-[var(--text-muted)]" />
            <input
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleFindNext(); if (e.key === 'Escape') setShowFind(false); }}
              placeholder="查找..."
              className="h-7 px-2 rounded text-xs outline-none flex-1"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
              autoFocus
            />
            <button onClick={handleFindNext} className="px-3 py-1 rounded text-xs hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">下一个</button>
            <button onClick={() => setShowReplace(!showReplace)} className="px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
              {showReplace ? '隐藏' : '替换'}
            </button>
            <button onClick={() => { setShowFind(false); setShowReplace(false); }} className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)]">
              <X size={14} />
            </button>
          </div>
          {showReplace && (
            <div className="flex items-center gap-2">
              <div className="w-[14px]" />
              <input
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleReplace(); if (e.key === 'Escape') setShowFind(false); }}
                placeholder="替换..."
                className="h-7 px-2 rounded text-xs outline-none flex-1"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
              />
              <button onClick={handleReplace} className="px-3 py-1 rounded text-xs hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">替换</button>
              <button onClick={handleReplaceAll} className="px-3 py-1 rounded text-xs hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">全部</button>
            </div>
          )}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line numbers */}
        <div
          className="w-12 py-2 text-right pr-2 select-none overflow-hidden shrink-0"
          style={{
            background: 'var(--bg-window)',
            color: 'var(--text-muted)',
            fontSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            lineHeight: '1.6',
            borderRight: '1px solid var(--border-default)',
          }}
        >
          {Array.from({ length: Math.max(lineCount, 1) }, (_, i) => (
            <div key={i} className="leading-relaxed">{i + 1}</div>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={currentFile?.content || ''}
          onChange={(e) => updateFileContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={updateCursorPos}
          onClick={updateCursorPos}
          onSelect={updateCursorPos}
          className="flex-1 p-2 outline-none resize-none font-mono leading-relaxed"
          style={{
            background: 'var(--bg-workspace)',
            color: 'var(--text-primary)',
            fontSize,
            whiteSpace: currentFile?.wordWrap ? 'pre-wrap' : 'pre',
            overflowWrap: currentFile?.wordWrap ? 'break-word' : 'normal',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            lineHeight: '1.6',
            tabSize: currentFile?.tabSize || 4,
          }}
          spellCheck={false}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 text-xs border-t" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
        <span>行 {cursorPos.line}, 列 {cursorPos.col}</span>
        <span>{lineCount} 行</span>
        <span>{currentFile?.content.length || 0} 字符</span>
        <span>制表符: {currentFile?.tabSize || 4}</span>
        <span>{currentFile?.wordWrap ? '换行' : '不换行'}</span>
        <span>UTF-8</span>
      </div>

      {/* Open dialog */}
      {showOpenDialog && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-96 rounded-xl p-4" style={{ background: 'var(--bg-window)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <h3 className="text-sm font-semibold mb-3 text-[var(--text-primary)]">打开文件</h3>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {textFiles.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">未找到文本文件</p>
              ) : (
                textFiles.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => handleOpen(node.id)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-[var(--bg-hover)] text-sm text-[var(--text-primary)] flex items-center gap-2"
                  >
                    <FilePlus size={14} className="text-[var(--text-muted)]" />
                    {node.name}
                    <span className="ml-auto text-[10px] text-[var(--text-muted)]">
                      {node.size ? `${node.size} 字节` : ''}
                    </span>
                  </button>
                ))
              )}
            </div>
            <button onClick={() => setShowOpenDialog(false)} className="w-full mt-3 py-2 rounded text-sm hover:bg-[var(--bg-hover)]" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}>取消</button>
          </div>
        </div>
      )}

      {/* Save dialog */}
      {showSaveDialog && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-80 rounded-xl p-4" style={{ background: 'var(--bg-window)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <h3 className="text-sm font-semibold mb-3 text-[var(--text-primary)]">另存为</h3>
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveAs(); }}
              placeholder="文件名"
              autoFocus
              className="w-full h-9 px-3 rounded text-sm outline-none mb-3"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowSaveDialog(false)} className="flex-1 py-2 rounded text-sm hover:bg-[var(--bg-hover)]" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}>取消</button>
              <button onClick={handleSaveAs} className="flex-1 py-2 rounded text-sm text-white" style={{ background: 'var(--accent-silver)' }}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
