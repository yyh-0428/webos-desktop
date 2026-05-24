import { useState, useMemo } from 'react';
import { Bold, Italic, Link, List, ListOrdered, Code, Quote, Heading1, Heading2, Heading3, Table, Eye, Edit3, Split } from 'lucide-react';

interface MarkdownViewerProps {
  windowId: string;
}

// Simple markdown-to-HTML converter
function markdownToHtml(md: string): string {
  let html = md;

  // Escape HTML entities (except what we'll generate)
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Code blocks (fenced) - must come before other processing
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="md-code-block" data-lang="${lang}"><code>${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');

  // Tables
  html = html.replace(/^(\|.+\|)\n(\|[-:| ]+\|)\n((?:\|.+\|\n?)*)/gm, (_, headerRow, separator, bodyRows) => {
    const headers = headerRow.split('|').filter((c: string) => c.trim());
    const rows = bodyRows.trim().split('\n').map((r: string) => r.split('|').filter((c: string) => c.trim()));
    let table = '<table class="md-table"><thead><tr>';
    headers.forEach((h: string) => { table += `<th>${h.trim()}</th>`; });
    table += '</tr></thead><tbody>';
    rows.forEach((row: string[]) => {
      table += '<tr>';
      row.forEach((cell: string) => { table += `<td>${cell.trim()}</td>`; });
      table += '</tr>';
    });
    table += '</tbody></table>';
    return table;
  });

  // Headings
  html = html.replace(/^######\s+(.+)$/gm, '<h6 class="md-h6">$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5 class="md-h5">$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4 class="md-h4">$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="md-h3">$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 class="md-h2">$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1 class="md-h1">$1</h1>');

  // Horizontal rules
  html = html.replace(/^---+$/gm, '<hr class="md-hr" />');
  html = html.replace(/^\*\*\*+$/gm, '<hr class="md-hr" />');

  // Blockquotes
  html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>');
  // Multi-line blockquotes
  html = html.replace(/(<blockquote class="md-blockquote">.*<\/blockquote>\n?<blockquote class="md-blockquote">)/g, (_, content) => {
    return content.replace(/<\/blockquote>\n?<blockquote class="md-blockquote">/g, '<br/>');
  });

  // Bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');
  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="md-link" href="$2" target="_blank">$1</a>');
  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img class="md-img" src="$2" alt="$1" />');

  // Unordered lists
  html = html.replace(/^[\s]*[-*+]\s+(.+)$/gm, '<li class="md-li">$1</li>');
  html = html.replace(/(<li class="md-li">.*<\/li>\n?)+/g, (match) => `<ul class="md-ul">${match}</ul>`);

  // Ordered lists
  html = html.replace(/^[\s]*\d+\.\s+(.+)$/gm, '<li class="md-oli">$1</li>');
  html = html.replace(/(<li class="md-oli">.*<\/li>\n?)+/g, (match) => `<ol class="md-ol">${match}</ol>`);

  // Task lists
  html = html.replace(/<li class="md-li">\[x\]\s*(.*?)<\/li>/g, '<li class="md-task"><input type="checkbox" checked disabled /> $1</li>');
  html = html.replace(/<li class="md-li">\[\s?\]\s*(.*?)<\/li>/g, '<li class="md-task"><input type="checkbox" disabled /> $1</li>');

  // Paragraphs: wrap remaining lines
  const lines = html.split('\n');
  const result: string[] = [];
  let inBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol') ||
        trimmed.startsWith('<li') || trimmed.startsWith('<pre') || trimmed.startsWith('<table') ||
        trimmed.startsWith('<blockquote') || trimmed.startsWith('<hr') || trimmed.startsWith('</') ||
        trimmed === '') {
      if (trimmed === '') {
        result.push('');
      } else {
        result.push(line);
      }
      inBlock = false;
    } else if (trimmed.startsWith('<')) {
      result.push(line);
    } else {
      result.push(`<p class="md-p">${line}</p>`);
    }
  }

  return result.join('\n');
}

