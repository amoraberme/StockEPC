import React from 'react';
import { Zap, History, Sliders, RefreshCw, BarChart3 } from 'lucide-react';
import { Button } from './ui/button';
import { UserProfile } from '../types';
import { MgSolarLogo } from './MgSolarLogo';

interface HeaderProps {
  activeTab: 'inventory' | 'analytics' | 'parser' | 'history' | 'json';
  setActiveTab: (tab: 'inventory' | 'analytics' | 'parser' | 'history' | 'json') => void;
  openPrdModal: () => void;
  lowStockCount: number;
  totalItemsCount: number;
  onResetDefaultData: () => void;
  currentUser: UserProfile;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openPrdModal,
  lowStockCount,
  totalItemsCount,
  onResetDefaultData,
  currentUser,
  onOpenProfile
}) => {
  return (
    <header id="app-header" className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-xs font-sans">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-white border border-zinc-200 rounded-xl shadow-xs">
              <MgSolarLogo size="sm" showText={false} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-black tracking-tight text-zinc-950 uppercase">
                  MG SOLAR <span className="text-zinc-500 font-medium text-xs font-mono ml-1">EPC Inventory</span>
                </h1>
              </div>
              <p className="text-[11px] text-zinc-500 hidden sm:block">
                Hardware & Balance of System (BOS) Stock Control Engine
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Desktop md+) */}
          <nav id="nav-tabs" className="hidden md:flex items-center space-x-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200/80">
            <button
              id="tab-inventory"
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Stock Control</span>
              <span className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono ${
                activeTab === 'inventory' ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-zinc-700'
              }`}>
                {totalItemsCount}
              </span>
            </button>

            <button
              id="tab-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics & Trends</span>
            </button>

            <button
              id="tab-history"
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Logs</span>
            </button>
          </nav>

          {/* Quick Actions & Profile */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {lowStockCount > 0 && (
              <button
                id="btn-low-stock-badge"
                onClick={() => setActiveTab('inventory')}
                className="hidden lg:flex items-center space-x-1 bg-zinc-900 text-white border border-black px-2.5 py-1 rounded-lg text-xs font-mono font-semibold"
              >
                <span>{lowStockCount} Low Stock</span>
              </button>
            )}

            <Button
              id="btn-open-profile"
              variant="outline"
              size="sm"
              onClick={onOpenProfile}
              className="flex items-center space-x-1.5 text-xs font-bold border-zinc-300 bg-zinc-50 hover:bg-zinc-100 h-8 px-2 sm:px-3"
            >
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 ${currentUser.avatarColor || 'bg-zinc-900'}`}>
                {currentUser.fullName.substring(0, 1)}
              </div>
              <span className="max-w-[70px] sm:max-w-[120px] truncate text-left">{currentUser.fullName}</span>
            </Button>

            <Button
              id="btn-reset-data"
              variant="ghost"
              size="icon"
              onClick={onResetDefaultData}
              title="Reset Sample Inventory Data"
              className="h-8 w-8 text-zinc-600 hover:text-black"
            >
              <RefreshCw className="w-4 h-4 text-zinc-600" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Bar (< md) */}
        <div className="md:hidden py-1.5 border-t border-zinc-100 overflow-x-auto no-scrollbar flex items-center space-x-1.5">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-black text-white shadow-2xs'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Stock Control</span>
            <span className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono ${
              activeTab === 'inventory' ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-zinc-700'
            }`}>
              {totalItemsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-black text-white shadow-2xs'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics & Trends</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-black text-white shadow-2xs'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Logs</span>
          </button>
        </div>
      </div>
    </header>
  );
};
