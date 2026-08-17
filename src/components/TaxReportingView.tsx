import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Sparkles,
  ShieldCheck,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Loader2,
  Calendar,
  Layers,
  HelpCircle,
  Upload,
  Globe,
} from 'lucide-react';
import { Transaction, SecurityConfig, AITaxAnalysisResult, CurrencyConfig } from '../types';
import { analyzeTaxWithAI } from '../services/aiService';
import {
  printTaxScheduleReport,
  downloadTransactionsCSV,
  downloadJSONBackup,
} from '../services/exportService';
import { formatCurrency, convertAmount } from '../services/currencyService';

interface TaxReportingViewProps {
  transactions: Transaction[];
  securityConfig: SecurityConfig;
  currencyConfig: CurrencyConfig;
  onRestoreJSONBackup: (data: any) => void;
}

export const TaxReportingView: React.FC<TaxReportingViewProps> = ({
  transactions,
  securityConfig,
  currencyConfig,
  onRestoreJSONBackup,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [filingStatus, setFilingStatus] = useState<'Single' | 'Married Filing Jointly' | 'Head of Household'>('Single');
  const [taxAnalysis, setTaxAnalysis] = useState<AITaxAnalysisResult | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [annualIncomeInput, setAnnualIncomeInput] = useState<string>('');

  // Currency helper
  const toDisplay = (amount: number, fromCurrency: string = 'USD'): number => {
    return convertAmount(amount, fromCurrency as any, currencyConfig.displayCurrency, currencyConfig.customRates);
  };

  // Filter transactions for selected year
  const yearTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(String(selectedYear)));
  }, [transactions, selectedYear]);

  // Calculate tax totals in display currency
  const taxSummary = useMemo(() => {
    let grossIncome = 0;
    let totalExpense = 0;
    let deductibleExpense = 0;

    const deductibleByCategory: Record<string, { total: number; count: number; items: Transaction[] }> = {};

    for (const t of yearTransactions) {
      const rawAmt = Number(t.amount) || 0;
      const amt = toDisplay(rawAmt, t.currency || 'USD');

      if (t.type === 'income') {
        grossIncome += amt;
      } else {
        totalExpense += amt;
        if (t.isTaxDeductible) {
          deductibleExpense += amt;
          const cat = t.taxCategory || t.category || 'General Business Deduction';
          if (!deductibleByCategory[cat]) {
            deductibleByCategory[cat] = { total: 0, count: 0, items: [] };
          }
          deductibleByCategory[cat].total += amt;
          deductibleByCategory[cat].count += 1;
          deductibleByCategory[cat].items.push(t);
        }
      }
    }

    const netTaxableIncome = Math.max(0, grossIncome - deductibleExpense);
    const estimatedTaxSavings = deductibleExpense * 0.24;

    return {
      grossIncome,
      totalExpense,
      deductibleExpense,
      netTaxableIncome,
      estimatedTaxSavings,
      deductibleByCategory,
      deductibleCount: yearTransactions.filter((t) => t.isTaxDeductible).length,
    };
  }, [yearTransactions, currencyConfig]);

  // Load AI Tax Strategy Report
  const handleRunAITaxStrategy = async () => {
    setIsLoadingAI(true);
    try {
      const customIncome = annualIncomeInput ? parseFloat(annualIncomeInput) : undefined;
      const res = await analyzeTaxWithAI(yearTransactions, customIncome, filingStatus);
      setTaxAnalysis(res);
    } catch (e) {
      console.warn('AI Tax analysis failed:', e);
    } finally {
      setIsLoadingAI(false);
    }
  };

  useEffect(() => {
    if (yearTransactions.length > 0) {
      handleRunAITaxStrategy();
    }
  }, [selectedYear]);

  const maskValue = (val: number, isCurrency = true) => {
    if (securityConfig.privacyBlur) return '••••••';
    return isCurrency
      ? formatCurrency(val, currencyConfig.displayCurrency, {
          fromCurrency: currencyConfig.displayCurrency,
          customRates: currencyConfig.customRates,
        })
      : val.toString();
  };

  const handleJSONFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target?.result as string);
          onRestoreJSONBackup(parsed);
          alert('Backup restored successfully!');
        } catch (err) {
          alert('Invalid JSON backup file');
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Tax Reporting &amp; IRS Write-Offs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Certified Schedule C &amp; Form 1040 deduction ledgers with export tools
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-100 dark:bg-slate-700 text-xs font-semibold px-3 py-2 rounded-xl text-slate-900 dark:text-white border-transparent focus:ring-2 focus:ring-emerald-500"
          >
            {[2026, 2025, 2024, 2023].map((yr) => (
              <option key={yr} value={yr}>
                Tax Year {yr}
              </option>
            ))}
          </select>

          {/* Print PDF Button */}
          <button
            onClick={() => printTaxScheduleReport(yearTransactions, selectedYear)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Tax Schedule</span>
          </button>
        </div>
      </div>

      {/* Tax Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Gross Revenue
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {maskValue(taxSummary.grossIncome)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">1099, client fees &amp; wage inflow</p>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-teal-200 dark:border-teal-800/80 bg-teal-50/40 dark:bg-teal-950/20 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Eligible Deductions
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400 mt-2">
            {maskValue(taxSummary.deductibleExpense)}
          </div>
          <p className="text-[11px] text-teal-600/80 dark:text-teal-400/80 mt-1">
            {taxSummary.deductibleCount} itemized write-off entries
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Est. Net Taxable Income
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">
            {maskValue(taxSummary.netTaxableIncome)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Gross Inflow minus Deductions</p>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            Est. Tax Saved (~24%)
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {maskValue(taxSummary.estimatedTaxSavings)}
          </div>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">
            Estimated cash retained via write-offs
          </p>
        </div>
      </div>

      {/* AI Tax Strategist & Audit Risk Analyzer */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-white p-6 rounded-3xl border border-emerald-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-750 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                Gemini AI Tax Strategist &amp; Audit Risk Model
              </h2>
              <p className="text-xs text-slate-400">
                IRS compliance checking &amp; tax deduction optimization
              </p>
            </div>
          </div>

          <button
            onClick={handleRunAITaxStrategy}
            disabled={isLoadingAI}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
          >
            {isLoadingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Refresh Analysis</span>
          </button>
        </div>

        {taxAnalysis && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Actionable Tax Tips */}
            <div className="md:col-span-2 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Actionable Tax Strategies &amp; IRS Write-Off Tips
              </span>
              <ul className="space-y-2 text-xs text-slate-300">
                {taxAnalysis.actionableTaxTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Audit Risk & Quarterly Estimated Tax */}
            <div className="space-y-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  IRS Audit Risk Assessment
                </span>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                      taxAnalysis.auditRiskScore === 'Low'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}
                  >
                    {taxAnalysis.auditRiskScore} Risk Profile
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  {taxAnalysis.auditRiskReason}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-700/60">
                <span className="text-[11px] text-slate-400 block">
                  Recommended Qtr Estimated Tax
                </span>
                <span className="text-lg font-extrabold text-emerald-400">
                  ${taxAnalysis.quarterlyEstimatedTaxRecommendation.toLocaleString()} / qtr
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Schedule C Category Breakdown Table */}
      <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Schedule C Deduction Breakdown ({selectedYear})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aggregated write-offs grouped by IRS expense classification
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="p-3">IRS / Tax Category</th>
                <th className="p-3 text-center">Item Count</th>
                <th className="p-3 text-right">Deductible Total</th>
                <th className="p-3 text-right">Est. Tax Retained (~24%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {Object.keys(taxSummary.deductibleByCategory).length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400 text-xs">
                    No tax-deductible expenses recorded for {selectedYear}.
                  </td>
                </tr>
              ) : (
                Object.entries(taxSummary.deductibleByCategory).map(([cat, rawData]) => {
                  const data = rawData as { total: number; count: number; items: Transaction[] };
                  return (
                    <tr key={cat} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                        {cat}
                      </td>
                      <td className="p-3 text-center text-slate-500">
                        {data.count} items
                      </td>
                      <td className="p-3 text-right font-bold text-teal-600 dark:text-teal-400">
                        {maskValue(data.total)}
                      </td>
                      <td className="p-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {maskValue(data.total * 0.24)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export & Data Portability Suite */}
      <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Data Export &amp; Backup Suite
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Export your verified records for accountants, CPA tax software, or encrypted offline storage
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* CSV Export */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
            <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-500" /> Tax &amp; Finance CSV
            </h4>
            <p className="text-[11px] text-slate-500">
              Complete spreadsheet file compatible with Excel, Google Sheets, and TurboTax.
            </p>
            <button
              onClick={() => downloadTransactionsCSV(yearTransactions, `tax_report_${selectedYear}`)}
              className="w-full mt-2 py-2 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition-colors"
            >
              Download Tax CSV
            </button>
          </div>

          {/* Printable Report */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
            <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-blue-500" /> Printable PDF Schedule
            </h4>
            <p className="text-[11px] text-slate-500">
              Formatted IRS Schedule C itemized statement ready to attach to tax returns.
            </p>
            <button
              onClick={() => printTaxScheduleReport(yearTransactions, selectedYear)}
              className="w-full mt-2 py-2 px-3 text-xs font-semibold bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Generate Printable Statement
            </button>
          </div>

          {/* JSON Full Backup */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
            <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-violet-500" /> JSON Backup &amp; Restore
            </h4>
            <p className="text-[11px] text-slate-500">
              Full structured database backup including custom categories and budgets.
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => downloadJSONBackup({ transactions, timestamp: new Date().toISOString() })}
                className="flex-1 py-2 px-2 text-xs font-semibold bg-slate-200 dark:bg-slate-750 text-slate-800 dark:text-slate-200 hover:bg-slate-300 rounded-xl transition-colors"
              >
                Export JSON
              </button>
              <label className="flex-1 py-2 px-2 text-xs font-semibold bg-slate-200 dark:bg-slate-750 text-slate-800 dark:text-slate-200 hover:bg-slate-300 rounded-xl transition-colors text-center cursor-pointer">
                Restore
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleJSONFileImport}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
