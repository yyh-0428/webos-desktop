import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send, Search, Phone, Video, MoreHorizontal, Smile, Paperclip, Image,
  Check, CheckCheck, Circle, ArrowLeft,
} from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

interface Contact {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
  avatar: string;
  color: string;
  messages: Message[];
}

const contacts: Contact[] = [
  {
    id: 'alice', name: 'Alice Chen', status: 'online', avatar: 'AC', color: '#E57373',
    messages: [
      { id: 'a1', senderId: 'alice', text: 'Hey! Have you tried the new terminal app?', timestamp: '2026-05-24T09:00:00', status: 'read' },
      { id: 'a2', senderId: 'me', text: 'Yes! The ANSI color support is really nice now', timestamp: '2026-05-24T09:02:00', status: 'read' },
      { id: 'a3', senderId: 'alice', text: 'Right? I love the tab completion too. Makes it so much faster to navigate', timestamp: '2026-05-24T09:03:00', status: 'read' },
      { id: 'a4', senderId: 'me', text: 'Agreed. Are you working on anything new?', timestamp: '2026-05-24T09:05:00', status: 'read' },
      { id: 'a5', senderId: 'alice', text: 'I\'m building a weather app! Should be done by end of day', timestamp: '2026-05-24T09:06:00', status: 'read' },
      { id: 'a6', senderId: 'me', text: 'That sounds awesome. Need any help?', timestamp: '2026-05-24T09:08:00', status: 'delivered' },
      { id: 'a7', senderId: 'alice', text: 'Maybe! I\'ll let you know if I get stuck on the forecast charts', timestamp: '2026-05-24T09:10:00', status: 'read' },
    ],
  },
  {
    id: 'bob', name: 'Bob Martinez', status: 'online', avatar: 'BM', color: '#64B5F6',
    messages: [
      { id: 'b1', senderId: 'bob', text: 'Did you see the PR I submitted for the file manager?', timestamp: '2026-05-24T08:30:00', status: 'read' },
      { id: 'b2', senderId: 'me', text: 'Not yet, let me take a look', timestamp: '2026-05-24T08:35:00', status: 'read' },
      { id: 'b3', senderId: 'bob', text: 'I added drag and drop support for file moving', timestamp: '2026-05-24T08:36:00', status: 'read' },
      { id: 'b4', senderId: 'bob', text: 'Also fixed the breadcrumb navigation bug', timestamp: '2026-05-24T08:36:30', status: 'read' },
      { id: 'b5', senderId: 'me', text: 'Nice! I\'ll review it this afternoon', timestamp: '2026-05-24T08:40:00', status: 'read' },
      { id: 'b6', senderId: 'bob', text: 'Thanks! No rush though, take your time', timestamp: '2026-05-24T08:41:00', status: 'read' },
    ],
  },
  {
    id: 'carol', name: 'Carol Wu', status: 'away', avatar: 'CW', color: '#81C784',
    messages: [
      { id: 'c1', senderId: 'carol', text: 'The design review meeting is at 3pm today', timestamp: '2026-05-23T14:00:00', status: 'read' },
      { id: 'c2', senderId: 'me', text: 'Got it, I\'ll be there. Is it in the usual Zoom room?', timestamp: '2026-05-23T14:05:00', status: 'read' },
      { id: 'c3', senderId: 'carol', text: 'Yes! I\'ll share the new mockups beforehand', timestamp: '2026-05-23T14:06:00', status: 'read' },
      { id: 'c4', senderId: 'me', text: 'Sounds good, looking forward to it', timestamp: '2026-05-23T14:10:00', status: 'read' },
      { id: 'c5', senderId: 'carol', text: 'Great! See you then', timestamp: '2026-05-23T14:11:00', status: 'read' },
    ],
  },
  {
    id: 'david', name: 'David Park', status: 'offline', lastSeen: '2 小时前', avatar: 'DP', color: '#FFB74D',
    messages: [
      { id: 'd1', senderId: 'me', text: 'Hey David, can you help me with the CSS for the map overlay?', timestamp: '2026-05-22T16:00:00', status: 'read' },
      { id: 'd2', senderId: 'david', text: 'Sure! What\'s the issue?', timestamp: '2026-05-22T16:15:00', status: 'read' },
      { id: 'd3', senderId: 'me', text: 'The mini-map keeps overflowing its container on smaller windows', timestamp: '2026-05-22T16:16:00', status: 'read' },
      { id: 'd4', senderId: 'david', text: 'Ah, try using position: absolute with overflow: hidden on the parent', timestamp: '2026-05-22T16:20:00', status: 'read' },
      { id: 'd5', senderId: 'me', text: 'That worked perfectly, thanks!', timestamp: '2026-05-22T16:25:00', status: 'read' },
      { id: 'd6', senderId: 'david', text: 'Happy to help! Let me know if you run into anything else', timestamp: '2026-05-22T16:26:00', status: 'read' },
    ],
  },
  {
    id: 'eva', name: 'Eva Liu', status: 'online', avatar: 'EL', color: '#BA68C8',
    messages: [
      { id: 'e1', senderId: 'eva', text: 'I just pushed the new icon set to the repo!', timestamp: '2026-05-24T10:00:00', status: 'read' },
      { id: 'e2', senderId: 'eva', text: '48 new icons for the desktop apps', timestamp: '2026-05-24T10:01:00', status: 'read' },
      { id: 'e3', senderId: 'me', text: 'Awesome! Are they SVG?', timestamp: '2026-05-24T10:05:00', status: 'read' },
      { id: 'e4', senderId: 'eva', text: 'Yes, all optimized SVGs with consistent 24x24 viewBox', timestamp: '2026-05-24T10:06:00', status: 'read' },
      { id: 'e5', senderId: 'eva', text: 'I also added dark mode variants for each icon', timestamp: '2026-05-24T10:07:00', status: 'read' },
      { id: 'e6', senderId: 'me', text: 'Perfect, that\'s exactly what we needed. I\'ll integrate them tonight', timestamp: '2026-05-24T10:10:00', status: 'delivered' },
      { id: 'e7', senderId: 'eva', text: 'Let me know if any icons are missing or need adjustments!', timestamp: '2026-05-24T10:12:00', status: 'read' },
      { id: 'e8', senderId: 'eva', text: 'Also, I started working on the animation library for the window transitions', timestamp: '2026-05-24T10:15:00', status: 'read' },
    ],
  },
  {
    id: 'frank', name: 'Frank Zhou', status: 'offline', lastSeen: '1 天前', avatar: 'FZ', color: '#4DB6AC',
    messages: [
      { id: 'f1', senderId: 'frank', text: 'Can someone help me debug the chess AI? It keeps crashing on castling moves', timestamp: '2026-05-21T11:00:00', status: 'read' },
      { id: 'f2', senderId: 'me', text: 'I can take a look. Can you share the error log?', timestamp: '2026-05-21T11:30:00', status: 'read' },
      { id: 'f3', senderId: 'frank', text: 'It\'s a null pointer when the rook hasn\'t moved but the king has. Edge case I missed', timestamp: '2026-05-21T11:35:00', status: 'read' },
      { id: 'f4', senderId: 'me', text: 'Ah yeah, you need to check the move history array bounds', timestamp: '2026-05-21T11:40:00', status: 'read' },
      { id: 'f5', senderId: 'frank', text: 'That fixed it! You\'re a lifesaver', timestamp: '2026-05-21T12:00:00', status: 'read' },
    ],
  },
];

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatLastMessage(messages: Message[]): { text: string; time: string } {
  if (messages.length === 0) return { text: '暂无消息', time: '' };
  const last = messages[messages.length - 1];
  const prefix = last.senderId === 'me' ? '我: ' : '';
  return {
    text: prefix + (last.text.length > 35 ? last.text.slice(0, 35) + '...' : last.text),
    time: formatTime(last.timestamp),
  };
}

