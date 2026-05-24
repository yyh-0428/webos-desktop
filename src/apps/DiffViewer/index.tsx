import { useState, useMemo } from 'react';
import { GitCompareArrows, Columns, Rows, Copy, RotateCcw } from 'lucide-react';

interface DiffViewerProps {
  windowId: string;
}

type DiffLine = {
  type: 'added' | 'removed' | 'unchanged' | 'modified';
  leftNum: number | null;
  rightNum: number | null;
  leftText: string;
  rightText: string;
};

// Longest Common Subsequence for line-level diff
function computeLCS(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp;
}

function buildDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const dp = computeLCS(oldLines, newLines);
  const result: DiffLine[] = [];
  let i = oldLines.length;
  let j = newLines.length;

  const temp: { type: DiffLine['type']; oldIdx: number | null; newIdx: number | null; oldText: string; newText: string }[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      temp.unshift({ type: 'unchanged', oldIdx: i, newIdx: j, oldText: oldLines[i - 1], newText: newLines[j - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      temp.unshift({ type: 'added', oldIdx: null, newIdx: j, oldText: '', newText: newLines[j - 1] });
      j--;
    } else if (i > 0) {
      temp.unshift({ type: 'removed', oldIdx: i, newIdx: null, oldText: oldLines[i - 1], newText: '' });
      i--;
    }
  }

  // Convert to DiffLine format, merging adjacent adds/removes as potential modifications
  let k = 0;
  while (k < temp.length) {
    if (temp[k].type === 'removed' && k + 1 < temp.length && temp[k + 1].type === 'added') {
      result.push({
        type: 'modified',
        leftNum: temp[k].oldIdx,
        rightNum: temp[k + 1].newIdx,
        leftText: temp[k].oldText,
        rightText: temp[k + 1].newText,
      });
      k += 2;
    } else {
      result.push({
        type: temp[k].type,
        leftNum: temp[k].oldIdx,
        rightNum: temp[k].newIdx,
        leftText: temp[k].oldText,
        rightText: temp[k].newText,
      });
      k++;
    }
  }

  return result;
}

// Character-level diff highlighting for modified lines
function diffChars(oldStr: string, newStr: string): { left: { text: string; diff: boolean }[]; right: { text: string; diff: boolean }[] } {
  // Simple approach: find common prefix and suffix
  let prefixLen = 0;
  while (prefixLen < oldStr.length && prefixLen < newStr.length && oldStr[prefixLen] === newStr[prefixLen]) prefixLen++;

  let suffixLen = 0;
  while (
    suffixLen < oldStr.length - prefixLen &&
    suffixLen < newStr.length - prefixLen &&
    oldStr[oldStr.length - 1 - suffixLen] === newStr[newStr.length - 1 - suffixLen]
  ) suffixLen++;

  const oldMid = oldStr.substring(prefixLen, oldStr.length - suffixLen);
  const newMid = newStr.substring(prefixLen, newStr.length - suffixLen);

  return {
    left: [
      { text: oldStr.substring(0, prefixLen), diff: false },
      { text: oldMid, diff: true },
      { text: oldStr.substring(oldStr.length - suffixLen), diff: suffixLen > 0 ? false : false },
    ].filter(s => s.text),
    right: [
      { text: newStr.substring(0, prefixLen), diff: false },
      { text: newMid, diff: true },
      { text: newStr.substring(newStr.length - suffixLen), diff: suffixLen > 0 ? false : false },
    ].filter(s => s.text),
  };
}

export default function DiffViewer({ windowId: _windowId }: DiffViewerProps) {
  const [leftText, setLeftText] = useState(`function hello() {
  console.log("Hello World");
  const x = 1;
  return x;
}

function goodbye() {
  console.log("Goodbye");
  const y = 2;
  return y;
}`);
  const [rightText, setRightText] = useState(`function hello(name) {
  console.log("Hello " + name);
  const x = 1;
  const z = 3;
  return x + z;
}

function farewell() {
  console.log("Farewell!");
  return true;
}`);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [compared, setCompared] = useState(false);

  const diffResult = useMemo(() => {
    if (!compared) return null;
    const oldLines = leftText.split('\n');
    const newLines = rightText.split('\n');
    return buildDiff(oldLines, newLines);
  }, [leftText, rightText, compared]);

  const stats = useMemo(() => {
    if (!diffResult) return { added: 0, removed: 0, modified: 0, unchanged: 0 };
    return {
      added: diffResult.filter(d => d.type === 'added').length,
      removed: diffResult.filter(d => d.type === 'removed').length,
      modified: diffResult.filter(d => d.type === 'modified').length,
      unchanged: diffResult.filter(d => d.type === 'unchanged').length,
    };
  }, [diffResult]);

  const handleCompare = () => setCompared(true);
  const handleReset = () => { setCompared(false); };

  const lineStyle = (type: DiffLine['type']) => {
    switch (type) {
      case 'added': return { background: 'rgba(34, 197, 94, 0.12)', borderLeft: '3px solid #22c55e' };
      case 'removed': return { background: 'rgba(239, 68, 68, 0.12)', borderLeft: '3px solid #ef4444' };
      case 'modified': return { background: 'rgba(234, 179, 8, 0.12)', borderLeft: '3px solid #eab308' };
      default: return { background: 'transparent', borderLeft: '3px solid transparent' };
    }
  };

  const renderCharDiff = (text: string, segments: { text: string; diff: boolean }[], highlightColor: string) => (
    <span className="font-mono text-xs">
      {segments.map((seg, i) => seg.diff ? (
        <span key={i} className="rounded px-0.5" style={{ background: highlightColor }}>{seg.text}</span>
      ) : (
        <span key={i}>{seg.text}</span>
      ))}
    </span>
  );

  return (
    <div className="w-full h-full flex flex-col text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
        <GitCompareArrows size={14} className="text-[var(--accent-silver)]" />
        <span className="text-xs font-medium text-[var(--text-secondary)]">差异对比</span>
        <button onClick={handleCompare} className="px-3 py-1 rounded text-xs text-white hover:opacity-90" style={{ background: 'var(--accent-silver)' }}>
          比较
        </button>
        <button onClick={handleReset} className="px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-secondary)' }}>
          <RotateCcw size={12} className="inline mr-1" />重置
        </button>
        <div className="flex-1" />
        {diffResult && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-green-400">+{stats.added}</span>
            <span className="text-red-400">-{stats.removed}</span>
            <span className="text-yellow-400">~{stats.modified}</span>
            <span className="text-[var(--text-muted)]">={stats.unchanged}</span>
          </div>
        )}
        <div className="w-px h-4 mx-1" style={{ background: 'var(--border-default)' }} />
        <div className="flex items-center rounded overflow-hidden text-xs" style={{ border: '1px solid var(--border-default)' }}>
          <button onClick={() => setViewMode('split')} className={`px-2 py-1 flex items-center gap-1 ${viewMode === 'split' ? 'text-white' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`} style={viewMode === 'split' ? { background: 'var(--accent-silver)' } : {}}>
            <Columns size={12} /> 分栏
          </button>
          <button onClick={() => setViewMode('unified')} className={`px-2 py-1 flex items-center gap-1 ${viewMode === 'unified' ? 'text-white' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`} style={viewMode === 'unified' ? { background: 'var(--accent-silver)' } : {}}>
            <Rows size={12} /> 统一
          </button>
        </div>
      </div>

      {/* Main content */}
      {!compared ? (
        /* Input mode: two side-by-side textareas */
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col border-r" style={{ borderColor: 'var(--border-default)' }}>
            <div className="px-3 py-1.5 border-b text-xs font-medium text-[var(--text-secondary)]" style={{ borderColor: 'var(--border-default)' }}>原始</div>
            <textarea
              value={leftText}
              onChange={(e) => setLeftText(e.target.value)}
              className="flex-1 p-3 outline-none resize-none font-mono text-xs leading-relaxed"
              style={{ background: 'var(--bg-workspace)', color: 'var(--text-primary)' }}
              spellCheck={false}
              placeholder="粘贴原始文本..."
            />
          </div>
          <div className="flex-1 flex flex-col">
            <div className="px-3 py-1.5 border-b text-xs font-medium text-[var(--text-secondary)]" style={{ borderColor: 'var(--border-default)' }}>修改后</div>
            <textarea
              value={rightText}
              onChange={(e) => setRightText(e.target.value)}
              className="flex-1 p-3 outline-none resize-none font-mono text-xs leading-relaxed"
              style={{ background: 'var(--bg-workspace)', color: 'var(--text-primary)' }}
              spellCheck={false}
              placeholder="粘贴修改后文本..."
            />
          </div>
        </div>
      ) : (
        /* Diff display */
        <div className="flex-1 overflow-auto">
          {viewMode === 'split' ? (
            /* Split view */
            <div className="flex h-full">
              <div className="flex-1 border-r overflow-auto" style={{ borderColor: 'var(--border-default)' }}>
                <div className="px-3 py-1.5 border-b text-xs font-medium text-[var(--text-secondary)] sticky top-0 z-10" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>原始</div>
                {diffResult?.map((line, i) => (
                  <div key={i} className="flex" style={lineStyle(line.type)}>
                    <span className="w-10 text-right pr-2 py-0.5 text-xs text-[var(--text-muted)] select-none shrink-0">{line.leftNum || ''}</span>
                    <div className="flex-1 py-0.5 px-2 overflow-x-auto">
                      {line.type === 'modified' ? (
                        renderCharDiff(line.leftText, diffChars(line.leftText, line.rightText).left, 'rgba(239, 68, 68, 0.25)')
                      ) : line.type === 'added' ? (
                        <span className="text-xs text-[var(--text-muted)]"> </span>
                      ) : (
                        <span className="font-mono text-xs">{line.leftText}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex-1 overflow-auto">
                <div className="px-3 py-1.5 border-b text-xs font-medium text-[var(--text-secondary)] sticky top-0 z-10" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>修改后</div>
                {diffResult?.map((line, i) => (
                  <div key={i} className="flex" style={lineStyle(line.type)}>
                    <span className="w-10 text-right pr-2 py-0.5 text-xs text-[var(--text-muted)] select-none shrink-0">{line.rightNum || ''}</span>
                    <div className="flex-1 py-0.5 px-2 overflow-x-auto">
                      {line.type === 'modified' ? (
                        renderCharDiff(line.rightText, diffChars(line.leftText, line.rightText).right, 'rgba(34, 197, 94, 0.25)')
                      ) : line.type === 'removed' ? (
                        <span className="text-xs text-[var(--text-muted)]"> </span>
                      ) : (
                        <span className="font-mono text-xs">{line.rightText}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Unified view */
            <div>
              <div className="px-3 py-1.5 border-b text-xs font-medium text-[var(--text-secondary)] sticky top-0 z-10" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>统一差异</div>
              {diffResult?.map((line, i) => {
                const style = lineStyle(line.type);
                const prefix = line.type === 'added' ? '+' : line.type === 'removed' ? '-' : line.type === 'modified' ? '~' : ' ';
                const text = line.type === 'removed' ? line.leftText : line.rightText;
                return (
                  <div key={i} className="flex" style={style}>
                    <span className="w-10 text-right pr-2 py-0.5 text-xs text-[var(--text-muted)] select-none shrink-0">{line.leftNum || ''}</span>
                    <span className="w-10 text-right pr-2 py-0.5 text-xs text-[var(--text-muted)] select-none shrink-0">{line.rightNum || ''}</span>
                    <span className="w-5 text-center py-0.5 text-xs font-bold shrink-0" style={{
                      color: line.type === 'added' ? '#22c55e' : line.type === 'removed' ? '#ef4444' : line.type === 'modified' ? '#eab308' : 'var(--text-muted)',
                    }}>{prefix}</span>
                    <div className="flex-1 py-0.5 px-2 overflow-x-auto">
                      <span className="font-mono text-xs">{text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 text-xs border-t" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
        <span>{compared ? `${diffResult?.length || 0} 行差异` : '准备比较'}</span>
        <span>{leftText.split('\n').length} 对比 {rightText.split('\n').length} 行</span>
      </div>
    </div>
  );
}
