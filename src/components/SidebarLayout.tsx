import React from 'react';
import { 
  Zap, 
  BarChart3, 
  ClipboardCheck, 
  History, 
  Database, 
  AlertTriangle, 
  RefreshCw, 
  User, 
  ChevronRight,
  ShieldAlert,
  Boxes
} from 'lucide-react';
import { Button } from './ui/button';
import { UserProfile } from '../types';
import { MgSolarLogo } from './MgSolarLogo';

export type NavTab = 'inventory' | 'parser' | 'history';

interface SidebarLayoutProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  lowStockCount: number;
  totalItemsCount: number;
  onResetDefaultData: () => void;
  currentUser: UserProfile;
  onOpenProfile: () => void;
  onOpenSupabaseModal?: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: NavTab; label: string; description: string; icon: React.FC<{ className?: string }> }[] = [
  {
    id: 'inventory',
    label: 'Stock Control',
    description: 'Hardware Catalog & Movement',
    icon: Zap,
  },
  {
    id: 'parser',
    label: 'Outgoing Checklist',
    description: 'Project Material Dispatch & Inventory Reduction',
    icon: ClipboardCheck,
  },
  {
    id: 'history',
    label: 'Audit Logs',
    description: 'Chronological Event History',
    icon: History,
  }
];

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  activeTab,
  setActiveTab,
  lowStockCount,
  totalItemsCount,
  onResetDefaultData,
  currentUser,
  onOpenProfile,
  onOpenSupabaseModal,
  children
}) => {
  const activeItemInfo = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
  };


  return (
    <div id="sidebar-layout-root" className="min-h-screen bg-zinc-50 text-zinc-950 flex flex-col md:flex-row font-sans overflow-x-hidden w-full">
      {/* Desktop Sidebar (md+) */}
      <aside 
        id="desktop-sidebar" 
        className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-zinc-200 fixed top-0 bottom-0 left-0 z-40 justify-between shadow-xs"
      >
        <div className="p-4 space-y-6">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 px-2 py-1 border-b border-zinc-100 pb-4">
            <MgSolarLogo size="md" showText={true} />
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-400">
              Workspace Navigation
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-zinc-950 text-white font-bold shadow-md'
                      : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 font-medium'
                  }`}
                >
                  <div className="flex items-center space-x-3 text-left">
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs">{item.label}</div>
                      <div className={`text-[10px] line-clamp-1 ${isActive ? 'text-zinc-300' : 'text-zinc-400'}`}>
                        {item.description}
                      </div>
                    </div>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-zinc-400" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Stats & Operator Info */}
        <div className="p-4 border-t border-zinc-200 space-y-3 bg-zinc-50/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-medium">Catalog SKUs:</span>
            <span className="font-bold font-mono text-zinc-900">{totalItemsCount} SKUs</span>
          </div>

          {/* Active Operator User Pill */}
          <button
            onClick={onOpenProfile}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 transition-colors shadow-2xs cursor-pointer"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 ${currentUser.avatarColor || 'bg-zinc-900'}`}>
                {currentUser.fullName.substring(0, 1)}
              </div>
              <div className="text-left min-w-0">
                <div className="text-xs font-bold text-zinc-900 truncate">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-zinc-500 truncate">
                  {currentUser.role}
                </div>
              </div>
            </div>
            <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          </button>
        </div>
      </aside>

      {/* Mobile Top Header (hidden on md) */}
      <header id="mobile-top-header" className="md:hidden bg-white border-b border-zinc-200 px-4 py-3 sticky top-0 z-30 flex items-center justify-between shadow-2xs">
        <div className="flex items-center space-x-2">
          <MgSolarLogo size="sm" showText={true} />
        </div>

        <div className="flex items-center space-x-2">
          {lowStockCount > 0 && (
            <span className="bg-rose-100 text-rose-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-rose-200">
              {lowStockCount} Low
            </span>
          )}

          <button
            onClick={onOpenProfile}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white ${currentUser.avatarColor || 'bg-zinc-900'}`}
          >
            {currentUser.fullName.substring(0, 1)}
          </button>
        </div>
      </header>


      {/* Main Dedicated Content Workspace (Offset on desktop for sidebar) */}
      <div id="main-content-wrapper" className="flex-1 md:pl-64 lg:pl-72 flex flex-col min-w-0 max-w-full min-h-screen overflow-x-hidden">
        {/* Dedicated Page Workspace Top Header */}
        <header id="dedicated-workspace-topbar" className="bg-white border-b border-zinc-200 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4 sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold font-mono uppercase tracking-wider text-zinc-400">
                  Module View
                </span>
                <span className="text-zinc-300">•</span>
                <span className="text-[10px] font-bold text-zinc-600 uppercase">
                  MG Solar EPC
                </span>
              </div>
              <h1 className="text-base sm:text-xl font-black text-zinc-950 tracking-tight uppercase leading-tight">
                {activeItemInfo.label}
              </h1>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {lowStockCount > 0 && (
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="hidden sm:flex items-center space-x-1.5 bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1 rounded-xl text-xs font-mono font-bold hover:bg-rose-100 transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{lowStockCount} Low Stock</span>
                </button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={onOpenProfile}
                className="hidden md:flex items-center space-x-1.5 text-xs font-bold border-zinc-300 bg-zinc-50 hover:bg-zinc-100 h-8 px-2.5 rounded-xl cursor-pointer"
              >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 ${currentUser.avatarColor || 'bg-zinc-900'}`}>
                  {currentUser.fullName.substring(0, 1)}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate">{currentUser.fullName}</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Dedicated Page Main Body */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 pb-24 md:pb-8 space-y-3.5 sm:space-y-6 max-w-7xl w-full mx-auto min-w-0 max-w-full">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Docked Navigation Bar (< md) matching modern mobile app layout */}
      <nav id="mobile-bottom-dock-nav" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200/80 px-3 py-2 flex items-center justify-around shadow-xl rounded-t-2xl">
        <button
          onClick={() => handleSelectTab('inventory')}
          className={`flex items-center transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-black text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm space-x-1.5'
              : 'flex-col items-center text-zinc-500 hover:text-zinc-900 space-y-0.5 text-[10px] font-medium px-2 py-1'
          }`}
        >
          <Zap className={`w-4 h-4 ${activeTab === 'inventory' ? 'text-white' : 'text-zinc-600'}`} />
          <span>Products</span>
        </button>

        <button
          onClick={() => handleSelectTab('parser')}
          className={`flex items-center transition-all cursor-pointer ${
            activeTab === 'parser'
              ? 'bg-black text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm space-x-1.5'
              : 'flex-col items-center text-zinc-500 hover:text-zinc-900 space-y-0.5 text-[10px] font-medium px-2 py-1'
          }`}
        >
          <ClipboardCheck className={`w-4 h-4 ${activeTab === 'parser' ? 'text-white' : 'text-zinc-600'}`} />
          <span>Dispatch</span>
        </button>

        <button
          onClick={() => handleSelectTab('history')}
          className={`flex items-center transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-black text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm space-x-1.5'
              : 'flex-col items-center text-zinc-500 hover:text-zinc-900 space-y-0.5 text-[10px] font-medium px-2 py-1'
          }`}
        >
          <History className={`w-4 h-4 ${activeTab === 'history' ? 'text-white' : 'text-zinc-600'}`} />
          <span>Audit</span>
        </button>

        <button
          onClick={onOpenProfile}
          className="flex flex-col items-center text-zinc-500 hover:text-zinc-900 space-y-0.5 text-[10px] font-medium px-2 py-1 cursor-pointer"
        >
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white ${currentUser.avatarColor || 'bg-zinc-900'}`}>
            {currentUser.fullName.substring(0, 1)}
          </div>
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
};
