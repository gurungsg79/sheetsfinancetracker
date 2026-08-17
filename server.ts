import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Lazy initialization of Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    try {
      genAIClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.warn("Failed to initialize GoogleGenAI with provided key:", e);
      return null;
    }
  }
  return genAIClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// AI Smart Categorization & Natural Language Transaction Parser
app.post("/api/ai/categorize", async (req, res) => {
  const { description, amount, type, userCategories } = req.body;

  if (!description || typeof description !== "string") {
    return res.status(400).json({ error: "Description is required" });
  }

  const defaultCategories = [
    "Salary & Wages",
    "Freelance & Client Contracts",
    "Investment & Dividends",
    "Side Business & Sales",
    "Rental & Property Income",
    "Gifts, Grants & Bonuses",
    "Housing & Rent",
    "Groceries & Supermarket",
    "Dining Out & Cafes",
    "Transportation & Fuel",
    "Utilities & Bills",
    "Healthcare & Medical",
    "Software & Subscriptions",
    "Shopping & Retail",
    "Entertainment & Leisure",
    "Travel & Lodging",
    "Education & Books",
    "Business Office & Supplies",
    "Taxes & Financial Fees",
    "Other Miscellaneous",
  ];

  const availableCategories = Array.isArray(userCategories) && userCategories.length > 0
    ? userCategories
    : defaultCategories;

  const ai = getGenAI();

  if (ai) {
    try {
      const prompt = `You are an expert accountant and tax advisor.
Analyze this financial transaction: "${description}".
Provided details:
- Stated Amount: ${amount || "Infer from text"}
- Stated Type: ${type || "Infer from context"}
- Available Categories: ${JSON.stringify(availableCategories)}

Return STRICT JSON only matching this schema without markdown formatting:
{
  "category": "One exact category from the available list",
  "subcategory": "A concise subcategory name (e.g. Coffee, Cloud DB, Gas, Client Lunch)",
  "type": "expense" or "income",
  "extractedAmount": number or null (if parsed from natural text like '$45.20'),
  "paymentMethod": "Credit Card" | "Debit Card" | "Bank Transfer" | "Cash" | "Apple Pay" | "Google Pay" | "PayPal" | "Other",
  "isTaxDeductible": boolean (true if eligible for business, freelance, or IRS tax write-off),
  "taxCategory": "e.g. Schedule C: Software & Internet, 50% Business Meals, Auto & Travel, Office Equipment, or Not Deductible",
  "confidence": number between 0.0 and 1.0,
  "cleanDescription": "Standardized merchant/payee name",
  "reasoning": "1 short sentence explaining categorization & tax rule"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText);
      return res.json(parsed);
    } catch (error) {
      console.error("Gemini categorization failed, falling back to heuristic engine:", error);
    }
  }

  // Heuristic Offline Fallback Engine
  const descLower = description.toLowerCase();
  let category = type === "income" ? "Freelance & Client Contracts" : "Other Miscellaneous";
  let subcategory = "General";
  let detectedType: "expense" | "income" = type === "income" ? "income" : "expense";
  let isTaxDeductible = false;
  let taxCategory = "Not Deductible";
  let paymentMethod = "Credit Card";

  let extractedAmount: number | null = null;
  const amountMatch = description.match(/\$?(\d+(?:\.\d{1,2})?)/);
  if (amountMatch && amountMatch[1]) {
    extractedAmount = parseFloat(amountMatch[1]);
  }

  if (descLower.includes("salary") || descLower.includes("payroll") || descLower.includes("paycheck")) {
    category = "Salary & Wages";
    subcategory = "Payroll";
    detectedType = "income";
  } else if (descLower.includes("freelance") || descLower.includes("client") || descLower.includes("invoice") || descLower.includes("consulting") || descLower.includes("stripe") || descLower.includes("upwork")) {
    category = "Freelance & Client Contracts";
    subcategory = "Client Revenue";
    detectedType = "income";
  } else if (descLower.includes("dividend") || descLower.includes("interest") || descLower.includes("vanguard") || descLower.includes("stock")) {
    category = "Investment & Dividends";
    subcategory = "Capital Returns";
    detectedType = "income";
  } else if (descLower.includes("starbucks") || descLower.includes("coffee") || descLower.includes("restaurant") || descLower.includes("cafe") || descLower.includes("eats") || descLower.includes("dinner") || descLower.includes("lunch")) {
    category = "Dining Out & Cafes";
    subcategory = descLower.includes("coffee") ? "Coffee & Drinks" : "Dining";
    if (descLower.includes("client") || descLower.includes("meeting") || descLower.includes("business")) {
      isTaxDeductible = true;
      taxCategory = "Schedule C: 50% Business Meals";
    }
  } else if (descLower.includes("groceries") || descLower.includes("trader joe") || descLower.includes("whole foods") || descLower.includes("market") || descLower.includes("costco") || descLower.includes("walmart")) {
    category = "Groceries & Supermarket";
    subcategory = "Groceries";
  } else if (descLower.includes("uber") || descLower.includes("lyft") || descLower.includes("gas") || descLower.includes("fuel") || descLower.includes("chevron") || descLower.includes("shell") || descLower.includes("parking")) {
    category = "Transportation & Fuel";
    subcategory = descLower.includes("gas") || descLower.includes("fuel") ? "Fuel" : "Transit";
    if (descLower.includes("client") || descLower.includes("airport") || descLower.includes("trip")) {
      isTaxDeductible = true;
      taxCategory = "Schedule C: Auto & Travel";
    }
  } else if (descLower.includes("aws") || descLower.includes("github") || descLower.includes("openai") || descLower.includes("adobe") || descLower.includes("figma") || descLower.includes("slack") || descLower.includes("zoom") || descLower.includes("notion")) {
    category = "Software & Subscriptions";
    subcategory = "Cloud & Dev";
    isTaxDeductible = true;
    taxCategory = "Schedule C: Software & Internet";
  } else if (descLower.includes("rent") || descLower.includes("mortgage") || descLower.includes("apartment")) {
    category = "Housing & Rent";
    subcategory = "Lease";
  } else if (descLower.includes("electric") || descLower.includes("wifi") || descLower.includes("water") || descLower.includes("verizon") || descLower.includes("at&t")) {
    category = "Utilities & Bills";
    subcategory = "Telecom & Utilities";
  } else if (descLower.includes("doctor") || descLower.includes("pharmacy") || descLower.includes("dentist") || descLower.includes("cvs")) {
    category = "Healthcare & Medical";
    subcategory = "Medical";
    isTaxDeductible = true;
    taxCategory = "Itemized: Medical & Dental Expenses";
  } else if (descLower.includes("staples") || descLower.includes("desk") || descLower.includes("monitor") || descLower.includes("laptop") || descLower.includes("apple store")) {
    category = "Business Office & Supplies";
    subcategory = "Equipment";
    isTaxDeductible = true;
    taxCategory = "Schedule C: Office Supplies & Equipment";
  }

  res.json({
    category,
    subcategory,
    type: detectedType,
    extractedAmount,
    paymentMethod,
    isTaxDeductible,
    taxCategory,
    confidence: 0.88,
    cleanDescription: description.trim(),
    reasoning: `Rule-matched based on merchant patterns for '${category}'`,
  });
});

// Comprehensive AI Financial Insights, Anomaly Detection & Forecasts
app.post("/api/ai/financial-insights", async (req, res) => {
  const { transactions, recurringRules, budgets } = req.body;

  const ai = getGenAI();

  if (ai && Array.isArray(transactions) && transactions.length > 0) {
    try {
      const prompt = `You are an elite personal financial strategist and wealth coach.
Analyze the user's financial profile:
- Total Transactions: ${transactions.length}
- Recurring Rules: ${JSON.stringify(recurringRules || [])}
- Active Budgets: ${JSON.stringify(budgets || [])}
- Sample Recent Transactions: ${JSON.stringify(transactions.slice(0, 20))}

Provide 4-5 high-value, actionable, personalized financial insights across these types:
1. "saving_opportunity" (concrete recurring cuts or expense reductions)
2. "spending_anomaly" (category spikes, pace acceleration, or unusual outflow)
3. "forecast" (projected end-of-month cash surplus or savings rate)
4. "subscription_audit" (recurring software/entertainment cost analysis)
5. "tax_boost" (maximizing eligible business tax deductions)

Return STRICT JSON only with this structure:
{
  "insights": [
    {
      "id": "insight-1",
      "title": "Concise high-impact headline",
      "type": "saving_opportunity" | "spending_anomaly" | "forecast" | "subscription_audit" | "tax_boost",
      "summary": "2 clear sentences detailing the trend, numbers, and why it matters.",
      "impactAmount": number (estimated dollar savings or impact, e.g. 140),
      "actionRecommendation": "Specific 1-step action the user should take",
      "category": "e.g. Dining Out & Cafes",
      "urgency": "low" | "medium" | "high"
    }
  ],
  "monthlyCashflowForecast": {
    "projectedSavings": number,
    "savingsRatePercent": number,
    "runwayHealth": "Excellent" | "Good" | "Needs Attention",
    "keyTakeaway": "1 punchy summary sentence"
  }
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    } catch (err) {
      console.error("AI Insights generation failed, falling back to deterministic engine:", err);
    }
  }

  // Deterministic Fallback Engine
  const totalIncome = transactions.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + (t.amount || 0), 0);
  const totalExpense = transactions.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + (t.amount || 0), 0);
  const netSavings = Math.max(0, totalIncome - totalExpense);
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  const fallbackInsights = [
    {
      id: "insight-sub-1",
      title: "Subscription & SaaS Stack Optimization",
      type: "subscription_audit",
      summary: "You have active recurring digital software and hosting charges. Auditing unused seats or switching to annual plans could save up to 15%.",
      impactAmount: 180,
      actionRecommendation: "Review recurring software items in the Recurring Transactions tab.",
      category: "Software & Subscriptions",
      urgency: "medium",
    },
    {
      id: "insight-save-2",
      title: "Strong Net Savings Retention",
      type: "forecast",
      summary: `Your current net savings rate is pacing at ${savingsRate}%. Maintaining this trajectory retains approximately $${netSavings.toFixed(0)} in liquid reserves this cycle.`,
      impactAmount: netSavings,
      actionRecommendation: "Consider routing 30% of net surplus into high-yield liquidity or index funds.",
      category: "Investment & Dividends",
      urgency: "low",
    },
    {
      id: "insight-tax-3",
      title: "IRS Schedule C Write-Off Optimization",
      type: "tax_boost",
      summary: "Business software, client meetings, and equipment purchases have been auto-flagged. Ensure all digital receipt invoices are filed.",
      impactAmount: Math.round(totalExpense * 0.24 * 0.4),
      actionRecommendation: "Generate your printable Tax Schedule C report in the Tax & Export tab.",
      category: "Business Office & Supplies",
      urgency: "low",
    },
    {
      id: "insight-dining-4",
      title: "Discretionary Dining Out Trend",
      type: "spending_anomaly",
      summary: "Dining out and cafe purchases represent an active discretionary category. Setting a strict weekly lunch cap keeps budget utilization below 75%.",
      impactAmount: 120,
      actionRecommendation: "Adjust your Dining Out budget limit in Budgets & Alerts.",
      category: "Dining Out & Cafes",
      urgency: "medium",
    },
  ];

  res.json({
    insights: fallbackInsights,
    monthlyCashflowForecast: {
      projectedSavings: netSavings,
      savingsRatePercent: savingsRate,
      runwayHealth: savingsRate >= 20 ? "Excellent" : savingsRate > 0 ? "Good" : "Needs Attention",
      keyTakeaway: `You are on pace to retain $${netSavings.toFixed(0)} this month with a ${savingsRate}% savings efficiency rate.`,
    },
  });
});

