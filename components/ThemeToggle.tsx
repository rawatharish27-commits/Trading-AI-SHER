
import React, { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('sher_theme') as 'light' | 'dark' || 'dark';
    setTheme(saved);
    document.documentElement.classList.toggle('dark', saved === 'dark');
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('sher_theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return (
    <button 
      onClick={toggle}
      className="p-2 rounded-inst border border-border-light dark:border-border-dark bg-panel-light dark:bg-panel-dark text-text-secondary hover:text-sher-accent transition-colors"
      title="Switch Theme Protocol"
    >
      {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
};

export default ThemeToggle;
