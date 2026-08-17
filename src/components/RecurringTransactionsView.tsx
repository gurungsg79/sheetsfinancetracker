import React, { useState, useMemo } from 'react';
import {
  Repeat,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Trash2,
  Edit2,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  Zap,
  Tag,
  Globe,
} from 'lucide-react';
import {
  RecurringTransaction,
  RecurringFrequency,
  TransactionType,
  PaymentMethod,
  SecurityConfig,
  CurrencyConfig,
  CurrencyCode,
} from '../types';
import {
  calculateNextDueDate,
  isDue,
  getDaysUntilDue,
} from '../services/recurringService';
import { formatCurrency, convertAmount, CURRENCY_LIST, getCurrencySymbol } from '../services/currencyService';

interface RecurringTransactionsViewProps {
  recurringList: RecurringTransaction[];
  incomeCategories: string[];
  expenseCategories: string[];
  securityConfig: SecurityConfig;
  currencyConfig: CurrencyConfig;
  onSaveRecurring: (recurring: RecurringTransaction) => void;
  onDeleteRecurring: (id: string) => void;
  onToggleActive: (id: string) => void;
  onApplyRecurring: (recurring: RecurringTransaction) => void;
  onApplyAllDue: (dueList: RecurringTransaction[]) => void;
}

export const RecurringTransactionsView: React.FC<RecurringTransactionsViewProps> = ({
  recurringList,
  incomeCategories,
  expenseCategories,
  securityConfig,
  currencyConfig,
  onSaveRecurring,
  onDeleteRecurring,
  onToggleActive,
  onApplyRecurring,
  onApplyAllDue,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);

  // Form State
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCurrency, setFormCurrency] = useState<CurrencyCode>(currencyConfig.displayCurrency);
  const [formType, setFormType] = useState<TransactionType>('expense');
  const [formCategory, setFormCategory] = useState(expenseCategories[0] || 'Housing & Rent');
  const [formSubcategory, setFormSubcategory] = useState('');
  const [formFrequency, setFormFrequency] = useState<RecurringFrequency>('monthly');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNextDueDate, setFormNextDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [formIsTaxDeductible, setFormIsTaxDeductible] = useState(false);
  const [formNotes, setFormNotes] = useState('');

  // Active Category List based on formType
  const currentCategories = formType === 'income' ? incomeCategories : expenseCategories;

  // Filter state
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Convert an amount to display currency
  const toDisplay = (amount: number, fromCurrency: string = 'USD'): number => {
    return convertAmount(amount, fromCurrency as any, currencyConfig.displayCurrency, currencyConfig.customRates);
  };

  // Find all due items
  const dueItems = useMemo(() => {
    return recurringList.filter((r) => r.isActive && isDue(r.nextDueDate));
  }, [recurringList]);

  // Calculate monthly projected recurring inflow vs outflow
  const { monthlyRecurringIncome, monthlyRecurringExpense } = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const r of recurringList) {
      if (!r.isActive) continue;
      let multiplier = 1;
      if (r.frequency === 'daily') multiplier = 30;
      else if (r.frequency === 'weekly') multiplier = 4.33;
      else if (r.frequency === 'biweekly') multiplier = 2.16;
      else if (r.frequency === 'monthly') multiplier = 1;
      else if (r.frequency === 'quarterly') multiplier = 1 / 3;
      else if (r.frequency === 'yearly') multiplier = 1 / 12;

      const convertedAmt = toDisplay(r.amount, r.currency || 'USD');
      const monthlyVal = convertedAmt * multiplier;
      if (r.type === 'income') {
        income += monthlyVal;
      } else {
        expense += monthlyVal;
      }
    }

    return {
      monthlyRecurringIncome: income,
      monthlyRecurringExpense: expense,
    };
  }, [recurringList, currencyConfig]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormDescription('');
    setFormAmount('');
    setFormCurrency(currencyConfig.displayCurrency);
    setFormType('expense');
    setFormCategory(expenseCategories[0] || 'Housing & Rent');
    setFormSubcategory('');
    setFormFrequency('monthly');
    const today = new Date().toISOString().split('T')[0];
    setFormStartDate(today);
    setFormNextDueDate(today);
    setFormPaymentMethod('Bank Transfer');
    setFormIsTaxDeductible(false);
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleStartEdit = (r: RecurringTransaction) => {
    setEditingItem(r);
    setFormDescription(r.description);
    setFormAmount(r.amount.toString());
    setFormCurrency(r.currency || currencyConfig.displayCurrency);
    setFormType(r.type);
    setFormCategory(r.category);
    setFormSubcategory(r.subcategory || '');
    setFormFrequency(r.frequency);
    setFormStartDate(r.startDate);
    setFormNextDueDate(r.nextDueDate);
    setFormPaymentMethod(r.paymentMethod);
    setFormIsTaxDeductible(r.isTaxDeductible);
    setFormNotes(r.notes || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(formAmount);
    if (isNaN(numAmt) || numAmt <= 0 || !formDescription.trim()) return;

    onSaveRecurring({
      id: editingItem ? editingItem.id : `rec-${Date.now()}`,
      description: formDescription.trim(),
      amount: numAmt,
      currency: formCurrency,
      type: formType,
      category: formCategory,
      subcategory: formSubcategory.trim() || undefined,
      frequency: formFrequency,
      startDate: formStartDate,
      nextDueDate: formNextDueDate,
      lastAppliedDate: editingItem?.lastAppliedDate || null,
      isActive: editingItem ? editingItem.isActive : true,
      paymentMethod: formPaymentMethod,
      isTaxDeductible: formIsTaxDeductible,
      taxCategory: formIsTaxDeductible ? 'Schedule C: Recurring Business Expense' : undefined,
      notes: formNotes.trim() || undefined,
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
    });

    setIsModalOpen(false);
  };

  const filteredList = useMemo(() => {
    if (filterType === 'all') return recurringList;
    return recurringList.filter((r) => r.type === filterType);
  }, [recurringList, filterType]);

  const maskValue = (val: number, isCurrency = true, fromCurrency: string = 'USD') => {
    if (securityConfig.privacyBlur) return '••••••';
    return isCurrency
      ? formatCurrency(val, currencyConfig.displayCurrency, {
          fromCurrency: fromCurrency as any,
          customRates: currencyConfig.customRates,
        })
      : val.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Recurring Transactions
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Automated recurring payroll, rent, utilities, and software subscriptions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Recurring Template</span>
          </button>
        </div>
      </div>

      {/* Due Items Banner Alert */}
      {dueItems.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                {dueItems.length} Recurring Item(s) Due for Execution!
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-400">
                Generate ledger transactions and advance schedules with one click.
              </div>
            </div>
          </div>

          <button
            onClick={() => onApplyAllDue(dueItems)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Apply All Due ({dueItems.length})</span>
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Est. Monthly Recurring Inflow
          </span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {maskValue(monthlyRecurringIncome)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Salary &amp; recurring client retainers</p>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Est. Monthly Recurring Outflow
          </span>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">
            {maskValue(monthlyRecurringExpense)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Rent, cloud SaaS, utilities &amp; bills</p>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Net Recurring Cashflow
          </span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            {maskValue(monthlyRecurringIncome - monthlyRecurringExpense)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {recurringList.filter((r) => r.isActive).length} active recurring templates
          </p>
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-white dark:bg-slate-800/80 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-750 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Scheduled Recurring Rules ({filteredList.length})
            </h2>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            {(['all', 'expense', 'income'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filterType === t
                    ? 'bg-white dark:bg-slate-750 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((r) => {
            const due = isDue(r.nextDueDate);
            const daysUntil = getDaysUntilDue(r.nextDueDate);

            return (
              <div
                key={r.id}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  !r.isActive
                    ? 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60'
                    : due
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/80'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-750'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                          r.type === 'income'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {r.type === 'income' ? '+' : '-'}
                      </span>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {r.description}
                      </h3>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>{r.category}</span>
                      <span>&bull;</span>
                      <span className="capitalize font-semibold text-slate-700 dark:text-slate-300">
                        {r.frequency}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-sm sm:text-base font-extrabold ${
                        r.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {r.type === 'income' ? '+' : '-'}
                      {maskValue(r.amount, true, r.currency || 'USD')}
                    </div>
                    {r.currency && r.currency !== currencyConfig.displayCurrency && (
                      <span className="block text-[10px] text-slate-400 font-medium">
                        Orig. {formatCurrency(r.amount, r.currency)}
                      </span>
                    )}
                    <span
                      className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        !r.isActive
                          ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          : due
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {!r.isActive
                        ? 'Paused'
                        : due
                        ? 'Due Now'
                        : daysUntil === 1
                        ? 'Due Tomorrow'
                        : `In ${daysUntil} days`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <span>Next: <strong>{r.nextDueDate}</strong></span>
                  <div className="flex items-center gap-1">
                    {r.isActive && (
                      <button
                        onClick={() => onApplyRecurring(r)}
                        title="Generate transaction now"
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Apply</span>
                      </button>
                    )}
                    <button
                      onClick={() => onToggleActive(r.id)}
                      title={r.isActive ? 'Pause rule' : 'Resume rule'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                    >
                      {r.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleStartEdit(r)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteRecurring(r.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Recurring Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Repeat className="w-4 h-4 text-violet-500" />
              <span>{editingItem ? 'Edit Recurring Rule' : 'New Recurring Transaction Rule'}</span>
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Type Switcher */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setFormType('expense');
                    setFormCategory(expenseCategories[0] || 'Housing & Rent');
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    formType === 'expense'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Recurring Expense
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType('income');
                    setFormCategory(incomeCategories[0] || 'Salary & Wages');
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    formType === 'income'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Recurring Income
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Payee *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apartment Rent or Monthly Salary"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Amount *
                    </label>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Globe className="w-3 h-3 text-violet-500" />
                      <span>Currency</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                        {getCurrencySymbol(formCurrency)}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-6 pr-2 py-2 text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <select
                      value={formCurrency}
                      onChange={(e) => setFormCurrency(e.target.value as CurrencyCode)}
                      className="w-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-1.5 py-2 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      {CURRENCY_LIST.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Frequency *
                  </label>
                  <select
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value as RecurringFrequency)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-Weekly (Every 2 Weeks)</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly (Every 3 Months)</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    {currentCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Next Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formNextDueDate}
                    onChange={(e) => setFormNextDueDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formIsTaxDeductible}
                    onChange={(e) => setFormIsTaxDeductible(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                  />
                  <span>Tax-Deductible Business / Freelance Expense</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-xl shadow-xs"
                >
                  Save Recurring Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
