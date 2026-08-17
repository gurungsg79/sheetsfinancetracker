import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  X,
  Sparkles,
  Share2,
  Calendar,
  User,
  Building,
  HeartPulse,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldCheck,
} from 'lucide-react';
import {
  MonthlyHealthReportOptions,
  printMonthlyHealthReportPDF,
  downloadMonthlyHealthReportHtml,
} from '../services/exportService';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportOptions: MonthlyHealthReportOptions;
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  isOpen,
  onClose,
  reportOptions,
}) => {
  const [clientName, setClientName] = useState(reportOptions.clientName || 'Valued Client');
  const [accountantName, setAccountantName] = useState(reportOptions.accountantName || 'Certified CPA / Accounting Office');
  const [customNotes, setCustomNotes] = useState(reportOptions.customNotes || '');
  const [copied, setCopied] = useState(false);
  const [printSuccess, setPrintSuccess] = useState<boolean | null>(null);

  if (!isOpen) return null;

  const currentOptions: MonthlyHealthReportOptions = {
    ...reportOptions,
    clientName,
    accountantName,
    customNotes,
  };

  const symbol = currentOptions.currencySymbol || '$';
  const currCode = currentOptions.currencyCode || 'USD';

  const fmt = (val: number) => {
    return `${symbol}${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handlePrint = () => {
    const success = printMonthlyHealthReportPDF(currentOptions);
    setPrintSuccess(success);
    if (!success) {
      // Fallback: If popup is blocked, download HTML directly
      downloadMonthlyHealthReportHtml(currentOptions);
    }
  };

  const handleDownload = () => {
    downloadMonthlyHealthReportHtml(currentOptions);
  };

  const handleCopySummary = async () => {
    const text = `
MONTHLY FINANCIAL HEALTH REPORT: ${currentOptions.monthName}
Prepared For: ${clientName} | Accountant: ${accountantName}
Currency: ${currCode} (${symbol})
--------------------------------------------------
Health Status: ${currentOptions.healthStatus}
Gross Monthly Inflows: +${fmt(currentOptions.totalIncome)} (${currentOptions.incomeCount} inflows)
Total Monthly Outflows: -${fmt(currentOptions.totalExpenses)} (${currentOptions.expenseCount} outflows)
Net Surplus / Savings: ${currentOptions.netSavings >= 0 ? '+' : ''}${fmt(currentOptions.netSavings)} (${currentOptions.savingsRate}% Savings Rate)

TARGET SAVINGS GOAL:
Target: ${fmt(currentOptions.targetGoal)} | Progress: ${currentOptions.goalPercent}% (${currentOptions.isGoalMet ? 'Goal Met!' : `${fmt(currentOptions.remainingToGoal)} remaining`})

MONTH-END VELOCITY FORECAST:
- Projected Month-End Net Savings: ${currentOptions.projectedMonthEndSavings >= 0 ? '+' : ''}${fmt(currentOptions.projectedMonthEndSavings)}
- Estimated Month-End Outflows: ${fmt(currentOptions.projectedMonthEndExpense)}
- Recommended Safe Daily Spend Cap: ${fmt(currentOptions.safeDailySpendCap)}/day (Remaining ${currentOptions.daysRemaining} days)
- Trajectory: ${currentOptions.isForecastOnTrack ? 'On Track' : 'Requires Adjustment'}

EXPENSE BREAKDOWN:
${currentOptions.categoryBreakdown.map((c) => `• ${c.name}: ${fmt(c.value)} (${c.percent}%)`).join('\n')}
--------------------------------------------------
Generated via Sheets Finance Tracker
`.trim();

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Failed to copy to clipboard', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  Monthly Financial Health Statement
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  PDF &amp; Print Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Formatted for certified CPA review, bookkeeping, tax filing, and archival
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Action Controls Bar */}
        <div className="px-6 py-3 bg-slate-100/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-750 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Period: <strong>{currentOptions.monthName}</strong></span>
            <span className="text-slate-400">&bull;</span>
            <span>Currency: <strong>{currCode} ({symbol})</strong></span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-650 transition-colors shadow-2xs active:scale-95 cursor-pointer"
              title="Copy executive summary as plain text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied Summary!' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-650 transition-colors shadow-2xs active:scale-95 cursor-pointer"
              title="Download standalone HTML document"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Download HTML</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Open browser print dialog to save as PDF or physical print"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export PDF</span>
            </button>
          </div>
        </div>

        {/* Form Details Customizer (Accordion or compact inputs) */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs shrink-0">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <User className="w-3 h-3 text-emerald-500" />
              <span>Client / Taxpayer Name</span>
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Alex Morgan / Freelance Design Studio"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Building className="w-3 h-3 text-emerald-500" />
              <span>Accountant / CPA Firm Reference</span>
            </label>
            <input
              type="text"
              value={accountantName}
              onChange={(e) => setAccountantName(e.target.value)}
              placeholder="e.g. Sterling &amp; Co. CPAs"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            />
          </div>
        </div>

        {/* Interactive Document Preview (Styled letter page) */}
        <div className="p-6 overflow-y-auto bg-slate-100 dark:bg-slate-950 flex-1 space-y-6">
          <div className="max-w-3xl mx-auto bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b-2 border-slate-900">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 block">
                  Executive Cash Flow &amp; Reserve Statement
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Monthly Financial Health Statement
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Reporting Period: <strong>{currentOptions.monthName}</strong> &bull; Cycle Day {currentOptions.dayOfMonth} of {currentOptions.totalDaysInMonth} ({currentOptions.daysRemaining} days remaining)
                </p>
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <HeartPulse className="w-3.5 h-3.5" />
                    Health Status: {currentOptions.healthStatus}
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs text-slate-600 space-y-1">
                <div>Client: <strong>{clientName}</strong></div>
                <div>Accountant: <strong>{accountantName}</strong></div>
                <div>Currency: <strong>{currCode} ({symbol})</strong></div>
                <div>Date: <strong>{new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}</strong></div>
              </div>
            </div>

            {/* KPI Summary 3-Column Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 border-l-4 border-l-emerald-500">
                <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider block">
                  Gross Inflows
                </span>
                <div className="text-xl font-extrabold text-emerald-700 mt-1">
                  +{fmt(currentOptions.totalIncome)}
                </div>
                <span className="text-[11px] text-emerald-600 block mt-0.5">
                  {currentOptions.incomeCount} transactions
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200 border-l-4 border-l-rose-500">
                <span className="text-[10px] font-bold uppercase text-rose-800 tracking-wider block">
                  Total Expenses
                </span>
                <div className="text-xl font-extrabold text-rose-700 mt-1">
                  -{fmt(currentOptions.totalExpenses)}
                </div>
                <span className="text-[11px] text-rose-600 block mt-0.5">
                  {currentOptions.expenseCount} outflows (~{fmt(currentOptions.dailyAverageExpense)}/day)
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 border-l-4 border-l-blue-500">
                <span className="text-[10px] font-bold uppercase text-blue-800 tracking-wider block">
                  Net Cash Margin
                </span>
                <div className="text-xl font-extrabold text-blue-700 mt-1">
                  {currentOptions.netSavings >= 0 ? '+' : ''}{fmt(currentOptions.netSavings)}
                </div>
                <span className="text-[11px] text-blue-600 block mt-0.5 font-bold">
                  {currentOptions.savingsRate}% Retention Rate
                </span>
              </div>
            </div>

            {/* Target Goal Progress */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>🎯 Monthly Net Savings Target: {fmt(currentOptions.targetGoal)}</span>
                <span className={currentOptions.isGoalMet ? 'text-emerald-600' : 'text-blue-600'}>
                  {currentOptions.goalPercent}% Attained {currentOptions.isGoalMet && '✓ Goal Reached!'}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, currentOptions.goalPercent)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Accumulated Reserve: <strong>{fmt(currentOptions.netSavings)}</strong></span>
                <span>{currentOptions.healthMessage}</span>
              </div>
            </div>

            {/* Run-Rate Velocity Forecast */}
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold tracking-tight flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Month-End Run-Rate Forecast
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {currentOptions.isForecastOnTrack ? '🎯 On Track for Goal' : '⚠️ Run-Rate Attention'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-medium">Projected Month-End Savings</span>
                  <div className="text-base font-extrabold text-emerald-400 mt-0.5">
                    {currentOptions.projectedMonthEndSavings >= 0 ? '+' : ''}{fmt(currentOptions.projectedMonthEndSavings)}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-medium">Projected Total Outflows</span>
                  <div className="text-base font-extrabold text-rose-300 mt-0.5">
                    {fmt(currentOptions.projectedMonthEndExpense)}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-medium">Safe Daily Spend Cap</span>
                  <div className="text-base font-extrabold text-teal-300 mt-0.5">
                    {fmt(currentOptions.safeDailySpendCap)}/day
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200">
                Expense Category Allocation
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-1.5 font-bold">Category</th>
                      <th className="pb-1.5 font-bold text-right">Amount</th>
                      <th className="pb-1.5 font-bold text-right">% Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOptions.categoryBreakdown.map((c, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-1.5 font-semibold text-slate-800">{c.name}</td>
                        <td className="py-1.5 text-right font-bold text-slate-900">{fmt(c.value)}</td>
                        <td className="py-1.5 text-right text-slate-600 font-medium">{c.percent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-4 border-t border-dashed border-slate-300 grid grid-cols-2 gap-8 text-xs text-slate-500">
              <div>
                <div className="font-bold text-slate-800 mb-1">Prepared By:</div>
                <div className="border-b border-slate-400 h-8 mb-1" />
                <div className="flex justify-between text-[11px]">
                  <span>{clientName}</span>
                  <span>Date: _________</span>
                </div>
              </div>
              <div>
                <div className="font-bold text-slate-800 mb-1">Accountant / CPA Verification:</div>
                <div className="border-b border-slate-400 h-8 mb-1" />
                <div className="flex justify-between text-[11px]">
                  <span>{accountantName}</span>
                  <span>Date: _________</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 dark:text-slate-400">
            Click <strong>Print / Export PDF</strong> to save via system PDF printer or send directly to your accountant.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
