import { Transaction, SheetConfig } from '../types';

export const SHEET_HEADERS = [
  'ID',
  'Date',
  'Type',
  'Category',
  'Subcategory',
  'Amount',
  'Description',
  'Payment Method',
  'Is Tax Deductible',
  'Tax Category',
  'Notes',
  'Updated At',
];

// Convert Transaction to Google Sheet Row Array
export function transactionToRow(t: Transaction): (string | number | boolean)[] {
  return [
    t.id,
    t.date,
    t.type,
    t.category,
    t.subcategory || '',
    Number(t.amount.toFixed(2)),
    t.description,
    t.paymentMethod || 'Credit Card',
    t.isTaxDeductible ? 'TRUE' : 'FALSE',
    t.taxCategory || '',
    t.notes || '',
    t.syncedAt || new Date().toISOString(),
  ];
}

// Convert Google Sheet Row Array to Transaction
export function rowToTransaction(row: any[], index: number): Transaction | null {
  if (!row || row.length < 6) return null;

  const id = row[0] ? String(row[0]) : `sheet-tx-${index + 1}-${Date.now()}`;
  const date = row[1] ? String(row[1]).trim() : new Date().toISOString().slice(0, 10);
  const type = String(row[2]).toLowerCase().includes('income') ? 'income' : 'expense';
  const category = row[3] ? String(row[3]).trim() : 'Other Miscellaneous';
  const subcategory = row[4] ? String(row[4]).trim() : 'General';
  const amountStr = String(row[5]).replace(/[^0-9.-]+/g, '');
  const amount = parseFloat(amountStr) || 0;
  const description = row[6] ? String(row[6]).trim() : 'Unnamed Transaction';
  const paymentMethod = (row[7] ? String(row[7]).trim() : 'Credit Card') as any;
  const isTaxDeductible = String(row[8]).toUpperCase() === 'TRUE' || String(row[8]) === '1';
  const taxCategory = row[9] ? String(row[9]).trim() : '';
  const notes = row[10] ? String(row[10]).trim() : '';
  const syncedAt = row[11] ? String(row[11]).trim() : new Date().toISOString();

  return {
    id,
    date,
    type,
    category,
    subcategory,
    amount,
    description,
    paymentMethod,
    isTaxDeductible,
    taxCategory,
    notes,
    syncedAt,
    isPendingSync: false,
    createdAt: syncedAt || new Date().toISOString(),
  };
}

// Fetch transactions from Google Sheets API v4 using OAuth Access Token
export async function fetchFromGoogleSheetsAPI(
  spreadsheetId: string,
  sheetName: string = 'Transactions',
  accessToken: string
): Promise<{ transactions: Transaction[]; rawRowsCount: number }> {
  const range = `${sheetName}!A2:L`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Sheets API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rows: any[][] = data.values || [];

  const transactions: Transaction[] = [];
  rows.forEach((row, idx) => {
    const tx = rowToTransaction(row, idx);
    if (tx && tx.amount > 0) {
      transactions.push(tx);
    }
  });

  return { transactions, rawRowsCount: rows.length };
}

// Push transactions to Google Sheets API v4
export async function syncToGoogleSheetsAPI(
  spreadsheetId: string,
  sheetName: string = 'Transactions',
  accessToken: string,
  transactions: Transaction[]
): Promise<{ success: boolean; rowsUpdated: number }> {
  // First ensure headers exist
  const headerRange = `${sheetName}!A1:L1`;
  const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(headerRange)}?valueInputOption=USER_ENTERED`;

  await fetch(headerUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: headerRange,
      majorDimension: 'ROWS',
      values: [SHEET_HEADERS],
    }),
  });

  // Now overwrite or append transaction rows
  const rows = transactions.map((t) => transactionToRow(t));
  const dataRange = `${sheetName}!A2:L${Math.max(2, rows.length + 1)}`;
  const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(dataRange)}?valueInputOption=USER_ENTERED`;

  const response = await fetch(dataUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: dataRange,
      majorDimension: 'ROWS',
      values: rows,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to write to Google Sheets (${response.status}): ${errText}`);
  }

  return { success: true, rowsUpdated: rows.length };
}

// Sync via Apps Script Webhook (for zero-auth direct Google Sheet integration)
export async function syncViaWebhook(
  webhookUrl: string,
  action: 'get' | 'sync' | 'append',
  transactions?: Transaction[]
): Promise<any> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    mode: 'cors',
    body: JSON.stringify({
      action,
      transactions: transactions ? transactions.map(transactionToRow) : undefined,
      timestamp: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Apps Script webhook responded with status ${response.status}`);
  }

  return await response.json();
}

// Parse CSV text into Transaction objects
export function parseCSVToTransactions(csvContent: string): Transaction[] {
  const lines = csvContent
    .split(/\r\n|\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  // Skip header if line 1 contains letters
  const hasHeader = /[a-zA-Z]/.test(lines[0]);
  const startIdx = hasHeader ? 1 : 0;

  const results: Transaction[] = [];

  for (let i = startIdx; i < lines.length; i++) {
    // Simple CSV parser handling quotes
    const row: string[] = [];
    let inQuote = false;
    let curr = '';

    for (let c = 0; c < lines[i].length; c++) {
      const char = lines[i][c];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        row.push(curr.trim());
        curr = '';
      } else {
        curr += char;
      }
    }
    row.push(curr.trim());

    const tx = rowToTransaction(row, i);
    if (tx && tx.amount > 0) {
      results.push(tx);
    }
  }

  return results;
}

// Convert all transactions to CSV string
export function exportTransactionsToCSV(transactions: Transaction[]): string {
  const rows = [SHEET_HEADERS.join(',')];
  for (const t of transactions) {
    const row = transactionToRow(t).map((val) => {
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    });
    rows.push(row.join(','));
  }
  return rows.join('\r\n');
}
