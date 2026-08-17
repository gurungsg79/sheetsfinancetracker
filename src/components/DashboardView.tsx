import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldCheck,
  PiggyBank,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  Filter,
  CheckCircle2,
  Repeat,
  Zap,
  Tags,
  FileSpreadsheet,
  Activity,
  HeartPulse,
  Wallet,
  Scale,
  Target,
  Edit3,
  Check,
  AlertCircle,
  Compass,
  ArrowRight,
  FileText,
  Printer,
  Download,
  Sun,
  Moon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  Transaction,
  BudgetGoal,
  SecurityConfig,
  RecurringTransaction,
  TransactionType,
  PaymentMethod,
  CurrencyConfig,
  UserProfile,
} from '../types';
import { QuickDataEntryWidget } from './QuickDataEntryWidget';
import { MonthlyReportModal } from './MonthlyReportModal';
import { isDue } from '../services/recurringService';
import {
  formatCurrency,
  convertAmount,
  getCurrencyDetail,
  getCurrencySymbol,
} from '../services/currencyService';
import { MonthlyHealthReportOptions } from '../services/exportService';

interface DashboardViewProps {
  transactions: Transaction[];
  recurringList: RecurringTransaction[];
  budgets: BudgetGoal[];
  incomeCategories: string[];
  expenseCategories: string[];
  securityConfig: SecurityConfig;
  currencyConfig: CurrencyConfig;
  currentUser?: UserProfile | null;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  monthlySavingsGoal?: number;
  onUpdateMonthlySavingsGoal?: (goal: number) => void;
  onOpenAddModal: (defaultType?: TransactionType) => void;
  onOpenCategoryManager: () => void;
  onSelectTransaction?: (t: Transaction) => void;
  onNavigateTab: (tab: any) => void;
  onQuickAddTransaction: (data: {
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    subcategory: string;
    paymentMethod: PaymentMethod;
    isTaxDeductible: boolean;
    taxCategory?: string;
    date: string;
  }) => void;
}

