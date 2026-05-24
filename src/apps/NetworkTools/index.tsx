import { useState, useCallback, useEffect, useRef } from 'react';
import { Wifi, WifiOff, Globe, Server, Shield, Activity, Loader2, Copy, CheckCircle, XCircle, Zap } from 'lucide-react';

type Tab = 'ping' | 'dns' | 'ports' | 'ipinfo';

const COMMON_PORTS = [
  { port: 21, service: 'FTP' },
  { port: 22, service: 'SSH' },
  { port: 23, service: 'Telnet' },
  { port: 25, service: 'SMTP' },
  { port: 53, service: 'DNS' },
  { port: 80, service: 'HTTP' },
  { port: 110, service: 'POP3' },
  { port: 143, service: 'IMAP' },
  { port: 443, service: 'HTTPS' },
  { port: 993, service: 'IMAPS' },
  { port: 995, service: 'POP3S' },
  { port: 3306, service: 'MySQL' },
  { port: 5432, service: 'PostgreSQL' },
  { port: 8080, service: 'HTTP Alt' },
];

interface PingResult {
  seq: number;
  time: number;
  status: 'success' | 'timeout';
}

interface DNSRecord {
  type: string;
  name: string;
  value: string;
  ttl: number;
}

interface PortResult {
  port: number;
  service: string;
  status: 'open' | 'closed' | 'filtered';
}

function simulatePing(host: string): PingResult[] {
  const results: PingResult[] = [];
  for (let i = 1; i <= 4; i++) {
    const timeout = Math.random() < 0.1;
    results.push({
      seq: i,
      time: timeout ? 0 : Math.floor(Math.random() * 80) + 5,
      status: timeout ? 'timeout' : 'success',
    });
  }
  return results;
}

function simulateDNS(domain: string): DNSRecord[] {
  const records: DNSRecord[] = [
    { type: 'A', name: domain, value: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, ttl: 300 },
    { type: 'A', name: domain, value: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, ttl: 300 },
    { type: 'MX', name: domain, value: `mail.${domain}`, ttl: 3600 },
    { type: 'CNAME', name: `www.${domain}`, value: domain, ttl: 300 },
    { type: 'NS', name: domain, value: `ns1.${domain}`, ttl: 86400 },
    { type: 'NS', name: domain, value: `ns2.${domain}`, ttl: 86400 },
  ];
  return records;
}

function simulatePortScan(host: string): PortResult[] {
  return COMMON_PORTS.map(p => ({
    port: p.port,
    service: p.service,
    status: (Math.random() < 0.4 ? 'open' : Math.random() < 0.7 ? 'closed' : 'filtered') as 'open' | 'closed' | 'filtered',
  }));
}

export default function NetworkTools({ windowId }: { windowId: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('ping');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const tabs: { id: Tab; label: string; icon: typeof Wifi }[] = [
    { id: 'ping', label: 'Ping', icon: Activity },
    { id: 'dns', label: 'DNS 查询', icon: Globe },
    { id: 'ports', label: '端口扫描', icon: Server },
    { id: 'ipinfo', label: 'IP 信息', icon: Shield },
  ];

  return (
    <div className="w-full h-full flex flex-col text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'var(--bg-window)' }}>
        <div className="flex items-center gap-2">
          <Wifi size={16} style={{ color: 'var(--accent-silver)' }} />
          <span className="font-medium text-[var(--text-primary)]">网络工具</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[10px] text-green-500">在线</span>
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-red-500" />
              <span className="text-[10px] text-red-500">离线</span>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 py-1 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'ping' && <PingTab />}
        {activeTab === 'dns' && <DNSTab />}
        {activeTab === 'ports' && <PortsTab />}
        {activeTab === 'ipinfo' && <IPInfoTab />}
      </div>
    </div>
  );
}

