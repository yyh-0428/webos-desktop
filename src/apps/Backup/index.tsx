import { useState, useCallback } from 'react';
import { Archive, HardDrive, FolderOpen, ChevronRight, ChevronDown, Play, RotateCcw, Clock, Shield, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useFileSystemStore, type FSNode } from '@/stores/useFileSystemStore';

interface BackupRecord {
  id: string;
  date: string;
  size: number;
  status: 'completed' | 'failed' | 'in-progress';
  fileCount: number;
  destination: string;
  compressed: boolean;
  encrypted: boolean;
}

const DESTINATIONS = [
  { id: 'local', name: '本地存储', path: '/backups/local', icon: HardDrive },
  { id: 'external', name: '外部驱动器', path: '/media/external/backup', icon: HardDrive },
  { id: 'cloud', name: '云存储', path: '/cloud/backup', icon: Archive },
];

const SCHEDULE_OPTIONS = [
  { id: 'none', label: '手动' },
  { id: 'daily', label: '每天' },
  { id: 'weekly', label: '每周' },
  { id: 'monthly', label: '每月' },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function FileTreeNode({ node, selected, onToggle, getChildren, depth }: {
  node: FSNode;
  selected: Set<string>;
  onToggle: (id: string) => void;
  getChildren: (parentId: string) => FSNode[];
  depth: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const children = node.type === 'directory' ? getChildren(node.id) : [];
  const isSelected = selected.has(node.id);

  return (
    <div>
      <div
        className="flex items-center gap-1 py-0.5 px-1 rounded cursor-pointer hover:bg-[var(--bg-hover)] text-xs"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={() => onToggle(node.id)}
      >
        {node.type === 'directory' ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="p-0.5"
          >
            {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </button>
        ) : (
          <span className="w-[18px]" />
        )}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(node.id)}
          className="w-3 h-3 accent-[var(--accent-silver)]"
          onClick={(e) => e.stopPropagation()}
        />
        {node.type === 'directory' ? (
          <FolderOpen size={12} style={{ color: 'var(--accent-silver)' }} />
        ) : (
          <Archive size={12} style={{ color: 'var(--text-muted)' }} />
        )}
        <span style={{ color: 'var(--text-primary)' }}>{node.name || '/'}</span>
        {node.type === 'file' && (
          <span className="ml-auto text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {formatSize(node.size || 0)}
          </span>
        )}
      </div>
      {expanded && children.map(child => (
        <FileTreeNode
          key={child.id}
          node={child}
          selected={selected}
          onToggle={onToggle}
          getChildren={getChildren}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export default function Backup({ windowId }: { windowId: string }) {
  const { nodes, getChildren, getNode, getPath } = useFileSystemStore();
  const [selectedDest, setSelectedDest] = useState('local');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [compress, setCompress] = useState(true);
  const [encrypt, setEncrypt] = useState(false);
  const [schedule, setSchedule] = useState('none');
  const [backupProgress, setBackupProgress] = useState(-1);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [history, setHistory] = useState<BackupRecord[]>([
    { id: '1', date: '2024-03-15 14:30', size: 2457600, status: 'completed', fileCount: 24, destination: '/backups/local', compressed: true, encrypted: false },
    { id: '2', date: '2024-03-10 09:15', size: 1843200, status: 'completed', fileCount: 18, destination: '/cloud/backup', compressed: true, encrypted: true },
    { id: '3', date: '2024-03-01 16:45', size: 3072000, status: 'failed', fileCount: 32, destination: '/media/external/backup', compressed: false, encrypted: false },
  ]);
  const [showRestore, setShowRestore] = useState<string | null>(null);

  const rootNode = nodes.find(n => n.id === 'fs-user') || nodes.find(n => n.id === 'fs-root');

  const toggleFile = useCallback((id: string) => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        // Remove children
        const removeChildren = (parentId: string) => {
          nodes.filter(n => n.parentId === parentId).forEach(child => {
            next.delete(child.id);
            if (child.type === 'directory') removeChildren(child.id);
          });
        };
        removeChildren(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, [nodes]);

  const startBackup = useCallback(() => {
    if (selectedFiles.size === 0) return;
    setIsBackingUp(true);
    setBackupProgress(0);

    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackingUp(false);
          const dest = DESTINATIONS.find(d => d.id === selectedDest);
          const record: BackupRecord = {
            id: Date.now().toString(),
            date: new Date().toLocaleString(),
            size: Math.floor(Math.random() * 5000000) + 500000,
            status: 'completed',
            fileCount: selectedFiles.size,
            destination: dest?.path || '',
            compressed: compress,
            encrypted: encrypt,
          };
          setHistory(h => [record, ...h]);
          return 100;
        }
        return prev + 2;
      });
    }, 60);
  }, [selectedFiles, selectedDest, compress, encrypt]);

  const restoreBackup = useCallback((record: BackupRecord) => {
    setShowRestore(record.id);
    setTimeout(() => setShowRestore(null), 2000);
  }, []);

  return (
    <div className="w-full h-full flex flex-col text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'var(--bg-window)' }}>
        <Archive size={16} style={{ color: 'var(--accent-silver)' }} />
        <span className="font-medium text-[var(--text-primary)]">备份工具</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - file selection */}
        <div className="w-64 flex flex-col border-r" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <div className="px-3 py-2 border-b text-xs font-medium" style={{ borderColor: 'rgba(0,0,0,0.06)', color: 'var(--text-secondary)' }}>
            选择文件和文件夹
          </div>
          <div className="flex-1 overflow-y-auto p-1">
            {rootNode && (
              <FileTreeNode
                node={rootNode}
                selected={selectedFiles}
                onToggle={toggleFile}
                getChildren={getChildren}
                depth={0}
              />
            )}
          </div>
          <div className="px-3 py-1 text-[10px] border-t" style={{ borderColor: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)' }}>
            已选择 {selectedFiles.size} 个项目
          </div>
        </div>

        {/* Right panel - settings & history */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Settings */}
          <div className="p-3 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
            {/* Destination */}
            <div className="mb-3">
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>目标位置</label>
              <div className="flex gap-2">
                {DESTINATIONS.map(dest => (
                  <button
                    key={dest.id}
                    onClick={() => setSelectedDest(dest.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
                      selectedDest === dest.id ? 'text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                    }`}
                    style={selectedDest === dest.id ? { background: 'var(--accent-dark-gray)' } : { background: 'var(--bg-input)' }}
                  >
                    <dest.icon size={12} />
                    {dest.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Options row */}
            <div className="flex items-center gap-4 mb-3">
              <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={compress} onChange={e => setCompress(e.target.checked)} className="w-3 h-3 accent-[var(--accent-silver)]" />
                压缩
              </label>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={encrypt} onChange={e => setEncrypt(e.target.checked)} className="w-3 h-3 accent-[var(--accent-silver)]" />
                <Lock size={10} /> 加密
              </label>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <Clock size={10} />
                <select
                  value={schedule}
                  onChange={e => setSchedule(e.target.value)}
                  className="text-xs px-2 py-0.5 rounded outline-none"
                  style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.06)' }}
                >
                  {SCHEDULE_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Backup button & progress */}
            <div className="flex items-center gap-3">
              <button
                onClick={startBackup}
                disabled={isBackingUp || selectedFiles.size === 0}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-medium text-white disabled:opacity-50 transition-all"
                style={{ background: 'var(--accent-dark-gray)' }}
              >
                {isBackingUp ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                {isBackingUp ? '备份中...' : '开始备份'}
              </button>
              {backupProgress >= 0 && (
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${backupProgress}%`, background: backupProgress >= 100 ? '#4ade80' : 'var(--accent-silver)' }}
                    />
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{backupProgress}%</span>
                </div>
              )}
            </div>
          </div>

          {/* History */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 py-2 text-xs font-medium border-b" style={{ borderColor: 'rgba(0,0,0,0.06)', color: 'var(--text-secondary)' }}>
              备份历史
            </div>
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32">
                <Archive size={24} style={{ color: 'var(--text-muted)' }} />
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>暂无备份记录</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
                {history.map(record => (
                  <div key={record.id} className="px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {record.status === 'completed' ? (
                          <CheckCircle size={14} style={{ color: '#4ade80' }} />
                        ) : record.status === 'failed' ? (
                          <AlertCircle size={14} style={{ color: '#f87171' }} />
                        ) : (
                          <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent-silver)' }} />
                        )}
                        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{record.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {record.compressed && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>ZIP</span>}
                        {record.encrypted && <Lock size={10} style={{ color: 'var(--accent-silver)' }} />}
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{formatSize(record.size)}</span>
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{record.fileCount} 个文件</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{record.destination}</span>
                      <div className="flex gap-1">
                        {record.status === 'completed' && (
                          <button
                            onClick={() => restoreBackup(record)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] hover:bg-[var(--bg-hover)] transition-colors"
                            style={{ color: 'var(--accent-silver)' }}
                          >
                            <RotateCcw size={10} />
                            恢复
                          </button>
                        )}
                      </div>
                    </div>
                    {showRestore === record.id && (
                      <div className="mt-1 text-[10px] px-2 py-1 rounded" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}>
                        正在恢复备份...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
