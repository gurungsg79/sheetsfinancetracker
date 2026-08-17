import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  DollarSign,
  Calendar,
  CreditCard,
  Tag,
  ShieldCheck,
  FileText,
  Loader2,
  Check,
  AlertCircle,
  Settings2,
  Globe,
} from 'lucide-react';
import { Transaction, TransactionType, PaymentMethod, CurrencyConfig, CurrencyCode } from '../types';
import {
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
} from '../data/initialData';
import { categorizeWithAI } from '../services/aiService';
import { CURRENCY_LIST, getCurrencySymbol } from '../services/currencyService';

const DEFAULT_TAX_CATEGORIES = [
  'Schedule C: Software & Internet Services',
  'Schedule C: 50% Business Meals & Dining',
  'Schedule C: Auto, Transit & Travel',
  'Schedule C: Office Supplies & Equipment',
  'Schedule C: Professional Fees & Legal',
  'Schedule C: Advertising & Marketing',
  'Itemized: Medical & Dental Expenses',
  'Itemized: Charitable Contributions',
  'Other Tax Write-Off',
];

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt'>, existingId?: string) => void;
  initialTransaction?: Transaction | null;
  incomeCategories?: string[];
  expenseCategories?: string[];
  onOpenCategoryManager?: () => void;
  defaultType?: TransactionType;
  currencyConfig: CurrencyConfig;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTransaction,
  incomeCategories = DEFAULT_INCOME_CATEGORIES,
  expenseCategories = DEFAULT_EXPENSE_CATEGORIES,
  onOpenCategoryManager,
  defaultType = 'expense',
  currencyConfig,
}) => {
  // Natural Language AI Prompt input
  const [nlInput, setNlInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ reasoning?: string; confidence?: number } | null>(null);

  // Form Fields
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<CurrencyCode>(currencyConfig.displayCurrency);
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>(
    defaultType === 'income' ? incomeCategories[0] : expenseCategories[0]
  );
  const [subcategory, setSubcategory] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');
  const [isTaxDeductible, setIsTaxDeductible] = useState<boolean>(false);
  const [taxCategory, setTaxCategory] = useState<string>(DEFAULT_TAX_CATEGORIES[0]);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Active Category list
  const activeCategories = type === 'income' ? incomeCategories : expenseCategories;

  useEffect(() => {
    if (initialTransaction) {
      setType(initialTransaction.type);
      setAmount(initialTransaction.amount.toString());
      setCurrency(initialTransaction.currency || currencyConfig.displayCurrency);
      setDescription(initialTransaction.description);
      setCategory(initialTransaction.category);
      setSubcategory(initialTransaction.subcategory || '');
      setDate(initialTransaction.date);
      setPaymentMethod(initialTransaction.paymentMethod || 'Credit Card');
      setIsTaxDeductible(initialTransaction.isTaxDeductible);
      setTaxCategory(initialTransaction.taxCategory || DEFAULT_TAX_CATEGORIES[0]);
      setNotes(initialTransaction.notes || '');
      setAiFeedback(null);
      setNlInput('');
    } else {
      setType(defaultType);
      setAmount('');
      setCurrency(currencyConfig.displayCurrency);
      setDescription('');
      setCategory(defaultType === 'income' ? incomeCategories[0] : expenseCategories[0]);
      setSubcategory('');
      setDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod(defaultType === 'income' ? 'Bank Transfer' : 'Credit Card');
      setIsTaxDeductible(false);
      setTaxCategory(DEFAULT_TAX_CATEGORIES[0]);
      setNotes('');
      setAiFeedback(null);
      setNlInput('');
      setError(null);
    }
  }, [initialTransaction, isOpen, defaultType, currencyConfig.displayCurrency]);

  // When type changes, ensure valid category
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income') {
      if (!incomeCategories.includes(category)) {
        setCategory(incomeCategories[0] || 'Salary & Wages');
      }
      setPaymentMethod('Bank Transfer');
    } else {
      if (!expenseCategories.includes(category)) {
        setCategory(expenseCategories[0] || 'Dining Out & Cafes');
      }
      setPaymentMethod('Credit Card');
    }
  };

  if (!isOpen) return null;

  // Handle AI NLP Parsing
  const handleRunAICategorization = async () => {
    const textToParse = nlInput.trim() || description.trim();
    if (!textToParse) {
      setError('Please enter a description or prompt for AI auto-categorization.');
      return;
    }

    setError(null);
    setIsAiLoading(true);

    try {
      const parsedAmount = amount ? parseFloat(amount) : undefined;
      const result = await categorizeWithAI(textToParse, parsedAmount, type, activeCategories);

      if (result.type) {
        setType(result.type);
      }
      if (result.category) setCategory(result.category);
      if (result.subcategory) setSubcategory(result.subcategory);
      if (result.paymentMethod) setPaymentMethod(result.paymentMethod);
      if (result.cleanDescription && !description) setDescription(result.cleanDescription);
      if (result.extractedAmount && !amount) setAmount(result.extractedAmount.toString());
      setIsTaxDeductible(result.isTaxDeductible);
      if (result.taxCategory) setTaxCategory(result.taxCategory);

      setAiFeedback({
        reasoning: result.reasoning,
        confidence: result.confidence,
      });
    } catch (err) {
      setError('AI categorization was unable to process this prompt.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please provide a valid transaction amount greater than 0.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a description or merchant name.');
      return;
    }

    onSave(
      {
        date,
        type,
        category,
        subcategory: subcategory.trim() || 'General',
        amount: numAmount,
        currency,
        description: description.trim(),
        paymentMethod,
        isTaxDeductible,
        taxCategory: isTaxDeductible ? taxCategory : '',
        notes: notes.trim(),
        syncedAt: null,
        isPendingSync: true,
      },
      initialTransaction ? initialTransaction.id : undefined
    );

    onClose();
  };

  const selectedCurrencySymbol = getCurrencySymbol(currency);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {initialTransaction ? 'Edit Transaction' : 'Record Transaction'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instant sync to Google Sheets &amp; cloud storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* AI Magic Input Bar */}
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-blue-950/40 border border-emerald-500/20 dark:border-emerald-500/30 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                AI Smart Categorization &amp; Receipt Parser
              </span>
              <span className="text-[11px] font-normal text-emerald-600/80 dark:text-emerald-400/80">
                Gemini 2.5 Flash
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nlInput}
                onChange={(e) => setNlInput(e.target.value)}
                placeholder="e.g. Spent $45.50 at Trader Joe's with Apple Pay for groceries"
                className="flex-1 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRunAICategorization();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleRunAICategorization}
                disabled={isAiLoading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                {isAiLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Auto-Detect</span>
              </button>
            </div>

            {aiFeedback && (
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/70 p-2 rounded-lg flex items-center justify-between">
                <span>✨ {aiFeedback.reasoning}</span>
                {aiFeedback.confidence && (
                  <span className="font-bold ml-2 shrink-0">
                    {Math.round(aiFeedback.confidence * 100)}% match
                  </span>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Toggle & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Transaction Type
              </label>
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleTypeChange('expense')}
                  className={`py-2 rounded-lg transition-all ${
                    type === 'expense'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Expense Outflow
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('income')}
                  className={`py-2 rounded-lg transition-all ${
                    type === 'income'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Income Inflow
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Amount *
                </label>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <Globe className="w-3 h-3 text-emerald-600" />
                  <span>Currency</span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    {selectedCurrencySymbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  {CURRENCY_LIST.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Description & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Description / Merchant *
              </label>
              <input
                type="text"
                required
                placeholder={type === 'income' ? 'e.g. Client Design Invoice #102' : "e.g. Trader Joe's Supermarket"}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>
          </div>

          {/* Category Selection & Customizer Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {type === 'income' ? 'Income Category' : 'Expense Category'}
                </label>
                {onOpenCategoryManager && (
                  <button
                    type="button"
                    onClick={onOpenCategoryManager}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Settings2 className="w-3 h-3" />
                    <span>Manage</span>
                  </button>
                )}
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                {activeCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Subcategory / Tag
              </label>
              <input
                type="text"
                placeholder="e.g. Supermarket, Cloud Hosting, Retainer"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  'Credit Card',
                  'Debit Card',
                  'Bank Transfer',
                  'Apple Pay',
                  'Google Pay',
                  'Cash',
                  'PayPal',
                  'Other',
                ] as PaymentMethod[]
              ).map((method) => (
                <button
                  type="button"
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`text-xs py-1.5 px-2 rounded-xl border text-center transition-all ${
                    paymentMethod === method
                      ? 'bg-slate-900 dark:bg-emerald-600 text-white border-transparent font-semibold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Tax Deductible Status Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTaxDeductible}
                  onChange={(e) => setIsTaxDeductible(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600"
                />
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
                  Tax Deductible Business Expense / Write-Off
                </span>
              </label>
              {isTaxDeductible && (
                <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                  ~24% estimated savings
                </span>
              )}
            </div>

            {isTaxDeductible && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  IRS Classification / Schedule C Category
                </label>
                <select
                  value={taxCategory}
                  onChange={(e) => setTaxCategory(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  {DEFAULT_TAX_CATEGORIES.map((tc) => (
                    <option key={tc} value={tc}>
                      {tc}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Receipt Memo / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Invoice #2034, client project staging expenses"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{initialTransaction ? 'Save Changes' : 'Record Transaction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
