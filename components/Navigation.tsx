
import React from 'react';
import { AppTab } from '../types.ts';

interface NavigationProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: AppTab.HOME, label: 'หน้าแรก', icon: '🏠' },
    { id: AppTab.FUEL, label: 'น้ำมัน', icon: '⛽' },
    { id: AppTab.MAP, label: 'แผนที่', icon: '🧭' },
    { id: AppTab.HEALTH, label: 'แจ้งซ่อม', icon: '🛠️' },
    { id: AppTab.EMERGENCY, label: 'ฉุกเฉิน', icon: '🆘' },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-[1000] px-6 pointer-events-none">
      <nav className="glass pointer-events-auto flex items-center gap-1 px-3 py-2.5 rounded-[2.5rem] border border-white/10 shadow-2xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center justify-center h-12 px-4 rounded-[2rem] transition-all duration-300 ${
                isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              {isActive && <span className="ml-2 text-[11px] font-extrabold uppercase">{tab.label}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Navigation;
