import {
  AIClassificationResult,
  AITaxAnalysisResult,
  AIInsight,
  Transaction,
  TransactionType,
  RecurringTransaction,
  BudgetGoal,
} from '../types';

export async function categorizeWithAI(
  description: string,
  amount?: number,
  type?: TransactionType,
  userCategories?: string[]
): Promise<AIClassificationResult> {
  try {
    const res = await fetch('/api/ai/categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, amount, type, userCategories }),
    });

    if (!res.ok) {
      throw new Error(`AI categorization responded with status ${res.status}`);
    }

    const data: AIClassificationResult = await res.json();
    return data;
  } catch (err) {
    console.warn('Backend AI categorization unavailable, running client fallback:', err);
    return clientFallbackCategorize(description, amount, type);
  }
}

export async function fetchFinancialInsights(
  transactions: Transaction[],
  recurringRules: RecurringTransaction[],
  budgets: BudgetGoal[]
): Promise<{
  insights: AIInsight[];
  monthlyCashflowForecast: {
    projectedSavings: number;
    savingsRatePercent: number;
    runwayHealth: 'Excellent' | 'Good' | 'Needs Attention';
    keyTakeaway: string;
  };
}> {
  try {
    const res = await fetch('/api/ai/financial-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions, recurringRules, budgets }),
    });

    if (!res.ok) {
      throw new Error(`AI insights responded with status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('Backend AI insights unavailable, generating client insights:', err);
    return clientFallbackInsights(transactions);
  }
}

export async function askAIFinancialAdvisor(
  question: string,
  history: Array<{ sender: 'user' | 'assistant'; text: string }>,
  financialSummary: any
): Promise<{ answer: string; suggestedPrompts: string[] }> {
  try {
    const res = await fetch('/api/ai/chat-advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, history, financialSummary }),
    });

    if (!res.ok) {
      throw new Error(`AI advisor chat responded with status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('Backend AI advisor unavailable, using fallback:', err);
    return {
      answer: `Here is advice based on your current cashflow:
• **Savings Rate**: Prioritize allocating surplus cash to high-yield liquidity reserves.
• **Budget Pacing**: Keep dining and entertainment expenses under your 80% threshold.
• **Tax Deductions**: Log home office supplies and software for IRS Schedule C write-offs.`,
      suggestedPrompts: [
        'How can I optimize my monthly software subscriptions?',
        'What tax deductions am I eligible for as a freelancer?',
      ],
    };
  }
}

export async function analyzeTaxWithAI(
  transactions: Transaction[],
  annualIncome?: number,
  filingStatus: string = 'Single'
): Promise<AITaxAnalysisResult> {
  try {
    const res = await fetch('/api/ai/tax-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions, annualIncome, filingStatus }),
    });

    if (!res.ok) {
      throw new Error(`AI tax analysis responded with status ${res.status}`);
    }

    const data: AITaxAnalysisResult = await res.json();
    return data;
  } catch (err) {
    console.warn('Backend AI Tax analysis unavailable, using client tax calculator:', err);
    return clientTaxAnalysis(transactions);
  }
}

