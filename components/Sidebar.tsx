
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: '대시보드', icon: 'fa-chart-line' },
    { id: 'standards', label: '수립 기준 (DB)', icon: 'fa-book-bookmark' },
    { id: 'apartment-info', label: '단지 정보 관리', icon: 'fa-building-circle-check' },
    { id: 'plan', label: '수선계획 관리', icon: 'fa-calendar-check' },
    { id: 'history', label: '버전 관리', icon: 'fa-history' },
    { id: 'execution', label: '집행/이력 관리', icon: 'fa-file-invoice-dollar' },
    { id: 'report', label: '검토서/보고서', icon: 'fa-file-pdf' },
    { id: 'settings', label: '시스템 설정', icon: 'fa-gear' },
  ];

  return (
    <div className="w-64 bg-slate-900 h-screen text-slate-300 flex flex-col fixed left-0 top-0 z-50 print:hidden">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-inner">
          <i className="fas fa-building text-xl"></i>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">수선계획 Pro</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeTab === item.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <i className={`fas ${item.icon} w-5 text-center transition-colors ${
               activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'
            }`}></i>
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-slate-800 space-y-3">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-900/20 text-slate-400 hover:text-red-400 transition-all text-xs font-black"
        >
          <i className="fas fa-arrow-right-from-bracket"></i>
          로그아웃
        </button>
        <div className="bg-slate-800/50 rounded-xl p-4 text-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-slate-400">데이터 실시간 동기화 중</p>
          </div>
          <p className="text-slate-500 mt-2 italic font-mono uppercase opacity-50">Apartment Pro v1.5.0</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
