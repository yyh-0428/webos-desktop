import { useState, useMemo, useCallback } from 'react';
import { Copy, BookOpen, ChevronDown, ChevronRight, Replace, Search } from 'lucide-react';

interface RegexBuddyProps {
  windowId: string;
}

interface MatchResult {
  fullMatch: string;
  index: number;
  groups: string[];
  namedGroups: Record<string, string>;
}

const PATTERN_LIBRARY = [
  { name: '邮箱地址', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', flags: 'gi' },
  { name: '网址', pattern: 'https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+[\\/\\w\\-._~:?#\\[\\]@!$&\'()*+,;=%]*', flags: 'gi' },
  { name: 'IPv4 地址', pattern: '\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b', flags: 'g' },
  { name: 'IPv6 地址', pattern: '(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}', flags: 'gi' },
  { name: '电话号码 (美国)', pattern: '\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}', flags: 'g' },
  { name: '日期 (YYYY-MM-DD)', pattern: '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])', flags: 'g' },
  { name: '十六进制颜色', pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b', flags: 'gi' },
  { name: 'HTML 标签', pattern: '<\\/?[a-zA-Z][a-zA-Z0-9]*(?:\\s[^>]*)?\\/?>', flags: 'g' },
  { name: '整数', pattern: '-?\\d+', flags: 'g' },
  { name: '浮点数', pattern: '-?\\d+\\.\\d+', flags: 'g' },
  { name: '空白字符', pattern: '\\s+', flags: 'g' },
  { name: '单词边界', pattern: '\\b\\w+\\b', flags: 'g' },
  { name: 'UUID', pattern: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', flags: 'gi' },
  { name: 'MAC 地址', pattern: '(?:[0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}', flags: 'gi' },
  { name: '信用卡号', pattern: '\\d{4}[-.\\s]?\\d{4}[-.\\s]?\\d{4}[-.\\s]?\\d{4}', flags: 'g' },
];

export default function RegexBuddy({ windowId: _windowId }: RegexBuddyProps) {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [testString, setTestString] = useState('Hello World! Test 123\nemail@example.com\nhttps://example.com\n192.168.1.1\n2024-01-15');
  const [replaceMode, setReplaceMode] = useState(false);
  const [replacement, setReplacement] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);

  const toggleFlag = (flag: string) => {
    if (flags.includes(flag)) setFlags(flags.replace(flag, ''));
    else setFlags(flags + flag);
  };

  const regexResult = useMemo(() => {
    if (!pattern) return { regex: null, error: null };
    try {
      const regex = new RegExp(pattern, flags);
      return { regex, error: null };
    } catch (e: any) {
      return { regex: null, error: e.message };
    }
  }, [pattern, flags]);

  const matches = useMemo((): MatchResult[] => {
    if (!regexResult.regex || !testString) return [];
    const results: MatchResult[] = [];
    const regex = new RegExp(regexResult.regex.source, regexResult.regex.flags);
    let match: RegExpExecArray | null;
    const global = flags.includes('g');
    let safety = 0;

    if (global) {
      while ((match = regex.exec(testString)) !== null && safety < 1000) {
        results.push({
          fullMatch: match[0],
          index: match.index,
          groups: match.slice(1),
          namedGroups: match.groups ? { ...match.groups } : {},
        });
        if (match[0].length === 0) regex.lastIndex++;
        safety++;
      }
    } else {
      match = regex.exec(testString);
      if (match) {
        results.push({
          fullMatch: match[0],
          index: match.index,
          groups: match.slice(1),
          namedGroups: match.groups ? { ...match.groups } : {},
        });
      }
    }
    return results;
  }, [regexResult.regex, testString, flags]);

  const highlightedText = useMemo(() => {
    if (!regexResult.regex || !testString || matches.length === 0) return null;
    const segments: { text: string; highlighted: boolean; matchIdx: number }[] = [];
    let lastIdx = 0;

    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      if (m.index > lastIdx) {
        segments.push({ text: testString.substring(lastIdx, m.index), highlighted: false, matchIdx: -1 });
      }
      segments.push({ text: m.fullMatch, highlighted: true, matchIdx: i });
      lastIdx = m.index + m.fullMatch.length;
    }
    if (lastIdx < testString.length) {
      segments.push({ text: testString.substring(lastIdx), highlighted: false, matchIdx: -1 });
    }
    return segments;
  }, [matches, testString, regexResult.regex]);

  const replacedText = useMemo(() => {
    if (!regexResult.regex || !replaceMode) return null;
    try {
      return testString.replace(new RegExp(regexResult.regex.source, regexResult.regex.flags), replacement);
    } catch {
      return null;
    }
  }, [regexResult.regex, testString, replacement, replaceMode]);

  const loadPattern = (p: typeof PATTERN_LIBRARY[0]) => {
    setPattern(p.pattern);
    setFlags(p.flags);
    setShowLibrary(false);
  };

  return (
    <div className="w-full h-full flex flex-col text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {/* Pattern input */}
      <div className="p-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Search size={14} className="text-[var(--text-muted)]" />
          <span className="text-xs font-medium text-[var(--text-secondary)]">正则表达式</span>
          <div className="flex-1" />
          <button onClick={() => setShowLibrary(!showLibrary)} className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)]" style={{ color: 'var(--accent-silver)' }}>
            <BookOpen size={12} /> 模板库
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-muted)]">/</span>
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="输入正则表达式..."
            className="flex-1 h-8 px-2 rounded text-sm font-mono outline-none"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
            spellCheck={false}
          />
          <span className="text-[var(--text-muted)]">/</span>
          <div className="flex items-center gap-0.5">
            {['g', 'i', 'm', 's'].map((f) => (
              <button
                key={f}
                onClick={() => toggleFlag(f)}
                className={`w-7 h-7 rounded text-xs font-mono font-bold transition-colors ${flags.includes(f) ? 'text-white' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`}
                style={flags.includes(f) ? { background: 'var(--accent-silver)' } : {}}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        {regexResult.error && (
          <div className="mt-2 px-2 py-1 rounded text-xs text-red-400 bg-red-900/20">
            {regexResult.error}
          </div>
        )}
      </div>

      {/* Replace bar */}
      {replaceMode && (
        <div className="px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--border-default)' }}>
          <Replace size={14} className="text-[var(--text-muted)]" />
          <input
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder="替换字符串..."
            className="flex-1 h-8 px-2 rounded text-sm font-mono outline-none"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
            spellCheck={false}
          />
        </div>
      )}

      {/* Pattern library dropdown */}
      {showLibrary && (
        <div className="border-b p-2 max-h-48 overflow-y-auto" style={{ borderColor: 'var(--border-default)', background: 'var(--bg-window)' }}>
          {PATTERN_LIBRARY.map((p, i) => (
            <button
              key={i}
              onClick={() => loadPattern(p)}
              className="w-full text-left px-3 py-1.5 rounded hover:bg-[var(--bg-hover)] flex items-center justify-between"
            >
              <span className="text-xs text-[var(--text-primary)]">{p.name}</span>
              <span className="text-xs font-mono text-[var(--text-muted)] truncate ml-2 max-w-[200px]">/{p.pattern}/</span>
            </button>
          ))}
        </div>
      )}

      {/* Main area: split test / results */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: test string */}
        <div className="flex-1 flex flex-col border-r" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <span className="text-xs font-medium text-[var(--text-secondary)]">测试字符串</span>
            <button onClick={() => setReplaceMode(!replaceMode)} className={`text-xs px-2 py-0.5 rounded ${replaceMode ? 'text-white' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`} style={replaceMode ? { background: 'var(--accent-silver)' } : {}}>
              {replaceMode ? '替换 已开启' : '替换'}
            </button>
          </div>
          <div className="flex-1 relative overflow-auto">
            {/* Highlighted overlay */}
            {highlightedText && (
              <div className="absolute inset-0 p-3 font-mono text-sm leading-relaxed whitespace-pre-wrap pointer-events-none overflow-auto" style={{ color: 'transparent' }}>
                {highlightedText.map((seg, i) => seg.highlighted ? (
                  <mark key={i} className="rounded px-0.5" style={{ background: 'rgba(255, 213, 79, 0.35)', color: 'var(--text-primary)' }}>{seg.text}</mark>
                ) : (
                  <span key={i} style={{ color: 'var(--text-primary)' }}>{seg.text}</span>
                ))}
              </div>
            )}
            <textarea
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              className="w-full h-full p-3 outline-none resize-none font-mono text-sm leading-relaxed"
              style={{ background: 'var(--bg-workspace)', color: highlightedText ? 'transparent' : 'var(--text-primary)', caretColor: 'var(--text-primary)' }}
              placeholder="输入测试字符串..."
              spellCheck={false}
            />
          </div>
          {/* Replaced text preview */}
          {replaceMode && replacedText !== null && (
            <div className="border-t p-3" style={{ borderColor: 'var(--border-default)' }}>
              <div className="text-xs font-medium text-[var(--text-secondary)] mb-1">结果</div>
              <pre className="text-xs font-mono whitespace-pre-wrap text-[var(--text-primary)] p-2 rounded" style={{ background: 'var(--bg-input)', maxHeight: 120, overflow: 'auto' }}>{replacedText}</pre>
            </div>
          )}
        </div>

        {/* Right: match results */}
        <div className="w-72 flex flex-col overflow-hidden">
          <div className="px-3 py-1.5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-default)' }}>
            <span className="text-xs font-medium text-[var(--text-secondary)]">匹配结果</span>
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-input)', color: 'var(--accent-silver)' }}>{matches.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {matches.length === 0 && (
              <p className="text-xs text-[var(--text-muted)] text-center py-6">无匹配</p>
            )}
            {matches.map((m, i) => (
              <div key={i} className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-window)' }}>
                <button
                  onClick={() => setExpandedMatch(expandedMatch === i ? null : i)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--bg-hover)]"
                >
                  {expandedMatch === i ? <ChevronDown size={12} className="text-[var(--text-muted)]" /> : <ChevronRight size={12} className="text-[var(--text-muted)]" />}
                  <span className="text-xs font-mono truncate flex-1" style={{ color: 'var(--text-primary)' }}>"{m.fullMatch}"</span>
                  <span className="text-xs text-[var(--text-muted)]">@{m.index}</span>
                </button>
                {expandedMatch === i && (
                  <div className="px-3 pb-2 space-y-1">
                    {m.groups.length > 0 && m.groups.map((g, gi) => (
                      <div key={gi} className="flex items-center gap-2 text-xs">
                        <span className="text-[var(--text-muted)]">分组 {gi + 1}:</span>
                        <span className="font-mono text-[var(--text-primary)]">"{g}"</span>
                      </div>
                    ))}
                    {Object.keys(m.namedGroups).length > 0 && Object.entries(m.namedGroups).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2 text-xs">
                        <span className="text-[var(--text-muted)]">{k}:</span>
                        <span className="font-mono text-[var(--text-primary)]">"{v}"</span>
                      </div>
                    ))}
                    {m.groups.length === 0 && Object.keys(m.namedGroups).length === 0 && (
                      <p className="text-xs text-[var(--text-muted)]">无捕获分组</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 text-xs border-t" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
        <span>{matches.length} 个匹配</span>
        <span>标志: {flags || '无'}</span>
      </div>
    </div>
  );
}
