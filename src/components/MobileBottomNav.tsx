import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Plus,
  Repeat,
  Sparkles,
  PiggyBank,
  Sheet as SheetIcon,
  FileSpreadsheet,
  BookOpen,
  X,
  Tags,
  RefreshCw,
  MoreHorizontal,
  Settings,
  Globe,
} from 'lucide-react';
import { NavTab } from './Navbar';
import { SheetConfig, CurrencyConfig } from '../types';
import { getCurrencyDetail } from '../services/currencyService';

interface MobileBottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenAddModal: () => void;
  onOpenCategoryManager: () => void;
  onOpenSettings: () => void;
  onManualSync: () => void;
  dueRecurringCount: number;
  unreadAlertsCount: number;
  pendingSyncCount: number;
  sheetConfig: SheetConfig;
  currencyConfig: CurrencyConfig;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenCategoryManager,
  onOpenSettings,
  onManualSync,
  dueRecurringCount,
  unreadAlertsCount,
  pendingSyncCount,
  sheetConfig,
  currencyConfig,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const activeCurrencyDetail = getCurrencyDetail(currencyConfig.displayCurrency);

  const mainTabs: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'transactions', label: 'Ledger', icon: Receipt },
    { id: 'recurring', label: 'Recurring', icon: Repeat, badge: dueRecurringCount },
    { id: 'ai-insights', label: 'AI Insights', icon: Sparkles },
  ];

  const moreTabs: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; desc: string; badge?: number }[] = [
    { id: 'budgets', label: 'Budgets & Alerts', icon: PiggyBank, desc: 'Category spending caps and alerts', badge: unreadAlertsCount },
    { id: 'sheets', label: 'Google Sheets', icon: SheetIcon, desc: 'Cloud spreadsheet sync telemetry', badge: pendingSyncCount },
    { id: 'tax', label: 'Tax & Export', icon: FileSpreadsheet, desc: 'Deductions & CSV / JSON exports' },
    { id: 'docs', label: 'User Guide', icon: BookOpen, desc: 'Documentation and setup tips' },
  ];

  return (
    <>
      {/* More Options Mobile Drawer Sheet */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="fixed inset-0"
            onClick={() => setIsMoreMenuOpen(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-2xl z-10 max-h-[85vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">More Features &amp; Settings</h3>
                <p className="text-xs text-slate-500">Currency, Cloud sync, budgets, and security</p>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Currency Selector Card */}
            <div
              onClick={() => {
                setIsMoreMenuOpen(false);
                onOpenSettings();
              }}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/5 dark:from-emerald-950/40 dark:to-slate-850 border border-emerald-200 dark:border-emerald-800/60 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-2xl shadow-xs">
                  {activeCurrencyDetail.flag}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                    Active Global Currency
                  </span>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {activeCurrencyDetail.name} ({activeCurrencyDetail.code})
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-700">
                Change FX
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {moreTabs.map((item) => {
                const Icon = item.icon;
                const isCurrent = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMoreMenuOpen(false);
                    }}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
                      isCurrent
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-750 text-slate-800 dark:text-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isCurrent ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{item.label}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</div>
                      </div>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions in Drawer */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenCategoryManager();
                }}
                className="py-2.5 px-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex flex-col items-center justify-center gap-1"
              >
                <Tags className="w-4 h-4" />
                <span>Categories</span>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenSettings();
                }}
                className="py-2.5 px-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex flex-col items-center justify-center gap-1"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onManualSync();
                }}
                disabled={sheetConfig.isSyncing}
                className="py-2.5 px-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex flex-col items-center justify-center gap-1"
              >
                <RefreshCw className={`w-4 h-4 ${sheetConfig.isSyncing ? 'animate-spin' : ''}`} />
                <span>{sheetConfig.isSyncing ? 'Syncing...' : 'Sync'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Nav Bar for Mobile Screens */}
      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 shadow-lg safe-area-inset-bottom">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* Home / Dashboard */}
          {mainTabs.slice(0, 2).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
              </button>
            );
          })}

          {/* Floating Center Quick Add Action */}
          <div className="relative -top-3">
            <button
              onClick={onOpenAddModal}
              title="Add New Entry"
              className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer border-2 border-white dark:border-slate-900"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Tab 3 (Recurring) */}
          <button
            onClick={() => setActiveTab('recurring')}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] py-1 px-2 rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'recurring'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Repeat className={`w-5 h-5 ${activeTab === 'recurring' ? 'scale-110' : ''} transition-transform`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Recurring</span>
            {dueRecurringCount > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* More Drawer Trigger */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] py-1 px-2 rounded-xl transition-all cursor-pointer relative ${
              ['budgets', 'sheets', 'tax', 'docs', 'ai-insights'].includes(activeTab)
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">More</span>
            {(unreadAlertsCount > 0 || pendingSyncCount > 0) && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};

