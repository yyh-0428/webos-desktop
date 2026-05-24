import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Minimize2,
  Search, Bookmark, FileText, Printer, X,
} from 'lucide-react';
import { useFileSystemStore } from '@/stores/useFileSystemStore';

interface PdfViewerProps {
  windowId: string;
}

interface SimulatedPage {
  title: string;
  content: string;
}

interface Bookmark {
  page: number;
  label: string;
}

const SIMULATED_DOCUMENTS: Record<string, SimulatedPage[]> = {
  'resume.pdf': [
    {
      title: 'Resume - John Doe',
      content: `John Doe
Software Engineer

CONTACT
Email: john.doe@example.com
Phone: (555) 123-4567
Location: San Francisco, CA

SUMMARY
Experienced software engineer with 8+ years of expertise in full-stack web development, cloud architecture, and team leadership. Passionate about building scalable, user-centric applications.

EXPERIENCE

Senior Software Engineer | TechCorp Inc. | 2020 - Present
- Led development of microservices platform serving 10M+ users
- Mentored team of 5 junior engineers
- Reduced API latency by 40% through caching optimization

Software Engineer | StartupXYZ | 2017 - 2020
- Built real-time collaboration features using WebSocket
- Implemented CI/CD pipeline reducing deployment time by 60%
- Developed RESTful APIs for mobile applications

EDUCATION
B.S. Computer Science | Stanford University | 2016

SKILLS
Languages: JavaScript, TypeScript, Python, Go
Frameworks: React, Node.js, Django, FastAPI
Cloud: AWS, GCP, Docker, Kubernetes`,
    },
    {
      title: 'Resume - Page 2',
      content: `PROJECTS

Open Source Contribution - React Component Library
- Contributed 15+ components to popular UI library
- 500+ GitHub stars on personal utility packages

Personal Blog Platform
- Built with Next.js and headless CMS
- 10K monthly active readers

CERTIFICATIONS
- AWS Solutions Architect Professional
- Google Cloud Professional Developer
- Kubernetes Administrator (CKA)

LANGUAGES
- English (Native)
- Mandarin (Fluent)
- Spanish (Conversational)

REFERENCES
Available upon request`,
    },
  ],
  'default': [
    {
      title: '文档',
      content: `欢迎使用 PDF 阅读器

这是一个模拟的 PDF 文档阅读器。在实际实现中，这里会渲染真实的 PDF 文件。

功能特性：
- 逐页导航
- 缩放控制
- 文档内搜索
- 书签
- 缩略图侧栏
- 全屏模式
- 打印功能

PDF 阅读器支持从虚拟文件系统打开文件。当您从文件管理器打开 PDF 文件时，将在此处显示。

当前显示的是模拟内容，因为真实的 PDF 渲染需要额外的库（如 pdf.js）。`,
    },
  ],
};

