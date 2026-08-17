import { Transaction, CurrencyCode } from '../types';
import { exportTransactionsToCSV } from './sheetsService';

// Trigger download of a file in browser
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download CSV of all transactions
export function downloadTransactionsCSV(transactions: Transaction[], filenamePrefix = 'finance_transactions') {
  const csv = exportTransactionsToCSV(transactions);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csv, `${filenamePrefix}_${dateStr}.csv`, 'text/csv;charset=utf-8;');
}

// Download JSON Backup
export function downloadJSONBackup(data: any, filenamePrefix = 'finance_tracker_backup') {
  const jsonStr = JSON.stringify(data, null, 2);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(jsonStr, `${filenamePrefix}_${dateStr}.json`, 'application/json;charset=utf-8;');
}

export interface MonthlyHealthReportOptions {
  monthName: string;
  monthKey: string;
  dayOfMonth: number;
  totalDaysInMonth: number;
  daysRemaining: number;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  incomeCount: number;
  expenseCount: number;
  dailyAverageExpense: number;
  projectedMonthEndExpense: number;
  projectedMonthEndSavings: number;
  safeDailySpendCap: number;
  targetGoal: number;
  goalPercent: number;
  remainingToGoal: number;
  isGoalMet: boolean;
  isForecastOnTrack: boolean;
  healthStatus: string;
  healthMessage: string;
  transactions: Transaction[];
  categoryBreakdown: Array<{ name: string; value: number; percent: number }>;
  currencyCode?: CurrencyCode;
  currencySymbol?: string;
  clientName?: string;
  clientEmail?: string;
  accountantName?: string;
  customNotes?: string;
}