export default function Chat({ windowId: _windowId }: { windowId: string }) {
  const [contactList, setContactList] = useState<Contact[]>(contacts);
  const [activeContactId, setActiveContactId] = useState<string | null>('alice');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typingContact, setTypingContact] = useState<string | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeContact = contactList.find(c => c.id === activeContactId);

  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contactList;
    const q = searchQuery.toLowerCase();
    return contactList.filter(c => c.name.toLowerCase().includes(q));
  }, [contactList, searchQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeContact?.messages.length, typingContact]);

  const sendMessage = () => {
    if (!messageInput.trim() || !activeContactId) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'me',
      text: messageInput.trim(),
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    setContactList(prev => prev.map(c =>
      c.id === activeContactId
        ? { ...c, messages: [...c.messages, newMessage] }
        : c
    ));
    setMessageInput('');
    inputRef.current?.focus();

    // Simulate delivery
    setTimeout(() => {
      setContactList(prev => prev.map(c =>
        c.id === activeContactId
          ? { ...c, messages: c.messages.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m) }
          : c
      ));
    }, 500);

    // Simulate typing and reply
    const contact = contactList.find(c => c.id === activeContactId);
    if (contact?.status === 'online') {
      setTimeout(() => setTypingContact(activeContactId), 1200);

      const replies = [
        '听起来不错！',
        '我明白你的意思。',
        '让我想想...',
        '好主意！',
        '我来研究一下。',
        '有道理。',
        '当然，我可以帮忙。',
        '有意思的方法！',
      ];
      const replyText = replies[Math.floor(Math.random() * replies.length)];

      setTimeout(() => {
        setTypingContact(null);
        const reply: Message = {
          id: `msg-${Date.now()}-reply`,
          senderId: activeContactId,
          text: replyText,
          timestamp: new Date().toISOString(),
          status: 'read',
        };
        setContactList(prev => prev.map(c =>
          c.id === activeContactId
            ? { ...c, messages: [...c.messages, reply] }
            : c
        ));
        // Mark our message as read
        setContactList(prev => prev.map(c =>
          c.id === activeContactId
            ? { ...c, messages: c.messages.map(m => m.id === newMessage.id ? { ...m, status: 'read' } : m) }
            : c
        ));
      }, 3000 + Math.random() * 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectContact = (id: string) => {
    setActiveContactId(id);
    setShowMobileChat(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const totalUnread = contactList.reduce((sum, c) => {
    const unread = c.messages.filter(m => m.senderId !== 'me' && m.status !== 'read').length;
    return sum + unread;
  }, 0);

  return (
    <div className="w-full h-full flex text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {/* Contact list sidebar */}
      <div className={`${showMobileChat ? 'hidden md:flex' : 'flex'} flex-col w-72 shrink-0`} style={{ borderRight: '1px solid var(--border-default)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 shrink-0" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">消息</h2>
            {totalUnread > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[var(--accent-silver)] text-white">
                {totalUnread}
              </span>
            )}
          </div>
          <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="p-2">
          <div className="flex items-center h-8 rounded-lg px-2.5 gap-2" style={{ background: 'var(--bg-input)' }}>
            <Search size={13} className="text-[var(--text-muted)] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索联系人..."
              className="flex-1 bg-transparent outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
          </div>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.map(contact => {
            const lastMsg = formatLastMessage(contact.messages);
            const isActive = activeContactId === contact.id;
            return (
              <button
                key={contact.id}
                onClick={() => selectContact(contact.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors ${
                  isActive ? '' : 'hover:bg-[var(--bg-hover)]'
                }`}
                style={isActive ? { background: 'var(--bg-hover)' } : {}}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                    style={{ background: contact.color }}
                  >
                    {contact.avatar}
                  </div>
                  {/* Status indicator */}
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${
                      contact.status === 'online' ? 'bg-green-500' :
                      contact.status === 'away' ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`}
                    style={{ borderColor: 'var(--bg-window)' }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium text-[var(--text-primary)] truncate">{contact.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)] shrink-0 ml-2">{lastMsg.time}</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] truncate">{lastMsg.text}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className={`${!showMobileChat ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0`}>
        {activeContact ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 h-12 shrink-0" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <button onClick={() => setShowMobileChat(false)}
                className="md:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <ArrowLeft size={16} />
              </button>
              <div className="relative">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
                  style={{ background: activeContact.color }}
                >
                  {activeContact.avatar}
                </div>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${
                    activeContact.status === 'online' ? 'bg-green-500' :
                    activeContact.status === 'away' ? 'bg-yellow-500' :
                    'bg-gray-400'
                  }`}
                  style={{ borderColor: 'var(--bg-window)' }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-[var(--text-primary)]">{activeContact.name}</div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  {activeContact.status === 'online' ? '在线' :
                   activeContact.status === 'away' ? '离开' :
                   activeContact.lastSeen ? `最后上线: ${activeContact.lastSeen}` : '离线'}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors">
                  <Phone size={14} />
                </button>
                <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors">
                  <Video size={14} />
                </button>
                <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors">
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {activeContact.messages.map((msg, i) => {
                const isMe = msg.senderId === 'me';
                const showAvatar = !isMe && (i === 0 || activeContact.messages[i - 1].senderId !== msg.senderId);
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <div className="w-6 shrink-0">
                        {showAvatar && (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-semibold"
                            style={{ background: activeContact.color }}
                          >
                            {activeContact.avatar}
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`max-w-[70%] ${isMe ? 'order-first' : ''}`}>
                      <div
                        className={`px-3 py-1.5 text-xs leading-relaxed ${
                          isMe
                            ? 'rounded-2xl rounded-br-sm text-white'
                            : 'rounded-2xl rounded-bl-sm text-[var(--text-primary)]'
                        }`}
                        style={isMe
                          ? { background: 'var(--accent-silver)' }
                          : { background: 'var(--bg-input)' }
                        }
                      >
                        {msg.text}
                      </div>
                      <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[9px] text-[var(--text-muted)]">{formatTime(msg.timestamp)}</span>
                        {isMe && (
                          msg.status === 'read' ? <CheckCheck size={10} className="text-blue-400" /> :
                          msg.status === 'delivered' ? <CheckCheck size={10} className="text-[var(--text-muted)]" /> :
                          <Check size={10} className="text-[var(--text-muted)]" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {typingContact === activeContactId && (
                <div className="flex items-end gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-semibold"
                    style={{ background: activeContact.color }}
                  >
                    {activeContact.avatar}
                  </div>
                  <div className="px-3 py-2 rounded-2xl rounded-bl-sm" style={{ background: 'var(--bg-input)' }}>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ borderTop: '1px solid var(--border-default)' }}>
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors">
                <Paperclip size={16} />
              </button>
              <div className="flex-1 flex items-center h-9 rounded-full px-3 gap-2" style={{ background: 'var(--bg-input)' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入消息..."
                  className="flex-1 bg-transparent outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
                <button className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                  <Smile size={16} />
                </button>
              </div>
              <button
                onClick={sendMessage}
                disabled={!messageInput.trim()}
                className="w-8 h-8 flex items-center justify-center rounded-full text-white transition-colors disabled:opacity-40"
                style={{ background: 'var(--accent-silver)' }}
              >
                <Send size={14} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)]">
            <Send size={32} className="mb-3 opacity-30" />
            <span className="text-xs">选择一个对话开始聊天</span>
          </div>
        )}
      </div>
    </div>
  );
}
