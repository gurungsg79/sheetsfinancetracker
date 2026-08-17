import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { TransactionsListView } from './components/TransactionsListView';
import { RecurringTransactionsView } from './components/RecurringTransactionsView';
import { AIInsightsView } from './components/AIInsightsView';
import { BudgetingView } from './components/BudgetingView';
import { GoogleSheetSyncView } from './components/GoogleSheetSyncView';
import { TaxReportingView } from './components/TaxReportingView';
import { DocumentationView } from './components/DocumentationView';
import { TransactionModal } from './components/TransactionModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { SecurityLockScreen } from './components/SecurityLockScreen';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SettingsModal } from './components/SettingsModal';
import { AuthScreen } from './components/AuthScreen';
import {
  Transaction,
  BudgetGoal,
  SpendingAlert,
  SheetConfig,
  SecurityConfig,
  RecurringTransaction,
  TransactionType,
  PaymentMethod,
  CurrencyConfig,
  UserProfile,
  AuthState,
} from './types';
import {
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_RECURRING_TRANSACTIONS,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
} from './data/initialData';
import { DEFAULT_CURRENCY_CONFIG } from './services/currencyService';
import { evaluateBudgetAlerts, playAlertChime } from './services/notificationService';
import {
  fetchFromGoogleSheetsAPI,
  syncToGoogleSheetsAPI,
  syncViaWebhook,
  parseCSVToTransactions,
} from './services/sheetsService';
import { downloadTransactionsCSV } from './services/exportService';
import { checkBiometricAvailability, hashPin } from './services/biometricService';
import {
  getAuthState,
  logoutUser,
  enrollUserBiometrics,
  removeUserBiometrics,
} from './services/authService';
import {
  generateTransactionFromRecurring,
  advanceRecurringSchedule,
  isDue,
} from './services/recurringService';
import { CurrencyCode } from './types';

