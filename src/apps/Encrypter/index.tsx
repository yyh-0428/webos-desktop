import { useState, useCallback } from 'react';
import { Lock, Unlock, Hash, Copy, Check, RotateCcw, ArrowRight } from 'lucide-react';

type Tab = 'encrypt' | 'decrypt' | 'hash';
type Method = 'base64' | 'rot13' | 'caesar' | 'xor';

// Real Base64 encode/decode
function base64Encode(text: string): string {
  try { return btoa(unescape(encodeURIComponent(text))); }
  catch { return '错误: 无效输入'; }
}
function base64Decode(text: string): string {
  try { return decodeURIComponent(escape(atob(text))); }
  catch { return '错误: 无效的 Base64'; }
}

// Real ROT13
function rot13(text: string): string {
  return text.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

// Real Caesar cipher
function caesarEncrypt(text: string, shift: number): string {
  return text.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + shift) % 26 + 26) % 26 + base);
  });
}
function caesarDecrypt(text: string, shift: number): string {
  return caesarEncrypt(text, -shift);
}

// XOR cipher
function xorCipher(text: string, key: string): string {
  if (!key) return text;
  return Array.from(text).map((c, i) =>
    String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join('');
}

// Simple hash functions (not cryptographic, simulated for demo)
function simpleHash(text: string, algorithm: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  const hexChars = '0123456789abcdef';
  const lengths: Record<string, number> = { md5: 32, 'sha-256': 64, 'sha-512': 128 };
  const len = lengths[algorithm] || 32;

  let result = '';
  let seed = Math.abs(hash);
  for (let i = 0; i < len; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    result += hexChars[seed % 16];
  }
  return result;
}

function formatOutput(text: string): string {
  // For XOR, output might have non-printable chars
  return Array.from(text).map(c => {
    const code = c.charCodeAt(0);
    if (code < 32 || code > 126) return `\\x${code.toString(16).padStart(2, '0')}`;
    return c;
  }).join('');
}

export default function Encrypter({ windowId }: { windowId: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('encrypt');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [method, setMethod] = useState<Method>('base64');
  const [key, setKey] = useState('');
  const [caesarShift, setCaesarShift] = useState(3);
  const [copied, setCopied] = useState(false);

  const process = useCallback(() => {
    if (!input) { setOutput(''); return; }

    if (activeTab === 'hash') {
      const md5 = simpleHash(input, 'md5');
      const sha256 = simpleHash(input, 'sha-256');
      const sha512 = simpleHash(input, 'sha-512');
      setOutput(`MD5:\n${md5}\n\nSHA-256:\n${sha256}\n\nSHA-512:\n${sha512}`);
      return;
    }

    const isEncrypt = activeTab === 'encrypt';
    let result = '';

    switch (method) {
      case 'base64':
        result = isEncrypt ? base64Encode(input) : base64Decode(input);
        break;
      case 'rot13':
        result = rot13(input); // ROT13 is its own inverse
        break;
      case 'caesar':
        result = isEncrypt ? caesarEncrypt(input, caesarShift) : caesarDecrypt(input, caesarShift);
        break;
      case 'xor':
        result = formatOutput(xorCipher(input, key));
        break;
    }

    setOutput(result);
  }, [input, method, key, caesarShift, activeTab]);

  const copyOutput = useCallback(() => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [output]);

  const clear = () => {
    setInput('');
    setOutput('');
    setKey('');
  };

  const tabs: { id: Tab; label: string; icon: typeof Lock }[] = [
    { id: 'encrypt', label: '加密', icon: Lock },
    { id: 'decrypt', label: '解密', icon: Unlock },
    { id: 'hash', label: '哈希', icon: Hash },
  ];

  const methods: { id: Method; label: string }[] = [
    { id: 'base64', label: 'Base64' },
    { id: 'rot13', label: 'ROT13' },
    { id: 'caesar', label: 'Caesar' },
    { id: 'xor', label: 'XOR' },
  ];

  return (
    <div className="w-full h-full flex flex-col text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 py-1 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'var(--bg-window)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setOutput(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
              activeTab === tab.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }`}
            style={activeTab === tab.id ? { background: 'rgba(125,139,150,0.15)' } : {}}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto">
        {/* Method selector (not for hash) */}
        {activeTab !== 'hash' && (
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>方法</label>
            <div className="flex gap-1.5">
              {methods.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setMethod(m.id); setOutput(''); }}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    method === m.id ? 'text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                  }`}
                  style={method === m.id ? { background: 'var(--accent-dark-gray)' } : { background: 'var(--bg-input)' }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Key input for Caesar/XOR */}
        {activeTab !== 'hash' && method === 'caesar' && (
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>偏移量: {caesarShift}</label>
            <input
              type="range"
              min="1"
              max="25"
              value={caesarShift}
              onChange={e => { setCaesarShift(parseInt(e.target.value)); setOutput(''); }}
              className="w-full accent-[var(--accent-silver)]"
            />
          </div>
        )}

        {activeTab !== 'hash' && method === 'xor' && (
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>密钥</label>
            <input
              type="text"
              value={key}
              onChange={e => { setKey(e.target.value); setOutput(''); }}
              placeholder="输入加密密钥"
              className="w-full px-3 py-1.5 rounded-lg text-xs outline-none"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.06)' }}
            />
          </div>
        )}

        {/* Input */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {activeTab === 'hash' ? '输入文本' : activeTab === 'encrypt' ? '明文' : '密文'}
            </label>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{input.length} 个字符</span>
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={activeTab === 'encrypt' ? '输入要加密的文本...' : activeTab === 'decrypt' ? '输入要解密的文本...' : '输入要计算哈希的文本...'}
            className="flex-1 min-h-[80px] px-3 py-2 rounded-lg text-xs outline-none resize-none font-mono"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.06)' }}
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={process}
            disabled={!input}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--accent-dark-gray)' }}
          >
            <ArrowRight size={12} />
            {activeTab === 'encrypt' ? '加密' : activeTab === 'decrypt' ? '解密' : '生成哈希'}
          </button>
          <button
            onClick={clear}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-input)' }}
          >
            <RotateCcw size={12} />
            清空
          </button>
        </div>

        {/* Output */}
        {output && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {activeTab === 'hash' ? '哈希输出' : activeTab === 'encrypt' ? '加密文本' : '解密文本'}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{output.length} 个字符</span>
                <button
                  onClick={copyOutput}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] hover:bg-[var(--bg-hover)]"
                  style={{ color: copied ? '#4ade80' : 'var(--accent-silver)' }}
                >
                  {copied ? <Check size={10} /> : <Copy size={10} />}
                  {copied ? '已复制!' : '复制'}
                </button>
              </div>
            </div>
            <textarea
              value={output}
              readOnly
              className="w-full min-h-[80px] px-3 py-2 rounded-lg text-xs outline-none resize-none font-mono"
              style={{ background: 'var(--bg-window)', color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.06)' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
