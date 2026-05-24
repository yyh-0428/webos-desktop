import { useState, useMemo } from 'react';
import {
  Inbox, Send, FileText, Trash2, AlertTriangle, Search, Plus, Star, Reply,
  Forward, MoreHorizontal, Mail, MailOpen, Clock, Paperclip, ChevronLeft, X,
} from 'lucide-react';

interface Email {
  id: string;
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  starred: boolean;
  folder: string;
  hasAttachment: boolean;
}

const mockEmails: Email[] = [
  {
    id: '1', from: 'Alice Chen', fromEmail: 'alice.chen@techcorp.com', to: 'user@webos.dev',
    subject: 'Q4 Project Roadmap - Review Request', body: 'Hi,\n\nI\'ve attached the Q4 project roadmap for your review. Please take a look at the timeline and let me know if you have any concerns about the milestones we\'ve set.\n\nKey highlights:\n- Feature freeze by Oct 15\n- Beta release Nov 1\n- GA release Dec 1\n\nLooking forward to your feedback.\n\nBest,\nAlice',
    date: '2026-05-24T09:15:00', read: false, starred: true, folder: 'inbox', hasAttachment: true,
  },
  {
    id: '2', from: 'GitHub', fromEmail: 'notifications@github.com', to: 'user@webos.dev',
    subject: '[webos-desktop] Pull request #142: Add Maps application', body: 'You have a new pull request notification.\n\nPR #142: Add Maps application\nAuthor: @dev-mike\nBranch: feature/maps → main\n\nChanges:\n- Added canvas-based map rendering\n- Implemented zoom and pan controls\n- Added marker placement system\n\nPlease review when you get a chance.',
    date: '2026-05-24T08:30:00', read: false, starred: false, folder: 'inbox', hasAttachment: false,
  },
  {
    id: '3', from: 'David Park', fromEmail: 'david.park@design.io', to: 'user@webos.dev',
    subject: 'New UI mockups for the settings panel', body: 'Hey!\n\nI finished the new UI mockups for the settings panel redesign. The main changes include:\n\n1. Simplified navigation with icon-based tabs\n2. New color picker component\n3. Improved accessibility labels\n\nLet me know what you think. I can iterate on any section.\n\nCheers,\nDavid',
    date: '2026-05-23T16:45:00', read: true, starred: false, folder: 'inbox', hasAttachment: true,
  },
  {
    id: '4', from: 'AWS Notifications', fromEmail: 'no-reply@aws.amazon.com', to: 'user@webos.dev',
    subject: 'Your AWS billing statement is ready', body: 'Dear Customer,\n\nYour AWS billing statement for April 2026 is now available.\n\nTotal charges: $47.83\n\nServices breakdown:\n- EC2: $32.10\n- S3: $8.45\n- CloudFront: $7.28\n\nView your detailed statement in the AWS Console.\n\nThank you for using AWS.',
    date: '2026-05-23T10:00:00', read: true, starred: false, folder: 'inbox', hasAttachment: false,
  },
  {
    id: '5', from: 'Sarah Kim', fromEmail: 'sarah.kim@startup.co', to: 'user@webos.dev',
    subject: 'Coffee chat next week?', body: 'Hi there!\n\nIt\'s been a while since we caught up. Would you be free for coffee sometime next week? I\'d love to hear about what you\'re working on.\n\nI\'m free Tuesday afternoon or Thursday morning. Let me know if either works for you!\n\nBest,\nSarah',
    date: '2026-05-22T14:20:00', read: true, starred: true, folder: 'inbox', hasAttachment: false,
  },
  {
    id: '6', from: 'Newsletter', fromEmail: 'digest@technews.io', to: 'user@webos.dev',
    subject: 'Weekly Tech Digest: AI Breakthroughs, New Framework Releases', body: 'This Week in Tech\n\nAI & ML:\n- New language model achieves 95% on complex reasoning tasks\n- Open source AI toolkit gains 10k stars in a week\n\nWeb Development:\n- React 20 announced with built-in server components\n- Tailwind CSS v5 beta now available\n\nHardware:\n- Next-gen ARM chips show 40% performance improvement\n\nRead more at technews.io',
    date: '2026-05-22T08:00:00', read: false, starred: false, folder: 'inbox', hasAttachment: false,
  },
  {
    id: '7', from: 'Mike Johnson', fromEmail: 'mike.j@devteam.org', to: 'user@webos.dev',
    subject: 'Re: Sprint retrospective notes', body: 'Thanks for sharing the retrospective notes. I agree with the action items, especially around improving code review turnaround time.\n\nOne additional suggestion: maybe we should set up a dedicated Slack channel for quick PR reviews?\n\nLet\'s discuss in standup tomorrow.\n\nMike',
    date: '2026-05-21T17:30:00', read: true, starred: false, folder: 'inbox', hasAttachment: false,
  },
  {
    id: '8', from: 'Jira', fromEmail: 'notifications@atlassian.net', to: 'user@webos.dev',
    subject: '[WEBOS-89] Terminal command parsing issue', body: 'Issue WEBOS-89 has been assigned to you.\n\nSummary: Terminal command parsing fails with nested quotes\nPriority: Medium\nAssignee: You\nReporter: QA Team\n\nSteps to reproduce:\n1. Open terminal\n2. Type: echo "hello \'world\'"\n3. Observe incorrect parsing\n\nPlease investigate when you have a chance.',
    date: '2026-05-21T11:15:00', read: true, starred: false, folder: 'inbox', hasAttachment: false,
  },
  {
    id: '9', from: 'Emily Zhang', fromEmail: 'emily.z@university.edu', to: 'user@webos.dev',
    subject: 'Internship recommendation letter', body: 'Hi,\n\nI wanted to let you know that I\'ve submitted the recommendation letter for your internship application. I highlighted your contributions to the open source project and your strong technical skills.\n\nGood luck with the application! Let me know if you need anything else.\n\nBest regards,\nProf. Zhang',
    date: '2026-05-20T09:45:00', read: true, starred: true, folder: 'inbox', hasAttachment: true,
  },
  {
    id: '10', from: 'You', fromEmail: 'user@webos.dev', to: 'alice.chen@techcorp.com',
    subject: 'Re: Q4 Project Roadmap - Review Request', body: 'Hi Alice,\n\nThanks for putting this together. The timeline looks reasonable. I have a few suggestions:\n\n1. Can we move the beta release up by a week?\n2. We should allocate more time for the API integration testing\n3. The documentation phase seems tight - maybe start it earlier?\n\nHappy to discuss further.\n\nBest',
    date: '2026-05-24T09:45:00', read: true, starred: false, folder: 'sent', hasAttachment: false,
  },
  {
    id: '11', from: 'You', fromEmail: 'user@webos.dev', to: 'team@devteam.org',
    subject: 'Sprint 23 planning agenda', body: 'Hi team,\n\nHere\'s the agenda for tomorrow\'s sprint planning:\n\n1. Review completed stories from Sprint 22\n2. Groom backlog items\n3. Estimate and assign new stories\n4. Identify blockers and dependencies\n\nPlease come prepared with your capacity estimates.\n\nThanks',
    date: '2026-05-22T15:00:00', read: true, starred: false, folder: 'sent', hasAttachment: false,
  },
  {
    id: '12', from: 'Draft', fromEmail: 'user@webos.dev', to: 'recruiter@bigtech.com',
    subject: 'Re: Senior Developer Position', body: 'Thank you for reaching out about the Senior Developer position. I\'m interested in learning more about the role and the team.\n\nI\'m available for a call next week...',
    date: '2026-05-23T20:00:00', read: true, starred: false, folder: 'drafts', hasAttachment: false,
  },
  {
    id: '13', from: 'SpamBot', fromEmail: 'offers@spammy.com', to: 'user@webos.dev',
    subject: 'You won a FREE laptop!!!', body: 'Congratulations! You have been selected to receive a brand new laptop absolutely FREE! Click here to claim your prize now!!!\n\nThis is definitely not a scam...',
    date: '2026-05-20T03:00:00', read: false, starred: false, folder: 'spam', hasAttachment: false,
  },
  {
    id: '14', from: 'You', fromEmail: 'user@webos.dev', to: 'sarah.kim@startup.co',
    subject: 'Re: Coffee chat next week?', body: 'Hi Sarah!\n\nThursday morning works perfectly for me. How about 10am at the usual place?\n\nLooking forward to catching up!',
    date: '2026-05-22T16:00:00', read: true, starred: false, folder: 'sent', hasAttachment: false,
  },
  {
    id: '15', from: 'Old Newsletter', fromEmail: 'weekly@oldnews.com', to: 'user@webos.dev',
    subject: 'Your weekly update from last month', body: 'Here is your weekly digest from last month. This email has been moved to trash.',
    date: '2026-04-15T08:00:00', read: true, starred: false, folder: 'trash', hasAttachment: false,
  },
];

