import { useState, useCallback, useMemo } from 'react';
import { BookOpen, Search, ChevronRight, Home, Bookmark, BookmarkCheck, Hash } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
  bookmarked?: boolean;
}

interface Category {
  id: string;
  label: string;
  articles: Article[];
}

const CATEGORIES: Category[] = [
  {
    id: 'getting-started',
    label: '快速入门',
    articles: [
      {
        id: 'welcome',
        title: '欢迎使用 WebOS',
        content: `# 欢迎使用 WebOS

WebOS 是一个功能完整的基于网页的操作系统，运行在浏览器中。它提供了熟悉的桌面体验，包括窗口、应用程序和文件管理。

## 主要功能

- **桌面环境**: 完整的桌面，包含任务栏、系统托盘和窗口管理
- **文件系统**: 虚拟文件系统，用于存储和组织文件
- **应用程序**: 不断增长的内置应用集合
- **主题**: 可自定义外观，支持明暗模式
- **键盘快捷键**: 使用键盘快捷键高效导航

## 基本操作

- **双击** 桌面图标打开应用
- **右键点击** 桌面查看菜单选项
- 使用左上角的 **活动** 菜单查找所有应用
- 底部 **任务栏** 显示打开的窗口和系统信息`,
      },
      {
        id: 'first-steps',
        title: '初步使用',
        content: `# 初步使用

## 打开应用

有多种方式可以打开应用：

1. **桌面图标**: 双击桌面上的任意图标
2. **活动菜单**: 点击左上角的"活动"并搜索应用
3. **右键菜单**: 右键点击桌面查看快速启动选项

## 管理窗口

- **移动**: 拖动标题栏重新定位
- **调整大小**: 拖动边缘或角落
- **最小化**: 点击最小化按钮 (-)
- **最大化**: 点击最大化按钮 (□)
- **关闭**: 点击关闭按钮 (×)

## 使用文件管理器

文件管理器可以浏览、创建和管理文件：

- 使用侧边栏在文件夹间导航
- 使用工具栏创建新文件和文件夹
- 拖放文件进行移动
- 右键点击文件查看更多选项`,
      },
      {
        id: 'customization',
        title: '自定义桌面',
        content: `# 自定义桌面

## 更换壁纸

1. 右键点击桌面
2. 选择"更换背景"
3. 从内置壁纸中选择或上传自己的壁纸

## 调整设置

打开 **设置** 应用进行自定义：

- **外观**: 主题、强调色、字体大小
- **显示**: 分辨率、缩放
- **声音**: 音量级别
- **网络**: 连接设置
- **日期和时间**: 时区、格式

## 整理桌面图标

- 拖动图标重新排列
- 右键点击查看排序选项
- 创建文件夹归类相关项目`,
      },
    ],
  },
  {
    id: 'desktop',
    label: '桌面',
    articles: [
      {
        id: 'taskbar',
        title: '使用任务栏',
        content: `# 使用任务栏

任务栏位于屏幕底部，提供快速访问重要功能。

## 组件

- **活动按钮**: 打开应用启动器
- **固定应用**: 快速启动常用应用
- **打开的窗口**: 查看所有运行中的应用
- **系统托盘**: 时钟、音量、网络状态
- **显示桌面**: 最小化所有窗口

## 任务栏功能

- 点击已打开窗口的图标切换焦点
- 右键点击任务栏图标查看窗口管理选项
- 时钟显示当前时间和日期
- 点击时钟弹出日历`,
      },
      {
        id: 'workspaces',
        title: '工作区',
        content: `# 工作区

工作区通过提供多个虚拟桌面来帮助您组织工作。

## 使用工作区

- 每个工作区可以打开不同的窗口
- 在工作区之间切换以减少混乱
- 在工作区之间拖动窗口

## 技巧

- 一个工作区用于工作，另一个用于个人任务
- 将相关应用放在同一工作区
- 使用键盘快捷键快速切换`,
      },
      {
        id: 'notifications',
        title: '通知',
        content: `# 通知

WebOS 显示通知以让您了解重要事件。

## 通知类型

- **系统**: 更新、警告、错误
- **应用**: 来自运行中应用的消息
- **文件操作**: 复制、移动、删除确认

## 管理通知

- 点击通知执行操作
- 点击 X 按钮关闭通知
- 通知历史记录可在系统托盘中查看`,
      },
    ],
  },
  {
    id: 'applications',
    label: '应用程序',
    articles: [
      {
        id: 'file-manager',
        title: '文件管理器',
        content: `# 文件管理器

文件管理器是浏览和管理文件的主要工具。

## 功能

- **导航**: 侧边栏包含书签和文件夹树
- **视图**: 列表视图和网格视图
- **搜索**: 按名称或内容查找文件
- **操作**: 复制、移动、删除、重命名
- **预览**: 快速预览文件

## 键盘快捷键

- **Ctrl+C**: 复制选中文件
- **Ctrl+V**: 粘贴文件
- **Ctrl+X**: 剪切文件
- **Delete**: 移至回收站
- **F2**: 重命名选中文件
- **Ctrl+A**: 全选`,
      },
      {
        id: 'text-editor',
        title: '文本编辑器',
        content: `# 文本编辑器

一个简洁而强大的文本编辑器，用于编辑代码和文本文件。

## 功能

- **语法高亮**: 支持多种编程语言
- **行号**: 方便导航
- **查找和替换**: 搜索和替换文本
- **多标签页**: 同时打开多个文件
- **自动保存**: 自动保存您的工作

## 支持的语言

JavaScript, TypeScript, Python, HTML, CSS, JSON, Markdown 等多种语言。`,
      },
      {
        id: 'terminal',
        title: '终端',
        content: `# 终端

终端为高级用户提供命令行界面。

## 基本命令

- **ls**: 列出当前目录的文件
- **cd**: 切换目录
- **mkdir**: 创建新目录
- **touch**: 创建新文件
- **cat**: 显示文件内容
- **clear**: 清空终端屏幕
- **help**: 显示可用命令

## 技巧

- 使用 Tab 键自动补全命令
- 按上/下箭头键浏览命令历史
- 使用 Ctrl+C 取消正在运行的命令`,
      },
      {
        id: 'calculator',
        title: '计算器',
        content: `# 计算器

多功能计算器，支持标准和科学模式。

## 标准模式

基本算术运算：
- 加法 (+)、减法 (-)
- 乘法 (×)、除法 (÷)
- 百分比 (%)、平方根 (√)

## 科学模式

高级函数：
- 三角函数: sin, cos, tan
- 对数: log, ln
- 幂运算: x², xʸ
- 常数: π, e
- 阶乘: n!

## 键盘支持

所有数字键和运算符都支持键盘输入。`,
      },
    ],
  },
  {
    id: 'shortcuts',
    label: '键盘快捷键',
    articles: [
      {
        id: 'general-shortcuts',
        title: '通用快捷键',
        content: `# 通用键盘快捷键

## 窗口管理

| 快捷键 | 操作 |
|----------|--------|
| Alt+Tab | 切换窗口 |
| Alt+F4 | 关闭当前窗口 |
| Super | 打开活动 |
| Ctrl+Alt+T | 打开终端 |

## 系统

| 快捷键 | 操作 |
|----------|--------|
| Ctrl+Alt+Delete | 打开任务管理器 |
| PrtSc | 截图 |
| Alt+F2 | 运行命令 |

## 文本编辑

| 快捷键 | 操作 |
|----------|--------|
| Ctrl+C | 复制 |
| Ctrl+V | 粘贴 |
| Ctrl+X | 剪切 |
| Ctrl+Z | 撤销 |
| Ctrl+Y | 重做 |
| Ctrl+A | 全选 |
| Ctrl+S | 保存 |
| Ctrl+F | 查找 |`,
      },
      {
        id: 'navigation-shortcuts',
        title: '导航快捷键',
        content: `# 导航快捷键

## 文件管理器

| 快捷键 | 操作 |
|----------|--------|
| Ctrl+N | 新窗口 |
| Ctrl+T | 新标签页 |
| Ctrl+W | 关闭标签页 |
| Ctrl+H | 显示隐藏文件 |
| Backspace | 返回上级 |
| Alt+Up | 进入父文件夹 |

## 桌面

| 快捷键 | 操作 |
|----------|--------|
| Super+D | 显示桌面 |
| Super+L | 锁屏 |
| Ctrl+Alt+方向键 | 切换工作区 |`,
      },
    ],
  },
  {
    id: 'troubleshooting',
    label: '故障排除',
    articles: [
      {
        id: 'common-issues',
        title: '常见问题',
        content: `# 常见问题与解决方案

## 应用无法打开

1. 尝试刷新页面 (F5)
2. 清除浏览器缓存
3. 检查 JavaScript 是否已启用
4. 尝试使用其他浏览器

## 文件无法保存

1. 检查可用存储空间
2. 确保文件不是只读的
3. 尝试保存到其他位置

## 性能问题

1. 关闭未使用的应用
2. 减少打开的窗口数量
3. 清除浏览器缓存和 Cookie
4. 禁用浏览器扩展

## 显示问题

1. 尝试调整缩放级别 (Ctrl+/Ctrl-)
2. 在设置中重置显示设置
3. 将浏览器更新到最新版本`,
      },
      {
        id: 'data-recovery',
        title: '数据恢复',
        content: `# 数据恢复

## 恢复已删除的文件

从文件管理器删除的文件会被移至回收站：

1. 打开 **回收站** 应用
2. 找到要恢复的文件
3. 右键点击并选择"恢复"
4. 文件将被移回原始位置

## 清空回收站

要永久删除文件：

1. 打开回收站
2. 点击"清空回收站"
3. 确认操作

**警告**: 从回收站清空的文件无法恢复。

## 浏览器存储

WebOS 使用浏览器本地存储。要保护您的数据：

- 不要清除此网站的浏览器数据
- 使用备份工具备份重要文件
- 定期导出关键数据`,
      },
      {
        id: 'reset',
        title: '重置 WebOS',
        content: `# 重置 WebOS

## 软重置

如果 WebOS 行为异常：

1. 刷新页面 (F5)
2. 这将重启系统但保留您的数据

## 硬重置

要完全重置 WebOS：

1. 打开浏览器设置
2. 清除此网站的所有数据
3. 重新加载页面

**警告**: 这将删除所有文件和设置。

## 清理存储

要释放存储空间：

1. 清空回收站
2. 删除不必要的文件
3. 在设置中清除应用缓存`,
      },
    ],
  },
  {
    id: 'about',
    label: '关于',
    articles: [
      {
        id: 'about-webos',
        title: '关于 WebOS',
        content: `# 关于 WebOS

**版本**: 24.04 LTS

WebOS 是一个使用现代网页技术构建的开源网页操作系统。

## 技术栈

- **前端**: React, TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **图标**: Lucide React

## 功能

- 完整的桌面环境
- 虚拟文件系统
- 40+ 内置应用
- 窗口管理
- 主题自定义
- 键盘快捷键

## 致谢

使用现代网页技术构建，致力于打造完整的浏览器计算体验。`,
      },
      {
        id: 'license',
        title: '许可协议',
        content: `# 许可协议

WebOS 基于 MIT 许可证发布。

## MIT 许可证

Copyright (c) 2024 WebOS 贡献者

特此免费授予任何获得本软件及相关文档文件（以下简称"软件"）副本的人不受限制地处理本软件的权利，包括但不限于使用、复制、修改、合并、发布、分发、再许可和/或销售本软件副本的权利，以及允许向其提供本软件的人这样做，但须满足以下条件：

上述版权声明和本许可声明应包含在本软件的所有副本或重要部分中。

本软件按"原样"提供，不作任何明示或暗示的保证，包括但不限于对适销性、特定用途适用性和非侵权性的保证。`,
      },
    ],
  },
];

