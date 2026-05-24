import { useState, useCallback, useMemo } from 'react';
import { Trash2, RotateCcw, X, CheckSquare, Square, AlertTriangle, FileText, FolderOpen, ArrowUpDown } from 'lucide-react';
import { useFileSystemStore, type FSNode } from '@/stores/useFileSystemStore';

type SortField = 'name' | 'date' | 'size';
type SortDir = 'asc' | 'desc';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function Trash({ windowId }: { windowId: string }) {
  const { nodes, getPath, moveNode, deleteNode } = useFileSystemStore();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showConfirm, setShowConfirm] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemId: string } | null>(null);

  const trashFolder = nodes.find(n => n.id === 'fs-trash');
  const trashItems = useMemo(() => {
    if (!trashFolder) return [];
    return nodes.filter(n => n.parentId === 'fs-trash').map(n => ({
      ...n,
      originalPath: n.content?.startsWith('Original:') ? n.content.replace('Original:', '') : `/home/user/${n.name}`,
      deletedAt: n.modifiedAt,
    }));
  }, [nodes, trashFolder]);

  const sortedItems = useMemo(() => {
    return [...trashItems].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'date') cmp = a.deletedAt.getTime() - b.deletedAt.getTime();
      else cmp = (a.size || 0) - (b.size || 0);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [trashItems, sortField, sortDir]);

  const toggleSort = useCallback((field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }, [sortField]);

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selected.size === trashItems.length) setSelected(new Set());
    else setSelected(new Set(trashItems.map(t => t.id)));
  }, [selected, trashItems]);

  const restoreItem = useCallback((id: string) => {
    moveNode(id, 'fs-user');
    setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
  }, [moveNode]);

  const restoreSelected = useCallback(() => {
    selected.forEach(id => moveNode(id, 'fs-user'));
    setSelected(new Set());
  }, [selected, moveNode]);

  const deletePermanently = useCallback((id: string) => {
    deleteNode(id);
    setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
  }, [deleteNode]);

  const emptyTrash = useCallback(() => {
    trashItems.forEach(item => deleteNode(item.id));
    setSelected(new Set());
    setShowConfirm(false);
  }, [trashItems, deleteNode]);

  const handleClick = useCallback(() => setContextMenu(null), []);

  return (
    <div className="w-full h-full flex flex-col text-sm" style={{ background: 'var(--bg-workspace)' }} onClick={handleClick}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'var(--bg-window)' }}>
        <div className="flex items-center gap-2">
          <Trash2 size={16} style={{ color: 'var(--accent-silver)' }} />
          <span className="font-medium text-[var(--text-primary)]">回收站</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
            {trashItems.length} 个项目
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {selected.size > 0 && (
            <>
              <button onClick={restoreSelected} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] hover:bg-[var(--bg-hover)]" style={{ color: 'var(--accent-silver)' }}>
                <RotateCcw size={10} /> 恢复 ({selected.size})
              </button>
              <button onClick={() => { selected.forEach(id => deleteNode(id)); setSelected(new Set()); }} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] hover:bg-[var(--bg-hover)]" style={{ color: '#f87171' }}>
                <X size={10} /> 删除 ({selected.size})
              </button>
            </>
          )}
          <button onClick={selectAll} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-secondary)' }}>
            {selected.size === trashItems.length ? <CheckSquare size={10} /> : <Square size={10} />} 全选
          </button>
          <button onClick={() => trashItems.length > 0 && setShowConfirm(true)} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-white" style={{ background: trashItems.length > 0 ? '#ef4444' : 'var(--bg-input)', opacity: trashItems.length > 0 ? 1 : 0.5 }}>
            <Trash2 size={10} /> 清空回收站
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid items-center px-3 py-1.5 text-[10px] font-medium border-b" style={{ gridTemplateColumns: '28px 1fr 1fr 100px 80px', borderColor: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)' }}>
        <span />
        <button onClick={() => toggleSort('name')} className="flex items-center gap-0.5 hover:text-[var(--text-secondary)]">Name <ArrowUpDown size={8} /></button>
        <span>原始位置</span>
        <button onClick={() => toggleSort('date')} className="flex items-center gap-0.5 hover:text-[var(--text-secondary)]">删除日期 <ArrowUpDown size={8} /></button>
        <button onClick={() => toggleSort('size')} className="flex items-center gap-0.5 hover:text-[var(--text-secondary)]">大小 <ArrowUpDown size={8} /></button>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto">
        {sortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Trash2 size={32} style={{ color: 'var(--text-muted)' }} />
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>回收站为空</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>已删除的文件将显示在这里</p>
          </div>
        ) : (
          sortedItems.map(item => (
            <div key={item.id} className="grid items-center px-3 py-1.5 hover:bg-[var(--bg-hover)] cursor-pointer transition-colors border-b" style={{ gridTemplateColumns: '28px 1fr 1fr 100px 80px', borderColor: 'rgba(0,0,0,0.04)', background: selected.has(item.id) ? 'rgba(125,139,150,0.1)' : 'transparent' }} onClick={() => toggleSelect(item.id)} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, itemId: item.id }); }}>
              <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} className="w-3 h-3 accent-[var(--accent-silver)]" onClick={e => e.stopPropagation()} />
              <div className="flex items-center gap-1.5 min-w-0">
                {item.type === 'directory' ? <FolderOpen size={12} style={{ color: 'var(--accent-silver)' }} /> : <FileText size={12} style={{ color: 'var(--text-muted)' }} />}
                <span className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</span>
              </div>
              <span className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{item.originalPath}</span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.deletedAt.toLocaleDateString()}</span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{formatSize(item.size || 0)}</span>
            </div>
          ))
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div className="fixed py-1 rounded-lg shadow-lg z-50" style={{ left: contextMenu.x, top: contextMenu.y, background: 'var(--bg-window)', border: '1px solid rgba(0,0,0,0.1)', minWidth: 150 }} onClick={e => e.stopPropagation()}>
          <button className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-primary)' }} onClick={() => { restoreItem(contextMenu.itemId); setContextMenu(null); }}>
            <RotateCcw size={12} style={{ color: 'var(--accent-silver)' }} /> 恢复
          </button>
          <div className="h-px my-1" style={{ background: 'rgba(0,0,0,0.06)' }} />
          <button className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-[var(--bg-hover)]" style={{ color: '#f87171' }} onClick={() => { deletePermanently(contextMenu.itemId); setContextMenu(null); }}>
            <Trash2 size={12} /> 永久删除
          </button>
        </div>
      )}

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="rounded-lg p-4 max-w-xs" style={{ background: 'var(--bg-window)' }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} style={{ color: '#f87171' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>清空回收站？</span>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>将永久删除 {trashItems.length} 个项目，此操作不可撤销。</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowConfirm(false)} className="px-3 py-1.5 rounded text-xs hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-secondary)', background: 'var(--bg-input)' }}>取消</button>
              <button onClick={emptyTrash} className="px-3 py-1.5 rounded text-xs text-white" style={{ background: '#ef4444' }}>清空回收站</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