const folders = [
  { id: 'inbox', name: '收件箱', icon: Inbox },
  { id: 'sent', name: '已发送', icon: Send },
  { id: 'drafts', name: '草稿箱', icon: FileText },
  { id: 'trash', name: '已删除', icon: Trash2 },
  { id: 'spam', name: '垃圾邮件', icon: AlertTriangle },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return '昨天';
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

export default function Email({ windowId: _windowId }: { windowId: string }) {
  const [emails, setEmails] = useState<Email[]>(mockEmails);
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [showMobileList, setShowMobileList] = useState(true);

  const filteredEmails = useMemo(() => {
    let result = emails.filter(e => e.folder === activeFolder);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.subject.toLowerCase().includes(q) ||
        e.from.toLowerCase().includes(q) ||
        e.body.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [emails, activeFolder, searchQuery]);

  const selectedEmail = emails.find(e => e.id === selectedEmailId);

  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    folders.forEach(f => {
      counts[f.id] = emails.filter(e => e.folder === f.id && !e.read).length;
    });
    return counts;
  }, [emails]);

  const toggleStar = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, starred: !e.starred } : e));
  };

  const markAsRead = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, read: true } : e));
  };

  const selectEmail = (id: string) => {
    setSelectedEmailId(id);
    markAsRead(id);
    setShowMobileList(false);
  };

  const deleteEmail = (id: string) => {
    setEmails(prev => prev.map(e => {
      if (e.id !== id) return e;
      if (e.folder === 'trash') return { ...e, folder: 'deleted' as string };
      return { ...e, folder: 'trash' };
    }));
    setSelectedEmailId(null);
    setShowMobileList(true);
  };

  const sendEmail = () => {
    if (!composeData.to || !composeData.subject) return;
    const newEmail: Email = {
      id: String(Date.now()),
      from: 'You',
      fromEmail: 'user@webos.dev',
      to: composeData.to,
      subject: composeData.subject,
      body: composeData.body,
      date: new Date().toISOString(),
      read: true,
      starred: false,
      folder: 'sent',
      hasAttachment: false,
    };
    setEmails(prev => [newEmail, ...prev]);
    setShowCompose(false);
    setComposeData({ to: '', subject: '', body: '' });
  };

  return (
    <div className="w-full h-full flex text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {/* Sidebar */}
      <div className="w-48 shrink-0 flex flex-col" style={{ background: 'var(--bg-window)', borderRight: '1px solid var(--border-default)' }}>
        <div className="p-3">
          <button
            onClick={() => { setShowCompose(true); setComposeData({ to: '', subject: '', body: '' }); }}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-medium text-white transition-colors"
            style={{ background: 'var(--accent-silver)' }}
          >
            <Plus size={14} /> 撰写
          </button>
        </div>
        <nav className="flex-1 px-1.5">
          {folders.map(folder => {
            const Icon = folder.icon;
            const isActive = activeFolder === folder.id;
            const count = unreadCounts[folder.id];
            return (
              <button
                key={folder.id}
                onClick={() => { setActiveFolder(folder.id); setSelectedEmailId(null); setShowMobileList(true); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors mb-0.5 ${
                  isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                }`}
                style={isActive ? { background: 'var(--bg-hover)' } : {}}
              >
                <Icon size={15} />
                <span className="flex-1 text-left">{folder.name}</span>
                {count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[var(--accent-silver)] text-white">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Email list */}
      <div className={`${showMobileList ? 'flex' : 'hidden md:flex'} flex-col w-72 shrink-0`} style={{ borderRight: '1px solid var(--border-default)' }}>
        {/* Search */}
        <div className="p-2">
          <div className="flex items-center h-8 rounded-lg px-2.5 gap-2" style={{ background: 'var(--bg-input)' }}>
            <Search size={13} className="text-[var(--text-muted)] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索邮件..."
              className="flex-1 bg-transparent outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>
        </div>

        {/* Email list */}
        <div className="flex-1 overflow-y-auto">
          {filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-[var(--text-muted)]">
              <Mail size={24} className="mb-2 opacity-40" />
              <span className="text-xs">没有邮件</span>
            </div>
          ) : (
            filteredEmails.map(email => (
              <button
                key={email.id}
                onClick={() => selectEmail(email.id)}
                className={`w-full text-left px-3 py-2.5 transition-colors ${
                  selectedEmailId === email.id ? '' : 'hover:bg-[var(--bg-hover)]'
                }`}
                style={selectedEmailId === email.id ? { background: 'var(--bg-hover)' } : {}}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <button
                    onClick={e => { e.stopPropagation(); toggleStar(email.id); }}
                    className={`shrink-0 transition-colors ${email.starred ? 'text-yellow-500' : 'text-[var(--text-muted)] hover:text-yellow-400'}`}
                  >
                    <Star size={12} fill={email.starred ? 'currentColor' : 'none'} />
                  </button>
                  <span className={`flex-1 truncate text-xs ${email.read ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)] font-semibold'}`}>
                    {email.from}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                    {formatDate(email.date)}
                  </span>
                </div>
                <div className={`text-xs truncate ${email.read ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)] font-medium'}`}>
                  {email.subject}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                  {email.body.split('\n')[0].slice(0, 60)}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Email detail / Compose */}
      <div className={`${!showMobileList ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0`}>
        {showCompose ? (
          /* Compose */
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 h-12 shrink-0" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <span className="text-sm font-medium text-[var(--text-primary)]">新邮件</span>
              <button onClick={() => setShowCompose(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <input
                type="text"
                value={composeData.to}
                onChange={e => setComposeData(p => ({ ...p, to: e.target.value }))}
                placeholder="收件人"
                className="w-full bg-transparent outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] py-1.5"
              />
            </div>
            <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <input
                type="text"
                value={composeData.subject}
                onChange={e => setComposeData(p => ({ ...p, subject: e.target.value }))}
                placeholder="主题"
                className="w-full bg-transparent outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] py-1.5"
              />
            </div>
            <textarea
              value={composeData.body}
              onChange={e => setComposeData(p => ({ ...p, body: e.target.value }))}
              placeholder="撰写邮件内容..."
              className="flex-1 bg-transparent outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] p-4 resize-none"
            />
            <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ borderTop: '1px solid var(--border-default)' }}>
              <button
                onClick={sendEmail}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                style={{ background: 'var(--accent-silver)' }}
              >
                <Send size={12} /> 发送
              </button>
              <button onClick={() => setShowCompose(false)}
                className="px-4 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                style={{ background: 'var(--bg-input)' }}>
                丢弃
              </button>
            </div>
          </div>
        ) : selectedEmail ? (
          /* Email detail */
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 px-4 h-10 shrink-0" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <button onClick={() => { setSelectedEmailId(null); setShowMobileList(true); }}
                className="md:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <ChevronLeft size={16} />
              </button>
              <div className="flex-1" />
              <button onClick={() => deleteEmail(selectedEmail.id)}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors">
                <Trash2 size={14} />
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors">
                <Reply size={14} />
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors">
                <Forward size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">{selectedEmail.subject}</h2>
              <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
                <div className="w-9 h-9 rounded-full bg-[var(--accent-silver)] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  {selectedEmail.from[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[var(--text-primary)]">{selectedEmail.from}</div>
                  <div className="text-[11px] text-[var(--text-muted)]">{selectedEmail.fromEmail}</div>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] shrink-0">
                  {new Date(selectedEmail.date).toLocaleString([], {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </div>
              <div className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                {selectedEmail.body}
              </div>
              {selectedEmail.hasAttachment && (
                <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border-default)' }}>
                  <div className="text-[11px] text-[var(--text-muted)] mb-2 flex items-center gap-1">
                    <Paperclip size={11} /> 1 个附件
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--text-secondary)]" style={{ background: 'var(--bg-input)' }}>
                    <FileText size={14} className="text-[var(--accent-silver)]" />
                    <span>document.pdf</span>
                    <span className="text-[10px] text-[var(--text-muted)]">245 KB</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)]">
            <MailOpen size={32} className="mb-3 opacity-30" />
            <span className="text-xs">选择一封邮件阅读</span>
          </div>
        )}
      </div>
    </div>
  );
}