const CATEGORY_COLORS = [
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#f97316', // orange
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#84cc16', // lime
  '#ef4444', // red
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  recurringList,
  budgets,
  incomeCategories,
  expenseCategories,
  securityConfig,
  currencyConfig,
  currentUser,
  darkMode,
  onToggleDarkMode,
  monthlySavingsGoal = 1500,
  onUpdateMonthlySavingsGoal,
  onOpenAddModal,
  onOpenCategoryManager,
  onNavigateTab,
  onQuickAddTransaction,
}) => {
  const [timeRange, setTimeRange] = useState<'this_month' | 'last_30_days' | 'year' | 'all'>('this_month');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [showQuickEntry, setShowQuickEntry] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Active currency details
  const activeCurrencyDetail = getCurrencyDetail(currencyConfig.displayCurrency);
  const activeCurrencySymbol = getCurrencySymbol(currencyConfig.displayCurrency);

  // Inline Savings Goal Editor State
  const [isEditingSavingsGoal, setIsEditingSavingsGoal] = useState(false);
  const [customGoalInput, setCustomGoalInput] = useState(monthlySavingsGoal.toString());

  // Due recurring items
  const dueRecurringCount = useMemo(() => {
    return recurringList.filter((r) => r.isActive && isDue(r.nextDueDate)).length;
  }, [recurringList]);

  // Convert an amount from USD base (or transaction's native currency) to the active display currency
  const toDisplay = (amount: number, fromCurrency: string = 'USD'): number => {
    return convertAmount(amount, fromCurrency as any, currencyConfig.displayCurrency, currencyConfig.customRates);
  };

  // Helper for masking or formatting
  const maskValue = (val: number, isCurrency = true, options?: { fromCurrency?: string; compact?: boolean }) => {
    if (securityConfig.privacyBlur) {
      return '••••••';
    }
    return isCurrency
      ? formatCurrency(val, currencyConfig.displayCurrency, {
          fromCurrency: (options?.fromCurrency || 'USD') as any,
          customRates: currencyConfig.customRates,
          compact: options?.compact,
        })
      : val.toString();
  };

  // Current Month Dedicated Financial Health & Forecasting Summary
  const currentMonthData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = String(now.getMonth() + 1).padStart(2, '0');
    const currentYearMonth = `${currentYear}-${currentMonthNum}`;
    const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    const dayOfMonth = now.getDate();
    const totalDaysInMonth = new Date(currentYear, now.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(1, totalDaysInMonth - dayOfMonth);

    const monthTx = transactions.filter((t) => t.date.startsWith(currentYearMonth));

    let totalIncome = 0;
    let totalExpenses = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    for (const t of monthTx) {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        totalIncome += amt;
        incomeCount++;
      } else {
        totalExpenses += amt;
        expenseCount++;
      }
    }

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
    const expensePercent = totalIncome > 0 ? Math.min(100, Math.round((totalExpenses / totalIncome) * 100)) : 100;
    
    // Forecast Calculations
    const dailyAverageExpense = dayOfMonth > 0 ? totalExpenses / dayOfMonth : 0;
    const projectedMonthEndExpense = dailyAverageExpense * totalDaysInMonth;
    const projectedMonthEndSavings = totalIncome - projectedMonthEndExpense;
    
    // Safe daily spend to hit the monthly savings goal
    const availableRemainingSpend = Math.max(0, totalIncome - monthlySavingsGoal - totalExpenses);
    const safeDailySpendCap = daysRemaining > 0 ? availableRemainingSpend / daysRemaining : 0;

    // Savings Goal Progress
    const targetGoal = monthlySavingsGoal > 0 ? monthlySavingsGoal : 1500;
    const goalPercent = Math.min(150, Math.max(0, Math.round((netSavings / targetGoal) * 100)));
    const remainingToGoal = targetGoal - netSavings;
    const isGoalMet = netSavings >= targetGoal;

    // Health Rating
    let healthStatus: 'Excellent' | 'Healthy' | 'Moderate' | 'Deficit' = 'Healthy';
    let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
    let healthMessage = 'Your cash flow is positive with steady reserve accumulation.';

    if (totalIncome === 0 && totalExpenses > 0) {
      healthStatus = 'Deficit';
      badgeBg = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
      healthMessage = 'Outflow logged without current month income record.';
    } else if (netSavings < 0) {
      healthStatus = 'Deficit';
      badgeBg = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
      healthMessage = 'Expenses exceed income this month. Review non-essential spending.';
    } else if (savingsRate >= 30) {
      healthStatus = 'Excellent';
      badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      healthMessage = `Exceptional ${savingsRate}% savings rate! Well above recommended guidelines.`;
    } else if (savingsRate >= 15) {
      healthStatus = 'Healthy';
      badgeBg = 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800';
      healthMessage = `Healthy ${savingsRate}% savings rate with steady monthly surplus.`;
    } else {
      healthStatus = 'Moderate';
      badgeBg = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      healthMessage = `Tight margins with ${savingsRate}% saved. Limit daily expenses to reach your goal.`;
    }

    // Forecast Trajectory Status
    const isForecastOnTrack = projectedMonthEndSavings >= targetGoal;

    return {
      monthName,
      dayOfMonth,
      totalDaysInMonth,
      daysRemaining,
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      expensePercent,
      incomeCount,
      expenseCount,
      dailyAverageExpense,
      projectedMonthEndExpense,
      projectedMonthEndSavings,
      safeDailySpendCap,
      targetGoal,
      goalPercent,
      remainingToGoal,
      isGoalMet,
      isForecastOnTrack,
      healthStatus,
      badgeBg,
      healthMessage,
    };
  }, [transactions, monthlySavingsGoal]);

  // Filter transactions by selected time range
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const thisMonthPrefix = `${currentYear}-${currentMonth}`;

    if (timeRange === 'this_month') {
      return transactions.filter((t) => t.date.startsWith(thisMonthPrefix));
    }
    if (timeRange === 'last_30_days') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      return transactions.filter((t) => t.date >= thirtyDaysAgo);
    }
    if (timeRange === 'year') {
      return transactions.filter((t) => t.date.startsWith(String(currentYear)));
    }
    return transactions;
  }, [transactions, timeRange]);

  // Aggregate Core Metrics for Selected Filter
  const metrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    let taxDeductible = 0;

    for (const t of filteredTransactions) {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        income += amt;
      } else {
        expense += amt;
        if (t.isTaxDeductible) {
          taxDeductible += amt;
        }
      }
    }

    const net = income - expense;
    const savingsRate = income > 0 ? Math.max(0, Math.round((net / income) * 100)) : 0;
    const estimatedTaxSaved = taxDeductible * 0.24;

    return {
      income,
      expense,
      net,
      savingsRate,
      taxDeductible,
      estimatedTaxSaved,
      totalCount: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // Daily Chart Trend Data (converted to display currency for smooth rendering)
  const trendData = useMemo(() => {
    const map: Record<string, { date: string; income: number; expense: number; net: number }> = {};
    const sorted = [...filteredTransactions].sort((a, b) => a.date.localeCompare(b.date));

    for (const t of sorted) {
      const d = t.date;
      if (!map[d]) {
        map[d] = { date: d.slice(5), income: 0, expense: 0, net: 0 };
      }
      const convertedAmt = toDisplay(t.amount, t.currency || 'USD');
      if (t.type === 'income') {
        map[d].income += convertedAmt;
      } else {
        map[d].expense += convertedAmt;
      }
      map[d].net = map[d].income - map[d].expense;
    }

    return Object.values(map);
  }, [filteredTransactions, currencyConfig]);

  // Expense Category Breakdown (converted to display currency)
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of filteredTransactions) {
      if (t.type === 'expense') {
        const convertedAmt = toDisplay(t.amount, t.currency || 'USD');
        map[t.category] = (map[t.category] || 0) + convertedAmt;
      }
    }

    const totalExpense = Object.values(map).reduce((a, b) => a + b, 0);

    return Object.entries(map)
      .map(([name, value], idx) => ({
        name,
        value: Number(value.toFixed(2)),
        percent: totalExpense > 0 ? Math.round((value / totalExpense) * 100) : 0,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, currencyConfig]);

  // Budget Goals vs Actuals for this month
  const budgetPacing = useMemo(() => {
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthExpenses = transactions.filter(
      (t) => t.type === 'expense' && t.date.startsWith(currentYearMonth)
    );

    const spentMap: Record<string, number> = {};
    for (const t of thisMonthExpenses) {
      spentMap[t.category] = (spentMap[t.category] || 0) + t.amount;
    }

    return budgets.map((b) => {
      const spent = spentMap[b.category] || 0;
      const percent = Math.round((spent / b.monthlyLimit) * 100);
      const remaining = b.monthlyLimit - spent;
      return {
        ...b,
        spent,
        percent,
        remaining,
        isOver: spent > b.monthlyLimit,
        isNear: percent >= (b.alertThresholdPercent || 80) && spent <= b.monthlyLimit,
      };
    });
  }, [transactions, budgets]);

  const handleSaveSavingsGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(customGoalInput);
    if (!isNaN(parsed) && parsed >= 0) {
      if (onUpdateMonthlySavingsGoal) {
        onUpdateMonthlySavingsGoal(parsed);
      }
      setIsEditingSavingsGoal(false);
    }
  };

  // Prepared options for accountant-grade PDF / HTML export report
  const healthReportOptions: MonthlyHealthReportOptions = useMemo(() => {
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthTransactions = transactions.filter((t) => t.date.startsWith(currentYearMonth));

    return {
      monthName: currentMonthData.monthName,
      monthKey: currentYearMonth,
      dayOfMonth: currentMonthData.dayOfMonth,
      totalDaysInMonth: currentMonthData.totalDaysInMonth,
      daysRemaining: currentMonthData.daysRemaining,
      totalIncome: currentMonthData.totalIncome,
      totalExpenses: currentMonthData.totalExpenses,
      netSavings: currentMonthData.netSavings,
      savingsRate: currentMonthData.savingsRate,
      incomeCount: currentMonthData.incomeCount,
      expenseCount: currentMonthData.expenseCount,
      dailyAverageExpense: currentMonthData.dailyAverageExpense,
      projectedMonthEndExpense: currentMonthData.projectedMonthEndExpense,
      projectedMonthEndSavings: currentMonthData.projectedMonthEndSavings,
      safeDailySpendCap: currentMonthData.safeDailySpendCap,
      targetGoal: currentMonthData.targetGoal,
      goalPercent: currentMonthData.goalPercent,
      remainingToGoal: currentMonthData.remainingToGoal,
      isGoalMet: currentMonthData.isGoalMet,
      isForecastOnTrack: currentMonthData.isForecastOnTrack,
      healthStatus: currentMonthData.healthStatus,
      healthMessage: currentMonthData.healthMessage,
      transactions: thisMonthTransactions,
      categoryBreakdown: categoryBreakdown,
      currencyCode: currencyConfig.displayCurrency,
      currencySymbol: activeCurrencySymbol,
      clientName: currentUser?.name || 'Valued Client',
      clientEmail: currentUser?.email,
    };
  }, [currentMonthData, transactions, categoryBreakdown, currencyConfig, activeCurrencySymbol, currentUser]);

  return (
    <div className="space-y-5 sm:space-y-6 pb-20 lg:pb-8">
      {/* Top Quick Actions Bar (Mobile Touch Friendly) */}
      <div className="bg-white dark:bg-slate-800/80 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Quick Actions
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto py-0.5">
          <button
            onClick={() => onOpenAddModal('expense')}
            className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-colors whitespace-nowrap active:scale-95 cursor-pointer"
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>+ Log Expense</span>
          </button>

          <button
            onClick={() => onOpenAddModal('income')}
            className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors whitespace-nowrap active:scale-95 cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+ Log Income</span>
          </button>

          <button
            onClick={() => setIsReportModalOpen(true)}
            id="btn-quick-export-report"
            className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs whitespace-nowrap active:scale-95 cursor-pointer"
            title="Export Monthly Financial Health Summary as PDF report"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export Report PDF</span>
          </button>

          <button
            onClick={() => onNavigateTab('recurring')}
            className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 rounded-xl text-xs font-semibold hover:bg-violet-100 transition-colors relative whitespace-nowrap active:scale-95 cursor-pointer"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Recurring</span>
            {dueRecurringCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {dueRecurringCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigateTab('ai-insights')}
            className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors whitespace-nowrap active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>AI Advisor</span>
          </button>

          <button
            onClick={onOpenCategoryManager}
            className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors whitespace-nowrap active:scale-95 cursor-pointer"
          >
            <Tags className="w-3.5 h-3.5" />
            <span>Categories</span>
          </button>

          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              id="btn-quick-theme-toggle"
              className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors whitespace-nowrap active:scale-95 cursor-pointer"
              title={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode`}
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Embedded Quick Data Entry Widget */}
      {showQuickEntry && (
        <QuickDataEntryWidget
          incomeCategories={incomeCategories}
          expenseCategories={expenseCategories}
          onAddTransaction={onQuickAddTransaction}
          onOpenFullModal={onOpenAddModal}
        />
      )}

      {/* MONTHLY FINANCIAL HEALTH SUMMARY CARD WITH PROGRESS BAR & FORECAST */}
      <section
        id="monthly-financial-health-summary"
        className="bg-gradient-to-br from-white via-slate-50/50 to-slate-100/70 dark:from-slate-800/95 dark:via-slate-850 dark:to-slate-900/90 rounded-3xl border border-slate-200/90 dark:border-slate-700/70 p-4 sm:p-6 shadow-xs relative overflow-hidden space-y-5"
      >
        {/* Subtle glow decorative background accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/70 dark:border-slate-700/60">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Monthly Financial Health Summary
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-650">
                  {currentMonthData.monthName}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Day {currentMonthData.dayOfMonth} of {currentMonthData.totalDaysInMonth} ({currentMonthData.daysRemaining} days remaining in cycle)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
            <div className={`px-3 py-1 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${currentMonthData.badgeBg}`}>
              <Activity className="w-3.5 h-3.5" />
              <span>{currentMonthData.healthStatus} Health</span>
            </div>

            {/* Export PDF Report Button */}
            <button
              id="btn-export-health-pdf"
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Export Monthly Financial Health Summary as a professional PDF report for printing or sharing with accountants"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF Report</span>
            </button>

            {/* Dark Mode Quick Toggle */}
            {onToggleDarkMode && (
              <button
                id="btn-toggle-darkmode-card"
                onClick={onToggleDarkMode}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode`}
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
            )}
          </div>
        </div>

        {/* 3 Core Metric Columns: Total Income, Total Expenses, Net Savings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {/* 1. Total Income */}
          <div className="bg-white/95 dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Total Income
                  </span>
                  <span className="text-[11px] text-slate-400">Current Month Inflows</span>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                {currentMonthData.incomeCount} Inflows
              </span>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                +{maskValue(currentMonthData.totalIncome)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Avg. {maskValue(currentMonthData.dayOfMonth > 0 ? currentMonthData.totalIncome / currentMonthData.dayOfMonth : 0)} / logged day
              </p>
            </div>
          </div>

          {/* 2. Total Expenses */}
          <div className="bg-white/95 dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Total Expenses
                  </span>
                  <span className="text-[11px] text-slate-400">Current Month Outflows</span>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50">
                {currentMonthData.expenseCount} Outflows
              </span>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                -{maskValue(currentMonthData.totalExpenses)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Daily burn: ~{maskValue(currentMonthData.dailyAverageExpense)}/day
              </p>
            </div>
          </div>

          {/* 3. Net Savings */}
          <div className="bg-white/95 dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/60 shadow-xs flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    currentMonthData.netSavings >= 0
                      ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  <PiggyBank className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Net Savings
                  </span>
                  <span className="text-[11px] text-slate-400">Month-to-Date Margin</span>
                </div>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                  currentMonthData.netSavings >= 0
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50'
                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50'
                }`}
              >
                {currentMonthData.savingsRate}% Rate
              </span>
            </div>

            <div>
              <div
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  currentMonthData.netSavings >= 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {currentMonthData.netSavings >= 0 ? '+' : ''}
                {maskValue(currentMonthData.netSavings)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {currentMonthData.netSavings >= 0
                  ? 'Accumulated into reserve funds'
                  : 'Deficit relative to monthly income'}
              </p>
            </div>
          </div>
        </div>

        {/* VISUAL PROGRESS BAR: MONTHLY NET SAVINGS GOAL */}
        <div className="bg-white/90 dark:bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/60 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Monthly Net Savings Goal</span>
                  {currentMonthData.isGoalMet && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                      <CheckCircle2 className="w-3 h-3" />
                      Goal Reached!
                    </span>
                  )}
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Target: <strong>{maskValue(currentMonthData.targetGoal)}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isEditingSavingsGoal ? (
                <button
                  onClick={() => {
                    setCustomGoalInput(currentMonthData.targetGoal.toString());
                    setIsEditingSavingsGoal(true);
                  }}
                  className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Adjust Target</span>
                </button>
              ) : (
                <form onSubmit={handleSaveSavingsGoal} className="flex items-center gap-1.5">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                      {activeCurrencySymbol}
                    </span>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={customGoalInput}
                      onChange={(e) => setCustomGoalInput(e.target.value)}
                      className="w-24 bg-slate-50 dark:bg-slate-900 border border-emerald-500 rounded-lg pl-6 pr-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                      placeholder="1500"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    className="p-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                    title="Save Target Goal"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingSavingsGoal(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 px-1"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* High Contrast Visual Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-4 sm:h-5 bg-slate-100 dark:bg-slate-700/80 rounded-full overflow-hidden p-0.5 border border-slate-200/80 dark:border-slate-650 flex relative">
              <div
                className={`h-full rounded-full transition-all duration-700 relative flex items-center justify-end pr-2 ${
                  currentMonthData.isGoalMet
                    ? 'bg-gradient-to-r from-teal-500 via-emerald-500 to-emerald-400 shadow-sm shadow-emerald-500/30'
                    : currentMonthData.netSavings > 0
                    ? 'bg-gradient-to-r from-blue-500 to-emerald-500'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
                style={{ width: `${Math.min(100, currentMonthData.goalPercent)}%` }}
              >
                {currentMonthData.goalPercent >= 15 && (
                  <span className="text-[10px] font-bold text-white drop-shadow-xs">
                    {currentMonthData.goalPercent}%
                  </span>
                )}
              </div>
            </div>

            {/* Sub-label metrics below progress bar */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                Saved: <strong className="text-slate-900 dark:text-white">{maskValue(currentMonthData.netSavings)}</strong> ({currentMonthData.goalPercent}%)
              </span>
              <span>
                {currentMonthData.isGoalMet ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    +{maskValue(Math.abs(currentMonthData.remainingToGoal))} surplus above goal!
                  </span>
                ) : (
                  <span>
                    Need <strong>{maskValue(currentMonthData.remainingToGoal)}</strong> to reach goal
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* COMPACT MONTH-END FINANCIAL FORECAST & PACING WIDGET */}
        <div className="bg-slate-900 text-white dark:bg-slate-950 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs sm:text-sm font-bold tracking-tight text-white">
                Month-End Financial Forecast &amp; Run-Rate
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  currentMonthData.isForecastOnTrack
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                    : 'bg-amber-950/80 text-amber-300 border-amber-700'
                }`}
              >
                {currentMonthData.isForecastOnTrack ? '🎯 On Track for Savings Goal' : '⚠️ Run-Rate Requires Attention'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Projected Month-End Savings */}
            <div className="bg-slate-800/80 dark:bg-slate-900 p-3 rounded-xl border border-slate-700/60 space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">
                Projected Month-End Savings
              </span>
              <div className="text-lg sm:text-xl font-extrabold text-emerald-400 tracking-tight">
                {currentMonthData.projectedMonthEndSavings >= 0 ? '+' : ''}
                {maskValue(currentMonthData.projectedMonthEndSavings)}
              </div>
              <span className="text-[10px] text-slate-400 block">
                Based on current daily velocity
              </span>
            </div>

            {/* Projected Month-End Run-Rate Expenses */}
            <div className="bg-slate-800/80 dark:bg-slate-900 p-3 rounded-xl border border-slate-700/60 space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">
                Estimated Month-End Outflows
              </span>
              <div className="text-lg sm:text-xl font-extrabold text-slate-200 tracking-tight">
                {maskValue(currentMonthData.projectedMonthEndExpense)}
              </div>
              <span className="text-[10px] text-slate-400 block">
                Current pace: ~{maskValue(currentMonthData.dailyAverageExpense)}/day
              </span>
            </div>

            {/* Recommended Safe Daily Spend Cap */}
            <div className="bg-slate-800/80 dark:bg-slate-900 p-3 rounded-xl border border-slate-700/60 space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">
                Target Daily Spend Cap
              </span>
              <div className="text-lg sm:text-xl font-extrabold text-teal-300 tracking-tight">
                {maskValue(currentMonthData.safeDailySpendCap)}/day
              </div>
              <span className="text-[10px] text-slate-400 block">
                For remaining {currentMonthData.daysRemaining} days to hit goal
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{currentMonthData.healthMessage}</span>
            </span>
            <button
              onClick={() => onNavigateTab('ai-insights')}
              className="text-emerald-400 hover:underline font-semibold flex items-center gap-0.5"
            >
              <span>Detailed Forecast</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </section>

      {/* Main Ledger Filter & Time Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Financial Analytics &amp; Flow
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Synchronized with Google Sheets &bull; Interactive charts &amp; category distribution
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {/* Time range pills */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shrink-0">
            {(
              [
                { id: 'this_month', label: 'This Month' },
                { id: 'last_30_days', label: 'Last 30D' },
                { id: 'year', label: 'This Year' },
                { id: 'all', label: 'All Time' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTimeRange(opt.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  timeRange === opt.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => onOpenAddModal('expense')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-xs transition-all shrink-0 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Entry</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Income */}
        <div className="bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Inflow ({timeRange.replace('_', ' ')})
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {maskValue(metrics.income)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span>{filteredTransactions.filter((t) => t.type === 'income').length} income records</span>
            </div>
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Outflow ({timeRange.replace('_', ' ')})
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {maskValue(metrics.expense)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span>{filteredTransactions.filter((t) => t.type === 'expense').length} expense records</span>
            </div>
          </div>
        </div>

        {/* Net Savings & Cash Flow */}
        <div className="bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Net Flow ({timeRange.replace('_', ' ')})
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                metrics.net >= 0
                  ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
              }`}
            >
              {metrics.net >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                metrics.net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {maskValue(metrics.net)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {metrics.savingsRate}%
              </span>{' '}
              savings retention
            </div>
          </div>
        </div>

        {/* Tax Deductions Identified */}
        <div
          onClick={() => onNavigateTab('tax')}
          className="bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs relative overflow-hidden cursor-pointer hover:border-emerald-400/80 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
              Tax Write-Offs
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400 tracking-tight">
              {maskValue(metrics.taxDeductible)}
            </div>
            <div className="text-xs text-teal-600/80 dark:text-teal-400/80 mt-1 flex items-center gap-1">
              <span>~{maskValue(metrics.estimatedTaxSaved)} est. tax saved</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Cash Flow Timeline Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/80 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Income vs Expense Trajectory
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dynamic transaction trajectory synced with Google Sheets
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChartType(chartType === 'area' ? 'bar' : 'area')}
                className="text-xs px-2.5 py-1 rounded-lg font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {chartType === 'area' ? 'Switch to Bar' : 'Switch to Area'}
              </button>
            </div>
          </div>

          <div className="h-60 sm:h-72 w-full">
            {trendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No transaction data in selected range
              </div>
            ) : chartType === 'area' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(v) => formatCurrency(v, currencyConfig.displayCurrency, { compact: true })}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [formatCurrency(Number(val), currencyConfig.displayCurrency), '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#incomeGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="Expense"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#expenseGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(v) => formatCurrency(v, currencyConfig.displayCurrency, { compact: true })}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [formatCurrency(Number(val), currencyConfig.displayCurrency), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expense Category Donut Breakdown */}
        <div className="bg-white dark:bg-slate-800/80 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Category Distribution
              </h3>
              <span className="text-xs text-slate-400">{categoryBreakdown.length} Categories</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Outflow breakdown by AI tags
            </p>

            <div className="h-44 sm:h-48 w-full relative flex items-center justify-center">
              {categoryBreakdown.length === 0 ? (
                <div className="text-xs text-slate-400">No expenses recorded</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#1e293b',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                      formatter={(val: any, name: any) => [formatCurrency(Number(val), currencyConfig.displayCurrency), name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top 3 Categories legend */}
          <div className="space-y-1.5 mt-2 pt-3 border-t border-slate-100 dark:border-slate-700/60">
            {categoryBreakdown.slice(0, 3).map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                    {c.name}
                  </span>
                </div>
                <div className="font-semibold text-slate-900 dark:text-white shrink-0">
                  {maskValue(c.value, true, { fromCurrency: currencyConfig.displayCurrency })} ({c.percent}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row: Budget Pacing & Live Transactions Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Monthly Budget Pacing Status */}
        <div className="bg-white dark:bg-slate-800/80 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Budget Pacing
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('budgets')}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Manage <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Spending caps vs active month consumption
          </p>

          <div className="space-y-4">
            {budgetPacing.slice(0, 4).map((b) => {
              const barColor = b.isOver
                ? 'bg-rose-500'
                : b.isNear
                ? 'bg-amber-500'
                : 'bg-emerald-500';

              return (
                <div key={b.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                      {b.category}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      <strong className={b.isOver ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}>
                        {maskValue(b.spent)}
                      </strong>{' '}
                      / {maskValue(b.monthlyLimit)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                      style={{ width: `${Math.min(100, b.percent)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span
                      className={
                        b.isOver
                          ? 'text-rose-600 font-semibold'
                          : b.isNear
                          ? 'text-amber-600 font-semibold'
                          : 'text-slate-400'
                      }
                    >
                      {b.percent}% utilized {b.isOver && '🚨 Over Limit'}
                    </span>
                    <span className="text-slate-400">
                      {b.remaining > 0 ? `${maskValue(b.remaining)} left` : `${maskValue(Math.abs(b.remaining))} over`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Recent Transactions Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/80 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Recent Activity
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Latest entries with AI tags &amp; write-off badges
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('transactions')}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                View All ({transactions.length}) <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredTransactions.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-3 group hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl px-2 -mx-2 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.type === 'income'
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {tx.type === 'income' ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {tx.description}
                        </span>
                        {tx.isTaxDeductible && (
                          <span
                            title={tx.taxCategory || 'Eligible tax write-off'}
                            className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800"
                          >
                            <ShieldCheck className="w-2.5 h-2.5" />
                            Tax Off
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{tx.category}</span>
                        <span>&bull;</span>
                        <span>{tx.date}</span>
                        <span>&bull;</span>
                        <span>{tx.paymentMethod}</span>
                        {tx.currency && tx.currency !== currencyConfig.displayCurrency && (
                          <>
                            <span>&bull;</span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              (Orig. {tx.currency})
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`font-bold text-xs sm:text-sm ${
                        tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {maskValue(tx.amount, true, { fromCurrency: tx.currency || 'USD' })}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {tx.isPendingSync ? 'Queued' : 'Synced'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
            <span>Cloud ledger active</span>
            <button
              onClick={() => onOpenAddModal('expense')}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
            >
              + Add new record
            </button>
          </div>
        </div>
      </div>

      {/* Accountant-Grade Monthly Health Statement Export & PDF Modal */}
      <MonthlyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportOptions={healthReportOptions}
      />
    </div>
  );
};
