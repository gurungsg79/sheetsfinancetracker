import React, { useState } from 'react';
import {
  Sheet as SheetIcon,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  UploadCloud,
  DownloadCloud,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Link2,
  Clock,
  Database,
  ArrowRight,
} from 'lucide-react';
import { SheetConfig, Transaction } from '../types';
import { SHEET_HEADERS } from '../services/sheetsService';

interface GoogleSheetSyncViewProps {
  sheetConfig: SheetConfig;
  transactions: Transaction[];
  onUpdateSheetConfig: (config: Partial<SheetConfig>) => void;
  onManualSync: () => void;
  onImportCSVFile: (file: File) => void;
  onExportAllToCSV: () => void;
  onClearOfflineQueue: () => void;
}

export const GoogleSheetSyncView: React.FC<GoogleSheetSyncViewProps> = ({
  sheetConfig,
  transactions,
  onUpdateSheetConfig,
  onManualSync,
  onImportCSVFile,
  onExportAllToCSV,
  onClearOfflineQueue,
}) => {
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [csvFileInput, setCsvFileInput] = useState<File | null>(null);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  // Form State
  const [sheetIdInput, setSheetIdInput] = useState(sheetConfig.spreadsheetId || '');
  const [sheetNameInput, setSheetNameInput] = useState(sheetConfig.sheetName || 'Transactions');
  const [tokenInput, setTokenInput] = useState(sheetConfig.accessToken || '');
  const [webhookUrlInput, setWebhookUrlInput] = useState(sheetConfig.webhookUrl || '');
  const [syncInterval, setSyncInterval] = useState(sheetConfig.autoSyncIntervalMinutes || 5);

  const pendingCount = transactions.filter((t) => t.isPendingSync).length;

  const handleCopyHeaderTemplate = () => {
    navigator.clipboard.writeText(SHEET_HEADERS.join('\t'));
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSheetConfig({
      spreadsheetId: sheetIdInput.trim(),
      sheetName: sheetNameInput.trim() || 'Transactions',
      accessToken: tokenInput.trim(),
      webhookUrl: webhookUrlInput.trim(),
      autoSyncIntervalMinutes: syncInterval,
      isConnected: Boolean(sheetIdInput.trim() || webhookUrlInput.trim()),
    });
    setTestStatus('Settings saved. Ready to sync!');
    setTimeout(() => setTestStatus(null), 3000);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        onImportCSVFile(file);
      } else {
        alert('Please upload a .csv file');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <SheetIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Google Sheets Cloud Sync
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Multi-device cloud ledger synchronization &amp; offline resilience
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onManualSync}
            disabled={sheetConfig.isSyncing}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${sheetConfig.isSyncing ? 'animate-spin' : ''}`} />
            <span>{sheetConfig.isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* Sync Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Indicator */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Connection Status
          </span>
          <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
            {sheetConfig.isConnected ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Connected to Google Sheets
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Database className="w-4 h-4" /> Local Storage Mode
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            {sheetConfig.lastSyncedAt
              ? `Last synced at ${new Date(sheetConfig.lastSyncedAt).toLocaleTimeString()}`
              : 'Sync scheduled or manual on demand'}
          </p>
        </div>

        {/* Offline Queue Count */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Offline Sync Queue
          </span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
            <span>{pendingCount} Pending Rows</span>
            {pendingCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                Queued
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Offline additions auto-push to Google Sheets upon reconnection.
          </p>
        </div>

        {/* Auto-Sync Timer */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Auto-Sync Frequency
          </span>
          <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span>
              {sheetConfig.autoSyncIntervalMinutes > 0
                ? `Every ${sheetConfig.autoSyncIntervalMinutes} minutes`
                : 'Manual Only'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Background polling keeps charts in sync with remote edits.
          </p>
        </div>
      </div>

      {/* Main Connection Setup Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Google Sheets ID & OAuth / Webhook Configuration Form */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Google Sheets Connection Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure your personal Google Spreadsheet ID and API access token
              </p>
            </div>
            <a
              href="https://sheets.new"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              Open New Sheet <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {testStatus && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{testStatus}</span>
            </div>
          )}

          <form onSubmit={handleSaveConnection} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Google Spreadsheet ID *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  value={sheetIdInput}
                  onChange={(e) => setSheetIdInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                The long string between <code className="text-slate-600 dark:text-slate-300">/d/</code> and <code className="text-slate-600 dark:text-slate-300">/edit</code> in your Google Sheet browser URL.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sheet Tab Name
                </label>
                <input
                  type="text"
                  placeholder="Transactions"
                  value={sheetNameInput}
                  onChange={(e) => setSheetNameInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Auto-Sync Interval
                </label>
                <select
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value={0}>Manual Sync Only</option>
                  <option value={1}>Every 1 Minute (Live)</option>
                  <option value={5}>Every 5 Minutes (Standard)</option>
                  <option value={15}>Every 15 Minutes</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                OAuth 2.0 Bearer Access Token (Optional for API v4)
              </label>
              <input
                type="password"
                placeholder="ya29.a0AfH6SM..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Optional: If left blank, local IndexedDB and direct CSV upload/download sync will be utilized seamlessly.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Google Apps Script Webhook URL (Alternative Zero-Auth Sync)
              </label>
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={webhookUrlInput}
                onChange={(e) => setWebhookUrlInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Paste your deployed Apps Script Web App URL for automatic cloud sync without requiring OAuth tokens.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Save Cloud Configuration
              </button>
            </div>
          </form>
        </div>

        {/* Right: Quick Template & CSV Tools */}
        <div className="space-y-4">
          {/* Quick Header Copy Tool */}
          <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                1-Click Google Sheet Template
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Copy standard columns and paste directly into row 1 of your blank Google Sheet:
            </p>

            <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-mono overflow-x-auto whitespace-nowrap">
              {SHEET_HEADERS.join(' | ')}
            </div>

            <button
              onClick={handleCopyHeaderTemplate}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-650 transition-colors"
            >
              {copiedTemplate ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copiedTemplate ? 'Copied Column Headers!' : 'Copy Column Headers'}</span>
            </button>
          </div>

          {/* Drag and Drop CSV Import */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors space-y-3 text-center"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                Import CSV from Google Sheets
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Drag &amp; drop a exported .csv file or select from device
              </p>
            </div>
            <label className="inline-block cursor-pointer px-4 py-1.5 text-xs font-semibold bg-slate-900 dark:bg-emerald-600 text-white rounded-xl shadow-xs hover:opacity-90 transition-opacity">
              Choose File
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onImportCSVFile(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>

          {/* Quick Export to CSV */}
          <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex items-center justify-between">
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                Download All Records
              </h4>
              <p className="text-[11px] text-slate-500">
                {transactions.length} rows ready for export
              </p>
            </div>
            <button
              onClick={onExportAllToCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-200 transition-colors"
            >
              <DownloadCloud className="w-4 h-4 text-emerald-500" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
