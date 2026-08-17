import React, { useState, useMemo } from 'react';
import {
  PiggyBank,
  AlertTriangle,
  Bell,
  BellRing,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Volume2,
  VolumeX,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Calendar,
  DollarSign,
  Globe,
} from 'lucide-react';
import { BudgetGoal, SpendingAlert, Transaction, SecurityConfig, CurrencyConfig } from '../types';
import { DEFAULT_EXPENSE_CATEGORIES } from '../data/initialData';
import {
  requestPushPermission,
  sendBrowserNotification,
  playAlertChime,
} from '../services/notificationService';
import { formatCurrency, convertAmount, getCurrencySymbol } from '../services/currencyService';

interface BudgetingViewProps {
  budgets: BudgetGoal[];
  alerts: SpendingAlert[];
  transactions: Transaction[];
  expenseCategories?: string[];
  securityConfig: SecurityConfig;
  currencyConfig: CurrencyConfig;
  onSaveBudget: (budget: BudgetGoal) => void;
  onDeleteBudget: (id: string) => void;
  onClearAlerts: () => void;
  onDismissAlert: (id: string) => void;
}

export const BudgetingView: React.FC<BudgetingViewProps> = ({
  budgets,
  alerts,
  transactions,
  expenseCategories = DEFAULT_EXPENSE_CATEGORIES,
  securityConfig,
  currencyConfig,
  onSaveBudget,
  onDeleteBudget,
  onClearAlerts,
  onDismissAlert,
}) => {
  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetGoal | null>(null);

  // Form State
  const [formCategory, setFormCategory] = useState(expenseCategories[0] || 'Dining Out & Cafes');
  const [formLimit, setFormLimit] = useState('');
  const [formThreshold, setFormThreshold] = useState('80');

  // Push Permission State
  const [pushStatus, setPushStatus] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  // Currency helper
  const toDisplay = (amount: number, fromCurrency: string = 'USD'): number => {
    return convertAmount(amount, fromCurrency as any, currencyConfig.displayCurrency, currencyConfig.customRates);
  };

  // Current Month Stats
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay);

  // Calculate current month expenses per category in display currency
  const thisMonthExpenses = useMemo(() => {
    return transactions.filter(
      (t) => t.type === 'expense' && t.date.startsWith(currentYearMonth)
    );
  }, [transactions, currentYearMonth]);

  const categorySpentMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of thisMonthExpenses) {
      const converted = toDisplay(t.amount, t.currency || 'USD');
      map[t.category] = (map[t.category] || 0) + converted;
    }
    return map;
  }, [thisMonthExpenses, currencyConfig]);

  // Total monthly budgeted limit
  const totalBudgetLimit = useMemo(() => {
    return budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  }, [budgets]);

  const totalSpentThisMonth = useMemo(() => {
    return thisMonthExpenses.reduce((sum, t) => sum + toDisplay(t.amount, t.currency || 'USD'), 0);
  }, [thisMonthExpenses, currencyConfig]);

  const overallPercent = totalBudgetLimit > 0 ? Math.round((totalSpentThisMonth / totalBudgetLimit) * 100) : 0;
  const overallRemaining = totalBudgetLimit - totalSpentThisMonth;
  const recommendedDailyCap = Math.max(0, Math.round((overallRemaining / daysRemaining) * 100) / 100);

  const handleRequestPush = async () => {
    const perm = await requestPushPermission();
    setPushStatus(perm);
    if (perm === 'granted') {
      sendBrowserNotification('Spending Alerts Enabled', 'You will receive real-time push alerts when exceeding spending goals.');
      playAlertChime('info');
    }
  };

  const handleTestAlert = () => {
    const formatted315 = formatCurrency(315, currencyConfig.displayCurrency);
    const formatted300 = formatCurrency(300, currencyConfig.displayCurrency);
    sendBrowserNotification(
      '🚨 Spending Limit Exceeded (Test)',
      `Alert: Dining Out reached 105% (${formatted315}) of your ${formatted300} monthly budget limit!`,
      '🚨'
    );
    playAlertChime('critical');
  };

  const handleSaveBudgetForm = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(formLimit);
    if (isNaN(limit) || limit <= 0) return;

    onSaveBudget({
      id: editingBudget ? editingBudget.id : `bg-${Date.now()}`,
      category: formCategory,
      monthlyLimit: limit,
      alertThresholdPercent: parseInt(formThreshold) || 80,
    });

    setIsAddingBudget(false);
    setEditingBudget(null);
    setFormLimit('');
  };

  const startEdit = (b: BudgetGoal) => {
    setEditingBudget(b);
    setFormCategory(b.category);
    setFormLimit(b.monthlyLimit.toString());
    setFormThreshold(b.alertThresholdPercent.toString());
    setIsAddingBudget(true);
  };

  const maskValue = (val: number, isCurrency = true) => {
    if (securityConfig.privacyBlur) return '••••••';
    return isCurrency
      ? formatCurrency(val, currencyConfig.displayCurrency, {
          fromCurrency: currencyConfig.displayCurrency,
          customRates: currencyConfig.customRates,
        })
      : val.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Monthly Budgets &amp; Spending Alerts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time threshold monitoring &bull; Push notifications on limit breach
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingBudget(null);
              setFormCategory(expenseCategories[0] || 'Dining Out & Cafes');
              setFormLimit('');
              setFormThreshold('80');
              setIsAddingBudget(true);
            }}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Budget Goal</span>
          </button>
        </div>
      </div>

      {/* Monthly Budget Summary Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Budget Gauge */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Overall Monthly Budget</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{overallPercent}%</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {maskValue(totalSpentThisMonth)}{' '}
            <span className="text-xs text-slate-400 font-normal">/ {maskValue(totalBudgetLimit)}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallPercent >= 100
                  ? 'bg-rose-500'
                  : overallPercent >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, overallPercent)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 flex justify-between">
            <span>{overallRemaining > 0 ? `${maskValue(overallRemaining)} left` : `${maskValue(Math.abs(overallRemaining))} over limit`}</span>
            <span>{daysRemaining} days left in month</span>
          </div>
        </div>

        {/* Recommended Daily Pacing Cap */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Daily Spending Allowance</span>
            <Calendar className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {maskValue(recommendedDailyCap)}
            <span className="text-xs text-slate-400 font-normal"> / day</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Recommended max spend per day to stay comfortably under your monthly limit.
          </p>
        </div>

        {/* Push Notification & Audio Alert Controls */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Push Spending Alerts
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  pushStatus === 'granted'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                {pushStatus === 'granted' ? 'Active' : 'Permission Required'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Receive notifications &amp; audio chimes on reaching 80% and 100% of limits.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            {pushStatus !== 'granted' ? (
              <button
                onClick={handleRequestPush}
                className="flex-1 text-xs font-bold py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Enable Push Alerts</span>
              </button>
            ) : (
              <button
                onClick={handleTestAlert}
                className="flex-1 text-xs font-semibold py-1.5 px-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Test Alert Chime</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Budget Goal Modal */}
      {isAddingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-emerald-500" />
              <span>{editingBudget ? 'Edit Budget Goal' : 'Create Monthly Budget Goal'}</span>
            </h3>

            <form onSubmit={handleSaveBudgetForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  {expenseCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Monthly Limit ({getCurrencySymbol(currencyConfig.displayCurrency)} {currencyConfig.displayCurrency}) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    {getCurrencySymbol(currencyConfig.displayCurrency)}
                  </span>
                  <input
                    type="number"
                    step="1"
                    required
                    placeholder="e.g. 500"
                    value={formLimit}
                    onChange={(e) => setFormLimit(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Warning Alert Threshold (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(e.target.value)}
                    className="flex-1 accent-emerald-600"
                  />
                  <span className="font-bold text-xs text-emerald-600">{formThreshold}%</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingBudget(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs"
                >
                  Save Budget Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Budgets Grid */}
      <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Category Budget Limits ({budgets.length})
          </h2>
          <span className="text-xs text-slate-400">Pacing for {currentYearMonth}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const spent = categorySpentMap[b.category] || 0;
            const percent = Math.round((spent / b.monthlyLimit) * 100);
            const remaining = b.monthlyLimit - spent;
            const isOver = spent > b.monthlyLimit;
            const isNear = percent >= b.alertThresholdPercent && !isOver;

            const barColor = isOver
              ? 'bg-rose-500'
              : isNear
              ? 'bg-amber-500'
              : 'bg-emerald-500';

            return (
              <div
                key={b.id}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-750 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {b.category}
                    </h3>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Alert at {b.alertThresholdPercent}% &bull; Max {maskValue(b.monthlyLimit)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(b)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove budget goal for "${b.category}"?`)) {
                          onDeleteBudget(b.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Spent: <strong className={isOver ? 'text-rose-500' : 'text-slate-900 dark:text-white'}>{maskValue(spent)}</strong>
                    </span>
                    <span className="font-semibold text-slate-500">{percent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className={isOver ? 'text-rose-600 font-bold' : isNear ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                      {isOver ? '🚨 Exceeded Limit!' : isNear ? '⚠️ Approaching Limit' : 'On Track'}
                    </span>
                    <span className="text-slate-400">
                      {remaining > 0 ? `${maskValue(remaining)} remaining` : `${maskValue(Math.abs(remaining))} over budget`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spending Alerts History Log */}
      <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Spending Alerts Feed ({alerts.length})
            </h2>
          </div>
          {alerts.length > 0 && (
            <button
              onClick={onClearAlerts}
              className="text-xs text-slate-500 hover:text-rose-500 font-medium transition-colors"
            >
              Clear Log
            </button>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No spending limit breaches recorded this cycle. All category budgets are healthy!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="py-3 flex items-center justify-between gap-3 text-xs group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      alert.level === 'critical'
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                        : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {alert.message}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(alert.timestamp).toLocaleString()} &bull; {alert.category}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onDismissAlert(alert.id)}
                  className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 rounded-lg"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
