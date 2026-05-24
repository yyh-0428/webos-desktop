import { useState, useCallback, useMemo } from 'react';
import { Package, PackagePlus, PackageOpen, FolderOpen, File, ChevronRight, ChevronDown, Trash2, Lock, Loader2, Archive as ArchiveIcon } from 'lucide-react';
import { useFileSystemStore, type FSNode } from '@/stores/useFileSystemStore';

type ArchiveFormat = 'zip' | 'tar' | '7z';
type CompressionLevel = 'none' | 'fast' | 'normal' | 'best';
type View = 'create' | 'extract' | 'viewer';

interface ArchiveEntry {
  id: string;
  name: string;
  type: 'file' | 'directory';
  size: number;
  compressedSize: number;
  children?: ArchiveEntry[];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

const COMPRESSION_RATIOS: Record<CompressionLevel, number> = {
  none: 1,
  fast: 0.8,
  normal: 0.6,
  best: 0.4,
};

const DEMO_ARCHIVES: { id: string; name: string; format: ArchiveFormat; entries: ArchiveEntry[]; createdAt: string; passwordProtected: boolean }[] = [
  {
    id: 'arch-1',
    name: 'project-backup.zip',
    format: 'zip',
    createdAt: '2024-03-15',
    passwordProtected: false,
    entries: [
      { id: 'e1', name: 'src', type: 'directory', size: 0, compressedSize: 0, children: [
        { id: 'e1-1', name: 'index.ts', type: 'file', size: 4096, compressedSize: 1200 },
        { id: 'e1-2', name: 'utils.ts', type: 'file', size: 2048, compressedSize: 800 },
        { id: 'e1-3', name: 'styles.css', type: 'file', size: 3072, compressedSize: 900 },
      ]},
      { id: 'e2', name: 'package.json', type: 'file', size: 512, compressedSize: 200 },
      { id: 'e3', name: 'README.md', type: 'file', size: 1024, compressedSize: 400 },
    ],
  },
  {
    id: 'arch-2',
    name: 'photos-2024.tar',
    format: 'tar',
    createdAt: '2024-02-20',
    passwordProtected: true,
    entries: [
      { id: 'e4', name: 'vacation', type: 'directory', size: 0, compressedSize: 0, children: [
        { id: 'e4-1', name: 'beach.jpg', type: 'file', size: 2097152, compressedSize: 1800000 },
        { id: 'e4-2', name: 'mountain.jpg', type: 'file', size: 3145728, compressedSize: 2700000 },
      ]},
      { id: 'e5', name: 'profile.png', type: 'file', size: 524288, compressedSize: 450000 },
    ],
  },
];

function EntryTree({ entries, depth = 0 }: { entries: ArchiveEntry[]; depth?: number }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="flex flex-col">
      {entries.map(entry => (
        <div key={entry.id}>
          <button
            onClick={() => entry.type === 'directory' ? toggle(entry.id) : undefined}
            className="flex items-center gap-1 py-0.5 text-xs w-full text-left hover:bg-[var(--bg-hover)] rounded px-1 transition-all"
            style={{ paddingLeft: `${depth * 16 + 4}px`, color: 'var(--text-secondary)' }}
          >
            {entry.type === 'directory' ? (
              <>
                <ChevronRight size={10} className={`transition-transform ${expanded.has(entry.id) ? 'rotate-90' : ''}`} />
                <FolderOpen size={10} style={{ color: 'var(--accent-silver)' }} />
              </>
            ) : (
              <>
                <span className="w-[10px]" />
                <File size={10} style={{ color: 'var(--text-muted)' }} />
              </>
            )}
            <span className="truncate flex-1">{entry.name}</span>
            {entry.type === 'file' && (
              <span className="text-[10px] shrink-0 ml-2" style={{ color: 'var(--text-muted)' }}>
                {formatSize(entry.size)} → {formatSize(entry.compressedSize)}
              </span>
            )}
          </button>
          {entry.type === 'directory' && entry.children && expanded.has(entry.id) && (
            <EntryTree entries={entry.children} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Archive({ windowId }: { windowId: string }) {
  const { nodes, getChildren, getPath } = useFileSystemStore();
  const [view, setView] = useState<View>('viewer');
  const [archives, setArchives] = useState(DEMO_ARCHIVES);
  const [selectedArchive, setSelectedArchive] = useState<string | null>(DEMO_ARCHIVES[0]?.id || null);

  // Create archive state
  const [newName, setNewName] = useState('');
  const [format, setFormat] = useState<ArchiveFormat>('zip');
  const [compression, setCompression] = useState<CompressionLevel>('normal');
  const [passwordProtect, setPasswordProtect] = useState(false);
  const [password, setPassword] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(-1);

  const userRoot = nodes.find(n => n.id === 'fs-user');
  const userChildren = userRoot ? getChildren('fs-user') : [];

  const toggleFile = useCallback((id: string) => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const createArchive = useCallback(() => {
    if (!newName.trim() || selectedFiles.size === 0) return;
    setIsCreating(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 50);

    setTimeout(() => {
      const ratio = COMPRESSION_RATIOS[compression];
      const entries: ArchiveEntry[] = [];
      let totalSize = 0;

      selectedFiles.forEach(id => {
        const node = nodes.find(n => n.id === id);
        if (node) {
          const size = node.size || 0;
          totalSize += size;
          entries.push({
            id: node.id,
            name: node.name,
            type: node.type,
            size,
            compressedSize: Math.floor(size * ratio),
          });
        }
      });

      const ext = format === 'zip' ? '.zip' : format === 'tar' ? '.tar' : '.7z';
      const archive = {
        id: `arch-${Date.now()}`,
        name: newName.endsWith(ext) ? newName : `${newName}${ext}`,
        format,
        entries,
        createdAt: new Date().toISOString().split('T')[0],
        passwordProtected: passwordProtect,
      };

      setArchives(prev => [archive, ...prev]);
      setSelectedArchive(archive.id);
      setView('viewer');
      setIsCreating(false);
      setProgress(-1);
      setNewName('');
      setSelectedFiles(new Set());
    }, 1200);
  }, [newName, format, compression, passwordProtect, selectedFiles, nodes]);

  const deleteArchive = useCallback((id: string) => {
    setArchives(prev => prev.filter(a => a.id !== id));
    if (selectedArchive === id) setSelectedArchive(null);
  }, [selectedArchive]);

  const selectedArch = archives.find(a => a.id === selectedArchive);

  return (
    <div className="w-full h-full flex flex-col text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'var(--bg-window)' }}>
        <div className="flex items-center gap-2">
          <Package size={16} style={{ color: 'var(--accent-silver)' }} />
          <span className="font-medium text-[var(--text-primary)]">压缩管理</span>
        </div>
        <div className="flex gap-1">
          {(['viewer', 'create', 'extract'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 rounded text-[10px] transition-colors capitalize ${
                view === v ? 'text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
              }`}
              style={view === v ? { background: 'var(--accent-dark-gray)' } : { background: 'var(--bg-input)' }}
            >
              {v === 'viewer' ? '浏览' : v === 'create' ? '创建' : '解压'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - archive list */}
        <div className="w-48 flex flex-col border-r" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <div className="px-2 py-1.5 text-[10px] font-medium border-b" style={{ borderColor: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)' }}>
            压缩包 ({archives.length})
          </div>
          <div className="flex-1 overflow-y-auto">
            {archives.map(a => (
              <button
                key={a.id}
                onClick={() => { setSelectedArchive(a.id); setView('viewer'); }}
                className="w-full text-left p-2 flex items-center gap-2 hover:bg-[var(--bg-hover)] transition-colors border-b"
                style={{
                  borderColor: 'rgba(0,0,0,0.04)',
                  background: selectedArchive === a.id ? 'rgba(125,139,150,0.1)' : 'transparent',
                }}
              >
                <Package size={12} style={{ color: 'var(--accent-silver)' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] truncate flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                    {a.name}
                    {a.passwordProtected && <Lock size={8} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                  <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{a.createdAt}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteArchive(a.id); }}
                  className="p-0.5 rounded hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Trash2 size={10} />
                </button>
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {view === 'viewer' && (
            <>
              {selectedArch ? (
                <>
                  <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                    <div className="flex items-center gap-2">
                      <PackageOpen size={14} style={{ color: 'var(--accent-silver)' }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{selectedArch.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded uppercase" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>{selectedArch.format}</span>
                      {selectedArch.passwordProtected && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                          <Lock size={8} /> 已加密
                        </span>
                      )}
                    </div>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {selectedArch.entries.length} 个项目 | 创建于 {selectedArch.createdAt}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    {selectedArch.entries.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <ArchiveIcon size={24} style={{ color: 'var(--text-muted)' }} />
                        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>空压缩包</p>
                      </div>
                    ) : (
                      <EntryTree entries={selectedArch.entries} />
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <Package size={32} style={{ color: 'var(--text-muted)' }} />
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>选择一个压缩包查看</p>
                </div>
              )}
            </>
          )}

          {view === 'create' && (
            <div className="flex-1 overflow-y-auto p-3">
              <div className="max-w-md">
                <div className="mb-3">
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>压缩包名称</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="my-archive"
                    className="w-full px-3 py-1.5 rounded-lg text-xs outline-none"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.06)' }}
                  />
                </div>

                <div className="mb-3">
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>格式</label>
                  <div className="flex gap-1.5">
                    {(['zip', 'tar', '7z'] as ArchiveFormat[]).map(f => (
                      <button
                        key={f}
                        onClick={() => setFormat(f)}
                        className={`px-3 py-1 rounded text-xs uppercase transition-colors ${
                          format === f ? 'text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                        }`}
                        style={format === f ? { background: 'var(--accent-dark-gray)' } : { background: 'var(--bg-input)' }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>压缩级别</label>
                  <select
                    value={compression}
                    onChange={e => setCompression(e.target.value as CompressionLevel)}
                    className="w-full px-3 py-1.5 rounded-lg text-xs outline-none"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.06)' }}
                  >
                    <option value="none">无 (仅存储)</option>
                    <option value="fast">快速</option>
                    <option value="normal">标准</option>
                    <option value="best">最佳</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={passwordProtect}
                      onChange={e => setPasswordProtect(e.target.checked)}
                      className="w-3 h-3 accent-[var(--accent-silver)]"
                    />
                    <Lock size={12} style={{ color: 'var(--text-secondary)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>密码保护</span>
                  </label>
                  {passwordProtect && (
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="输入密码"
                      className="w-full mt-1 px-3 py-1.5 rounded-lg text-xs outline-none"
                      style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.06)' }}
                    />
                  )}
                </div>

                <div className="mb-3">
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>选择文件</label>
                  <div className="rounded-lg p-2 max-h-40 overflow-y-auto" style={{ background: 'var(--bg-input)', border: '1px solid rgba(0,0,0,0.06)' }}>
                    {userChildren.map(child => (
                      <label key={child.id} className="flex items-center gap-2 py-0.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(child.id)}
                          onChange={() => toggleFile(child.id)}
                          className="w-3 h-3 accent-[var(--accent-silver)]"
                        />
                        {child.type === 'directory' ? (
                          <FolderOpen size={12} style={{ color: 'var(--accent-silver)' }} />
                        ) : (
                          <File size={12} style={{ color: 'var(--text-muted)' }} />
                        )}
                        <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{child.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {isCreating && (
                  <div className="mb-3">
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progress}%`, background: progress >= 100 ? '#4ade80' : 'var(--accent-silver)' }}
                      />
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                      {progress >= 100 ? '完成!' : '正在创建压缩包...'}
                    </p>
                  </div>
                )}

                <button
                  onClick={createArchive}
                  disabled={!newName.trim() || selectedFiles.size === 0 || isCreating}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                  style={{ background: 'var(--accent-dark-gray)' }}
                >
                  {isCreating ? <Loader2 size={12} className="animate-spin" /> : <PackagePlus size={12} />}
                  创建压缩包
                </button>
              </div>
            </div>
          )}

          {view === 'extract' && (
            <div className="flex-1 flex flex-col items-center justify-center p-3">
              <ArchiveIcon size={32} style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>选择一个压缩包解压</p>
              {selectedArch && (
                <div className="mt-3 text-center">
                  <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{selectedArch.name}</p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    {selectedArch.entries.length} item(s) | {selectedArch.format.toUpperCase()}
                  </p>
                  <button
                    className="mt-3 flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white"
                    style={{ background: 'var(--accent-dark-gray)' }}
                  >
                    <PackageOpen size={12} />
                    解压到 /home/user/Downloads
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