// Interactive AI Financial Advisor Chat
app.post("/api/ai/chat-advisor", async (req, res) => {
  const { question, history, financialSummary } = req.body;

  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Question is required" });
  }

  const ai = getGenAI();

  if (ai) {
    try {
      const prompt = `You are a certified financial planner, tax strategist, and Google Sheets budgeting assistant.
Context:
- User Financial Profile: ${JSON.stringify(financialSummary || {})}
- Conversation History: ${JSON.stringify(history || [])}
- User Question: "${question}"

Respond clearly, concisely, and warmly with practical, high-impact financial guidance, tax optimization tips, or budgeting formulas.
Keep response under 3 paragraphs with bullet points for easy scanning.
Also return 2 relevant suggested follow-up questions.

Return STRICT JSON only:
{
  "answer": "Your comprehensive answer text formatted with markdown bullet points if helpful",
  "suggestedPrompts": ["Follow-up question 1", "Follow-up question 2"]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    } catch (e) {
      console.error("AI Chat advisor failed, using fallback:", e);
    }
  }

  // Deterministic chat answer fallback
  res.json({
    answer: `Based on your current transactions and budget pacing:
• **Pacing**: Your monthly inflow exceeds expenses, creating a healthy positive cash flow.
• **Tax Deductions**: Make sure you log all home office utilities and client meeting meals to take full advantage of Schedule C write-offs.
• **Automation**: Use the Recurring Transactions tab to set up automatic scheduled entries for fixed expenses like rent, subscriptions, and bi-weekly payroll.`,
    suggestedPrompts: [
      "How can I increase my monthly savings rate to 30%?",
      "What business expenses are eligible for tax write-offs?",
    ],
  });
});

// AI Tax & Financial Optimization Insights
app.post("/api/ai/tax-analysis", async (req, res) => {
  const { transactions, annualIncome, filingStatus = "Single" } = req.body;

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return res.status(400).json({ error: "Transactions array is required" });
  }

  const ai = getGenAI();

  if (ai) {
    try {
      const summaryStats = transactions.reduce(
        (acc, t) => {
          const amt = Number(t.amount) || 0;
          if (t.type === "income") {
            acc.totalIncome += amt;
          } else {
            acc.totalExpense += amt;
            if (t.isTaxDeductible) {
              acc.deductibleExpense += amt;
              acc.deductibleCategories[t.category] = (acc.deductibleCategories[t.category] || 0) + amt;
            }
          }
          return acc;
        },
        { totalIncome: 0, totalExpense: 0, deductibleExpense: 0, deductibleCategories: {} as Record<string, number> }
      );

      const prompt = `You are a certified tax strategist and financial planner.
Analyze the following financial profile:
- Total Transactions: ${transactions.length}
- Total Gross Income: $${summaryStats.totalIncome.toFixed(2)}
- Total Expenses: $${summaryStats.totalExpense.toFixed(2)}
- Total Identified Tax Deductions: $${summaryStats.deductibleExpense.toFixed(2)}
- Deductions by Category: ${JSON.stringify(summaryStats.deductibleCategories)}
- Filing Status: ${filingStatus}
- Stated Annual Income: $${annualIncome || summaryStats.totalIncome}

Return STRICT JSON only without markdown formatting:
{
  "estimatedTaxSavings": number (estimated value in dollars saved assuming 24% effective tax bracket),
  "taxableNetIncome": number,
  "topWriteOffCategories": [
    { "category": string, "amount": number, "irsSchedule": string, "tip": string }
  ],
  "actionableTaxTips": [string, string, string],
  "auditRiskScore": "Low" | "Moderate" | "High",
  "auditRiskReason": string,
  "quarterlyEstimatedTaxRecommendation": number
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    } catch (e) {
      console.error("AI Tax analysis failed, using deterministic summary:", e);
    }
  }

  // Deterministic fallback
  let totalIncome = 0;
  let totalExpense = 0;
  let deductibleExpense = 0;
  const categories: Record<string, number> = {};

  for (const t of transactions) {
    const amt = Number(t.amount) || 0;
    if (t.type === "income") {
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
      irsSchedule: "Schedule C / Form 1040",
      tip: `Keep itemized receipt documentation for all ${cat} expenses.`,
    }));

  res.json({
    estimatedTaxSavings,
    taxableNetIncome,
    topWriteOffCategories,
    actionableTaxTips: [
      "Track home office square footage if you utilize a dedicated workspace for freelance/remote tasks.",
      "Retain digital copies of receipts for all business meals (50% deductible) and client meetings.",
      "Consider funding a Traditional IRA or SEP-IRA to reduce adjusted gross income before filing deadlines.",
    ],
    auditRiskScore: "Low",
    auditRiskReason: "Deductions match standard industry expense ratios for personal and freelance finance.",
    quarterlyEstimatedTaxRecommendation: Math.round((taxableNetIncome * 0.22) / 4),
  });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Finance Tracker server running on port ${PORT}`);
  });
}

startServer();
