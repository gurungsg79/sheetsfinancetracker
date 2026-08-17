import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Repeat,
  Sparkles,
  PiggyBank,
  Sheet as SheetIcon,
  FileSpreadsheet,
  BookOpen,
  Plus,
  Lock,
  Eye,
  EyeOff,
  Sun,
  Moon,
  RefreshCw,
  Tags,
  Settings,
  Globe,
  ChevronDown,
  Check,
  User,
  Fingerprint,
  LogOut,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { SheetConfig, SecurityConfig, CurrencyConfig, CurrencyCode, UserProfile } from '../types';
import { CURRENCY_LIST, getCurrencyDetail } from '../services/currencyService';

export type NavTab =
  | 'dashboard'
  | 'transactions'
  | 'recurring'
  | 'ai-insights'
  | 'budgets'
  | 'sheets'
  | 'tax'
  | 'docs';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  currentUser: UserProfile | null;
  sheetConfig: SheetConfig;
  securityConfig: SecurityConfig;
  currencyConfig: CurrencyConfig;
  pendingSyncCount: number;
  unreadAlertsCount: number;
  dueRecurringCount: number;
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenAddModal: () => void;
  onOpenCategoryManager: () => void;
  onOpenSettings: () => void;
  onQuickChangeCurrency: (code: CurrencyCode) => void;
  onManualSync: () => void;
  onLockApp: () => void;
  onTogglePrivacyBlur: () => void;
  onLogout: () => void;
  onSwitchAccount: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  sheetConfig,
  securityConfig,
  currencyConfig,
  pendingSyncCount,
  unreadAlertsCount,
  dueRecurringCount,
  darkMode,
  setDarkMode,
  onOpenAddModal,
  onOpenCategoryManager,
  onOpenSettings,
  onQuickChangeCurrency,
  onManualSync,
  onLockApp,
  onTogglePrivacyBlur,
  onLogout,
  onSwitchAccount,
}) => {
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const activeCurrencyDetail = getCurrencyDetail(currencyConfig.displayCurrency);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        currencyDropdownRef.current &&
        !currencyDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCurrencyDropdownOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions' as NavTab, label: 'Transactions', icon: Receipt },
    {
      id: 'recurring' as NavTab,
      label: 'Recurring',
      icon: Repeat,
      badge: dueRecurringCount > 0 ? `${dueRecurringCount} due` : undefined,
    },
    {
      id: 'ai-insights' as NavTab,
      label: 'AI Insights',
      icon: Sparkles,
    },
    {
      id: 'budgets' as NavTab,
      label: 'Budgets & Alerts',
      icon: PiggyBank,
      badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined,
    },
    {
      id: 'sheets' as NavTab,
      label: 'Google Sheets',
      icon: SheetIcon,
      badge: pendingSyncCount > 0 ? `${pendingSyncCount} sync` : undefined,
    },
    { id: 'tax' as NavTab, label: 'Tax & Export', icon: FileSpreadsheet },
    { id: 'docs' as NavTab, label: 'Docs & Guide', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
              <SheetIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                  Sheets Finance
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                  <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  Gemini 2.5 AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Real-Time Multi-Currency Ledger &bull; Google Sheets &bull; Recurring Rules
              </p>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Global Currency Quick Selector Pill */}
            <div className="relative" ref={currencyDropdownRef}>
              <button
                id="nav-currency-selector-btn"
                onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                title="Change Global Display Currency"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs"
              >
                <span className="text-sm">{activeCurrencyDetail.flag}</span>
                <span>{activeCurrencyDetail.code}</span>
                <span className="text-slate-400 font-normal text-[11px] hidden sm:inline">
                  ({activeCurrencyDetail.symbol.trim()})
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Currency Dropdown Menu */}
              {isCurrencyDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-1.5 animate-scaleUp">
                  <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Display Currency
                    </span>
                    <button
                      onClick={() => {
                        setIsCurrencyDropdownOpen(false);
                        onOpenSettings();
                      }}
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                    >
                      FX Rates &rarr;
                    </button>
                  </div>
                  <div className="py-1 space-y-0.5">
                    {CURRENCY_LIST.map((c) => {
                      const isSelected = currencyConfig.displayCurrency === c.code;
                      return (
                        <button
                          key={c.code}
                          onClick={() => {
                            onQuickChangeCurrency(c.code);
                            setIsCurrencyDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{c.flag}</span>
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="font-bold">{c.code}</span>
                                <span className="text-[10px] text-slate-400">
                                  ({c.symbol.trim()})
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                {c.name}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sync Status Button */}
            <button
              id="nav-sync-button"
              onClick={onManualSync}
              disabled={sheetConfig.isSyncing}
              title={
                sheetConfig.isConnected
                  ? `Google Sheets Connected (${sheetConfig.lastSyncedAt ? 'Synced ' + new Date(sheetConfig.lastSyncedAt).toLocaleTimeString() : 'Ready'})`
                  : 'Sync local cache with Google Sheets'
              }
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl border transition-all ${
                sheetConfig.isSyncing
                  ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                  : sheetConfig.isConnected
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
              }`}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${sheetConfig.isSyncing ? 'animate-spin text-blue-600' : ''}`}
              />
              <span className="hidden md:inline">
                {sheetConfig.isSyncing
                  ? 'Syncing...'
                  : sheetConfig.isConnected
                  ? 'Sheets Synced'
                  : 'Offline Storage'}
              </span>
              {pendingSyncCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  {pendingSyncCount}
                </span>
              )}
            </button>

            {/* Manage Categories Button */}
            <button
              id="nav-categories-btn"
              onClick={onOpenCategoryManager}
              title="Customize Income & Expense Categories"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Tags className="w-4 h-4" />
            </button>

            {/* Settings Gear Button */}
            <button
              id="nav-settings-btn"
              onClick={onOpenSettings}
              title="Settings (Currency, Biometrics, Sync Preferences)"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Quick Add Transaction Button */}
            <button
              id="nav-quick-add-btn"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Entry</span>
            </button>

            {/* Privacy Blur Toggle */}
            <button
              id="nav-privacy-blur-btn"
              onClick={onTogglePrivacyBlur}
              title={securityConfig.privacyBlur ? 'Unmask sensitive balances' : 'Mask sensitive balances in public'}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {securityConfig.privacyBlur ? (
                <EyeOff className="w-4 h-4 text-amber-500" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>

            {/* Security Vault Lock Button */}
            {(securityConfig.pinEnabled || securityConfig.biometricEnabled) && (
              <button
                id="nav-lock-vault-btn"
                onClick={onLockApp}
                title="Lock Vault with Biometric / PIN"
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              id="nav-theme-toggle-btn"
              onClick={() => setDarkMode((prev) => !prev)}
              title="Toggle Dark / Light Mode"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* User Profile & Biometric Auth Dropdown */}
            {currentUser && (
              <div className="relative" ref={userMenuRef}>
                <button
                  id="nav-user-profile-btn"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl border border-slate-200 dark:border-slate-750 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  title={`Signed in as ${currentUser.name}`}
                >
                  <div className="relative">
                    <img
                      src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={currentUser.name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                    />
                    {currentUser.hasBiometrics && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border border-white dark:border-slate-900 flex items-center justify-center">
                        <Fingerprint className="w-2 h-2 text-slate-950" />
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden lg:inline max-w-[100px] truncate">
                    {currentUser.name}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:inline" />
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 animate-scaleUp">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={currentUser.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {currentUser.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {currentUser.email}
                          </div>
                        </div>
                      </div>

                      {/* Biometric Status Tag */}
                      <div className="mt-2.5 flex items-center justify-between text-[10px] bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                          <Fingerprint className={`w-3 h-3 ${currentUser.hasBiometrics ? 'text-emerald-500' : 'text-slate-400'}`} />
                          <span>Biometrics:</span>
                        </span>
                        <span className={`font-bold ${currentUser.hasBiometrics ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          {currentUser.hasBiometrics ? 'Enrolled' : 'Not Enrolled'}
                        </span>
                      </div>
                    </div>

                    <div className="py-1 space-y-0.5">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenSettings();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-400" />
                        <span>Account & Security Settings</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLockApp();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Lock Vault</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onSwitchAccount();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        <span>Switch User Profile</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 sm:space-x-1.5 overflow-x-auto no-scrollbar py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      typeof tab.badge === 'string' && (tab.badge.includes('sync') || tab.badge.includes('due'))
                        ? 'bg-amber-500 text-white'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