export default function Help({ windowId }: { windowId: string }) {
  const [selectedCategory, setSelectedCategory] = useState('getting-started');
  const [selectedArticle, setSelectedArticle] = useState('welcome');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [showBookmarks, setShowBookmarks] = useState(false);

  const toggleBookmark = useCallback((articleId: string) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(articleId)) next.delete(articleId); else next.add(articleId);
      return next;
    });
  }, []);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return CATEGORIES;
    const q = searchQuery.toLowerCase();
    return CATEGORIES.map(cat => ({
      ...cat,
      articles: cat.articles.filter(
        a => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)
      ),
    })).filter(cat => cat.articles.length > 0);
  }, [searchQuery]);

  const bookmarkedArticles = useMemo(() => {
    return CATEGORIES.flatMap(cat =>
      cat.articles.filter(a => bookmarks.has(a.id)).map(a => ({ ...a, category: cat.label }))
    );
  }, [bookmarks]);

  const currentArticle = useMemo(() => {
    for (const cat of CATEGORIES) {
      const article = cat.articles.find(a => a.id === selectedArticle);
      if (article) return article;
    }
    return null;
  }, [selectedArticle]);

  const currentCategory = CATEGORIES.find(c => c.id === selectedCategory);

  // Simple markdown renderer
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-bold mb-2 mt-4" style={{ color: 'var(--text-primary)' }}>{line.slice(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-base font-semibold mb-2 mt-3" style={{ color: 'var(--text-primary)' }}>{line.slice(3)}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-semibold mb-1 mt-2" style={{ color: 'var(--text-primary)' }}>{line.slice(4)}</h3>;
      if (line.startsWith('- **')) {
        const match = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)$/);
        if (match) return <div key={i} className="flex gap-2 ml-3 mb-0.5"><span className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{match[1]}:</span><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{match[2]}</span></div>;
      }
      if (line.startsWith('- ')) return <div key={i} className="ml-3 mb-0.5 text-xs flex gap-1" style={{ color: 'var(--text-secondary)' }}><span>-</span><span>{line.slice(2)}</span></div>;
      if (line.startsWith('| ')) {
        const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
        if (cells.every(c => c.match(/^[-]+$/))) return null;
        return (
          <div key={i} className="grid gap-2 text-xs mb-0.5" style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)`, color: 'var(--text-secondary)' }}>
            {cells.map((cell, j) => <span key={j} className="font-mono">{cell}</span>)}
          </div>
        );
      }
      if (line.match(/^\d+\. /)) return <div key={i} className="ml-3 mb-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>{line}</div>;
      if (line.trim() === '') return <div key={i} className="h-2" />;
      if (line.startsWith('**')) {
        const text = line.replace(/\*\*/g, '');
        return <p key={i} className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{text}</p>;
      }
      return <p key={i} className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{line}</p>;
    });
  };

  return (
    <div className="w-full h-full flex text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {/* Sidebar */}
      <div className="w-52 flex flex-col border-r" style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'var(--bg-window)' }}>
        {/* Search */}
        <div className="p-2 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: 'var(--bg-input)' }}>
            <Search size={12} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索文档..."
              className="flex-1 bg-transparent outline-none text-[11px]"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Bookmarks toggle */}
        <button
          onClick={() => setShowBookmarks(!showBookmarks)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] hover:bg-[var(--bg-hover)] transition-colors border-b"
          style={{ borderColor: 'rgba(0,0,0,0.06)', color: bookmarks.size > 0 ? 'var(--accent-silver)' : 'var(--text-muted)' }}
        >
          {showBookmarks ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
          书签 ({bookmarks.size})
        </button>

        {/* Category list */}
        <div className="flex-1 overflow-y-auto">
          {showBookmarks ? (
            bookmarkedArticles.length > 0 ? (
              bookmarkedArticles.map(article => (
                <button
                  key={article.id}
                  onClick={() => { setSelectedArticle(article.id); setShowBookmarks(false); }}
                  className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-1.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Bookmark size={10} style={{ color: 'var(--accent-silver)' }} />
                  {article.title}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>暂无书签</p>
            )
          ) : (
            filteredCategories.map(cat => (
              <div key={cat.id}>
                <button
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-3 py-1.5 text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                    selectedCategory === cat.id ? '' : 'hover:bg-[var(--bg-hover)]'
                  }`}
                  style={{
                    color: selectedCategory === cat.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: selectedCategory === cat.id ? 'rgba(125,139,150,0.1)' : 'transparent',
                  }}
                >
                  <ChevronRight size={10} className={`transition-transform ${selectedCategory === cat.id ? 'rotate-90' : ''}`} />
                  {cat.label}
                </button>
                {selectedCategory === cat.id && (
                  <div>
                    {cat.articles.map(article => (
                      <button
                        key={article.id}
                        onClick={() => setSelectedArticle(article.id)}
                        className="w-full text-left pl-8 pr-3 py-1 text-[11px] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-1.5"
                        style={{
                          color: selectedArticle === article.id ? 'var(--accent-silver)' : 'var(--text-muted)',
                          background: selectedArticle === article.id ? 'rgba(125,139,150,0.08)' : 'transparent',
                        }}
                      >
                        {bookmarks.has(article.id) && <Bookmark size={8} style={{ color: 'var(--accent-silver)' }} />}
                        {article.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b text-[10px]" style={{ borderColor: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)' }}>
          <Home size={10} />
          <ChevronRight size={8} />
          <span>{currentCategory?.label}</span>
          <ChevronRight size={8} />
          <span style={{ color: 'var(--text-secondary)' }}>{currentArticle?.title}</span>
          {currentArticle && (
            <button
              onClick={() => toggleBookmark(currentArticle.id)}
              className="ml-auto p-0.5 rounded hover:bg-[var(--bg-hover)]"
              style={{ color: bookmarks.has(currentArticle.id) ? 'var(--accent-silver)' : 'var(--text-muted)' }}
            >
              {bookmarks.has(currentArticle.id) ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
            </button>
          )}
        </div>

        {/* Article content */}
        <div className="flex-1 overflow-y-auto p-4">
          {currentArticle ? (
            <div className="max-w-2xl">
              {renderContent(currentArticle.content)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <BookOpen size={32} style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>选择一篇文章阅读</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
