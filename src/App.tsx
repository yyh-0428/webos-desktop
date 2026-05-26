import { useState, useEffect } from 'react';
import { useSystemStore } from '@/stores/useSystemStore';
import { useWindowStore } from '@/stores/useWindowStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import WindowFrame from '@/components/WindowFrame';
import TopPanel from '@/components/TopPanel';
import BottomTaskbar from '@/components/BottomTaskbar';
import ApplicationMenu from '@/components/ApplicationMenu';
import Desktop from '@/components/Desktop';
import { renderApp } from '@/components/AppRegistry';

export default function App() {
  const windows = useWindowStore((s) => s.windows);
  const activeWorkspace = useSystemStore((s) => s.activeWorkspace);
  const [appMenuOpen, setAppMenuOpen] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);

  // Clock tick
  useEffect(() => {
    const interval = setInterval(() => {
      useSystemStore.getState().setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut: Super key opens app menu
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Meta') { e.preventDefault(); setAppMenuOpen((p) => !p); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Auto-hide fullscreen prompt when already fullscreen
  useEffect(() => {
    const handler = () => { if (document.fullscreenElement) setShowFullscreenPrompt(false); };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen().then(() => setShowFullscreenPrompt(false)).catch(() => setShowFullscreenPrompt(false));
  };

  // Dynamic CSS variables from settings
  const accentColor = useSettingsStore((s) => s.accentColor);
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-silver', accentColor);
    document.documentElement.style.setProperty('--text-accent', accentColor);
    document.documentElement.style.setProperty('--scrollbar-accent', accentColor);
    document.documentElement.style.setProperty('--border-active', accentColor);
  }, [accentColor]);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    } else {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    }
  }, [theme]);

  // Desktop phase
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Fullscreen prompt */}
      {showFullscreenPrompt && !document.fullscreenElement && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center cursor-pointer" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }} onClick={enterFullscreen}>
          <div className="text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #4a5568, #2d3748)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </div>
            <h2 className="text-2xl font-light text-white mb-3 tracking-wide">WebOS</h2>
            <p className="text-white/60 text-sm mb-6">点击任意位置进入全屏模式</p>
            <button onClick={(e) => { e.stopPropagation(); setShowFullscreenPrompt(false); }} className="text-white/40 text-xs hover:text-white/70 transition-colors">
              跳过，使用窗口模式
            </button>
          </div>
        </div>
      )}

      {/* Desktop */}
      <Desktop onOpenAppMenu={() => setAppMenuOpen(true)} />

      {/* Window Layer */}
      <div className="fixed inset-x-0 top-9 bottom-12 z-[10] overflow-hidden pointer-events-none">
        {windows
          .filter((w) => w.workspace === activeWorkspace && !w.isMinimized)
          .map((win) => (
            <div key={win.id} className="pointer-events-auto" style={{ position: 'absolute', inset: 0 }}>
              <WindowFrame windowId={win.id}>
                {renderApp(win.appId, win.id)}
              </WindowFrame>
            </div>
          ))}
      </div>

      {/* Top Panel */}
      <TopPanel onOpenAppMenu={() => setAppMenuOpen(!appMenuOpen)} />

      {/* Bottom Taskbar */}
      <BottomTaskbar onOpenAppMenu={() => setAppMenuOpen(!appMenuOpen)} />

      {/* Application Menu */}
      <ApplicationMenu isOpen={appMenuOpen} onClose={() => setAppMenuOpen(false)} />
    </div>
  );
}
