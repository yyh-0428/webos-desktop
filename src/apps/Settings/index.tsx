import { useState } from 'react';
import { Palette, Monitor, Wifi, Volume2, Users, Info, Languages } from 'lucide-react';
import { useI18n, localeNames } from '@/i18n';
import { useSettingsStore } from '@/stores/useSettingsStore';
import AppearanceTab from './AppearanceTab';
import DisplayTab from './DisplayTab';
import NetworkTab from './NetworkTab';
import SoundTab from './SoundTab';
import UsersTab from './UsersTab';
import AboutTab from './AboutTab';

interface SettingsProps {
  windowId: string;
}

export default function Settings({ windowId: _windowId }: SettingsProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('appearance');

  const tabs = [
    { id: 'appearance', name: t('settings.appearance'), icon: Palette },
    { id: 'language', name: t('settings.language'), icon: Languages },
    { id: 'display', name: t('settings.display'), icon: Monitor },
    { id: 'network', name: t('settings.network'), icon: Wifi },
    { id: 'sound', name: t('settings.sound'), icon: Volume2 },
    { id: 'users', name: t('settings.users'), icon: Users },
    { id: 'about', name: t('settings.about'), icon: Info },
  ];

  return (
    <div className="w-full h-full flex text-sm" style={{ background: 'var(--bg-workspace)' }}>
      {/* Sidebar */}
      <div className="w-48 shrink-0 py-2" style={{ background: 'var(--bg-window)', borderRight: '1px solid rgba(0,0,0,0.06)' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                activeTab === tab.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              }`}
              style={activeTab === tab.id ? { background: 'var(--bg-active)' } : {}}
            >
              <Icon size={18} />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'appearance' && <AppearanceTab />}
        {activeTab === 'language' && <LanguageTab />}
        {activeTab === 'display' && <DisplayTab />}
        {activeTab === 'network' && <NetworkTab />}
        {activeTab === 'sound' && <SoundTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'about' && <AboutTab />}
      </div>
    </div>
  );
}

function LanguageTab() {
  const { t, language } = useI18n();
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-[var(--text-primary)]">{t('settings.language')}</h3>
      <p className="text-xs text-[var(--text-muted)]">{t('settings.language')} — {t('common.changes')}</p>
      <div className="space-y-2">
        {(Object.entries(localeNames) as [string, string][]).map(([code, name]) => (
          <button
            key={code}
            onClick={() => setLanguage(code)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
              language === code ? 'ring-2 ring-[var(--accent-silver)]' : 'hover:bg-[var(--bg-hover)]'
            }`}
            style={{ background: 'var(--bg-window)' }}
          >
            <div className="flex items-center gap-3">
              <Languages size={18} className="text-[var(--accent-silver)]" />
              <span className="text-sm text-[var(--text-primary)]">{name}</span>
            </div>
            {language === code && (
              <span className="text-xs text-[var(--accent-silver)]">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
