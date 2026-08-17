import React, { useState } from 'react';
import {
  Zap,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  DollarSign,
  Tag,
  Receipt,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { TransactionType, PaymentMethod } from '../types';
import { categorizeWithAI } from '../services/aiService';
import { playAlertChime } from '../services/notificationService';

interface QuickDataEntryWidgetProps {
  incomeCategories: string[];
  expenseCategories: string[];
  onAddTransaction: (data: {
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
  onOpenFullModal: (defaultType: TransactionType) => void;
}

export const QuickDataEntryWidget: React.FC<QuickDataEntryWidgetProps> = ({
  incomeCategories,
  expenseCategories,
  onAddTransaction,
  onOpenFullModal,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    expenseCategories[0] || 'Dining Out & Cafes'
  );
  const [isTaxDeductible, setIsTaxDeductible] = useState(false);
  const [isAiCategorizing, setIsAiCategorizing] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Active category list based on type
  const activeCategories = type === 'income' ? incomeCategories : expenseCategories;

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income') {
      setSelectedCategory(incomeCategories[0] || 'Salary & Wages');
    } else {
      setSelectedCategory(expenseCategories[0] || 'Dining Out & Cafes');
    }
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const handleAiAutoFill = async () => {
    if (!description.trim()) return;
    setIsAiCategorizing(true);
    try {
      const parsedAmt = amount ? parseFloat(amount) : undefined;
      const res = await categorizeWithAI(description, parsedAmt, type, activeCategories);

      if (res.extractedAmount && (!amount || isNaN(parseFloat(amount)))) {
        setAmount(res.extractedAmount.toString());
      }
      if (res.category && activeCategories.includes(res.category)) {
        setSelectedCategory(res.category);
      }
      if (res.type) {
        setType(res.type);
      }
      if (res.isTaxDeductible) {
        setIsTaxDeductible(true);
      }
      setAiMessage(`AI identified as ${res.category} (${res.subcategory})`);
      setTimeout(() => setAiMessage(null), 3000);
    } catch (e) {
      console.warn('AI Quick parse error:', e);
    } finally {
      setIsAiCategorizing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || !description.trim()) {
      return;
    }

    onAddTransaction({
      description: description.trim(),
      amount: numAmount,
      type,
      category: selectedCategory,
      subcategory: type === 'income' ? 'Direct Income' : 'Quick Entry',
      paymentMethod: type === 'income' ? 'Bank Transfer' : 'Credit Card',
      isTaxDeductible,
      taxCategory: isTaxDeductible ? 'Schedule C: Business Expense' : undefined,
      date: new Date().toISOString().split('T')[0],
    });

    playAlertChime('info');

    // Reset fields
    setDescription('');
    setAmount('');
    setIsTaxDeductible(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/70 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header with Type Selector & Full Form Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Quick Data Entry &amp; Fast Logging
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              One-click instant transaction logging with smart category tagging
            </p>
          </div>
        </div>

        {/* Income vs Expense Toggle */}
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-750">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Income</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onOpenFullModal(type)}
            className="text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
          >
            Full Form &rarr;
          </button>
        </div>
      </div>

      {aiMessage && (
        <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-1.5 animate-fadeIn">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>{aiMessage}</span>
        </div>
      )}

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Description / Payee with AI NLP trigger */}
          <div className="sm:col-span-6 relative">
            <input
              type="text"
              required
              placeholder={
                type === 'expense'
                  ? "e.g. Starbucks Latte $5.50 or Trader Joe's"
                  : 'e.g. Client Design Invoice $1200 or Tech Payroll'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleAiAutoFill}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
            />
            {description.length > 2 && (
              <button
                type="button"
                onClick={handleAiAutoFill}
                disabled={isAiCategorizing}
                title="Auto-categorize with Gemini"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 p-1"
              >
                <Sparkles className={`w-4 h-4 ${isAiCategorizing ? 'animate-spin text-emerald-500' : ''}`} />
              </button>
            )}
          </div>

          {/* Amount input */}
          <div className="sm:col-span-3 relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
              $
            </div>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-7 pr-3 py-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit Button */}
          <div className="sm:col-span-3">
            <button
              type="submit"
              className={`w-full h-full py-2.5 px-4 rounded-2xl text-xs font-bold text-white shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-600 hover:bg-rose-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Log {type === 'expense' ? 'Expense' : 'Income'}</span>
            </button>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] text-slate-400 font-semibold mr-1">Quick $:</span>
          {(type === 'expense' ? [5, 15, 25, 50, 100, 250] : [250, 500, 1000, 2500, 3850]).map(
            (val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAmount(val)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all ${
                  amount === val.toString()
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                }`}
              >
                ${val}
              </button>
            )
          )}
        </div>

        {/* Category Selector Chips (Income vs Expense specific) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3 text-emerald-500" />
              <span>
                {type === 'income' ? 'Choose Income Category:' : 'Choose Expense Category:'}
              </span>
            </span>
            <span className="text-slate-400 font-normal">
              Active: <strong className="text-slate-700 dark:text-slate-200">{selectedCategory}</strong>
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto py-1">
            {activeCategories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all ${
                    isSelected
                      ? type === 'income'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-rose-500 text-white border-rose-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tax Deductible Quick Checkbox */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={isTaxDeductible}
              onChange={(e) => setIsTaxDeductible(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 border-slate-300"
            />
            <span>Tax-Deductible / Business Expense (IRS Schedule C)</span>
          </label>
        </div>
      </form>
    </div>
  );
};