// Generate self-contained, highly styled HTML document for the Monthly Financial Health Summary Report
export function generateMonthlyHealthReportHtml(options: MonthlyHealthReportOptions): string {
  const symbol = options.currencySymbol || '$';
  const currCode = options.currencyCode || 'USD';
  const clientName = options.clientName || 'Valued Client';
  const clientEmail = options.clientEmail ? ` (${options.clientEmail})` : '';
  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const fmt = (val: number) => {
    return `${symbol}${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Health status badge colors
  let statusBadgeBg = '#ecfdf5';
  let statusBadgeColor = '#065f46';
  let statusBadgeBorder = '#a7f3d0';
  if (options.healthStatus === 'Deficit') {
    statusBadgeBg = '#fff1f2';
    statusBadgeColor = '#9f1239';
    statusBadgeBorder = '#fecdd3';
  } else if (options.healthStatus === 'Moderate') {
    statusBadgeBg = '#fffbeb';
    statusBadgeColor = '#92400e';
    statusBadgeBorder = '#fde68a';
  }

  // Category Rows
  const categoryRows = options.categoryBreakdown
    .map((c, i) => `
      <tr style="border-bottom: 1px solid #f1f5f9; font-size: 13px;">
        <td style="padding: 10px 12px; font-weight: 600; color: #1e293b;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#f97316'][i % 7]}; margin-right: 8px;"></span>
          ${c.name}
        </td>
        <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #0f172a;">${fmt(c.value)}</td>
        <td style="padding: 10px 12px; text-align: right; font-weight: 600; color: #64748b;">${c.percent}%</td>
        <td style="padding: 10px 12px; width: 140px;">
          <div style="background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden;">
            <div style="background: #0284c7; height: 100%; width: ${Math.min(100, c.percent)}%; border-radius: 4px;"></div>
          </div>
        </td>
      </tr>
    `)
    .join('');

  // Top Transactions List for current month
  const monthTransactions = [...options.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 25);

  const txRows = monthTransactions
    .map((t) => {
      const isIncome = t.type === 'income';
      const color = isIncome ? '#059669' : '#dc2626';
      const prefix = isIncome ? '+' : '-';
      return `
        <tr style="border-bottom: 1px solid #f1f5f9; font-size: 12px;">
          <td style="padding: 8px 10px; color: #475569; white-space: nowrap;">${t.date}</td>
          <td style="padding: 8px 10px; font-weight: 600; color: #1e293b;">${t.description}</td>
          <td style="padding: 8px 10px; color: #64748b;">${t.category} ${t.subcategory ? `<span style="color:#94a3b8;">/ ${t.subcategory}</span>` : ''}</td>
          <td style="padding: 8px 10px; color: #64748b;">${t.paymentMethod || 'Other'}</td>
          <td style="padding: 8px 10px; text-align: center;">
            ${t.isTaxDeductible ? '<span style="background: #dcfce7; color: #15803d; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px;">YES</span>' : '<span style="color: #cbd5e1;">-</span>'}
          </td>
          <td style="padding: 8px 10px; text-align: right; font-weight: 700; color: ${color}; white-space: nowrap;">
            ${prefix}${fmt(t.amount)}
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Monthly Financial Health Statement - ${options.monthName} - ${clientName}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm 15mm 20mm 15mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            background-color: #ffffff;
            margin: 0;
            padding: 30px;
            font-size: 13px;
            line-height: 1.5;
          }
          .no-print {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #0f172a;
            color: #ffffff;
            padding: 14px 24px;
            border-radius: 12px;
            margin-bottom: 25px;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
          }
          .no-print-btn {
            background: #0284c7;
            color: #ffffff;
            border: none;
            padding: 9px 20px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 13px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: background 0.2s;
          }
          .no-print-btn:hover {
            background: #0369a1;
          }
          .report-container {
            max-width: 800px;
            margin: 0 auto;
          }
          .header-banner {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 18px;
            margin-bottom: 22px;
          }
          .brand-title {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.5px;
            margin: 0 0 4px 0;
          }
          .brand-sub {
            font-size: 12px;
            color: #64748b;
            margin: 0;
            font-weight: 500;
          }
          .meta-box {
            text-align: right;
            font-size: 12px;
            color: #475569;
          }
          .meta-box strong {
            color: #0f172a;
          }
          .status-badge {
            display: inline-block;
            background: ${statusBadgeBg};
            color: ${statusBadgeColor};
            border: 1px solid ${statusBadgeBorder};
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            margin-top: 6px;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 20px;
          }
          .kpi-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 14px 16px;
          }
          .kpi-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            margin-bottom: 6px;
          }
          .kpi-value {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.1;
          }
          .kpi-sub {
            font-size: 11px;
            color: #64748b;
            margin-top: 5px;
          }
          .section-heading {
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
            margin: 24px 0 10px 0;
            padding-bottom: 6px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .forecast-box {
            background: #0f172a;
            color: #ffffff;
            border-radius: 12px;
            padding: 16px 20px;
            margin-bottom: 20px;
          }
          .forecast-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-top: 10px;
          }
          .forecast-item {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 8px;
            padding: 10px 12px;
          }
          .progress-bar-container {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          th {
            background: #f8fafc;
            color: #475569;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
            padding: 8px 10px;
            border-bottom: 2px solid #cbd5e1;
          }
          .signatures-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px dashed #cbd5e1;
            page-break-inside: avoid;
          }
          .signature-box {
            font-size: 11px;
            color: #475569;
          }
          .signature-line {
            border-bottom: 1px solid #0f172a;
            height: 35px;
            margin-bottom: 6px;
          }
          .footer-note {
            margin-top: 30px;
            font-size: 11px;
            color: #94a3b8;
            text-align: center;
            border-top: 1px solid #f1f5f9;
            padding-top: 12px;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
            .page-break {
              page-break-before: always;
            }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <!-- Top Bar for Interactive Browser View -->
          <div class="no-print">
            <div>
              <strong style="font-size: 14px; display: block;">📄 Monthly Financial Health Statement (${options.monthName})</strong>
              <span style="font-size: 12px; color: #94a3b8;">Formatted for certified accounting review, bookkeeping, and PDF printing</span>
            </div>
            <div style="display: flex; gap: 10px;">
              <button class="no-print-btn" onclick="window.print()">
                <span>🖨️ Print / Save as PDF</span>
              </button>
            </div>
          </div>

          <!-- Official Report Header -->
          <div class="header-banner">
            <div>
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #0284c7; margin-bottom: 2px;">
                Executive Cash Flow &amp; Reserve Statement
              </div>
              <h1 class="brand-title">Monthly Financial Health Report</h1>
              <p class="brand-sub">Reporting Period: <strong>${options.monthName}</strong> (Cycle: Day ${options.dayOfMonth} of ${options.totalDaysInMonth}, ${options.daysRemaining} days remaining)</p>
              <div>
                <span class="status-badge">● Health Rating: ${options.healthStatus}</span>
              </div>
            </div>
            <div class="meta-box">
              <div>Client: <strong>${clientName}</strong>${clientEmail}</div>
              <div>Prepared On: <strong>${currentDateFormatted}</strong></div>
              <div>Functional Currency: <strong>${currCode} (${symbol})</strong></div>
              <div>Accountant Copy: <strong>${options.accountantName || 'Certified CPA Review'}</strong></div>
            </div>
          </div>

          <!-- Executive KPI Grid -->
          <div class="kpi-grid">
            <div class="kpi-card" style="border-left: 4px solid #10b981;">
              <div class="kpi-label">Gross Monthly Inflows</div>
              <div class="kpi-value" style="color: #059669;">+${fmt(options.totalIncome)}</div>
              <div class="kpi-sub">${options.incomeCount} Inflow Transactions &bull; Avg ${fmt(options.dayOfMonth > 0 ? options.totalIncome / options.dayOfMonth : 0)}/day</div>
            </div>

            <div class="kpi-card" style="border-left: 4px solid #ef4444;">
              <div class="kpi-label">Total Outflows / Expenses</div>
              <div class="kpi-value" style="color: #dc2626;">-${fmt(options.totalExpenses)}</div>
              <div class="kpi-sub">${options.expenseCount} Outflows &bull; Burn rate ~${fmt(options.dailyAverageExpense)}/day</div>
            </div>

            <div class="kpi-card" style="border-left: 4px solid #0284c7; background: #f0f9ff;">
              <div class="kpi-label">Net Surplus / Cash Margin</div>
              <div class="kpi-value" style="color: ${options.netSavings >= 0 ? '#0369a1' : '#b45309'};">
                ${options.netSavings >= 0 ? '+' : ''}${fmt(options.netSavings)}
              </div>
              <div class="kpi-sub"><strong>${options.savingsRate}%</strong> Net Savings Retention Rate</div>
            </div>
          </div>

          <!-- Monthly Savings Goal Progress -->
          <div class="progress-bar-container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-weight: 700; font-size: 12px; color: #1e293b;">
                🎯 Monthly Target Savings Goal: ${fmt(options.targetGoal)}
              </span>
              <span style="font-weight: 700; font-size: 12px; color: ${options.isGoalMet ? '#059669' : '#0284c7'};">
                ${options.goalPercent}% Attained (${options.isGoalMet ? 'Goal Reached!' : `${fmt(options.remainingToGoal)} remaining`})
              </span>
            </div>
            <div style="background: #e2e8f0; height: 10px; border-radius: 5px; overflow: hidden; margin-bottom: 6px;">
              <div style="background: ${options.isGoalMet ? 'linear-gradient(90deg, #059669, #10b981)' : 'linear-gradient(90deg, #0284c7, #06b6d4)'}; height: 100%; width: ${Math.min(100, options.goalPercent)}%; border-radius: 5px;"></div>
            </div>
            <div style="font-size: 11px; color: #64748b; display: flex; justify-content: space-between;">
              <span>Accumulated Surplus: <strong>${fmt(options.netSavings)}</strong></span>
              <span>${options.healthMessage}</span>
            </div>
          </div>

          <!-- Month-End Forecast & Projections -->
          <div class="forecast-box">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 8px;">
              <span style="font-weight: 700; font-size: 13px; letter-spacing: 0.3px;">
                📈 Month-End Run-Rate Forecast &amp; Capital Velocity
              </span>
              <span style="font-size: 11px; background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 4px; font-weight: 600;">
                ${options.isForecastOnTrack ? '✓ Trajectory on Target' : '⚠️ Run-Rate Attention Required'}
              </span>
            </div>
            <div class="forecast-grid">
              <div class="forecast-item">
                <div style="font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700;">Projected Month-End Savings</div>
                <div style="font-size: 16px; font-weight: 800; color: #34d399; margin-top: 3px;">
                  ${options.projectedMonthEndSavings >= 0 ? '+' : ''}${fmt(options.projectedMonthEndSavings)}
                </div>
                <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Based on current daily velocity</div>
              </div>

              <div class="forecast-item">
                <div style="font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700;">Projected Total Outflow</div>
                <div style="font-size: 16px; font-weight: 800; color: #f87171; margin-top: 3px;">
                  ${fmt(options.projectedMonthEndExpense)}
                </div>
                <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Velocity pace: ~${fmt(options.dailyAverageExpense)}/day</div>
              </div>

              <div class="forecast-item">
                <div style="font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700;">Safe Daily Spend Cap</div>
                <div style="font-size: 16px; font-weight: 800; color: #38bdf8; margin-top: 3px;">
                  ${fmt(options.safeDailySpendCap)}/day
                </div>
                <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">To safeguard savings target</div>
              </div>
            </div>
          </div>

          <!-- Category Breakdown Table -->
          <div class="section-heading">
            <span>Expense Allocation by Category</span>
            <span style="font-size: 11px; font-weight: 500; color: #64748b;">Total: ${fmt(options.totalExpenses)} across ${options.categoryBreakdown.length} categories</span>
          </div>

          <table>
            <thead>
              <tr>
                <th>Category Name</th>
                <th style="text-align: right;">Amount Spent</th>
                <th style="text-align: right;">% Share</th>
                <th>Visual Distribution</th>
              </tr>
            </thead>
            <tbody>
              ${categoryRows.length > 0 ? categoryRows : '<tr><td colspan="4" style="text-align:center; padding: 12px; color: #94a3b8;">No expense categories recorded this month.</td></tr>'}
            </tbody>
          </table>

          <!-- Major Monthly Ledger Entries -->
          <div class="section-heading" style="margin-top: 28px;">
            <span>Month-to-Date Transaction Ledger (Recent &amp; Major Activity)</span>
            <span style="font-size: 11px; font-weight: 500; color: #64748b;">Showing top entries</span>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description / Payee</th>
                <th>Category</th>
                <th>Method</th>
                <th style="text-align: center;">Tax Write-Off</th>
                <th style="text-align: right;">Amount (${currCode})</th>
              </tr>
            </thead>
            <tbody>
              ${txRows.length > 0 ? txRows : '<tr><td colspan="6" style="text-align:center; padding: 12px; color: #94a3b8;">No transactions logged for this period.</td></tr>'}
            </tbody>
          </table>

          <!-- Accountant Notes & Signatures -->
          <div class="signatures-grid">
            <div class="signature-box">
              <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px;">Client Verification</div>
              <div>I certify that the above recorded transactions accurately represent my monthly income and business/personal expenses for the period.</div>
              <div class="signature-line"></div>
              <div style="display: flex; justify-content: space-between;">
                <span>Signature: ${clientName}</span>
                <span>Date: ____________</span>
              </div>
            </div>

            <div class="signature-box">
              <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px;">Accountant / Bookkeeper Sign-Off</div>
              <div>Report reconciled against source records and banking telemetry for year-end tax preparation and financial planning.</div>
              <div class="signature-line"></div>
              <div style="display: flex; justify-content: space-between;">
                <span>CPA / Accountant Signature</span>
                <span>Date: ____________</span>
              </div>
            </div>
          </div>

          <!-- Footer Disclaimer -->
          <div class="footer-note">
            Sheets Finance Tracker &bull; Confidential Financial Statement &bull; Generated on ${currentDateFormatted} &bull; Page 1 of 1
          </div>
        </div>
      </body>
    </html>
  `;
}

// Print / Save as PDF using browser print dialog
export function printMonthlyHealthReportPDF(options: MonthlyHealthReportOptions): boolean {
  const html = generateMonthlyHealthReportHtml(options);
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    // Popup might be blocked, fallback to downloading HTML or returning false so component can open modal
    return false;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
}

// Download HTML file for direct emailing or archiving
export function downloadMonthlyHealthReportHtml(options: MonthlyHealthReportOptions) {
  const html = generateMonthlyHealthReportHtml(options);
  const dateStr = options.monthKey || new Date().toISOString().slice(0, 7);
  downloadFile(html, `Financial_Health_Report_${dateStr}.html`, 'text/html;charset=utf-8;');
}

// Generate and trigger clean printable Tax Deductions Schedule / Report
export function printTaxScheduleReport(
  transactions: Transaction[],
  taxYear = new Date().getFullYear(),
  taxPayerName = 'Taxpayer / Freelancer'
) {
  const deductibleTransactions = transactions.filter((t) => t.isTaxDeductible);
  const totalDeductible = deductibleTransactions.reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Group by Tax Category
  const categoryGroups: Record<string, { count: number; total: number; items: Transaction[] }> = {};
  for (const t of deductibleTransactions) {
    const cat = t.taxCategory || t.category || 'General Business Expense';
    if (!categoryGroups[cat]) {
      categoryGroups[cat] = { count: 0, total: 0, items: [] };
    }
    categoryGroups[cat].count += 1;
    categoryGroups[cat].total += t.amount;
    categoryGroups[cat].items.push(t);
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print the Tax Schedule Report');
    return;
  }

  const rowsHtml = deductibleTransactions
    .map(
      (t) => `
    <tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
      <td style="padding: 8px 10px;">${t.date}</td>
      <td style="padding: 8px 10px; font-weight: 600;">${t.description}</td>
      <td style="padding: 8px 10px;">${t.category}</td>
      <td style="padding: 8px 10px; color: #475569;">${t.taxCategory || 'Schedule C'}</td>
      <td style="padding: 8px 10px;">${t.paymentMethod}</td>
      <td style="padding: 8px 10px; text-align: right; font-weight: 600; color: #0f172a;">$${t.amount.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  const summaryRowsHtml = Object.entries(categoryGroups)
    .map(
      ([cat, data]) => `
    <tr style="border-bottom: 1px solid #e2e8f0; font-size: 14px;">
      <td style="padding: 10px; font-weight: 600;">${cat}</td>
      <td style="padding: 10px; text-align: center;">${data.count} items</td>
      <td style="padding: 10px; text-align: right; font-weight: 700; color: #15803d;">$${data.total.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>IRS Schedule C & Tax Deduction Report (${taxYear}) - ${taxPayerName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 40px; }
          h1 { font-size: 24px; margin-bottom: 4px; color: #0f172a; }
          .header-meta { font-size: 13px; color: #64748b; margin-bottom: 24px; border-bottom: 2px solid #0f172a; padding-bottom: 12px; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
          .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
          .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
          .stat-val { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 12px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; border-bottom: 2px solid #cbd5e1; }
          .section-title { font-size: 17px; font-weight: 700; margin-top: 32px; margin-bottom: 8px; color: #1e293b; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #64748b; display: flex; justify-content: space-between; }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; background: #e0f2fe; padding: 12px 18px; border-radius: 8px;">
          <span style="color: #0369a1; font-weight: 600;">📄 Tax Deductions & Business Schedule Ready for Filing</span>
          <button onclick="window.print()" style="background: #0284c7; color: white; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 600; cursor: pointer;">Print / Save as PDF</button>
        </div>

        <h1>Tax Deductions & Expense Report</h1>
        <div class="header-meta">
          Tax Year: <strong>${taxYear}</strong> | Prepared for: <strong>${taxPayerName}</strong> | Generated: <strong>${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}</strong>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Gross Income</div>
            <div class="stat-val">$${totalIncome.toFixed(2)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Annual Expenses</div>
            <div class="stat-val">$${totalExpenses.toFixed(2)}</div>
          </div>
          <div class="stat-card" style="border-color: #86efac; background: #f0fdf4;">
            <div class="stat-label" style="color: #166534;">Eligible Deductions</div>
            <div class="stat-val" style="color: #15803d;">$${totalDeductible.toFixed(2)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Est. Tax Savings (~24%)</div>
            <div class="stat-val" style="color: #0369a1;">$${(totalDeductible * 0.24).toFixed(2)}</div>
          </div>
        </div>

        <div class="section-title">Schedule C Category Summary</div>
        <table>
          <thead>
            <tr>
              <th>Tax / Expense Category</th>
              <th style="text-align: center;">Item Count</th>
              <th style="text-align: right;">Total Deductible Amount</th>
            </tr>
          </thead>
          <tbody>
            ${summaryRowsHtml}
          </tbody>
          <tfoot>
            <tr style="background: #f8fafc; font-weight: 700; border-top: 2px solid #0f172a;">
              <td style="padding: 12px 10px;">Total Identified Write-Offs</td>
              <td style="padding: 12px 10px; text-align: center;">${deductibleTransactions.length} items</td>
              <td style="padding: 12px 10px; text-align: right; color: #15803d; font-size: 16px;">$${totalDeductible.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="section-title" style="page-break-before: auto;">Itemized Tax Deductible Ledger</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description / Payee</th>
              <th>Category</th>
              <th>IRS Classification</th>
              <th>Payment</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div>Report generated via Sheets Finance Tracker &bull; Certified Automated Record</div>
          <div>Taxpayer Signature: _______________________ &nbsp; Date: ________</div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
