import { useState, useMemo, useCallback } from 'react';
import {
  HardDrive, Folder, FolderOpen, File, FileText, FileImage, FileAudio,
  FileVideo, FileCode, FileArchive, ArrowLeft, ArrowUp, LayoutGrid,
  List, SortAsc, SortDesc,
} from 'lucide-react';
import { useFileSystemStore, type FSNode } from '@/stores/useFileSystemStore';

interface DiskUsageProps { windowId: string }

type SortBy = 'size' | 'name';
type SortDir = 'asc' | 'desc';
type ViewMode = 'treemap' | 'table';

const FILE_COLORS: Record<string, string> = {
  'text': '#3B82F6',
  'image': '#10B981',
  'audio': '#8B5CF6',
  'video': '#F59E0B',
  'application': '#EF4444',
  'default': '#6B7280',
};

function getFileColor(mimeType?: string): string {
  if (!mimeType) return FILE_COLORS.default;
  const type = mimeType.split('/')[0];
  return FILE_COLORS[type] || FILE_COLORS.default;
}

function getFileIcon(node: FSNode) {
  if (node.type === 'directory') return <Folder size={14} className="text-yellow-400" />;
  const mime = node.mimeType || '';
  if (mime.startsWith('image/')) return <FileImage size={14} className="text-green-400" />;
  if (mime.startsWith('audio/')) return <FileAudio size={14} className="text-purple-400" />;
  if (mime.startsWith('video/')) return <FileVideo size={14} className="text-amber-400" />;
  if (mime.startsWith('text/')) return <FileText size={14} className="text-blue-400" />;
  if (mime.includes('zip') || mime.includes('archive')) return <FileArchive size={14} className="text-red-400" />;
  if (mime.includes('javascript') || mime.includes('json')) return <FileCode size={14} className="text-cyan-400" />;
  return <File size={14} className="text-[var(--text-muted)]" />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

interface DirEntry {
  id: string;
  name: string;
  type: 'file' | 'directory';
  size: number;
  mimeType?: string;
}

export default function DiskUsage({ windowId }: DiskUsageProps) {
  const nodes = useFileSystemStore((s) => s.nodes);
  const getChildren = useFileSystemStore((s) => s.getChildren);
  const getPath = useFileSystemStore((s) => s.getPath);
  const [currentDirId, setCurrentDirId] = useState('fs-root');
  const [viewMode, setViewMode] = useState<ViewMode>('treemap');
  const [sortBy, setSortBy] = useState<SortBy>('size');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Calculate directory sizes recursively
  const dirSizes = useMemo(() => {
    const sizes = new Map<string, number>();
    const calcSize = (nodeId: string): number => {
      if (sizes.has(nodeId)) return sizes.get(nodeId)!;
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return 0;
      if (node.type === 'file') {
        const sz = node.size || node.content?.length || 0;
        sizes.set(nodeId, sz);
        return sz;
      }
      const children = nodes.filter((n) => n.parentId === nodeId);
      let total = 4096; // directory entry size
      for (const child of children) {
        total += calcSize(child.id);
      }
      sizes.set(nodeId, total);
      return total;
    };
    nodes.forEach((n) => calcSize(n.id));
    return sizes;
  }, [nodes]);

  // Get entries for current directory
  const entries = useMemo((): DirEntry[] => {
    const children = nodes.filter((n) => n.parentId === currentDirId);
    const items: DirEntry[] = children.map((n) => ({
      id: n.id,
      name: n.name,
      type: n.type,
      size: dirSizes.get(n.id) || 0,
      mimeType: n.mimeType,
    }));

    items.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'size') cmp = a.size - b.size;
      else cmp = a.name.localeCompare(b.name);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return items;
  }, [nodes, currentDirId, dirSizes, sortBy, sortDir]);

  const totalSize = dirSizes.get(currentDirId) || 0;
  const totalDisk = 50 * 1024 * 1024 * 1024; // 50 GB virtual
  const usedPercent = Math.min(100, (totalSize / totalDisk) * 100);

  const pathSegments = useMemo(() => {
    const segs: { id: string; name: string }[] = [];
    let current = nodes.find((n) => n.id === currentDirId);
    while (current) {
      segs.unshift({ id: current.id, name: current.id === 'fs-root' ? '/' : current.name });
      current = current.parentId ? nodes.find((n) => n.id === current?.parentId) : undefined;
    }
    return segs;
  }, [nodes, currentDirId]);

  const handleNavigate = (id: string) => {
    const node = nodes.find((n) => n.id === id);
    if (node?.type === 'directory') {
      setCurrentDirId(id);
    }
  };

  const handleGoUp = () => {
    const current = nodes.find((n) => n.id === currentDirId);
    if (current?.parentId) setCurrentDirId(current.parentId);
  };

  // Treemap layout algorithm (simple squarified treemap)
  const treemapRects = useMemo(() => {
    if (entries.length === 0) return [];
    const total = entries.reduce((s, e) => s + e.size, 0);
    if (total === 0) return entries.map((e, i) => ({ entry: e, x: 0, y: i * 30, w: 100, h: 30 }));

    const rects: { entry: DirEntry; x: number; y: number; w: number; h: number }[] = [];
    const area = 100 * 100; // percentage-based

    // Simple strip layout
    let yOffset = 0;
    const sorted = [...entries].sort((a, b) => b.size - a.size);

    for (const entry of sorted) {
      const fraction = entry.size / total;
      const height = Math.max(3, fraction * 100);
      rects.push({
        entry,
        x: 0,
        y: yOffset,
        w: 100,
        h: height,
      });
      yOffset += height;
    }

    // Normalize to fit 100%
    if (yOffset > 0) {
      const scale = 100 / yOffset;
      for (const r of rects) {
        r.y *= scale;
        r.h *= scale;
      }
    }

    return rects;
  }, [entries]);

  const toggleSort = (by: SortBy) => {
    if (sortBy === by) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(by);
      setSortDir('desc');
    }
  };

  return (
    <div className="w-full h-full flex flex-col text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
        <HardDrive size={18} className="text-[var(--accent-silver)]" />
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">磁盘使用分析</h2>
        <div className="flex-1" />
        <button
          onClick={() => setViewMode('treemap')}
          className="w-8 h-8 flex items-center justify-center rounded"
          style={{
            background: viewMode === 'treemap' ? 'var(--accent-silver)' : 'transparent',
            color: viewMode === 'treemap' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          <LayoutGrid size={16} />
        </button>
        <button
          onClick={() => setViewMode('table')}
          className="w-8 h-8 flex items-center justify-center rounded"
          style={{
            background: viewMode === 'table' ? 'var(--accent-silver)' : 'transparent',
            color: viewMode === 'table' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          <List size={16} />
        </button>
      </div>

      {/* Disk usage bar */}
      <div className="px-3 py-2 border-b" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
          <span>已用: {formatSize(totalSize)}</span>
          <span>总计: {formatSize(totalDisk)}</span>
          <span>可用: {formatSize(totalDisk - totalSize)}</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${usedPercent}%`,
              background: usedPercent > 90 ? '#EF4444' : usedPercent > 70 ? '#F59E0B' : 'var(--accent-silver)',
            }}
          />
        </div>
        <div className="text-xs text-[var(--text-muted)] text-center mt-0.5">已使用 {usedPercent.toFixed(1)}%</div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
        <button
          onClick={handleGoUp}
          disabled={currentDirId === 'fs-root'}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] disabled:opacity-30 text-[var(--text-secondary)]"
        >
          <ArrowUp size={14} />
        </button>
        {pathSegments.map((seg, i) => (
          <span key={seg.id} className="flex items-center gap-1">
            {i > 0 && <span className="text-[var(--text-muted)]">/</span>}
            <button
              onClick={() => setCurrentDirId(seg.id)}
              className="px-1.5 py-0.5 rounded text-xs hover:bg-[var(--bg-hover)]"
              style={{ color: i === pathSegments.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}
            >
              {seg.name}
            </button>
          </span>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <FolderOpen size={40} className="text-[var(--text-muted)]" />
            <span className="text-sm text-[var(--text-muted)]">空目录</span>
          </div>
        ) : viewMode === 'treemap' ? (
          /* Treemap view */
          <div className="p-2 h-full">
            <div className="relative w-full rounded-lg overflow-hidden" style={{ height: 'calc(100% - 8px)', background: 'var(--bg-input)' }}>
              {treemapRects.map((rect) => {
                const isDir = rect.entry.type === 'directory';
                const pct = totalSize > 0 ? ((rect.entry.size / totalSize) * 100).toFixed(1) : '0';
                return (
                  <div
                    key={rect.entry.id}
                    className="absolute border transition-all cursor-pointer hover:brightness-110"
                    style={{
                      left: `${rect.x}%`,
                      top: `${rect.y}%`,
                      width: `${rect.w}%`,
                      height: `${rect.h}%`,
                      background: isDir ? 'rgba(234, 179, 8, 0.3)' : getFileColor(rect.entry.mimeType) + '40',
                      borderColor: isDir ? 'rgba(234, 179, 8, 0.6)' : getFileColor(rect.entry.mimeType) + '80',
                    }}
                    onClick={() => isDir && handleNavigate(rect.entry.id)}
                  >
                    <div className="p-1.5 h-full flex flex-col justify-center overflow-hidden">
                      <div className="flex items-center gap-1">
                        {getFileIcon(rect.entry)}
                        <span className="text-xs font-medium text-[var(--text-primary)] truncate">{rect.entry.name}</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)]">{formatSize(rect.entry.size)} ({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Table view */
          <div className="p-2">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-[var(--text-muted)] border-b" style={{ borderColor: 'var(--border-default)' }}>
                  <th className="text-left py-1.5 px-2 font-medium">名称</th>
                  <th className="text-right py-1.5 px-2 font-medium cursor-pointer hover:text-[var(--text-primary)]" onClick={() => toggleSort('size')}>
                    大小 {sortBy === 'size' && (sortDir === 'asc' ? <SortAsc size={12} className="inline" /> : <SortDesc size={12} className="inline" />)}
                  </th>
                  <th className="text-right py-1.5 px-2 font-medium w-24">%</th>
                  <th className="py-1.5 px-2 font-medium w-40">使用率</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const pct = totalSize > 0 ? (entry.size / totalSize) * 100 : 0;
                  const isDir = entry.type === 'directory';
                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-[var(--bg-hover)] cursor-pointer border-b"
                      style={{ borderColor: 'var(--border-default)' }}
                      onClick={() => isDir && handleNavigate(entry.id)}
                    >
                      <td className="py-1.5 px-2">
                        <div className="flex items-center gap-2">
                          {getFileIcon(entry)}
                          <span className="text-xs text-[var(--text-primary)] truncate">{entry.name}</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-right text-xs font-mono text-[var(--text-secondary)]">
                        {formatSize(entry.size)}
                      </td>
                      <td className="py-1.5 px-2 text-right text-xs text-[var(--text-muted)]">
                        {pct.toFixed(1)}%
                      </td>
                      <td className="py-1.5 px-2">
                        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(1, pct)}%`,
                              background: isDir ? '#EAB308' : getFileColor(entry.mimeType),
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 text-xs border-t" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
        <span>{entries.length} 个项目</span>
        <span>总计: {formatSize(totalSize)}</span>
        <span>排序方式: {sortBy === 'size' ? '大小' : '名称'} ({sortDir === 'asc' ? '升序' : '降序'})</span>
      </div>
    </div>
  );
}