export default function PdfViewer({ windowId: _windowId }: PdfViewerProps) {
  const [pages, setPages] = useState<SimulatedPage[]>(SIMULATED_DOCUMENTS['default']);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<{ page: number; count: number }[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const nodes = useFileSystemStore((s) => s.nodes);
  const readFile = useFileSystemStore((s) => s.readFile);
  const currentDirectory = useFileSystemStore((s) => s.currentDirectory);
  const getChildren = useFileSystemStore((s) => s.getChildren);

  // Check for pending file open
  useEffect(() => {
    const pending = (window as any).__pendingFileOpen;
    if (pending && pending.appId === 'pdfviewer') {
      const node = nodes.find((n) => n.id === pending.fileId);
      if (node && node.type === 'file') {
        const content = readFile(pending.fileId);
        if (content) {
          const docPages = content.split('\n\n---\n\n').map((section, i) => ({
            title: `${node.name} - 第 ${i + 1} 页`,
            content: section,
          }));
          setPages(docPages.length > 0 ? docPages : [{ title: node.name, content }]);
          setFileName(node.name);
          setCurrentPage(0);
        }
      }
      (window as any).__pendingFileOpen = null;
    }
  }, [nodes, readFile]);

  const handleOpenFile = (nodeId: string) => {
    const fs = useFileSystemStore.getState();
    const node = fs.getNode(nodeId);
    if (!node || node.type !== 'file') return;

    const name = node.name.toLowerCase();
    if (name.endsWith('.pdf')) {
      // Use simulated content for known PDFs, or create pages from content
      const simulated = SIMULATED_DOCUMENTS[node.name];
      if (simulated) {
        setPages(simulated);
      } else {
        const content = readFile(nodeId) || '[PDF内容 - 二进制数据无法显示为文本]';
        const docPages = content.split('\n\n---\n\n').map((section, i) => ({
          title: `${node.name} - 第 ${i + 1} 页`,
          content: section,
        }));
        setPages(docPages);
      }
    } else {
      // For non-PDF files, show content as pages
      const content = readFile(nodeId) || '';
      const lines = content.split('\n');
      const pageSize = 40;
      const docPages: SimulatedPage[] = [];
      for (let i = 0; i < lines.length; i += pageSize) {
        docPages.push({
          title: `${node.name} - 第 ${Math.floor(i / pageSize) + 1} 页`,
          content: lines.slice(i, i + pageSize).join('\n'),
        });
      }
      setPages(docPages.length > 0 ? docPages : [{ title: node.name, content: '[空文件]' }]);
    }
    setFileName(node.name);
    setCurrentPage(0);
    setShowOpenDialog(false);
  };

  const handleSearch = useCallback(() => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }
    const lower = searchText.toLowerCase();
    const results = pages.map((page, i) => {
      const matches = page.content.toLowerCase().split(lower).length - 1;
      return { page: i, count: matches };
    }).filter((r) => r.count > 0);
    setSearchResults(results);
    if (results.length > 0) {
      setCurrentPage(results[0].page);
    }
  }, [searchText, pages]);

  const highlightText = useCallback((text: string): string => {
    if (!searchText.trim()) return text;
    const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark style="background:#fde047;padding:0 1px;border-radius:2px">$1</mark>');
  }, [searchText]);

  const toggleBookmark = () => {
    const existing = bookmarks.findIndex((b) => b.page === currentPage);
    if (existing >= 0) {
      setBookmarks((prev) => prev.filter((_, i) => i !== existing));
    } else {
      setBookmarks((prev) => [...prev, { page: currentPage, label: `第 ${currentPage + 1} 页` }]);
    }
  };

  const isBookmarked = bookmarks.some((b) => b.page === currentPage);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const content = pages[currentPage].content;
      printWindow.document.write(`<html><head><title>${pages[currentPage].title}</title><pre style="font-family:sans-serif;white-space:pre-wrap">${content}</pre></head></html>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const pdfFiles = nodes.filter((n) => n.type === 'file' && (n.name.toLowerCase().endsWith('.pdf') || n.name.toLowerCase().endsWith('.txt')));

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col" style={{ background: 'var(--bg-workspace)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
        {/* Open */}
        <button
          onClick={() => setShowOpenDialog(true)}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
        >
          <FileText size={14} />
          <span>打开</span>
        </button>

        <div className="w-px h-5 mx-1" style={{ background: 'var(--border-default)' }} />

        {/* Page navigation */}
        <button
          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] disabled:opacity-30"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs text-[var(--text-primary)] min-w-[80px] text-center">
          第{' '}
          <input
            type="number"
            value={currentPage + 1}
            onChange={(e) => {
              const p = parseInt(e.target.value, 10) - 1;
              if (p >= 0 && p < pages.length) setCurrentPage(p);
            }}
            className="w-8 text-center outline-none rounded px-1 text-xs"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
          />{' '}
          页 / 共 {pages.length} 页
        </span>
        <button
          onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
          disabled={currentPage === pages.length - 1}
          className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] disabled:opacity-30"
        >
          <ChevronRight size={14} />
        </button>

        <div className="w-px h-5 mx-1" style={{ background: 'var(--border-default)' }} />

        {/* Zoom */}
        <button
          onClick={() => setZoom(Math.max(50, zoom - 10))}
          className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
          title="缩小"
        >
          <ZoomOut size={14} />
        </button>
        <span className="text-xs text-[var(--text-primary)] min-w-[40px] text-center">{zoom}%</span>
        <button
          onClick={() => setZoom(Math.min(200, zoom + 10))}
          className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
          title="放大"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={() => setZoom(100)}
          className="px-1.5 py-1 rounded text-xs hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
          title="重置缩放"
        >
          重置
        </button>

        <div className="w-px h-5 mx-1" style={{ background: 'var(--border-default)' }} />

        {/* Search */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className={`p-1.5 rounded ${searchOpen ? 'bg-[var(--accent-silver)] text-white' : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'}`}
          title="搜索"
        >
          <Search size={14} />
        </button>

        {/* Thumbnails toggle */}
        <button
          onClick={() => setShowThumbnails(!showThumbnails)}
          className={`p-1.5 rounded ${showThumbnails ? 'bg-[var(--accent-silver)] text-white' : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'}`}
          title="缩略图"
        >
          <FileText size={14} />
        </button>

        {/* Bookmarks toggle */}
        <button
          onClick={() => setShowBookmarks(!showBookmarks)}
          className={`p-1.5 rounded ${showBookmarks ? 'bg-[var(--accent-silver)] text-white' : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'}`}
          title="书签"
        >
          <Bookmark size={14} />
        </button>

        <div className="flex-1" />

        {/* Actions */}
        <button
          onClick={toggleBookmark}
          className={`p-1.5 rounded ${isBookmarked ? 'text-yellow-500' : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'}`}
          title={isBookmarked ? '移除书签' : '添加书签'}
        >
          <Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={handlePrint}
          className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
          title="打印"
        >
          <Printer size={14} />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
          title="全屏"
        >
          {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="flex items-center gap-2 px-2 py-1.5 border-b" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
          <Search size={14} className="text-[var(--text-muted)]" />
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="在文档中搜索..."
            className="flex-1 h-7 px-2 rounded text-xs outline-none"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
            autoFocus
          />
          <button onClick={handleSearch} className="px-2 py-1 rounded text-xs hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
            搜索
          </button>
          {searchResults.length > 0 && (
            <span className="text-xs text-[var(--text-muted)]">
              {searchResults.reduce((sum, r) => sum + r.count, 0)} 个结果，共 {searchResults.length} 页
            </span>
          )}
          <button onClick={() => { setSearchOpen(false); setSearchText(''); setSearchResults([]); }} className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)]">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thumbnails sidebar */}
        {showThumbnails && (
          <div className="w-32 border-r overflow-y-auto p-2 space-y-2" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
            {pages.map((page, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`w-full text-left rounded border-2 transition-all overflow-hidden ${
                  i === currentPage ? 'border-[var(--accent-silver)]' : 'border-transparent hover:border-[var(--border-default)]'
                }`}
              >
                <div
                  className="p-2 text-[6px] leading-tight overflow-hidden"
                  style={{
                    background: 'white',
                    color: '#333',
                    height: 80,
                    wordBreak: 'break-all',
                  }}
                >
                  {page.content.substring(0, 200)}
                </div>
                <div className="text-center text-[9px] py-0.5 text-[var(--text-muted)]">{i + 1}</div>
              </button>
            ))}
          </div>
        )}

        {/* Bookmarks panel */}
        {showBookmarks && (
          <div className="w-40 border-r overflow-y-auto" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
            <div className="p-2 border-b" style={{ borderColor: 'var(--border-default)' }}>
              <span className="text-xs font-medium text-[var(--text-secondary)]">书签</span>
            </div>
            {bookmarks.length === 0 ? (
              <div className="p-4 text-center text-xs text-[var(--text-muted)]">暂无书签</div>
            ) : (
              <div className="p-1">
                {bookmarks.map((bm, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(bm.page)}
                    className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-[var(--bg-hover)] text-[var(--text-primary)] flex items-center gap-2"
                  >
                    <Bookmark size={12} className="text-yellow-500" />
                    {bm.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Document view */}
        <div className="flex-1 overflow-auto p-6 flex justify-center" style={{ background: '#525659' }}>
          <div
            style={{
              width: `${(612 * zoom) / 100}px`,
              minHeight: `${(792 * zoom) / 100}px`,
              background: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              padding: `${(72 * zoom) / 100}px`,
              fontSize: `${(12 * zoom) / 100}px`,
              lineHeight: 1.6,
              color: '#1a1a1a',
              fontFamily: 'Helvetica, Arial, sans-serif',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
            ref={contentRef}
            dangerouslySetInnerHTML={{
              __html: highlightText(pages[currentPage]?.content || ''),
            }}
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 text-xs border-t" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
        <span>{fileName || '未打开文件'}</span>
        <span>{zoom}%</span>
        <span>{pages.length} 页</span>
      </div>

      {/* Open dialog */}
      {showOpenDialog && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-96 rounded-xl p-4" style={{ background: 'var(--bg-window)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <h3 className="text-sm font-semibold mb-3 text-[var(--text-primary)]">打开文档</h3>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {pdfFiles.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">未找到文档</p>
              ) : (
                pdfFiles.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => handleOpenFile(node.id)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-[var(--bg-hover)] text-sm text-[var(--text-primary)] flex items-center gap-2"
                  >
                    <FileText size={14} className="text-[var(--text-muted)]" />
                    {node.name}
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => setShowOpenDialog(false)}
              className="w-full mt-3 py-2 rounded text-sm hover:bg-[var(--bg-hover)]"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