export default function App() {
  // Authentication State
  const [authState, setAuthState] = useState<AuthState>(() => getAuthState());

  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Dark Mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme_dark_mode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme_dark_mode', String(darkMode));
  }, [darkMode]);

  // Currency Configuration State & Persistence
  const [currencyConfig, setCurrencyConfig] = useState<CurrencyConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('finance_currency_config_v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Failed to parse saved currency config:', e);
        }
      }
    }
    return DEFAULT_CURRENCY_CONFIG;
  });

  useEffect(() => {
    localStorage.setItem('finance_currency_config_v1', JSON.stringify(currencyConfig));
  }, [currencyConfig]);

  // Settings Modal State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const handleQuickChangeCurrency = (code: CurrencyCode) => {
    setCurrencyConfig((prev) => ({
      ...prev,
      displayCurrency: code,
    }));
    showToast(`Global currency changed to ${code}`);
  };

  const handleSetupPin = async (pin: string) => {
    try {
      const hashed = await hashPin(pin);
      setSecurityConfig((prev) => ({
        ...prev,
        pinEnabled: true,
        pinHash: hashed,
      }));
      showToast('Vault Security PIN configured successfully!');
    } catch (e) {
      showToast('Failed to configure PIN', 'error');
    }
  };

  const handleDisablePin = () => {
    setSecurityConfig((prev) => ({
      ...prev,
      pinEnabled: false,
      pinHash: null,
    }));
    showToast('Security PIN disabled.');
  };

  // User Authentication & Biometrics Handlers
  const handleLoginSuccess = (user: UserProfile) => {
    setAuthState(getAuthState());
    showToast(`Welcome back, ${user.name}!`);
  };

  const handleLogout = () => {
    logoutUser();
    setAuthState(getAuthState());
    showToast('Signed out of session.');
  };

  const handleSwitchAccount = () => {
    logoutUser();
    setAuthState(getAuthState());
  };

  const handleEnrollBiometrics = async () => {
    if (!authState.currentUser) return;
    const res = await enrollUserBiometrics(authState.currentUser.id);
    if (res.success && res.user) {
      setAuthState(getAuthState());
      showToast('Device biometric passkey enrolled successfully!');
    } else {
      showToast(res.error || 'Failed to enroll biometric passkey', 'error');
    }
  };

  const handleRemoveBiometrics = () => {
    if (!authState.currentUser) return;
    removeUserBiometrics(authState.currentUser.id);
    setAuthState(getAuthState());
    showToast('Biometric passkey removed.');
  };

  // Income & Expense Category State
  const [incomeCategories, setIncomeCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('finance_income_categories_v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return DEFAULT_INCOME_CATEGORIES;
  });

  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('finance_expense_categories_v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return DEFAULT_EXPENSE_CATEGORIES;
  });

  useEffect(() => {
    localStorage.setItem('finance_income_categories_v1', JSON.stringify(incomeCategories));
  }, [incomeCategories]);

  useEffect(() => {
    localStorage.setItem('finance_expense_categories_v1', JSON.stringify(expenseCategories));
  }, [expenseCategories]);

  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('finance_transactions_v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Failed to parse saved transactions:', e);
        }
      }
    }
    return INITIAL_TRANSACTIONS;
  });

  useEffect(() => {
    localStorage.setItem('finance_transactions_v1', JSON.stringify(transactions));
  }, [transactions]);

  // Recurring Transactions State
  const [recurringList, setRecurringList] = useState<RecurringTransaction[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('finance_recurring_v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return INITIAL_RECURRING_TRANSACTIONS;
  });

  useEffect(() => {
    localStorage.setItem('finance_recurring_v1', JSON.stringify(recurringList));
  }, [recurringList]);

  // Budgets State
  const [budgets, setBudgets] = useState<BudgetGoal[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('finance_budgets_v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Failed to parse saved budgets:', e);
        }
      }
    }
    return INITIAL_BUDGETS;
  });

  useEffect(() => {
    localStorage.setItem('finance_budgets_v1', JSON.stringify(budgets));
  }, [budgets]);

  // Monthly Savings Goal State
  const [monthlySavingsGoal, setMonthlySavingsGoal] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('finance_monthly_savings_goal_v1');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
    }
    return 1500;
  });

  useEffect(() => {
    localStorage.setItem('finance_monthly_savings_goal_v1', String(monthlySavingsGoal));
  }, [monthlySavingsGoal]);

  // Spending Alerts State
  const [alerts, setAlerts] = useState<SpendingAlert[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('finance_alerts_v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('finance_alerts_v1', JSON.stringify(alerts));
  }, [alerts]);

  // Google Sheet Configuration State
  const [sheetConfig, setSheetConfig] = useState<SheetConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('finance_sheet_config_v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {
      mode: 'local_demo',
      spreadsheetId: '',
      sheetName: 'Transactions',
      accessToken: '',
      isConnected: false,
      lastSyncedAt: null,
      autoSyncIntervalMinutes: 5,
      isSyncing: false,
      syncError: null,
    };
  });

  useEffect(() => {
    localStorage.setItem('finance_sheet_config_v1', JSON.stringify(sheetConfig));
  }, [sheetConfig]);

  // Security Configuration State
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('finance_security_config_v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {
      isBiometricAvailable: true,
      biometricEnabled: false,
      pinEnabled: false,
      pinHash: null,
      isLocked: false,
      autoLockMinutes: -1,
      privacyBlur: false,
    };
  });

  useEffect(() => {
    localStorage.setItem('finance_security_config_v1', JSON.stringify(securityConfig));
  }, [securityConfig]);

  // Check biometric support on mount
  useEffect(() => {
    checkBiometricAvailability().then((avail) => {
      setSecurityConfig((prev) => ({ ...prev, isBiometricAvailable: avail }));
    });
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<TransactionType>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // In-App Toast State
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Perform Google Sheets Synchronization
  const handleManualSync = useCallback(async () => {
    setSheetConfig((prev) => ({ ...prev, isSyncing: true, syncError: null }));

    try {
      if (sheetConfig.accessToken && sheetConfig.spreadsheetId) {
        await syncToGoogleSheetsAPI(
          sheetConfig.spreadsheetId,
          sheetConfig.sheetName || 'Transactions',
          sheetConfig.accessToken,
          transactions
        );

        const remote = await fetchFromGoogleSheetsAPI(
          sheetConfig.spreadsheetId,
          sheetConfig.sheetName || 'Transactions',
          sheetConfig.accessToken
        );

        if (remote.transactions.length > 0) {
          setTransactions(remote.transactions);
        }

        const now = new Date().toISOString();
        setSheetConfig((prev) => ({
          ...prev,
          isSyncing: false,
          isConnected: true,
          lastSyncedAt: now,
        }));
        showToast('Successfully synchronized with Google Sheets!');
      } else if (sheetConfig.webhookUrl) {
        await syncViaWebhook(sheetConfig.webhookUrl, 'sync', transactions);
        const now = new Date().toISOString();
        setSheetConfig((prev) => ({
          ...prev,
          isSyncing: false,
          isConnected: true,
          lastSyncedAt: now,
        }));
        showToast('Synced via Apps Script Webhook!');
      } else {
        await new Promise((r) => setTimeout(r, 600));
        setTransactions((prev) =>
          prev.map((t) => ({ ...t, isPendingSync: false, syncedAt: new Date().toISOString() }))
        );
        setSheetConfig((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncedAt: new Date().toISOString(),
        }));
        showToast('Local offline storage synced!');
      }
    } catch (err: any) {
      console.error('Sync failed:', err);
      setSheetConfig((prev) => ({
        ...prev,
        isSyncing: false,
        syncError: err.message || 'Sync failed',
      }));
      showToast(`Sync issue: ${err.message || 'Check network / credentials'}`, 'error');
    }
  }, [sheetConfig, transactions]);

  // Auto-sync polling effect
  useEffect(() => {
    if (sheetConfig.autoSyncIntervalMinutes <= 0 || !sheetConfig.isConnected) return;
    const intervalMs = sheetConfig.autoSyncIntervalMinutes * 60 * 1000;
    const timer = setInterval(() => {
      handleManualSync();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [sheetConfig.autoSyncIntervalMinutes, sheetConfig.isConnected, handleManualSync]);

  // Evaluate spending alerts whenever transactions change
  const triggerBudgetEvaluation = useCallback(
    (currentTxList: Transaction[]) => {
      const result = evaluateBudgetAlerts(currentTxList, budgets, alerts);
      setAlerts(result.alerts);
      if (result.newAlertTriggered) {
        showToast('Budget alert threshold reached!', 'info');
      }
    },
    [budgets, alerts]
  );

  // Transaction Actions
  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    let updatedList: Transaction[];

    if (existingId) {
      updatedList = transactions.map((t) =>
        t.id === existingId
          ? {
              ...t,
              ...txData,
              syncedAt: null,
              isPendingSync: true,
            }
          : t
      );
      showToast('Transaction updated.');
    } else {
      const newTx: Transaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ...txData,
        createdAt: new Date().toISOString(),
        isPendingSync: true,
      };
      updatedList = [newTx, ...transactions];
      showToast('Transaction recorded & queued for sync.');
    }

    setTransactions(updatedList);
    triggerBudgetEvaluation(updatedList);
  };

  const handleQuickAdd = (data: {
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    subcategory: string;
    paymentMethod: PaymentMethod;
    isTaxDeductible: boolean;
    taxCategory?: string;
    date: string;
  }) => {
    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      description: data.description,
      amount: data.amount,
      type: data.type,
      category: data.category,
      subcategory: data.subcategory,
      paymentMethod: data.paymentMethod,
      isTaxDeductible: data.isTaxDeductible,
      taxCategory: data.taxCategory,
      date: data.date,
      notes: 'Logged via Quick Data Entry',
      syncedAt: null,
      createdAt: new Date().toISOString(),
      isPendingSync: true,
    };

    const updated = [newTx, ...transactions];
    setTransactions(updated);
    triggerBudgetEvaluation(updated);
    showToast(`Logged ${data.type === 'income' ? 'Income' : 'Expense'}: ${data.description}`);
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    showToast('Transaction removed.');
  };

  const handleDeleteMultiple = (ids: string[]) => {
    const updated = transactions.filter((t) => !ids.includes(t.id));
    setTransactions(updated);
    showToast(`Deleted ${ids.length} transaction(s).`);
  };

  // Recurring Management Handlers
  const handleSaveRecurring = (item: RecurringTransaction) => {
    setRecurringList((prev) => {
      const idx = prev.findIndex((r) => r.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = item;
        return copy;
      }
      return [item, ...prev];
    });
    showToast('Recurring transaction rule saved!');
  };

  const handleDeleteRecurring = (id: string) => {
    setRecurringList((prev) => prev.filter((r) => r.id !== id));
    showToast('Recurring template deleted.');
  };

  const handleToggleActiveRecurring = (id: string) => {
    setRecurringList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  };

  const handleApplyRecurring = (r: RecurringTransaction) => {
    const tx = generateTransactionFromRecurring(r);
    const updatedTxList = [tx, ...transactions];
    setTransactions(updatedTxList);
    triggerBudgetEvaluation(updatedTxList);

    // Advance schedule
    const advanced = advanceRecurringSchedule(r);
    setRecurringList((prev) => prev.map((item) => (item.id === r.id ? advanced : item)));

    playAlertChime('info');
    showToast(`Generated "${r.description}" ($${r.amount}). Next due: ${advanced.nextDueDate}`);
  };

  const handleApplyAllDueRecurring = (dueList: RecurringTransaction[]) => {
    if (dueList.length === 0) return;

    const newTxs: Transaction[] = [];
    const advancedMap: Record<string, RecurringTransaction> = {};

    for (const r of dueList) {
      newTxs.push(generateTransactionFromRecurring(r));
      advancedMap[r.id] = advanceRecurringSchedule(r);
    }

    const updatedTxList = [...newTxs, ...transactions];
    setTransactions(updatedTxList);
    triggerBudgetEvaluation(updatedTxList);

    setRecurringList((prev) => prev.map((item) => advancedMap[item.id] || item));
    playAlertChime('info');
    showToast(`Generated ${dueList.length} recurring transaction(s)!`);
  };

  // CSV Import
  const handleImportCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const parsed = parseCSVToTransactions(text);
        if (parsed.length > 0) {
          setTransactions((prev) => [...parsed, ...prev]);
          showToast(`Imported ${parsed.length} transaction(s) from CSV!`);
          triggerBudgetEvaluation([...parsed, ...transactions]);
        } else {
          showToast('No valid transactions found in CSV file.', 'error');
        }
      }
    };
    reader.readAsText(file);
  };

  // Backup restore
  const handleRestoreJSONBackup = (data: any) => {
    if (data && Array.isArray(data.transactions)) {
      setTransactions(data.transactions);
      showToast('Restored transactions from backup file.');
    }
  };

  const pendingSyncCount = useMemo(
    () => transactions.filter((t) => t.isPendingSync).length,
    [transactions]
  );

  const unreadAlertsCount = useMemo(
    () => alerts.filter((a) => !a.read).length,
    [alerts]
  );

  const dueRecurringCount = useMemo(
    () => recurringList.filter((r) => r.isActive && isDue(r.nextDueDate)).length,
    [recurringList]
  );

  const handleOpenAddModalWithType = (defType: TransactionType = 'expense') => {
    setModalDefaultType(defType);
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  // If user is not authenticated, render the biometric & credentials login screen
  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center">
        {toastMsg && (
          <div
            className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2 animate-fadeIn ${
              toastMsg.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : toastMsg.type === 'info'
                ? 'bg-amber-900 text-white border-amber-700'
                : 'bg-emerald-900 text-white border-emerald-700'
            }`}
          >
            <span>{toastMsg.text}</span>
          </div>
        )}
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Biometric Security Lock Screen Overlay */}
      {securityConfig.isLocked && (
        <SecurityLockScreen
          securityConfig={securityConfig}
          onUnlockSuccess={() => setSecurityConfig((prev) => ({ ...prev, isLocked: false }))}
          onUpdateSecurityConfig={(c) => setSecurityConfig((prev) => ({ ...prev, ...c }))}
        />
      )}

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={authState.currentUser}
        sheetConfig={sheetConfig}
        securityConfig={securityConfig}
        currencyConfig={currencyConfig}
        pendingSyncCount={pendingSyncCount}
        unreadAlertsCount={unreadAlertsCount}
        dueRecurringCount={dueRecurringCount}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenAddModal={() => handleOpenAddModalWithType('expense')}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onQuickChangeCurrency={handleQuickChangeCurrency}
        onManualSync={handleManualSync}
        onLockApp={() => setSecurityConfig((prev) => ({ ...prev, isLocked: true }))}
        onTogglePrivacyBlur={() =>
          setSecurityConfig((prev) => ({ ...prev, privacyBlur: !prev.privacyBlur }))
        }
        onLogout={handleLogout}
        onSwitchAccount={handleSwitchAccount}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Toast alert banner */}
        {toastMsg && (
          <div
            className={`fixed bottom-6 right-6 z-40 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2 animate-fadeIn ${
              toastMsg.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : toastMsg.type === 'info'
                ? 'bg-amber-900 text-white border-amber-700'
                : 'bg-emerald-900 text-white border-emerald-700'
            }`}
          >
            <span>{toastMsg.text}</span>
          </div>
        )}

        {/* Tab View Routing */}
        {activeTab === 'dashboard' && (
          <DashboardView
            transactions={transactions}
            recurringList={recurringList}
            budgets={budgets}
            incomeCategories={incomeCategories}
            expenseCategories={expenseCategories}
            securityConfig={securityConfig}
            currencyConfig={currencyConfig}
            currentUser={authState.currentUser}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
            monthlySavingsGoal={monthlySavingsGoal}
            onUpdateMonthlySavingsGoal={setMonthlySavingsGoal}
            onOpenAddModal={(t) => handleOpenAddModalWithType(t || 'expense')}
            onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
            onNavigateTab={setActiveTab}
            onQuickAddTransaction={handleQuickAdd}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsListView
            transactions={transactions}
            incomeCategories={incomeCategories}
            expenseCategories={expenseCategories}
            securityConfig={securityConfig}
            currencyConfig={currencyConfig}
            onOpenAddModal={() => handleOpenAddModalWithType('expense')}
            onEditTransaction={(tx) => {
              setEditingTransaction(tx);
              setIsModalOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onDeleteMultiple={handleDeleteMultiple}
          />
        )}

        {activeTab === 'recurring' && (
          <RecurringTransactionsView
            recurringList={recurringList}
            incomeCategories={incomeCategories}
            expenseCategories={expenseCategories}
            securityConfig={securityConfig}
            currencyConfig={currencyConfig}
            onSaveRecurring={handleSaveRecurring}
            onDeleteRecurring={handleDeleteRecurring}
            onToggleActive={handleToggleActiveRecurring}
            onApplyRecurring={handleApplyRecurring}
            onApplyAllDue={handleApplyAllDueRecurring}
          />
        )}

        {activeTab === 'ai-insights' && (
          <AIInsightsView
            transactions={transactions}
            recurringList={recurringList}
            budgets={budgets}
            securityConfig={securityConfig}
            currencyConfig={currencyConfig}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetingView
            budgets={budgets}
            alerts={alerts}
            transactions={transactions}
            expenseCategories={expenseCategories}
            securityConfig={securityConfig}
            currencyConfig={currencyConfig}
            onSaveBudget={(b) => {
              setBudgets((prev) => {
                const idx = prev.findIndex((item) => item.id === b.id);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = b;
                  return copy;
                }
                return [...prev, b];
              });
              showToast('Budget goal saved!');
            }}
            onDeleteBudget={(id) => {
              setBudgets((prev) => prev.filter((b) => b.id !== id));
              showToast('Budget goal removed.');
            }}
            onClearAlerts={() => {
              setAlerts([]);
              showToast('Alerts log cleared.');
            }}
            onDismissAlert={(id) => {
              setAlerts((prev) => prev.filter((a) => a.id !== id));
            }}
          />
        )}

        {activeTab === 'sheets' && (
          <GoogleSheetSyncView
            sheetConfig={sheetConfig}
            transactions={transactions}
            onUpdateSheetConfig={(c) => setSheetConfig((prev) => ({ ...prev, ...c }))}
            onManualSync={handleManualSync}
            onImportCSVFile={handleImportCSVFile}
            onExportAllToCSV={() => downloadTransactionsCSV(transactions, 'sheets_finance_ledger')}
            onClearOfflineQueue={() => {
              setTransactions((prev) => prev.map((t) => ({ ...t, isPendingSync: false })));
              showToast('Offline queue marked as synced.');
            }}
          />
        )}

        {activeTab === 'tax' && (
          <TaxReportingView
            transactions={transactions}
            securityConfig={securityConfig}
            currencyConfig={currencyConfig}
            onRestoreJSONBackup={handleRestoreJSONBackup}
          />
        )}

        {activeTab === 'docs' && <DocumentationView />}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => handleOpenAddModalWithType('expense')}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onManualSync={handleManualSync}
        dueRecurringCount={dueRecurringCount}
        unreadAlertsCount={unreadAlertsCount}
        pendingSyncCount={pendingSyncCount}
        sheetConfig={sheetConfig}
        currencyConfig={currencyConfig}
      />

      {/* Transaction Modal (Add / Edit) */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        initialTransaction={editingTransaction}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
        onOpenCategoryManager={() => {
          setIsModalOpen(false);
          setIsCategoryModalOpen(true);
        }}
        defaultType={modalDefaultType}
        currencyConfig={currencyConfig}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
        onUpdateIncomeCategories={setIncomeCategories}
        onUpdateExpenseCategories={setExpenseCategories}
      />

      {/* Global Settings & Currency Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentUser={authState.currentUser}
        currencyConfig={currencyConfig}
        onUpdateCurrencyConfig={setCurrencyConfig}
        securityConfig={securityConfig}
        onUpdateSecurityConfig={(c) => setSecurityConfig((prev) => ({ ...prev, ...c }))}
        sheetConfig={sheetConfig}
        onUpdateSheetConfig={(c) => setSheetConfig((prev) => ({ ...prev, ...c }))}
        onSetupPin={handleSetupPin}
        onDisablePin={handleDisablePin}
        onEnrollBiometrics={handleEnrollBiometrics}
        onRemoveBiometrics={handleRemoveBiometrics}
        onSwitchAccount={handleSwitchAccount}
        onLogout={handleLogout}
      />
    </div>
  );
}
