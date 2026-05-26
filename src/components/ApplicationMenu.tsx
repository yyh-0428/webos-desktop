import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useAppRegistryStore } from '@/stores/useAppRegistryStore';
import { useWindowStore } from '@/stores/useWindowStore';
import { useI18n } from '@/i18n';
import * as Icons from 'lucide-react';

interface ApplicationMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryOrder = ['Favorites', 'Accessories', 'Development', 'Internet', 'Office', 'Multimedia', 'Graphics', 'Games', 'System'];

const favorites = ['terminal', 'filemanager', 'browser', 'texteditor', 'settings', 'calculator', 'calendar', 'taskmanager'];

const categoryColors: Record<string, { bg: string; icon: string }> = {
  System: { bg: 'linear-gradient(135deg, #4a5568, #2d3748)', icon: '#e2e8f0' },
  Accessories: { bg: 'linear-gradient(135deg, #5a6acd, #4c51bf)', icon: '#e0e7ff' },
  Development: { bg: 'linear-gradient(135deg, #059669, #047857)', icon: '#d1fae5' },
  Internet: { bg: 'linear-gradient(135deg, #2563eb, #1d4ed8)', icon: '#dbeafe' },
  Office: { bg: 'linear-gradient(135deg, #d97706, #b45309)', icon: '#fef3c7' },
  Multimedia: { bg: 'linear-gradient(135deg, #dc2626, #b91c1c)', icon: '#fee2e2' },
  Graphics: { bg: 'linear-gradient(135deg, #7c3aed, #6d28d9)', icon: '#ede9fe' },
  Games: { bg: 'linear-gradient(135deg, #db2777, #be185d)', icon: '#fce7f3' },
  Favorites: { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', icon: '#fef3c7' },
};

export default function ApplicationMenu({ isOpen, onClose }: ApplicationMenuProps) {
  const { t } = useI18n();
  const apps = useAppRegistryStore((s) => s.apps);
  const openWindow = useWindowStore((s) => s.openWindow);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    if (!isOpen) { setSearch(''); setActiveCategory('All'); }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const categories = useAppRegistryStore.getState().getAllCategories();
  const sortedCategories = categoryOrder.filter((c) => categories.includes(c)).concat(categories.filter((c) => !categoryOrder.includes(c)));

  const allApps = Object.values(apps);

  const filteredApps = allApps.filter((app) => {
    const matchesSearch = !search || app.name.toLowerCase().includes(search.toLowerCase()) || app.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || app.category === activeCategory || (activeCategory === 'Favorites' && favorites.includes(app.id));
    return matchesSearch && matchesCategory;
  });

  const handleOpenApp = (appId: string) => {
    const app = apps[appId];
    if (!app) return;
    openWindow(appId, app.name, { width: app.defaultWidth, height: app.defaultHeight });
    onClose();
  };

  const displayedCategories = activeCategory === 'All' && !search
    ? (['Favorites'] as string[]).concat(sortedCategories.filter((c) => c !== 'Favorites'))
    : [activeCategory];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
          className="fixed inset-x-0 bottom-12 top-9 z-[45] flex flex-col items-center p-6 overflow-y-auto"
          style={{ background: 'rgba(30,30,30,0.98)', backdropFilter: 'blur(20px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          {/* Search */}
          <div className="w-full max-w-xl mb-6 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('menu.search')}
              autoFocus
              className="w-full h-10 pl-10 pr-10 rounded-lg text-sm text-white outline-none placeholder:text-white/40"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={16} className="text-white/50" />
              </button>
            )}
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {(['All'] as string[]).concat(sortedCategories).map((cat) => {
              const catKey = cat === 'All' ? 'menu.all' : cat === 'Favorites' ? 'menu.favorites' : `category.${cat.toLowerCase()}`;
              return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  activeCategory === cat ? 'text-white' : 'text-white/60 hover:bg-white/10'
                }`}
                style={activeCategory === cat ? { background: 'var(--accent-silver)' } : {}}
              >
                {t(catKey, cat)}
              </button>
              );
            })}
          </div>

          {/* App grid */}
          <div className="w-full max-w-5xl">
            {displayedCategories.map((category) => {
              const catApps = category === 'Favorites'
                ? allApps.filter((a) => favorites.includes(a.id))
                : filteredApps.filter((a) => a.category === category);
              if (catApps.length === 0) return null;

              return (
                <div key={category} className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3 px-2">{category === 'Favorites' ? t('menu.favorites') : category === 'All' ? t('menu.all') : t(`category.${category.toLowerCase()}`, category)}</h3>
                  <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                    {catApps.map((app, i) => {
                      const IconComp = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>>)[app.icon];
                      const catColor = categoryColors[category] || categoryColors.System;
                      return (
                        <motion.button
                          key={app.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.015 }}
                          onClick={() => handleOpenApp(app.id)}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-white/10 hover:scale-105 transition-all group"
                        >
                          <div className="w-14 h-14 flex items-center justify-center rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow" style={{ background: catColor.bg }}>
                            {IconComp ? <IconComp size={28} style={{ color: catColor.icon }} /> : <span className="text-2xl text-white">?</span>}
                          </div>
                          <span className="text-[11px] text-white text-center leading-tight max-w-full truncate">{app.name}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
