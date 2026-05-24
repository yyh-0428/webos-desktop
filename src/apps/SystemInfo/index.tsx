import { useState, useEffect } from 'react';
import {
  Monitor, Cpu, HardDrive, Globe, Clock, Shield, Server,
  MemoryStick, Wifi, Palette, Languages,
} from 'lucide-react';

interface SystemInfoProps { windowId: string }

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d} 天`);
  if (h > 0) parts.push(`${h} 小时`);
  if (m > 0) parts.push(`${m} 分钟`);
  parts.push(`${s} 秒`);
  return parts.join(', ');
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browser = '未知';
  let version = '';
  if (ua.includes('Firefox/')) { browser = 'Firefox'; version = ua.split('Firefox/')[1]?.split(' ')[0] || ''; }
  else if (ua.includes('Edg/')) { browser = 'Edge'; version = ua.split('Edg/')[1]?.split(' ')[0] || ''; }
  else if (ua.includes('Chrome/')) { browser = 'Chrome'; version = ua.split('Chrome/')[1]?.split(' ')[0] || ''; }
  else if (ua.includes('Safari/') && ua.includes('Version/')) { browser = 'Safari'; version = ua.split('Version/')[1]?.split(' ')[0] || ''; }
  return { browser, version };
}

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  items: [string, string][];
}

function InfoCard({ icon, title, items }: InfoCardProps) {
  return (
    <div className="rounded-lg p-4" style={{ background: 'var(--bg-window)', border: '1px solid var(--border-default)' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-input)' }}>
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      </div>
      <div className="grid gap-1.5">
        {items.map(([k, v]) => (
          <div key={k} className="flex justify-between text-xs">
            <span className="text-[var(--text-muted)]">{k}</span>
            <span className="text-[var(--text-primary)] font-mono text-right max-w-[60%] truncate">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SystemInfo({ windowId: _windowId }: SystemInfoProps) {
  const [uptime, setUptime] = useState(0);
  const startTime = useState(() => Date.now())[0];

  useEffect(() => {
    const iv = setInterval(() => setUptime(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [startTime]);

  const { browser, version } = getBrowserInfo();
  const nav = navigator;
  const scr = window.screen;
  const cores = nav.hardwareConcurrency || 4;
  const memoryGB = (nav as any).deviceMemory;
  const language = nav.language || 'en-US';
  const languages = nav.languages?.join(', ') || language;
  const platform = nav.platform || '未知';
  const pixelRatio = window.devicePixelRatio || 1;
  const colorDepth = scr.colorDepth || 24;
  const orientation = scr.orientation?.type || '未知';
  const maxTouch = nav.maxTouchPoints || 0;
  const isOnline = nav.onLine;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const utcOffset = new Date().getTimezoneOffset();
  const perf = typeof performance !== 'undefined' ? performance : null;

  const sections: InfoCardProps[] = [
    {
      icon: <Server size={16} className="text-blue-400" />,
      title: '操作系统',
      items: [
        ['名称', 'WebOS'],
        ['版本', '24.04 LTS'],
        ['内核', '6.5.0-web'],
        ['架构', platform.includes('Win') ? 'x86_64' : platform.includes('Mac') ? 'arm64' : 'x86_64'],
        ['桌面环境', 'WebOS Desktop Environment'],
        ['主机名', window.location.hostname || 'webos-desktop'],
        ['运行时间', formatUptime(uptime)],
      ],
    },
    {
      icon: <Cpu size={16} className="text-green-400" />,
      title: '硬件',
      items: [
        ['CPU', `虚拟 CPU (${cores} 核)`],
        ['平台', platform],
        ['设备内存', memoryGB ? `${memoryGB} GB` : '未知'],
        ['GPU', 'WebGL 2.0 Renderer'],
        ['显示器', `${scr.width} x ${scr.height}`],
        ['像素比', `${pixelRatio}x`],
        ['色深', `${colorDepth}-bit`],
        ['方向', orientation],
        ['触控点数', String(maxTouch)],
      ],
    },
    {
      icon: <MemoryStick size={16} className="text-purple-400" />,
      title: '内存与存储',
      items: [
        ['设备内存', memoryGB ? `${memoryGB} GB` : '未知'],
        ['JS 堆上限', perf && 'memory' in perf ? formatBytes((perf as any).memory.jsHeapSizeLimit) : 'N/A'],
        ['JS 堆已用', perf && 'memory' in perf ? formatBytes((perf as any).memory.usedJSHeapSize) : 'N/A'],
        ['JS 堆总量', perf && 'memory' in perf ? formatBytes((perf as any).memory.totalJSHeapSize) : 'N/A'],
        ['虚拟磁盘', '50 GB 总容量'],
        ['磁盘已用', '~12 GB'],
      ],
    },
    {
      icon: <Wifi size={16} className="text-cyan-400" />,
      title: '网络',
      items: [
        ['状态', isOnline ? '已连接' : '已断开'],
        ['主机名', window.location.hostname || 'localhost'],
        ['协议', window.location.protocol],
        ['来源', window.location.origin],
        ['浏览器', browser],
        ['连接类型', (nav as any).connection?.effectiveType || '未知'],
      ],
    },
    {
      icon: <Monitor size={16} className="text-orange-400" />,
      title: '显示器',
      items: [
        ['屏幕分辨率', `${scr.width} x ${scr.height}`],
        ['可用区域', `${scr.availWidth} x ${scr.availHeight}`],
        ['视口', `${window.innerWidth} x ${window.innerHeight}`],
        ['像素比', `${pixelRatio}x`],
        ['色深', `${colorDepth} bit`],
        ['方向', orientation],
        ['触控支持', maxTouch > 0 ? `是 (${maxTouch} 点)` : '否'],
      ],
    },
    {
      icon: <Globe size={16} className="text-teal-400" />,
      title: '浏览器',
      items: [
        ['浏览器', browser],
        ['版本', version],
        ['语言', language],
        ['所有语言', languages],
        ['Cookie', nav.cookieEnabled ? '已启用' : '已禁用'],
        ['请勿追踪', nav.doNotTrack || '未设置'],
        ['在线状态', isOnline ? '是' : '否'],
      ],
    },
    {
      icon: <Shield size={16} className="text-amber-400" />,
      title: '环境与安全',
      items: [
        ['时区', timezone],
        ['UTC 偏移', `UTC${utcOffset > 0 ? '-' : '+'}${Math.abs(utcOffset / 60)}`],
        ['日期', new Date().toLocaleDateString()],
        ['时间', new Date().toLocaleTimeString()],
        ['安全上下文', window.isSecureContext ? '是' : '否'],
        ['在线状态', isOnline ? '在线' : '离线'],
      ],
    },
  ];

  return (
    <div className="w-full h-full overflow-y-auto p-4" style={{ background: 'var(--bg-workspace)' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-silver)' }}>
          <Monitor size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">系统信息</h1>
          <p className="text-xs text-[var(--text-muted)]">WebOS 24.04 LTS - 硬件与软件详情</p>
        </div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {sections.map((s) => (
          <InfoCard key={s.title} icon={s.icon} title={s.title} items={s.items} />
        ))}
      </div>

      {/* Uptime counter */}
      <div className="mt-4 rounded-lg p-4 flex items-center justify-between" style={{ background: 'var(--bg-window)', border: '1px solid var(--border-default)' }}>
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-[var(--accent-silver)]" />
          <div>
            <span className="text-sm font-medium text-[var(--text-primary)]">系统运行时间</span>
            <p className="text-xs text-[var(--text-muted)]">自页面加载以来的时间</p>
          </div>
        </div>
        <span className="text-lg font-mono font-semibold text-[var(--text-primary)]">{formatUptime(uptime)}</span>
      </div>
    </div>
  );
}