function PingTab() {
  const [host, setHost] = useState('');
  const [results, setResults] = useState<PingResult[]>([]);
  const [isPinging, setIsPinging] = useState(false);

  const startPing = useCallback(() => {
    if (!host.trim()) return;
    setIsPinging(true);
    setResults([]);
    setTimeout(() => {
      setResults(simulatePing(host));
      setIsPinging(false);
    }, 800 + Math.random() * 600);
  }, [host]);

  const successCount = results.filter(r => r.status === 'success').length;
  const avgTime = results.length > 0
    ? (results.filter(r => r.status === 'success').reduce((sum, r) => sum + r.time, 0) / successCount).toFixed(1)
    : '0';

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={host}
          onChange={e => setHost(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && startPing()}
          placeholder="输入主机 (例如 google.com)"
          className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none"
          style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.06)' }}
        />
        <button
          onClick={startPing}
          disabled={!host.trim() || isPinging}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
          style={{ background: 'var(--accent-dark-gray)' }}
        >
          {isPinging ? <Loader2 size={12} className="animate-spin" /> : <Activity size={12} />}
          Ping
        </button>
      </div>

      {results.length > 0 && (
        <div>
          <div className="flex items-center gap-4 mb-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span>发送: {results.length}</span>
            <span>接收: {successCount}</span>
            <span>丢包: {((1 - successCount / results.length) * 100).toFixed(0)}%</span>
            <span>平均: {avgTime}ms</span>
          </div>
          <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-window)' }}>
            {results.map(r => (
              <div key={r.seq} className="flex items-center gap-3 px-3 py-1.5 border-b last:border-b-0" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
                {r.status === 'success' ? (
                  <CheckCircle size={12} style={{ color: '#4ade80' }} />
                ) : (
                  <XCircle size={12} style={{ color: '#f87171' }} />
                )}
                <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
                  来自 {host} 的回复: seq={r.seq}
                </span>
                <span className="ml-auto text-xs" style={{ color: r.status === 'success' ? 'var(--text-secondary)' : '#f87171' }}>
                  {r.status === 'success' ? `time=${r.time}ms` : '超时'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DNSTab() {
  const [domain, setDomain] = useState('');
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [isLooking, setIsLooking] = useState(false);

  const lookup = useCallback(() => {
    if (!domain.trim()) return;
    setIsLooking(true);
    setRecords([]);
    setTimeout(() => {
      setRecords(simulateDNS(domain));
      setIsLooking(false);
    }, 500 + Math.random() * 400);
  }, [domain]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={domain}
          onChange={e => setDomain(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && lookup()}
          placeholder="输入域名 (例如 example.com)"
          className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none"
          style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.06)' }}
        />
        <button
          onClick={lookup}
          disabled={!domain.trim() || isLooking}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
          style={{ background: 'var(--accent-dark-gray)' }}
        >
          {isLooking ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />}
          查询
        </button>
      </div>

      {records.length > 0 && (
        <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-window)' }}>
          <div className="grid grid-4 gap-2 px-3 py-1.5 text-[10px] font-medium border-b" style={{ gridTemplateColumns: '60px 1fr 1fr 60px', borderColor: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)' }}>
            <span>类型</span>
            <span>名称</span>
            <span>值</span>
            <span className="text-right">TTL</span>
          </div>
          {records.map((r, i) => (
            <div key={i} className="grid grid-4 gap-2 px-3 py-1.5 border-b last:border-b-0" style={{ gridTemplateColumns: '60px 1fr 1fr 60px', borderColor: 'rgba(0,0,0,0.04)' }}>
              <span className="text-xs font-mono" style={{ color: 'var(--accent-silver)' }}>{r.type}</span>
              <span className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>{r.name}</span>
              <span className="text-xs truncate font-mono" style={{ color: 'var(--text-secondary)' }}>{r.value}</span>
              <span className="text-xs text-right" style={{ color: 'var(--text-muted)' }}>{r.ttl}s</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PortsTab() {
  const [host, setHost] = useState('');
  const [results, setResults] = useState<PortResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  const startScan = useCallback(() => {
    if (!host.trim()) return;
    setIsScanning(true);
    setResults([]);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 100 / COMMON_PORTS.length;
      });
    }, 100);

    setTimeout(() => {
      setResults(simulatePortScan(host));
      setIsScanning(false);
      setProgress(100);
    }, 1500);
  }, [host]);

  const openPorts = results.filter(r => r.status === 'open').length;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={host}
          onChange={e => setHost(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && startScan()}
          placeholder="输入主机 (例如 192.168.1.1)"
          className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none"
          style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.06)' }}
        />
        <button
          onClick={startScan}
          disabled={!host.trim() || isScanning}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
          style={{ background: 'var(--accent-dark-gray)' }}
        >
          {isScanning ? <Loader2 size={12} className="animate-spin" /> : <Server size={12} />}
          扫描
        </button>
      </div>

      {isScanning && (
        <div className="mb-3">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, background: 'var(--accent-silver)' }}
            />
          </div>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>正在扫描端口...</p>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span>已扫描: {results.length}</span>
            <span className="text-green-500">开放: {openPorts}</span>
            <span>关闭/过滤: {results.length - openPorts}</span>
          </div>
          <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-window)' }}>
            {results.map(r => (
              <div key={r.port} className="flex items-center gap-3 px-3 py-1.5 border-b last:border-b-0" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
                <span className="text-xs font-mono w-10" style={{ color: 'var(--text-primary)' }}>{r.port}</span>
                <span className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>{r.service}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  r.status === 'open' ? 'bg-green-500/10 text-green-500' :
                  r.status === 'closed' ? 'bg-red-500/10 text-red-500' :
                  'bg-yellow-500/10 text-yellow-500'
                }`}>
                  {r.status === 'open' ? '开放' : r.status === 'closed' ? '关闭' : '过滤'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IPInfoTab() {
  const [speedTesting, setSpeedTesting] = useState(false);
  const [speedResult, setSpeedResult] = useState<{ download: number; upload: number } | null>(null);
  const [speedProgress, setSpeedProgress] = useState(0);

  const startSpeedTest = useCallback(() => {
    setSpeedTesting(true);
    setSpeedResult(null);
    setSpeedProgress(0);

    const interval = setInterval(() => {
      setSpeedProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    setTimeout(() => {
      setSpeedResult({
        download: Math.floor(Math.random() * 900) + 100,
        upload: Math.floor(Math.random() * 500) + 50,
      });
      setSpeedTesting(false);
    }, 2500);
  }, []);

  return (
    <div>
      <div className="rounded-lg p-3 mb-3" style={{ background: 'var(--bg-window)' }}>
        <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>连接信息</div>
        <div className="grid gap-2" style={{ gridTemplateColumns: '100px 1fr' }}>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>状态:</span>
          <span className="text-xs flex items-center gap-1" style={{ color: navigator.onLine ? '#4ade80' : '#f87171' }}>
            {navigator.onLine ? <Wifi size={10} /> : <WifiOff size={10} />}
            {navigator.onLine ? '已连接' : '已断开'}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>IP 地址:</span>
          <span className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>192.168.1.{Math.floor(Math.random() * 254) + 1}</span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>网关:</span>
          <span className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>192.168.1.1</span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>DNS:</span>
          <span className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>8.8.8.8, 8.8.4.4</span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>子网:</span>
          <span className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>255.255.255.0</span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>MAC:</span>
          <span className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>AA:BB:CC:DD:EE:FF</span>
        </div>
      </div>

      <div className="rounded-lg p-3" style={{ background: 'var(--bg-window)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>网速测试</span>
          <button
            onClick={startSpeedTest}
            disabled={speedTesting}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--accent-dark-gray)' }}
          >
            {speedTesting ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} />}
            {speedTesting ? '测试中...' : '开始测试'}
          </button>
        </div>

        {speedTesting && (
          <div className="mb-2">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${speedProgress}%`, background: 'var(--accent-silver)' }}
              />
            </div>
          </div>
        )}

        {speedResult && (
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 rounded" style={{ background: 'var(--bg-input)' }}>
              <div className="text-lg font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{speedResult.download}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Mbps 下载</div>
            </div>
            <div className="text-center p-2 rounded" style={{ background: 'var(--bg-input)' }}>
              <div className="text-lg font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{speedResult.upload}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Mbps 上传</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