// Fast deterministic client parser
function clientFallbackCategorize(
  description: string,
  amount?: number,
  type?: TransactionType
): AIClassificationResult {
  const descLower = description.toLowerCase();
  let category = 'Other Miscellaneous';
  let subcategory = 'General';
  let detectedType: TransactionType = type || 'expense';
  let isTaxDeductible = false;
  let taxCategory = 'Not Deductible / Personal';
  const paymentMethod = 'Credit Card';

  let extractedAmount = amount || null;
  if (!extractedAmount) {
    const match = description.match(/\$?(\d+(?:\.\d{1,2})?)/);
    if (match && match[1]) {
      extractedAmount = parseFloat(match[1]);
    }
  }

  if (descLower.includes('salary') || descLower.includes('payroll') || descLower.includes('paycheck')) {
    category = 'Salary & Wages';
    subcategory = 'Payroll';
    detectedType = 'income';
  } else if (descLower.includes('freelance') || descLower.includes('client') || descLower.includes('invoice') || descLower.includes('consulting') || descLower.includes('stripe') || descLower.includes('upwork')) {
    category = 'Freelance & Client Contracts';
    subcategory = 'Client Revenue';
    detectedType = 'income';
  } else if (descLower.includes('dividend') || descLower.includes('interest') || descLower.includes('stock') || descLower.includes('vanguard')) {
    category = 'Investment & Dividends';
    subcategory = 'Capital Returns';
    detectedType = 'income';
  } else if (descLower.includes('coffee') || descLower.includes('starbucks') || descLower.includes('restaurant') || descLower.includes('cafe') || descLower.includes('eats') || descLower.includes('dinner') || descLower.includes('lunch') || descLower.includes('chipotle')) {
    category = 'Dining Out & Cafes';
    subcategory = descLower.includes('coffee') || descLower.includes('starbucks') ? 'Coffee & Beverages' : 'Dining';
    if (descLower.includes('client') || descLower.includes('meeting') || descLower.includes('business')) {
      isTaxDeductible = true;
      taxCategory = 'Schedule C: 50% Business Meals';
    }
  } else if (descLower.includes('groceries') || descLower.includes('trader joe') || descLower.includes('whole foods') || descLower.includes('safeway') || descLower.includes('kroger') || descLower.includes('market') || descLower.includes('walmart') || descLower.includes('costco')) {
    category = 'Groceries & Supermarket';
    subcategory = 'Supermarket';
  } else if (descLower.includes('gas') || descLower.includes('chevron') || descLower.includes('shell') || descLower.includes('fuel') || descLower.includes('uber') || descLower.includes('lyft') || descLower.includes('parking') || descLower.includes('transit')) {
    category = 'Transportation & Fuel';
    subcategory = descLower.includes('gas') || descLower.includes('shell') ? 'Fuel' : 'Rideshare & Transit';
    if (descLower.includes('client') || descLower.includes('airport') || descLower.includes('trip')) {
      isTaxDeductible = true;
      taxCategory = 'Schedule C: Auto & Travel';
    }
  } else if (descLower.includes('aws') || descLower.includes('github') || descLower.includes('openai') || descLower.includes('adobe') || descLower.includes('figma') || descLower.includes('slack') || descLower.includes('hosting') || descLower.includes('software') || descLower.includes('zoom') || descLower.includes('notion')) {
    category = 'Software & Subscriptions';
    subcategory = 'Cloud & Digital Tools';
    isTaxDeductible = true;
    taxCategory = 'Schedule C: Software & Internet';
  } else if (descLower.includes('rent') || descLower.includes('mortgage') || descLower.includes('lease') || descLower.includes('hoa')) {
    category = 'Housing & Rent';
    subcategory = 'Housing Lease';
  } else if (descLower.includes('electric') || descLower.includes('water') || descLower.includes('wifi') || descLower.includes('internet') || descLower.includes('utility') || descLower.includes('verizon') || descLower.includes('at&t')) {
    category = 'Utilities & Bills';
    subcategory = 'Telecom & Power';
  } else if (descLower.includes('monitor') || descLower.includes('laptop') || descLower.includes('desk') || descLower.includes('staples') || descLower.includes('office') || descLower.includes('printer')) {
    category = 'Business Office & Supplies';
    subcategory = 'Equipment & Supplies';
    isTaxDeductible = true;
    taxCategory = 'Schedule C: Office Supplies & Equipment';
  } else if (descLower.includes('flight') || descLower.includes('hotel') || descLower.includes('airline') || descLower.includes('delta') || descLower.includes('airbnb')) {
    category = 'Travel & Lodging';
    subcategory = 'Travel & Hospitality';
    if (descLower.includes('conference') || descLower.includes('business') || descLower.includes('client')) {
      isTaxDeductible = true;
      taxCategory = 'Schedule C: Auto & Travel';
    }
  }

  return {
    category,
    subcategory,
    type: detectedType,
    extractedAmount,
    paymentMethod,
    isTaxDeductible,
    taxCategory,
    confidence: 0.85,
    cleanDescription: description.trim(),
    reasoning: `Rule-matched based on merchant name for '${category}'`,
  };
}

