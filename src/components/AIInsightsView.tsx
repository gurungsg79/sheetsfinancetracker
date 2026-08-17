import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  DollarSign,
  Send,
  Loader2,
  HelpCircle,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';
import {
  AIInsight,
  AIChatMessage,
  Transaction,
  RecurringTransaction,
  BudgetGoal,
  SecurityConfig,
  CurrencyConfig,
} from '../types';
import {
  fetchFinancialInsights,
  askAIFinancialAdvisor,
} from '../services/aiService';
import { formatCurrency, convertAmount } from '../services/currencyService';

interface AIInsightsViewProps {
  transactions: Transaction[];
  recurringList: RecurringTransaction[];
  budgets: BudgetGoal[];
  securityConfig: SecurityConfig;
  currencyConfig: CurrencyConfig;
  onNavigateTab: (tab: any) => void;
}

export const AIInsightsView: React.FC<AIInsightsViewProps> = ({
  transactions,
  recurringList,
  budgets,
  securityConfig,
  currencyConfig,
  onNavigateTab,
}) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [forecast, setForecast] = useState<{
    projectedSavings: number;
    savingsRatePercent: number;
    runwayHealth: 'Excellent' | 'Good' | 'Needs Attention';
    keyTakeaway: string;
  } | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: "Hello! I'm your Gemini Financial Advisor. I continuously analyze your Google Sheets ledger, recurring commitments, and budget limits. Ask me anything about spending optimization, tax strategies, or cash flow forecasting.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedPrompts: [
        'How can I optimize my monthly software subscriptions?',
        'What are my highest business tax write-offs this year?',
        'How can I increase my monthly savings rate to 30%?',
      ],
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAskingAdvisor, setIsAskingAdvisor] = useState(false);

  // Convert amount helper
  const toDisplay = (amount: number, fromCurrency: string = 'USD'): number => {
    return convertAmount(amount, fromCurrency as any, currencyConfig.displayCurrency, currencyConfig.customRates);
  };

  const loadInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const res = await fetchFinancialInsights(transactions, recurringList, budgets);
      setInsights(res.insights || []);
      setForecast(res.monthlyCashflowForecast || null);
    } catch (e) {
      console.warn('Failed to load AI insights:', e);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, [transactions.length, recurringList.length, budgets.length]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || chatInput;
    if (!query.trim() || isAskingAdvisor) return;

    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsAskingAdvisor(true);

    try {
      const totalIncome = transactions
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + toDisplay(t.amount, t.currency || 'USD'), 0);
      const totalExpense = transactions
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + toDisplay(t.amount, t.currency || 'USD'), 0);

      const summary = {
        totalIncome,
        totalExpense,
        netCashflow: totalIncome - totalExpense,
        activeRecurringCount: recurringList.filter((r) => r.isActive).length,
        budgetCount: budgets.length,
      };

      const historyFormatted = messages.slice(-4).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await askAIFinancialAdvisor(query.trim(), historyFormatted, summary);

      const aiMsg: AIChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts: res.suggestedPrompts,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsAskingAdvisor(false);
    }
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Gemini AI Financial Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Proactive cash flow forecasting, subscription audits, and interactive advisory
            </p>
          </div>
        </div>

        <button
          onClick={loadInsights}
          disabled={isLoadingInsights}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingInsights ? 'animate-spin' : ''}`} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Cash Flow Forecast Card */}
      {forecast && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-white p-6 rounded-3xl border border-emerald-500/20 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-750 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              Monthly Cash Flow &amp; Runway Forecast
            </span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                forecast.runwayHealth === 'Excellent'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : forecast.runwayHealth === 'Good'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {forecast.runwayHealth} Runway Health
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <span className="text-xs text-slate-400">Projected Net Monthly Savings</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
                {maskValue(forecast.projectedSavings)}
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400">Savings Retention Efficiency</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {forecast.savingsRatePercent}%
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400">AI Key Takeaway</span>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {forecast.keyTakeaway}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Insights Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((ins) => {
          const isWarning = ins.type === 'spending_anomaly' || ins.urgency === 'high';
          const isSubscription = ins.type === 'subscription_audit';
          const isTax = ins.type === 'tax_boost';

          return (
            <div
              key={ins.id}
              className={`p-5 rounded-2xl border transition-all space-y-3 bg-white dark:bg-slate-800/80 ${
                isWarning
                  ? 'border-amber-200 dark:border-amber-700/60'
                  : 'border-slate-200 dark:border-slate-700/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isWarning
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                        : isSubscription
                        ? 'bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400'
                        : isTax
                        ? 'bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400'
                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                    }`}
                  >
                    {isWarning ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : isSubscription ? (
                      <Layers className="w-4 h-4" />
                    ) : isTax ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : (
                      <Lightbulb className="w-4 h-4" />
                    )}
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {ins.title}
                  </h3>
                </div>

                {ins.impactAmount && ins.impactAmount > 0 && (
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg">
                    ~{maskValue(ins.impactAmount)}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {ins.summary}
              </p>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">{ins.actionRecommendation}</span>
                {isSubscription && (
                  <button
                    onClick={() => onNavigateTab('recurring')}
                    className="text-violet-600 dark:text-violet-400 font-bold hover:underline flex items-center gap-1"
                  >
                    Recurring <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                {isTax && (
                  <button
                    onClick={() => onNavigateTab('tax')}
                    className="text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-1"
                  >
                    Tax Report <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive AI Financial Advisor Chat Console */}
      <div className="bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Ask Gemini Financial Advisor
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Interactive Q&amp;A on tax optimization, budget thresholds, and cash flow formulas
            </p>
          </div>
        </div>

        {/* Message Log */}
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-xs'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-bl-xs border border-slate-200 dark:border-slate-800 whitespace-pre-line'
                }`}
              >
                {m.text}
              </div>

              {m.suggestedPrompts && m.suggestedPrompts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
                  {m.suggestedPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(p)}
                      className="text-[11px] px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition-colors"
                    >
                      {p} &rarr;
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isAskingAdvisor && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 dark:bg-slate-900 p-3 rounded-2xl w-fit">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              <span>Analyzing ledger &amp; generating recommendation...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 pt-2"
        >
          <input
            type="text"
            placeholder="Ask anything about your expenses, taxes, or savings pacing..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || isAskingAdvisor}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