export default function MarkdownViewer({ windowId: _windowId }: MarkdownViewerProps) {
  const [content, setContent] = useState(`# 欢迎使用 Markdown 编辑器

## 功能介绍

这是一个**实时预览**的 Markdown 编辑器。试试编辑这段文字吧！

### 文本格式

- **粗体文字** 使用双星号
- *斜体文字* 使用单星号
- ~~删除线~~ 使用双波浪号
- \`行内代码\` 使用反引号

### 列表

1. 第一个有序项
2. 第二个有序项
3. 第三个有序项

- 无序项
- 另一个项
  - 嵌套项

### 链接和图片

[访问 GitHub](https://github.com)

### 引用

> 这是一段引用。
> 它可以跨越多行。

### 代码

\`\`\`javascript
function hello(name) {
  console.log(\`Hello, \${name}!\`);
}
\`\`\`

### 表格

| 姓名 | 年龄 | 城市 |
|------|-----|------|
| 张三 | 30 | 北京 |
| 李四 | 25 | 上海 |
| 王五 | 35 | 广州 |

---

### 任务列表

- [x] 创建 Markdown 编辑器
- [x] 添加实时预览
- [ ] 添加更多功能
`);

  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');

  const html = useMemo(() => markdownToHtml(content), [content]);
  const wordCount = useMemo(() => content.trim().split(/\s+/).filter(Boolean).length, [content]);
  const lineCount = content.split('\n').length;
  const charCount = content.length;

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const ta = document.querySelector('.md-editor-textarea') as HTMLTextAreaElement;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.substring(start, end);
    const newContent = content.substring(0, start) + prefix + selected + suffix + content.substring(end);
    setContent(newContent);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  };

  return (
    <div className="w-full h-full flex flex-col text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {/* Markdown CSS */}
      <style>{`
        .md-content h1 { font-size: 1.5em; font-weight: 700; margin: 0.8em 0 0.4em; color: var(--text-primary); border-bottom: 1px solid var(--border-default); padding-bottom: 0.3em; }
        .md-content h2 { font-size: 1.3em; font-weight: 600; margin: 0.7em 0 0.35em; color: var(--text-primary); border-bottom: 1px solid var(--border-default); padding-bottom: 0.2em; }
        .md-content h3 { font-size: 1.15em; font-weight: 600; margin: 0.6em 0 0.3em; color: var(--text-primary); }
        .md-content h4, .md-content h5, .md-content h6 { font-size: 1em; font-weight: 600; margin: 0.5em 0 0.25em; color: var(--text-primary); }
        .md-content p { margin: 0.5em 0; line-height: 1.7; }
        .md-content strong { font-weight: 700; }
        .md-content em { font-style: italic; }
        .md-content a { color: var(--accent-silver); text-decoration: underline; }
        .md-content ul { list-style-type: disc; padding-left: 1.5em; margin: 0.5em 0; }
        .md-content ol { list-style-type: decimal; padding-left: 1.5em; margin: 0.5em 0; }
        .md-content li { margin: 0.2em 0; line-height: 1.6; }
        .md-content blockquote { border-left: 3px solid var(--accent-silver); padding-left: 1em; margin: 0.5em 0; color: var(--text-secondary); font-style: italic; }
        .md-content pre { background: var(--bg-input); border-radius: 6px; padding: 12px; margin: 0.5em 0; overflow-x: auto; }
        .md-content pre code { background: none; padding: 0; font-size: 0.85em; }
        .md-content code { background: var(--bg-input); padding: 2px 5px; border-radius: 3px; font-size: 0.9em; font-family: 'JetBrains Mono', monospace; }
        .md-content hr { border: none; border-top: 1px solid var(--border-default); margin: 1em 0; }
        .md-content img { max-width: 100%; border-radius: 6px; margin: 0.5em 0; }
        .md-content table { border-collapse: collapse; width: 100%; margin: 0.5em 0; }
        .md-content th, .md-content td { border: 1px solid var(--border-default); padding: 6px 12px; text-align: left; }
        .md-content th { background: var(--bg-input); font-weight: 600; }
        .md-content .md-task { list-style: none; }
        .md-content .md-task input { margin-right: 6px; }
      `}</style>

      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)' }}>
        <button onClick={() => insertMarkdown('# ')} className="p-1.5 rounded hover:bg-[var(--bg-hover)]" title="标题 1"><Heading1 size={14} className="text-[var(--text-secondary)]" /></button>
        <button onClick={() => insertMarkdown('## ')} className="p-1.5 rounded hover:bg-[var(--bg-hover)]" title="标题 2"><Heading2 size={14} className="text-[var(--text-secondary)]" /></button>
        <button onClick={() => insertMarkdown('### ')} className="p-1.5 rounded hover:bg-[var(--bg-hover)]" title="标题 3"><Heading3 size={14} className="text-[var(--text-secondary)]" /></button>
        <div className="w-px h-4 mx-1" style={{ background: 'var(--border-default)' }} />
        <button onClick={() => insertMarkdown('**', '**')} className="p-1.5 rounded hover:bg-[var(--bg-hover)]" title="粗体"><Bold size={14} className="text-[var(--text-secondary)]" /></button>
        <button onClick={() => insertMarkdown('*', '*')} className="p-1.5 rounded hover:bg-[var(--bg-hover)]" title="斜体"><Italic size={14} className="text-[var(--text-secondary)]" /></button>
        <button onClick={() => insertMarkdown('`', '`')} className="p-1.5 rounded hover:bg-[var(--bg-hover)]" title="代码"><Code size={14} className="text-[var(--text-secondary)]" /></button>
        <button onClick={() => insertMarkdown('[', '](url)')} className="p-1.5 rounded hover:bg-[var(--bg-hover)]" title="链接"><Link size={14} className="text-[var(--text-secondary)]" /></button>
        <div className="w-px h-4 mx-1" style={{ background: 'var(--border-default)' }} />
        <button onClick={() => insertMarkdown('- ')} className="p-1.5 rounded hover:bg-[var(--bg-hover)]" title="无序列表"><List size={14} className="text-[var(--text-secondary)]" /></button>
        <button onClick={() => insertMarkdown('1. ')} className="p-1.5 rounded hover:bg-[var(--bg-hover)]" title="有序列表"><ListOrdered size={14} className="text-[var(--text-secondary)]" /></button>
        <button onClick={() => insertMarkdown('> ')} className="p-1.5 rounded hover:bg-[var(--bg-hover)]" title="引用"><Quote size={14} className="text-[var(--text-secondary)]" /></button>
        <button onClick={() => insertMarkdown('\n```\n', '\n```\n')} className="p-1.5 rounded hover:bg-[var(--bg-hover)]" title="代码块"><Code size={14} className="text-[var(--text-secondary)]" /></button>
        <button onClick={() => insertMarkdown('\n| Col 1 | Col 2 | Col 3 |\n|-------|-------|-------|\n| ', ' |  |  |\n')} className="p-1.5 rounded hover:bg-[var(--bg-hover)]" title="表格"><Table size={14} className="text-[var(--text-secondary)]" /></button>
        <div className="flex-1" />
        <div className="flex items-center rounded overflow-hidden text-xs" style={{ border: '1px solid var(--border-default)' }}>
          <button onClick={() => setViewMode('edit')} className={`px-2 py-1 flex items-center gap-1 ${viewMode === 'edit' ? 'text-white' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`} style={viewMode === 'edit' ? { background: 'var(--accent-silver)' } : {}}>
            <Edit3 size={12} /> 编辑
          </button>
          <button onClick={() => setViewMode('split')} className={`px-2 py-1 flex items-center gap-1 ${viewMode === 'split' ? 'text-white' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`} style={viewMode === 'split' ? { background: 'var(--accent-silver)' } : {}}>
            <Split size={12} /> 分栏
          </button>
          <button onClick={() => setViewMode('preview')} className={`px-2 py-1 flex items-center gap-1 ${viewMode === 'preview' ? 'text-white' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`} style={viewMode === 'preview' ? { background: 'var(--accent-silver)' } : {}}>
            <Eye size={12} /> 预览
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`flex flex-col ${viewMode === 'split' ? 'w-1/2 border-r' : 'flex-1'}`} style={{ borderColor: 'var(--border-default)' }}>
            <textarea
              className="md-editor-textarea flex-1 p-4 outline-none resize-none font-mono text-sm leading-relaxed"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ background: 'var(--bg-workspace)', color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}
              spellCheck={false}
            />
          </div>
        )}

        {/* Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'flex-1'} overflow-auto`}>
            <div
              className="md-content p-6"
              style={{ color: 'var(--text-primary)' }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1 text-xs border-t" style={{ background: 'var(--bg-window)', borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-4">
          <span>{lineCount} 行</span>
          <span>{wordCount} 词</span>
          <span>{charCount} 字符</span>
        </div>
        <span>Markdown</span>
      </div>
    </div>
  );
}
