import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from 'lucide-react';
import {
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
} from '../data/initialData';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  incomeCategories: string[];
  expenseCategories: string[];
  onUpdateIncomeCategories: (cats: string[]) => void;
  onUpdateExpenseCategories: (cats: string[]) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  incomeCategories,
  expenseCategories,
  onUpdateIncomeCategories,
  onUpdateExpenseCategories,
}) => {
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense');
  const [newCatName, setNewCatName] = useState('');

  if (!isOpen) return null;

  const currentList = activeTab === 'income' ? incomeCategories : expenseCategories;
  const updateCurrentList = activeTab === 'income' ? onUpdateIncomeCategories : onUpdateExpenseCategories;

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed || currentList.includes(trimmed)) return;

    updateCurrentList([...currentList, trimmed]);
    setNewCatName('');
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (currentList.length <= 1) {
      alert('You must have at least one category.');
      return;
    }
    updateCurrentList(currentList.filter((c) => c !== catToDelete));
  };

  const handleResetDefaults = () => {
    if (confirm(`Reset ${activeTab} categories to standard defaults?`)) {
      if (activeTab === 'income') {
        onUpdateIncomeCategories(DEFAULT_INCOME_CATEGORIES);
      } else {
        onUpdateExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Category Customization Center
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Income vs Expense */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('expense')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'expense'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Expense Categories ({expenseCategories.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'income'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Income Categories ({incomeCategories.length})</span>
          </button>
        </div>

        {/* Add New Category Form */}
        <form onSubmit={handleAddCategory} className="flex gap-2">
          <input
            type="text"
            placeholder={`Add new ${activeTab} category (e.g. Pet Care or Crypto)`}
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={!newCatName.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>

        {/* Category List */}
        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {currentList.map((cat) => (
            <div
              key={cat}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 text-xs"
            >
              <span className="font-semibold text-slate-800 dark:text-slate-200">{cat}</span>
              <button
                onClick={() => handleDeleteCategory(cat)}
                title="Remove category"
                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleResetDefaults}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-emerald-600 hover:opacity-90 rounded-xl"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
