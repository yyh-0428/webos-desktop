import { useState, useCallback, useMemo } from 'react';
import { Search, File, FolderOpen, Filter, X, Loader2, FileText, Image, Music, Film, ChevronDown } from 'lucide-react';
import { useFileSystemStore, type FSNode } from '@/stores/useFileSystemStore';

type SearchIn = 'filename' | 'content' | 'both';
type FileType = 'all' | 'text' | 'image' | 'audio' | 'video';

const FILE_TYPE_MAP: Record<FileType, string[]> = {
  text: ['text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json', 'application/pdf'],
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac'],
  video: ['video/mp4', 'video/webm', 'video/avi', 'video/quicktime'],
  all: [],
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getFileTypeIcon(node: FSNode) {
  const mime = node.mimeType || '';
  if (mime.startsWith('image/')) return Image;
  if (mime.startsWith('audio/')) return Music;
  if (mime.startsWith('video/')) return Film;
  if (mime.startsWith('text/') || mime.includes('pdf') || mime.includes('json')) return FileText;
  return File;
}

export default function FileSearch({ windowId }: { windowId: string }) {
  const { nodes, getPath, getNode } = useFileSystemStore();
  const [query, setQuery] = useState('');
  const [searchIn, setSearchIn] = useState<SearchIn>('both');
  const [fileType, setFileType] = useState<FileType>('all');
  const [minSize, setMinSize] = useState('');
  const [maxSize, setMaxSize] = useState('');
  const [searchLocation, setSearchLocation] = useState('fs-root');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<FSNode[]>([]);
  const [searched, setSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const locationPath = useMemo(() => getPath(searchLocation), [searchLocation, getPath]);

  const search = useCallback(() => {
    if (!query.trim()) return;
    setIsSearching(true);
    setSearched(true);

    // Simulate search delay
    setTimeout(() => {
      const lowerQuery = query.toLowerCase();
      const minBytes = minSize ? parseInt(minSize) * 1024 : 0;
      const maxBytes = maxSize ? parseInt(maxSize) * 1024 : Infinity;

      // Get all descendants of search location
      const getDescendants = (parentId: string): FSNode[] => {
        const children = nodes.filter(n => n.parentId === parentId);
        return children.reduce<FSNode[]>((acc, child) => {
          acc.push(child);
          if (child.type === 'directory') {
            acc.push(...getDescendants(child.id));
          }
          return acc;
        }, []);
      };

      const candidates = searchLocation === 'fs-root'
        ? nodes
        : [getNode(searchLocation)!, ...getDescendants(searchLocation)];

      const filtered = candidates.filter(node => {
        // File type filter
        if (fileType !== 'all' && node.type === 'file') {
          const allowedMimes = FILE_TYPE_MAP[fileType];
          const mime = node.mimeType || '';
          if (!allowedMimes.some(m => mime.startsWith(m.split('/')[0]))) return false;
        }

        // Size filter
        const size = node.size || 0;
        if (size < minBytes || size > maxBytes) return false;

        // Query match
        const nameMatch = node.name.toLowerCase().includes(lowerQuery);
        const contentMatch = node.content?.toLowerCase().includes(lowerQuery) || false;

        if (searchIn === 'filename') return nameMatch;
        if (searchIn === 'content') return contentMatch;
        return nameMatch || contentMatch;
      });

      setResults(filtered);
      setIsSearching(false);
    }, 300 + Math.random() * 400);
  }, [query, searchIn, fileType, minSize, maxSize, searchLocation, nodes, getNode]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') search();
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
  };

  return (
    <div className="w-full h-full flex flex-col text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {/* Search bar */}
      <div className="p-3 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'var(--bg-window)' }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-input)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索文件..."
              className="flex-1 bg-transparent outline-none text-xs"
              style={{ color: 'var(--text-primary)' }}
            />
            {query && (
              <button onClick={clearSearch} className="p-0.5 rounded hover:bg-[var(--bg-hover)]">
                <X size={12} style={{ color: 'var(--text-muted)' }} />
              </button>
            )}
          </div>
          <button
            onClick={search}
            disabled={!query.trim() || isSearching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--accent-dark-gray)' }}
          >
            {isSearching ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
            搜索
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
            style={{ color: showFilters ? 'var(--accent-silver)' : 'var(--text-muted)' }}
          >
            <Filter size={14} />
          </button>
        </div>

        {/* Search in selector */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>搜索范围:</span>
          {(['filename', 'content', 'both'] as SearchIn[]).map(option => (
            <button
              key={option}
              onClick={() => setSearchIn(option)}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                searchIn === option ? 'text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
              }`}
              style={searchIn === option ? { background: 'var(--accent-dark-gray)' } : { background: 'var(--bg-input)' }}
            >
              {option === 'both' ? '全部' : option === 'filename' ? '文件名' : '内容'}
            </button>
          ))}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
            {/* Location */}
            <div className="flex items-center gap-1.5">
              <FolderOpen size={10} style={{ color: 'var(--text-muted)' }} />
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>位置:</span>
              <select
                value={searchLocation}
                onChange={e => setSearchLocation(e.target.value)}
                className="text-[10px] px-1.5 py-0.5 rounded outline-none"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.06)' }}
              >
                <option value="fs-root">整个系统</option>
                <option value="fs-user">主目录</option>
                <option value="fs-user-doc">文档</option>
                <option value="fs-user-dl">下载</option>
                <option value="fs-user-music">音乐</option>
                <option value="fs-user-pics">图片</option>
                <option value="fs-user-vids">视频</option>
              </select>
            </div>

            {/* File type */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>类型:</span>
              <select
                value={fileType}
                onChange={e => setFileType(e.target.value as FileType)}
                className="text-[10px] px-1.5 py-0.5 rounded outline-none"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.06)' }}
              >
                <option value="all">所有文件</option>
                <option value="text">文本</option>
                <option value="image">图片</option>
                <option value="audio">音频</option>
                <option value="video">视频</option>
              </select>
            </div>

            {/* Size filters */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>大小 (KB):</span>
              <input
                type="number"
                value={minSize}
                onChange={e => setMinSize(e.target.value)}
                placeholder="最小"
                className="w-14 text-[10px] px-1.5 py-0.5 rounded outline-none"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.06)' }}
              />
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>-</span>
              <input
                type="number"
                value={maxSize}
                onChange={e => setMaxSize(e.target.value)}
                placeholder="最大"
                className="w-14 text-[10px] px-1.5 py-0.5 rounded outline-none"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.06)' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent-silver)' }} />
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>搜索中...</p>
          </div>
        ) : searched && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Search size={24} style={{ color: 'var(--text-muted)' }} />
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>未找到结果</p>
          </div>
        ) : results.length > 0 ? (
          <div>
            <div className="px-3 py-1.5 text-[10px] border-b" style={{ borderColor: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)' }}>
              找到 {results.length} 个结果
            </div>
            {results.map(node => {
              const Icon = getFileTypeIcon(node);
              return (
                <div
                  key={node.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-hover)] cursor-pointer transition-colors border-b"
                  style={{ borderColor: 'rgba(0,0,0,0.04)' }}
                  onClick={() => {
                    // Could open file in appropriate app
                  }}
                >
                  <Icon size={14} style={{ color: node.type === 'directory' ? 'var(--accent-silver)' : 'var(--text-muted)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>{node.name}</div>
                    <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{getPath(node.id)}</div>
                  </div>
                  <div className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {formatSize(node.size || 0)}
                  </div>
                  <div className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {node.modifiedAt.toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <Search size={32} style={{ color: 'var(--text-muted)' }} />
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>输入搜索关键词查找文件</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>可按文件名、内容或两者搜索</p>
          </div>
        )}
      </div>
    </div>
  );
}
