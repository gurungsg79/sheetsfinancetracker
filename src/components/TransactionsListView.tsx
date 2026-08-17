import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Trash2,
  Edit2,
  Plus,
  ShieldCheck,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  SlidersHorizontal,
  Calendar,
  Globe,
} from 'lucide-react';
import { Transaction, SecurityConfig, CurrencyConfig } from '../types';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../data/initialData';
import { downloadTransactionsCSV } from '../services/exportService';
import { formatCurrency, convertAmount } from '../services/currencyService';

interface TransactionsListViewProps {
  transactions: Transaction[];
  incomeCategories?: string[];
  expenseCategories?: string[];
  securityConfig: SecurityConfig;
  currencyConfig: CurrencyConfig;
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
}

export const TransactionsListView: React.FC<TransactionsListViewProps> = ({
  transactions,
  incomeCategories = DEFAULT_INCOME_CATEGORIES,
  expenseCategories = DEFAULT_EXPENSE_CATEGORIES,
  securityConfig,
  currencyConfig,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  onDeleteMultiple,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [taxDeductibleOnly, setTaxDeductibleOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Convert an amount to display currency
  const toDisplay = (amount: number, fromCurrency: string = 'USD'): number => {
    return convertAmount(amount, fromCurrency as any, currencyConfig.displayCurrency, currencyConfig.customRates);
  };

  // Filter & Sort
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        // Search text matching description, notes, category, or subcategory
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          !term ||
          t.description.toLowerCase().includes(term) ||
          t.category.toLowerCase().includes(term) ||
          (t.subcategory && t.subcategory.toLowerCase().includes(term)) ||
          (t.notes && t.notes.toLowerCase().includes(term)) ||
          (t.paymentMethod && t.paymentMethod.toLowerCase().includes(term));

        if (!matchesSearch) return false;

        // Type filter
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;

        // Category filter
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

        // Tax deductible filter
        if (taxDeductibleOnly && !t.isTaxDeductible) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return b.date.localeCompare(a.date);
        if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
        if (sortBy === 'amount_desc') return b.amount - a.amount;
        if (sortBy === 'amount_asc') return a.amount - b.amount;
        return 0;
      });
  }, [transactions, searchTerm, typeFilter, categoryFilter, taxDeductibleOnly, sortBy]);

  // Aggregate sums of filtered view (converted to active currency)
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    let deductible = 0;
    for (const t of filteredTransactions) {
      const converted = toDisplay(t.amount, t.currency || 'USD');
      if (t.type === 'income') income += converted;
      else {
        expense += converted;
        if (t.isTaxDeductible) deductible += converted;
      }
    }
    return { income, expense, deductible, net: income - expense };
  }, [filteredTransactions, currencyConfig]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTransactions.map((t) => t.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} selected transaction(s)?`)) {
      onDeleteMultiple(selectedIds);
      setSelectedIds([]);
    }
  };

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
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Transaction Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {transactions.length} total entries &bull; Real-time cloud synchronization
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadTransactionsCSV(filteredTransactions, 'transactions_export')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-650 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record Entry</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search merchant, tag, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium">
            {(['all', 'expense', 'income'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`flex-1 py-1.5 rounded-lg capitalize transition-all ${
                  typeFilter === t
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t === 'all' ? 'All Types' : t}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="all">All Categories</option>
              {Array.from(new Set(
                typeFilter === 'income'
                  ? incomeCategories
                  : typeFilter === 'expense'
                  ? expenseCategories
                  : [...incomeCategories, ...expenseCategories]
              )).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Sub filter: Tax Deductible only checkbox & Filter Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
            <input
              type="checkbox"
              checked={taxDeductibleOnly}
              onChange={(e) => setTaxDeductibleOnly(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600"
            />
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
              Tax Write-Offs Only
            </span>
          </label>

          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
            <span>
              Showing <strong>{filteredTransactions.length}</strong> items
            </span>
            <span>
              Inflow: <strong className="text-emerald-600">{maskValue(summary.income)}</strong>
            </span>
            <span>
              Outflow: <strong className="text-rose-500">{maskValue(summary.expense)}</strong>
            </span>
            <span>
              Deductible: <strong className="text-teal-600">{maskValue(summary.deductible)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Selected Items Batch Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-3 rounded-xl flex items-center justify-between animate-fadeIn">
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            {selectedIds.length} transaction(s) selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Transactions Data Table */}
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredTransactions.length > 0 &&
                      selectedIds.length === filteredTransactions.length
                    }
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                </th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Description &amp; Tag</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Payment Method</th>
                <th className="p-3.5">Tax Write-Off</th>
                <th className="p-3.5 text-right">Amount</th>
                <th className="p-3.5 text-center">Cloud Sync</th>
                <th className="p-3.5 text-right w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                    No transactions match your search filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isSelected = selectedIds.includes(tx.id);
                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors ${
                        isSelected ? 'bg-emerald-50/60 dark:bg-emerald-950/30' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(tx.id)}
                          className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                        />
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap font-medium">
                        {tx.date}
                      </td>
                      <td className="p-3.5 max-w-[220px]">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {tx.description}
                        </div>
                        {tx.notes && (
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {tx.notes}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {tx.category}
                        </span>
                        {tx.subcategory && tx.subcategory !== 'General' && (
                          <span className="text-[10px] block text-slate-400">
                            {tx.subcategory}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {tx.paymentMethod}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {tx.isTaxDeductible ? (
                          <span
                            title={tx.taxCategory || 'IRS Schedule C deduction'}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            Deductible
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div>
                          <span
                            className={`font-bold ${
                              tx.type === 'income'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {tx.type === 'income' ? '+' : '-'}
                            {maskValue(tx.amount, true, tx.currency || 'USD')}
                          </span>
                          {tx.currency && tx.currency !== currencyConfig.displayCurrency && (
                            <span className="block text-[10px] text-slate-400 font-medium">
                              Orig. {formatCurrency(tx.amount, tx.currency)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        {tx.isPendingSync ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                            Queued
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            Synced
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            title="Edit transaction"
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${tx.description}"?`)) {
                                onDeleteTransaction(tx.id);
                              }
                            }}
                            title="Delete transaction"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
