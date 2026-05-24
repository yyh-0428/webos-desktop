import { useState } from 'react';
import { Folder, File, ArrowLeft, ArrowUp, RefreshCw, Plus, Trash2, Edit, Copy, Scissors, Info, Grid, List as ListIcon, Search } from 'lucide-react';
import { useFileSystemStore, type FSNode } from '@/stores/useFileSystemStore';
import { useWindowStore } from '@/stores/useWindowStore';
import { useAppRegistryStore } from '@/stores/useAppRegistryStore';
import FileToolbar from './FileToolbar';
import PathBar from './PathBar';
import FileList from './FileList';

interface FileManagerProps {
  windowId: string;
}

export default function FileManager({ windowId }: FileManagerProps) {
  const nodes = useFileSystemStore((s) => s.nodes);
  const currentDirectory = useFileSystemStore((s) => s.currentDirectory);
  const setCurrentDirectory = useFileSystemStore((s) => s.setCurrentDirectory);
  const getChildren = useFileSystemStore((s) => s.getChildren);
  const getNode = useFileSystemStore((s) => s.getNode);
  const getPath = useFileSystemStore((s) => s.getPath);
  const deleteNode = useFileSystemStore((s) => s.deleteNode);
  const renameNode = useFileSystemStore((s) => s.renameNode);
  const createDirectory = useFileSystemStore((s) => s.createDirectory);
  const createFile = useFileSystemStore((s) => s.createFile);
  const copyToClipboard = useFileSystemStore((s) => s.copyToClipboard);
  const pasteFromClipboard = useFileSystemStore((s) => s.pasteFromClipboard);
  const clipboard = useFileSystemStore((s) => s.clipboard);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProperties, setShowProperties] = useState<FSNode | null>(null);
  const [navHistory, setNavHistory] = useState<string[]>(['fs-user']);
  const [historyPos, setHistoryPos] = useState(0);

  const children = getChildren(currentDirectory).filter(
    (c) => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navigateTo = (nodeId: string) => {
    setCurrentDirectory(nodeId);
    setSelectedNode(null);
    const newHistory = navHistory.slice(0, historyPos + 1);
    newHistory.push(nodeId);
    setNavHistory(newHistory);
    setHistoryPos(newHistory.length - 1);
  };

  const goBack = () => {
    if (historyPos > 0) {
      const newPos = historyPos - 1;
      setHistoryPos(newPos);
      setCurrentDirectory(navHistory[newPos]);
      setSelectedNode(null);
    }
  };

  const goUp = () => {
    const node = getNode(currentDirectory);
    if (node?.parentId) {
      navigateTo(node.parentId);
    }
  };

  const handleDoubleClick = (node: FSNode) => {
    if (node.type === 'directory') {
      navigateTo(node.id);
    } else {
      // Open file with appropriate app based on mime type / extension
      const ext = node.name.split('.').pop()?.toLowerCase() || '';
      const winStore = useWindowStore.getState();
      const registry = useAppRegistryStore.getState();

      // Text files → Text Editor
      if (['txt', 'md', 'js', 'ts', 'tsx', 'jsx', 'json', 'html', 'css', 'py', 'c', 'cpp', 'h', 'java', 'sh', 'log'].includes(ext)) {
        const app = registry.getApp('texteditor');
        if (app) {
          winStore.openWindow('texteditor', node.name, {
            width: app.defaultWidth,
            height: app.defaultHeight,
          });
          // Pass file content to editor via a global pending-open mechanism
          setTimeout(() => {
            const pending = (window as any).__pendingFileOpen;
            if (pending && pending.fileId === node.id) return; // already handled
            (window as any).__pendingFileOpen = { appId: 'texteditor', fileId: node.id, fileName: node.name };
          }, 100);
        }
      }
      // Archives → Archive Manager
      else if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) {
        const app = registry.getApp('archiver');
        if (app) {
          winStore.openWindow('archiver', node.name, {
            width: app.defaultWidth,
            height: app.defaultHeight,
          });
        }
      }
      // Other files: show info toast via window alert
      else {
        alert(`文件: ${node.name}\n类型: ${node.mimeType || '未知'}\n大小: ${node.size} 字节\n\n没有可打开此文件类型的应用。`);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent, node?: FSNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
    if (node) setSelectedNode(node.id);
  };

  const handleRename = () => {
    if (!selectedNode) return;
    const node = getNode(selectedNode);
    if (!node) return;
    setRenaming(selectedNode);
    setRenameValue(node.name);
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (!selectedNode) return;
    deleteNode(selectedNode);
    setSelectedNode(null);
    setContextMenu(null);
  };

  const handleCreateFolder = () => {
    const name = `新建文件夹 ${children.filter((c) => c.type === 'directory' && c.name.startsWith('新建文件夹')).length + 1}`;
    createDirectory(name, currentDirectory);
    setContextMenu(null);
  };

  const handleCreateFile = () => {
    const name = `新建文件 ${children.filter((c) => c.type === 'file' && c.name.startsWith('新建文件')).length + 1}.txt`;
    createFile(name, currentDirectory, '');
    setContextMenu(null);
  };

  const handleCopy = () => {
    if (!selectedNode) return;
    copyToClipboard(selectedNode, 'copy');
    setContextMenu(null);
  };

  const handleCut = () => {
    if (!selectedNode) return;
    copyToClipboard(selectedNode, 'cut');
    setContextMenu(null);
  };

  const handlePaste = () => {
    pasteFromClipboard(currentDirectory);
    setContextMenu(null);
  };

  const handleRenameSubmit = () => {
    if (renaming && renameValue.trim()) {
      renameNode(renaming, renameValue.trim());
    }
    setRenaming(null);
    setRenameValue('');
  };

  const handleRefresh = () => {
    // Force re-render
    setSelectedNode(null);
  };

  return (
    <div className="w-full h-full flex flex-col text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'var(--bg-window)' }}>
        <button onClick={goBack} className="p-1.5 rounded hover:bg-[var(--bg-hover)] transition-colors" title="返回">
          <ArrowLeft size={16} className="text-[var(--text-secondary)]" />
        </button>
        <button onClick={goUp} className="p-1.5 rounded hover:bg-[var(--bg-hover)] transition-colors" title="上级目录">
          <ArrowUp size={16} className="text-[var(--text-secondary)]" />
        </button>
        <button onClick={handleRefresh} className="p-1.5 rounded hover:bg-[var(--bg-hover)] transition-colors" title="刷新">
          <RefreshCw size={16} className="text-[var(--text-secondary)]" />
        </button>
        <div className="w-px h-5 mx-1" style={{ background: 'rgba(0,0,0,0.06)' }} />
        <button onClick={handleCreateFolder} className="p-1.5 rounded hover:bg-[var(--bg-hover)] transition-colors" title="新建文件夹">
          <Plus size={16} className="text-[var(--text-secondary)]" />
        </button>
        <button onClick={() => { if (selectedNode) handleDelete(); }} className={`p-1.5 rounded transition-colors ${selectedNode ? 'hover:bg-[var(--bg-hover)]' : 'opacity-30'}`} title="删除">
          <Trash2 size={16} className="text-[var(--text-secondary)]" />
        </button>
        <div className="flex-1 mx-2">
          <PathBar path={getPath(currentDirectory)} onNavigate={(id) => id && navigateTo(id)} />
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索..."
            className="w-40 h-7 pl-7 pr-2 rounded text-xs outline-none"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.06)' }}
          />
        </div>
        <div className="flex items-center ml-1 rounded overflow-hidden" style={{ background: 'var(--bg-input)' }}>
          <button onClick={() => setViewMode('list')} className={`p-1.5 ${viewMode === 'list' ? 'bg-[var(--bg-active)]' : ''}`}>
            <ListIcon size={16} className="text-[var(--text-secondary)]" />
          </button>
          <button onClick={() => setViewMode('grid')} className={`p-1.5 ${viewMode === 'grid' ? 'bg-[var(--bg-active)]' : ''}`}>
            <Grid size={16} className="text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto" onContextMenu={(e) => handleContextMenu(e)} onClick={() => setSelectedNode(null)}>
        <FileList
          nodes={children}
          viewMode={viewMode}
          selectedNode={selectedNode}
          onSelect={setSelectedNode}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
          renaming={renaming}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
          onRenameSubmit={handleRenameSubmit}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 text-xs" style={{ background: 'var(--bg-window)', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <span className="text-[var(--text-muted)]">{children.length} 个项目</span>
        <span className="text-[var(--text-muted)]">{getPath(currentDirectory)}</span>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed rounded-lg py-1 z-[60] min-w-[160px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            background: 'var(--bg-panel)',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid rgba(0,0,0,0.10)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {selectedNode && (
            <>
              <button onClick={() => { const n = getNode(selectedNode); if (n) handleDoubleClick(n); setContextMenu(null); }}
                className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">打开</button>
              <div className="my-1 h-px" style={{ background: 'rgba(0,0,0,0.06)' }} />
              <button onClick={handleCopy}
                className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">复制</button>
              <button onClick={handleCut}
                className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">剪切</button>
              <button onClick={handlePaste}
                className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">粘贴</button>
              <div className="my-1 h-px" style={{ background: 'rgba(0,0,0,0.06)' }} />
              <button onClick={handleRename}
                className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">重命名</button>
              <button onClick={handleDelete}
                className="w-full text-left px-3 py-1.5 text-sm text-[var(--error)] hover:bg-[var(--bg-hover)] transition-colors">删除</button>
              <div className="my-1 h-px" style={{ background: 'rgba(0,0,0,0.06)' }} />
              <button onClick={() => { setShowProperties(getNode(selectedNode) || null); setContextMenu(null); }}
                className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">属性</button>
            </>
          )}
          {!selectedNode && (
            <>
              <button onClick={handleCreateFolder}
                className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">新建文件夹</button>
              <button onClick={handleCreateFile}
                className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">新建文档</button>
              <div className="my-1 h-px" style={{ background: 'rgba(0,0,0,0.06)' }} />
              <button onClick={handlePaste}
                className="w-full text-left px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">粘贴</button>
            </>
          )}
        </div>
      )}

      {/* Properties dialog */}
      {showProperties && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowProperties(null)}>
          <div className="w-80 rounded-xl p-4" style={{ background: 'var(--bg-panel)', boxShadow: 'var(--shadow-lg)', border: '1px solid rgba(0,0,0,0.10)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-3">{showProperties.name}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">类型</span><span>{showProperties.type === 'directory' ? '文件夹' : '文件'}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">大小</span><span>{showProperties.size || 0} 字节</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">权限</span><span>{showProperties.permissions}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">所有者</span><span>{showProperties.owner}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">创建时间</span><span>{showProperties.createdAt.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">修改时间</span><span>{showProperties.modifiedAt.toLocaleString()}</span></div>
            </div>
            <button onClick={() => setShowProperties(null)} className="w-full mt-4 py-2 rounded text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors" style={{ background: 'var(--bg-input)' }}>
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
