import React from 'react';
import {
  BookOpen,
  Sheet as SheetIcon,
  ShieldCheck,
  Sparkles,
  Lock,
  Layers,
  Bell,
  Cpu,
  CheckCircle2,
  ExternalLink,
  Code,
  Zap,
} from 'lucide-react';
import { SHEET_HEADERS } from '../services/sheetsService';

export const DocumentationView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-xs space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Documentation &amp; Scalability Architecture Guide
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Technical specifications, Google Sheets schema, AI categorization, and biometric security
            </p>
          </div>
        </div>
      </div>

      {/* 1. Google Sheets Integration & Schema */}
      <div className="bg-white dark:bg-slate-800/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <SheetIcon className="w-5 h-5 text-emerald-500" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            1. Google Sheets Cloud Sync &amp; Column Mapping
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          The application uses an offline-first hybrid cloud architecture. Transactions recorded on any device are stored in a local persistent storage queue and synchronized with your personal Google Sheet via Google Sheets API (v4) or Apps Script Webhooks.
        </p>

        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Standard Google Sheet Header Schema:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs font-mono">
            {SHEET_HEADERS.map((col, idx) => (
              <div
                key={col}
                className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-between"
              >
                <span className="text-emerald-500 font-bold">Col {String.fromCharCode(65 + idx)}:</span>
                <span>{col}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <h3 className="font-bold text-slate-800 dark:text-slate-200">Useful Google Sheets Formula Snippets:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Total Income:</strong> <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-emerald-600 font-mono">=SUMIF(C2:C, "income", F2:F)</code>
            </li>
            <li>
              <strong>Total Expenses:</strong> <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-rose-500 font-mono">=SUMIF(C2:C, "expense", F2:F)</code>
            </li>
            <li>
              <strong>Schedule C Deductible Sum:</strong> <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-teal-600 font-mono">=SUMIF(I2:I, TRUE, F2:F)</code>
            </li>
          </ul>
        </div>
      </div>

      {/* 2. AI Auto-Categorization & Tax Engine */}
      <div className="bg-white dark:bg-slate-800/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-500" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            2. Gemini AI Smart Auto-Categorization Engine
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Powered by Gemini 2.5 Flash on the server and a deterministic regex fallback engine client-side. When users type natural language (e.g. <em>"Client dinner at Bistro for $85 on Mastercard"</em>), the system extracts:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <strong className="text-slate-900 dark:text-white block mb-1">Entity Extraction</strong>
            <span className="text-slate-500">Extracts currency amount, date, payment method, and standardized merchant name.</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <strong className="text-slate-900 dark:text-white block mb-1">Category &amp; Subcategory</strong>
            <span className="text-slate-500">Maps accurately to 19 standard accounting categories and granular sub-tags.</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <strong className="text-slate-900 dark:text-white block mb-1">Tax Deductibility</strong>
            <span className="text-slate-500">Flags IRS Schedule C eligible write-offs (50% Meals, Software, Travel, Office Equipment).</span>
          </div>
        </div>
      </div>

      {/* 3. Budgeting Goals & Push Alert Engine */}
      <div className="bg-white dark:bg-slate-800/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-500" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            3. Monthly Budget Goals &amp; Push Alerts
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          The alert engine continuously monitors your transactions against set monthly limits:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <li>
            <strong>Warning Alert (&ge; 80% Threshold):</strong> Sends a gentle browser notification and plays an alert chime informing the user of remaining category runway.
          </li>
          <li>
            <strong>Critical Alert (&ge; 100% Limit Breach):</strong> Sends high-priority push notification and double tone audio chime indicating the exact over-budget dollar amount.
          </li>
          <li>
            <strong>Daily Spending Allowance:</strong> Dynamically calculates daily safe burn based on remaining days in the month.
          </li>
        </ul>
      </div>

      {/* 4. Biometric Security & WebAuthn Vault */}
      <div className="bg-white dark:bg-slate-800/80 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-500" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            4. Biometric Authentication &amp; SHA-256 Security
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          The finance vault supports hardware-backed WebAuthn authenticators:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <strong className="text-slate-900 dark:text-white block mb-1">WebAuthn Platform Keys</strong>
            <span className="text-slate-500">Unlocks with Touch ID, Face ID, or Windows Hello with zero biometric data ever leaving the client device.</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <strong className="text-slate-900 dark:text-white block mb-1">Salted SHA-256 PIN Vault</strong>
            <span className="text-slate-500">Secure 4-digit PIN fallback hashed with cryptographic Web Crypto API (<code className="font-mono">crypto.subtle.digest</code>).</span>
          </div>
        </div>
      </div>
    </div>
  );
};