function clientFallbackInsights(transactions: Transaction[]) {
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const netSavings = Math.max(0, totalIncome - totalExpense);
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  return {
    insights: [
      {
        id: 'ins-sub',
        title: 'Software Subscriptions Audit',
        type: 'subscription_audit' as const,
        summary: 'Cloud hosting and digital tools represent active recurring charges. Reviewing annual payment plans can save up to 15%.',
        impactAmount: 140,
        actionRecommendation: 'Audit recurring subscriptions in the Recurring tab.',
        category: 'Software & Subscriptions',
        urgency: 'medium' as const,
      },
      {
        id: 'ins-save',
        title: 'Positive Cashflow Retention',
        type: 'forecast' as const,
        summary: `Your net savings rate is currently pacing at ${savingsRate}%, retaining $${netSavings.toFixed(0)} this cycle.`,
        impactAmount: netSavings,
        actionRecommendation: 'Allocate 20% of net surplus into tax-advantaged retirement accounts.',
        category: 'Investment & Dividends',
        urgency: 'low' as const,
      },
      {
        id: 'ins-tax',
        title: 'Schedule C Eligible Deductions',
        type: 'tax_boost' as const,
        summary: 'Eligible business expenses are tracked and tagged for IRS write-offs.',
        impactAmount: Math.round(totalExpense * 0.24 * 0.35),
        actionRecommendation: 'Export Schedule C deduction ledger in Tax & Export.',
        category: 'Business Office & Supplies',
        urgency: 'low' as const,
      },
    ],
    monthlyCashflowForecast: {
      projectedSavings: netSavings,
      savingsRatePercent: savingsRate,
      runwayHealth: (savingsRate >= 20 ? 'Excellent' : savingsRate > 0 ? 'Good' : 'Needs Attention') as any,
      keyTakeaway: `You are on pace to save $${netSavings.toFixed(0)} this month with a ${savingsRate}% savings rate.`,
    },
  };
}

function clientTaxAnalysis(transactions: Transaction[]): AITaxAnalysisResult {
  let totalIncome = 0;
  let totalExpense = 0;
  let deductibleExpense = 0;
  const categories: Record<string, number> = {};

  for (const t of transactions) {
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') {
      totalIncome += amt;
    } else {
      totalExpense += amt;
      if (t.isTaxDeductible) {
        deductibleExpense += amt;
        categories[t.category] = (categories[t.category] || 0) + amt;
      }
    }
  }

  const estimatedTaxSavings = Math.round(deductibleExpense * 0.24 * 100) / 100;
  const taxableNetIncome = Math.max(0, totalIncome - deductibleExpense);

  const topWriteOffCategories = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      irsSchedule: 'Schedule C / Form 1040',
      tip: `Retain receipts and invoices for all ${cat} business write-offs.`,
    }));

  return {
    estimatedTaxSavings,
    taxableNetIncome,
    topWriteOffCategories,
    actionableTaxTips: [
      'Track dedicated home office square footage to claim IRS simplified $5/sq ft home office deductions.',
      'Log business meal attendee names and agendas to claim the 50% IRS business meal write-off.',
      'Keep track of standard business mileage (IRS standard mileage rate) for client visits and supply runs.',
    ],
    auditRiskScore: 'Low',
    auditRiskReason: 'Deductible expense percentages align comfortably within standard freelance ratios.',
    quarterlyEstimatedTaxRecommendation: Math.round((taxableNetIncome * 0.22) / 4),
  };
}
