import { useState, useRef, useCallback } from 'react';
import {
  ArrowLeft, ArrowRight, RotateCw, Home, Plus, X, Star, Search, Globe,
  Lock, Shield, MoreHorizontal, BookmarkPlus, ExternalLink, ChevronDown,
} from 'lucide-react';

interface Tab {
  id: string;
  title: string;
  url: string;
  loading: boolean;
  iframeError: boolean;
}

interface Bookmark {
  name: string;
  url: string;
  favicon: string;
}

interface HistoryEntry {
  url: string;
  title: string;
  time: number;
}

const SEARCH_ENGINES = [
  { name: '百度', url: 'https://www.baidu.com/s?wd=', color: '#2932E1', icon: 'B' },
  { name: 'Google', url: 'https://www.google.com/search?q=', color: '#4285F4', icon: 'G' },
  { name: 'Bing', url: 'https://www.bing.com/search?q=', color: '#00809D', icon: 'B' },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', color: '#DE5833', icon: 'D' },
  { name: '搜狗', url: 'https://www.sogou.com/web?query=', color: '#FB6C2C', icon: 'S' },
  { name: 'Yandex', url: 'https://yandex.com/search/?text=', color: '#FF0000', icon: 'Y' },
];

const defaultBookmarks: Bookmark[] = [
  { name: '百度', url: 'https://www.baidu.com', favicon: 'B' },
  { name: 'Google', url: 'https://www.google.com', favicon: 'G' },
  { name: 'GitHub', url: 'https://github.com', favicon: 'GH' },
  { name: 'Wikipedia', url: 'https://www.wikipedia.org', favicon: 'W' },
  { name: 'YouTube', url: 'https://www.youtube.com', favicon: 'YT' },
  { name: 'Bilibili', url: 'https://www.bilibili.com', favicon: 'B' },
  { name: '知乎', url: 'https://www.zhihu.com', favicon: '知' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com', favicon: 'SO' },
];

const quickLinks = [
  { name: '百度', url: 'https://www.baidu.com', color: '#2932E1' },
  { name: 'Google', url: 'https://www.google.com', color: '#4285F4' },
  { name: 'Bilibili', url: 'https://www.bilibili.com', color: '#00A1D6' },
  { name: 'GitHub', url: 'https://github.com', color: '#333' },
  { name: '知乎', url: 'https://www.zhihu.com', color: '#0066FF' },
  { name: 'YouTube', url: 'https://www.youtube.com', color: '#FF0000' },
  { name: 'Wikipedia', url: 'https://www.wikipedia.org', color: '#636466' },
  { name: 'Twitter', url: 'https://twitter.com', color: '#1DA1F2' },
];

let tabCounter = 1;
function newTabId() { return `tab-${tabCounter++}`; }

export default function Browser({ windowId: _windowId }: { windowId: string }) {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'tab-0', title: '新标签页', url: '', loading: false, iframeError: false },
  ]);
  const [activeTabId, setActiveTabId] = useState('tab-0');
  const [inputUrl, setInputUrl] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentHistory, setCurrentHistory] = useState<string[]>([]);
  const [bookmarks] = useState<Bookmark[]>(defaultBookmarks);
  const [showBookmarksBar, setShowBookmarksBar] = useState(true);
  const [searchEngine, setSearchEngine] = useState(0);
  const [showEngineMenu, setShowEngineMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const updateTab = useCallback((id: string, updates: Partial<Tab>) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const navigateTo = useCallback((url: string) => {
    let finalUrl = url.trim();
    if (!finalUrl) return;

    // If no protocol, treat as search or add https
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
        finalUrl = 'https://' + finalUrl;
      } else {
        finalUrl = `${SEARCH_ENGINES[searchEngine].url}${encodeURIComponent(finalUrl)}`;
      }
    }

    const title = finalUrl.replace(/^https?:\/\//, '').split('/')[0] || '新标签页';
    updateTab(activeTabId, { url: finalUrl, title, loading: true, iframeError: false });
    setInputUrl(finalUrl);

    // Update history
    setCurrentHistory(prev => {
      const next = [...prev.slice(0, historyIndex + 1), finalUrl];
      setHistoryIndex(next.length - 1);
      return next;
    });
    setHistory(prev => [
      { url: finalUrl, title, time: Date.now() },
      ...prev.slice(0, 49),
    ]);
  }, [activeTabId, historyIndex, updateTab]);

  const addTab = () => {
    const id = newTabId();
    setTabs(prev => [...prev, { id, title: '新标签页', url: '', loading: false, iframeError: false }]);
    setActiveTabId(id);
    setInputUrl('');
    setCurrentHistory([]);
    setHistoryIndex(-1);
  };

  const closeTab = (id: string) => {
    if (tabs.length <= 1) return;
    const idx = tabs.findIndex(t => t.id === id);
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      const newActive = newTabs[Math.min(idx, newTabs.length - 1)];
      setActiveTabId(newActive.id);
      setInputUrl(newActive.url);
    }
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const url = currentHistory[newIndex];
      const title = url.replace(/^https?:\/\//, '').split('/')[0] || '新标签页';
      updateTab(activeTabId, { url, title, loading: true, iframeError: false });
      setInputUrl(url);
    }
  };

  const goForward = () => {
    if (historyIndex < currentHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const url = currentHistory[newIndex];
      const title = url.replace(/^https?:\/\//, '').split('/')[0] || '新标签页';
      updateTab(activeTabId, { url, title, loading: true, iframeError: false });
      setInputUrl(url);
    }
  };

  const refresh = () => {
    if (activeTab.url) {
      updateTab(activeTabId, { loading: true, iframeError: false });
      const iframe = document.getElementById(`iframe-${activeTabId}`) as HTMLIFrameElement;
      if (iframe) {
        iframe.src = activeTab.url;
      }
    }
  };

  const goHome = () => {
    updateTab(activeTabId, { url: '', title: '新标签页', loading: false, iframeError: false });
    setInputUrl('');
  };

  const handleIframeLoad = useCallback((tabId: string) => {
    updateTab(tabId, { loading: false });
  }, [updateTab]);

  const handleIframeError = useCallback((tabId: string) => {
    updateTab(tabId, { loading: false, iframeError: true });
  }, [updateTab]);

  const handleUrlKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') navigateTo(inputUrl);
  };

  const switchTab = (id: string) => {
    setActiveTabId(id);
    const tab = tabs.find(t => t.id === id);
    setInputUrl(tab?.url || '');
  };

  const isNewTab = !activeTab.url;

  return (
    <div className="w-full h-full flex flex-col text-sm" style={{ background: 'var(--bg-workspace)' }} onClick={() => setShowEngineMenu(false)}>
      {/* Tab bar */}
      <div className="flex items-center h-9 px-1 gap-0.5" style={{ background: 'var(--bg-window)', borderBottom: '1px solid var(--border-default)' }}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={`group flex items-center gap-1.5 h-7 px-3 rounded-t-md cursor-pointer max-w-[180px] min-w-[80px] text-xs transition-colors ${
              tab.id === activeTabId
                ? 'text-[var(--text-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
            style={tab.id === activeTabId ? { background: 'var(--bg-workspace)' } : {}}
          >
            {tab.loading && (
              <div className="w-3 h-3 border-2 border-[var(--accent-silver)] border-t-transparent rounded-full animate-spin shrink-0" />
            )}
            {!tab.loading && <Globe size={12} className="shrink-0 text-[var(--text-muted)]" />}
            <span className="truncate flex-1">{tab.title || '新标签页'}</span>
            <button
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
              className="opacity-0 group-hover:opacity-100 hover:text-[var(--text-primary)] transition-opacity shrink-0"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          onClick={addTab}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Navigation bar */}
      <div className="flex items-center gap-1.5 px-2 h-10" style={{ background: 'var(--bg-window)', borderBottom: '1px solid var(--border-default)' }}>
        <button onClick={goBack} disabled={historyIndex <= 0}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] disabled:opacity-30 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <button onClick={goForward} disabled={historyIndex >= currentHistory.length - 1}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] disabled:opacity-30 transition-colors">
          <ArrowRight size={16} />
        </button>
        <button onClick={refresh}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors">
          <RotateCw size={14} className={activeTab.loading ? 'animate-spin' : ''} />
        </button>
        <button onClick={goHome}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors">
          <Home size={14} />
        </button>

        {/* URL bar */}
        <div className="flex-1 flex items-center h-8 rounded-full px-3 gap-2" style={{ background: 'var(--bg-input)' }}>
          {activeTab.url ? (
            <Lock size={12} className="text-green-500 shrink-0" />
          ) : (
            <Search size={12} className="text-[var(--text-muted)] shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={inputUrl}
            onChange={e => setInputUrl(e.target.value)}
            onKeyDown={handleUrlKeyDown}
            placeholder={`搜索（${SEARCH_ENGINES[searchEngine].name}）或输入网址`}
            className="flex-1 bg-transparent outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
          <div className="relative">
            <button
              onClick={() => setShowEngineMenu(!showEngineMenu)}
              className="flex items-center gap-0.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              title="切换搜索引擎"
            >
              <span className="text-[10px] font-bold">{SEARCH_ENGINES[searchEngine].icon}</span>
              <ChevronDown size={10} />
            </button>
            {showEngineMenu && (
              <div className="absolute top-full right-0 mt-1 rounded-lg py-1 z-50 min-w-[120px]"
                style={{ background: 'var(--bg-window)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-default)' }}
                onClick={e => e.stopPropagation()}>
                {SEARCH_ENGINES.map((eng, i) => (
                  <button
                    key={i}
                    onClick={() => { setSearchEngine(i); setShowEngineMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2"
                    style={{ color: searchEngine === i ? 'var(--accent-silver)' : 'var(--text-primary)' }}
                  >
                    <span className="w-4 h-4 rounded text-[8px] text-white flex items-center justify-center font-bold" style={{ background: eng.color }}>{eng.icon}</span>
                    {eng.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            <BookmarkPlus size={14} />
          </button>
        </div>

        <button onClick={() => setShowBookmarksBar(!showBookmarksBar)}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors">
          <Star size={14} />
        </button>
        <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors">
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Bookmarks bar */}
      {showBookmarksBar && (
        <div className="flex items-center gap-0.5 px-2 h-7 overflow-x-auto" style={{ background: 'var(--bg-window)', borderBottom: '1px solid var(--border-default)' }}>
          {bookmarks.map((bm, i) => (
            <button
              key={i}
              onClick={() => navigateTo(bm.url)}
              className="flex items-center gap-1.5 px-2 h-5 rounded text-[11px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors shrink-0"
            >
              <span className="w-3.5 h-3.5 rounded-sm bg-[var(--accent-silver)] text-[8px] text-white flex items-center justify-center font-bold shrink-0">
                {bm.favicon[0]}
              </span>
              {bm.name}
            </button>
          ))}
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 relative overflow-hidden">
        {activeTab.loading && (
          <div className="absolute top-0 left-0 right-0 h-0.5 z-10">
            <div className="h-full bg-[var(--accent-silver)] animate-pulse" style={{ width: '60%' }} />
          </div>
        )}

        {isNewTab ? (
          /* New Tab Page */
          <div className="w-full h-full flex flex-col items-center justify-start pt-16 px-8 overflow-y-auto" style={{ background: 'var(--bg-workspace)' }}>
            <div className="text-3xl font-light text-[var(--text-primary)] mb-8 tracking-wide">WebOS 浏览器</div>

            {/* Search box */}
            <div className="w-full max-w-xl flex items-center h-11 rounded-full px-4 gap-3 mb-10 shadow-sm" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}>
              <Search size={18} className="text-[var(--text-muted)] shrink-0" />
              <input
                type="text"
                value={inputUrl}
                onChange={e => setInputUrl(e.target.value)}
                onKeyDown={handleUrlKeyDown}
                placeholder={`用 ${SEARCH_ENGINES[searchEngine].name} 搜索或输入网址`}
                className="flex-1 bg-transparent outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-4 gap-4 max-w-xl w-full">
              {quickLinks.map((link, i) => (
                <button
                  key={i}
                  onClick={() => navigateTo(link.url)}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-[var(--bg-hover)] transition-colors group"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-semibold shadow-sm group-hover:scale-105 transition-transform"
                    style={{ background: link.color }}
                  >
                    {link.name[0]}
                  </div>
                  <span className="text-xs text-[var(--text-secondary)]">{link.name}</span>
                </button>
              ))}
            </div>

            {/* Recent history */}
            {history.length > 0 && (
              <div className="w-full max-w-xl mt-8">
                <div className="text-xs text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                  <Globe size={12} /> 最近历史
                </div>
                <div className="space-y-1">
                  {history.slice(0, 5).map((entry, i) => (
                    <button
                      key={i}
                      onClick={() => navigateTo(entry.url)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-left"
                    >
                      <Globe size={12} className="text-[var(--text-muted)] shrink-0" />
                      <span className="text-xs text-[var(--text-secondary)] truncate">{entry.url}</span>
                      <span className="text-[10px] text-[var(--text-muted)] ml-auto shrink-0">
                        {new Date(entry.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Iframe content */
          <div className="w-full h-full relative" style={{ background: '#fff' }}>
            <iframe
              id={`iframe-${activeTabId}`}
              src={activeTab.url}
              className="w-full h-full border-0"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
              onLoad={() => handleIframeLoad(activeTabId)}
              onError={() => handleIframeError(activeTabId)}
              title={activeTab.title}
            />
            {activeTab.iframeError && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--bg-workspace)' }}>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-input)' }}>
                    <Shield size={28} className="text-[var(--accent-silver)]" />
                  </div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1">无法加载此页面</h3>
                  <p className="text-xs text-[var(--text-muted)] mb-4 max-w-md truncate px-4">{activeTab.url}</p>
                  <p className="text-[11px] text-[var(--text-muted)] max-w-xs">
                    该网站可能阻止了嵌入式加载。您可以尝试在新标签页中打开。
                  </p>
                  <div className="flex gap-2 justify-center mt-4">
                    <button onClick={() => { updateTab(activeTabId, { iframeError: false }); }}
                      className="px-4 py-1.5 rounded-full text-xs text-white" style={{ background: 'var(--accent-silver)' }}>
                      重试
                    </button>
                    <a href={activeTab.url} target="_blank" rel="noopener noreferrer"
                      className="px-4 py-1.5 rounded-full text-xs text-[var(--text-secondary)] flex items-center gap-1" style={{ background: 'var(--bg-input)' }}>
                      <ExternalLink size={12} /> 新窗口打开
                    </a>
                    <button onClick={goBack}
                      className="px-4 py-1.5 rounded-full text-xs text-[var(--text-secondary)]" style={{ background: 'var(--bg-input)' }}>
                      返回
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
