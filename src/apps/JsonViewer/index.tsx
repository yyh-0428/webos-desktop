import { useState, useMemo, useCallback } from 'react';
import { Copy, Check, Minimize2, Maximize2, ChevronRight, ChevronDown, AlertCircle, FileJson } from 'lucide-react';

interface JsonViewerProps {
  windowId: string;
}

interface TreeNodeProps {
  data: any;
  keyName: string | null;
  path: string;
  depth: number;
  defaultOpen?: boolean;
  onPathClick: (path: string) => void;
}

function JsonTreeNode({ data, keyName, path, depth, defaultOpen, onPathClick }: TreeNodeProps) {
  const [open, setOpen] = useState(defaultOpen ?? depth < 2);

  const type = data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data;
  const isExpandable = type === 'object' || type === 'array';

  const toggle = () => {
    setOpen(!open);
    onPathClick(path);
  };

  const valueColor = (t: string) => {
    switch (t) {
      case 'string': return '#ce9178';
      case 'number': return '#b5cea8';
      case 'boolean': return '#569cd6';
      case 'null': return '#d16969';
      default: return 'var(--text-primary)';
    }
  };

  const displayValue = () => {
    if (type === 'string') return `"${data}"`;
    if (type === 'null') return 'null';
    return String(data);
  };

  if (!isExpandable) {
    return (
      <div className="flex items-center gap-1 py-0.5 hover:bg-[var(--bg-hover)] rounded px-1 cursor-pointer" style={{ paddingLeft: depth * 16 }} onClick={() => onPathClick(path)}>
        {keyName !== null && (
          <>
            <span className="font-mono text-xs text-[var(--accent-silver)]">"{keyName}"</span>
            <span className="text-xs text-[var(--text-muted)]">:</span>
          </>
        )}
        <span className="font-mono text-xs" style={{ color: valueColor(type) }}>{displayValue()}</span>
      </div>
    );
  }

  const entries = type === 'array' ? data.map((v: any, i: number) => [i, v]) : Object.entries(data);
  const bracket = type === 'array' ? ['[', ']'] : ['{', '}'];

  return (
    <div>
      <div className="flex items-center gap-1 py-0.5 hover:bg-[var(--bg-hover)] rounded px-1 cursor-pointer" style={{ paddingLeft: depth * 16 }} onClick={toggle}>
        <span className="text-[var(--text-muted)]">{open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</span>
        {keyName !== null && (
          <>
            <span className="font-mono text-xs text-[var(--accent-silver)]">"{keyName}"</span>
            <span className="text-xs text-[var(--text-muted)]">: </span>
          </>
        )}
        <span className="font-mono text-xs text-[var(--text-muted)]">{bracket[0]}</span>
        {!open && <span className="font-mono text-xs text-[var(--text-muted)]">{entries.length} 个元素{bracket[1]}</span>}
      </div>
      {open && (
        <>
          {entries.map(([k, v]: [any, any]) => (
            <JsonTreeNode
              key={k}
              data={v}
              keyName={type === 'array' ? null : String(k)}
              path={type === 'array' ? `${path}[${k}]` : `${path}.${k}`}
              depth={depth + 1}
              defaultOpen={depth < 2}
              onPathClick={onPathClick}
            />
          ))}
          <div className="font-mono text-xs text-[var(--text-muted)] py-0.5" style={{ paddingLeft: depth * 16 }}>{bracket[1]}</div>
        </>
      )}
    </div>
  );
}

export default function JsonViewer({ windowId: _windowId }: JsonViewerProps) {
  const [input, setInput] = useState('{\n  "name": "WebOS",\n  "version": "1.0.0",\n  "features": ["desktop", "apps", "files"],\n  "config": {\n    "theme": "dark",\n    "language": "en",\n    "notifications": true\n  },\n  "users": [\n    { "id": 1, "name": "Admin", "role": "admin" },\n    { "id": 2, "name": "Guest", "role": "user" }\n  ],\n  "debug": null\n}');
  const [currentPath, setCurrentPath] = useState('$');
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'tree' | 'raw'>('tree');

  const parsed = useMemo(() => {
    if (!input.trim()) return { data: null, error: null, empty: true };
    try {
      const data = JSON.parse(input);
      return { data, error: null, empty: false };
    } catch (e: any) {
      return { data: null, error: e.message, empty: false };
    }
  }, [input]);

  const formatted = useMemo(() => {
    if (parsed.error || parsed.empty) return '';
    return JSON.stringify(parsed.data, null, 2);
  }, [parsed]);

  const minified = useMemo(() => {
    if (parsed.error || parsed.empty) return '';
    return JSON.stringify(parsed.data);
  }, [parsed]);

  const handleFormat = () => {
    if (formatted) setInput(formatted);
  };

  const handleMinify = () => {
    if (minified) setInput(minified);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formatted || input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePathClick = useCallback((path: string) => {
    setCurrentPath(path);
  }, []);

  const stats = useMemo(() => {
    if (!parsed.data) return null;
    const count = (obj: any): { keys: number; arrays: number; objects: number; depth: number } => {
      if (obj === null || typeof obj !== 'object') return { keys: 0, arrays: 0, objects: 0, depth: 0 };
      const isArray = Array.isArray(obj);
      let keys = isArray ? 0 : Object.keys(obj).length;
      let arrays = isArray ? 1 : 0;
      let objects = isArray ? 0 : 1;
      let maxChildDepth = 0;
      for (const v of Object.values(obj)) {
        if (typeof v === 'object' && v !== null) {
          const child = count(v);
          keys += child.keys;
          arrays += child.arrays;
          objects += child.objects;
          maxChildDepth = Math.max(maxChildDepth, child.depth);
        }
      }
      return { keys, arrays, objects, depth: maxChildDepth + 1 };
    };
    return count(parsed.data);
  }, [parsed.data]);

  return (
    <div className="w-full h-full flex flex-col text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
        <FileJson size={14} className="text-[var(--accent-silver)]" />
        <span className="text-xs font-medium text-[var(--text-secondary)] mr-2">JSON 查看器</span>
        <button onClick={handleFormat} disabled={!!parsed.error || parsed.empty} className="px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)] disabled:opacity-40" style={{ color: 'var(--text-primary)' }}>
          <Maximize2 size={12} className="inline mr-1" />格式化
        </button>
        <button onClick={handleMinify} disabled={!!parsed.error || parsed.empty} className="px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)] disabled:opacity-40" style={{ color: 'var(--text-primary)' }}>
          <Minimize2 size={12} className="inline mr-1" />压缩
        </button>
        <button onClick={handleCopy} className="px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-primary)' }}>
          {copied ? <Check size={12} className="inline mr-1 text-green-400" /> : <Copy size={12} className="inline mr-1" />}
          {copied ? '已复制!' : '复制'}
        </button>
        <div className="flex-1" />
        <div className="flex items-center rounded overflow-hidden text-xs" style={{ border: '1px solid var(--border-default)' }}>
          <button onClick={() => setMode('tree')} className={`px-2 py-1 ${mode === 'tree' ? 'text-white' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`} style={mode === 'tree' ? { background: 'var(--accent-silver)' } : {}}>树形</button>
          <button onClick={() => setMode('raw')} className={`px-2 py-1 ${mode === 'raw' ? 'text-white' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`} style={mode === 'raw' ? { background: 'var(--accent-silver)' } : {}}>原始</button>
        </div>
      </div>

      {/* Path bar */}
      <div className="flex items-center gap-2 px-3 py-1 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <span className="text-xs text-[var(--text-muted)]">路径:</span>
        <span className="text-xs font-mono text-[var(--accent-silver)]">{currentPath}</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Input */}
        <div className="w-2/5 flex flex-col border-r" style={{ borderColor: 'var(--border-default)' }}>
          <div className="px-3 py-1 border-b text-xs font-medium text-[var(--text-secondary)]" style={{ borderColor: 'var(--border-default)' }}>输入</div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-3 outline-none resize-none font-mono text-xs leading-relaxed"
            style={{ background: 'var(--bg-workspace)', color: 'var(--text-primary)' }}
            spellCheck={false}
            placeholder="在此粘贴 JSON..."
          />
        </div>

        {/* Output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-3 py-1 border-b text-xs font-medium text-[var(--text-secondary)]" style={{ borderColor: 'var(--border-default)' }}>输出</div>
          <div className="flex-1 overflow-auto p-3">
            {parsed.error && (
              <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-red-400 mb-1">无效的 JSON</p>
                  <p className="text-xs text-red-300 font-mono">{parsed.error}</p>
                </div>
              </div>
            )}
            {parsed.empty && (
              <p className="text-xs text-[var(--text-muted)] text-center py-8">在输入框中粘贴 JSON 以查看</p>
            )}
            {!parsed.error && !parsed.empty && mode === 'tree' && (
              <JsonTreeNode data={parsed.data} keyName={null} path="$" depth={0} defaultOpen onPathClick={handlePathClick} />
            )}
            {!parsed.error && !parsed.empty && mode === 'raw' && (
              <pre className="font-mono text-xs whitespace-pre-wrap text-[var(--text-primary)]">{formatted}</pre>
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 text-xs border-t" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-4">
          {stats && (
            <>
              <span>{stats.keys} 个键</span>
              <span>{stats.objects} 个对象</span>
              <span>{stats.arrays} 个数组</span>
              <span>深度: {stats.depth}</span>
            </>
          )}
          {parsed.error && <span className="text-red-400">无效的 JSON</span>}
        </div>
        <span>{input.length} 字符</span>
      </div>
    </div>
  );
}
