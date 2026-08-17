import React, { useState } from 'react';
import {
  X,
  Globe,
  DollarSign,
  Shield,
  Fingerprint,
  Lock,
  Eye,
  Sliders,
  Check,
  RefreshCw,
  Search,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  User,
  LogOut,
  Users,
  KeyRound,
  CheckCircle2,
  ScanFace,
  Sparkles,
} from 'lucide-react';
import { CurrencyCode, CurrencyConfig, SecurityConfig, SheetConfig, UserProfile } from '../types';
import {
  SUPPORTED_CURRENCIES,
  CURRENCY_LIST,
  getCurrencyDetail,
  formatCurrency,
  convertAmount,
  getExchangeRate,
} from '../services/currencyService';
import {
  getBiometricHardwareName,
  authenticateBiometrics,
} from '../services/biometricService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  currencyConfig: CurrencyConfig;
  onUpdateCurrencyConfig: (config: CurrencyConfig) => void;
  securityConfig: SecurityConfig;
  onUpdateSecurityConfig: (config: Partial<SecurityConfig>) => void;
  sheetConfig: SheetConfig;
  onUpdateSheetConfig: (config: Partial<SheetConfig>) => void;
  onSetupPin: (pin: string) => void;
  onDisablePin: () => void;
  onEnrollBiometrics?: () => Promise<void>;
  onRemoveBiometrics?: () => void;
  onSwitchAccount?: () => void;
  onLogout?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currencyConfig,
  onUpdateCurrencyConfig,
  securityConfig,
  onUpdateSecurityConfig,
  sheetConfig,
  onUpdateSheetConfig,
  onSetupPin,
  onDisablePin,
  onEnrollBiometrics,
  onRemoveBiometrics,
  onSwitchAccount,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'currency' | 'security' | 'sync'>('account');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCustomRate, setEditingCustomRate] = useState<CurrencyCode | null>(null);
  const [customRateInput, setCustomRateInput] = useState('');
  
  // Pin setup states
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);

  // Biometric Test State
  const [bioTestStatus, setBioTestStatus] = useState<string | null>(null);
  const [isBioTesting, setIsBioTesting] = useState(false);

  const hardwareName = getBiometricHardwareName();

  if (!isOpen) return null;

  const currentDisplayDetail = getCurrencyDetail(currencyConfig.displayCurrency);
  const sampleAmountUSD = 2450.0;
  const convertedSample = convertAmount(
    sampleAmountUSD,
    'USD',
    currencyConfig.displayCurrency,
    currencyConfig.customRates
  );

  const filteredCurrencies = CURRENCY_LIST.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCurrency = (code: CurrencyCode) => {
    onUpdateCurrencyConfig({
      ...currencyConfig,
      displayCurrency: code,
    });
  };

  const handleSaveCustomRate = (code: CurrencyCode) => {
    const val = parseFloat(customRateInput);
    if (!isNaN(val) && val > 0) {
      onUpdateCurrencyConfig({
        ...currencyConfig,
        customRates: {
          ...currencyConfig.customRates,
          [code]: val,
        },
      });
      setEditingCustomRate(null);
      setCustomRateInput('');
    }
  };

  const handleResetRate = (code: CurrencyCode) => {
    const nextRates = { ...currencyConfig.customRates };
    delete nextRates[code];
    onUpdateCurrencyConfig({
      ...currencyConfig,
      customRates: nextRates,
    });
  };

  const handleResetAllRates = () => {
    onUpdateCurrencyConfig({
      ...currencyConfig,
      customRates: {},
    });
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }
    onSetupPin(newPin);
    setIsSettingPin(false);
    setNewPin('');
    setConfirmPin('');
    setPinError('');
  };

  const handleTestBiometrics = async () => {
    setIsBioTesting(true);
    setBioTestStatus(null);
    try {
      const res = await authenticateBiometrics(currentUser?.biometricCredentialId);
      if (res.success) {
        setBioTestStatus('Success! Biometric hardware verified.');
      } else {
        setBioTestStatus(res.error || 'Biometric verification cancelled.');
      }
    } catch (err: any) {
      setBioTestStatus('Biometric hardware check failed.');
    } finally {
      setIsBioTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Application Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Multi-currency conversion, biometric security, and cloud preferences
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

        {/* Tab Navigation */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 gap-2 shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'account'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Account &amp; Biometrics</span>
          </button>

          <button
            onClick={() => setActiveTab('currency')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'currency'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Currency &amp; FX ({currentDisplayDetail.code})</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Vault Security</span>
          </button>

          <button
            onClick={() => setActiveTab('sync')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sync'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Auto-Sync Frequency</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 0: USER ACCOUNT & BIOMETRIC AUTH */}
          {activeTab === 'account' && (
            <div className="space-y-6 animate-fadeIn">
              {currentUser ? (
                <>
                  {/* User Profile Card */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={currentUser.name}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-sm"
                        />
                        {currentUser.hasBiometrics && (
                          <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-slate-950 rounded-full shadow-xs">
                            <Fingerprint className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {currentUser.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Active Session
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {currentUser.email}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Role: {currentUser.role || 'Member'} &bull; Last Login: {new Date(currentUser.lastLoginAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-2">
                      {onSwitchAccount && (
                        <button
                          onClick={() => {
                            onClose();
                            onSwitchAccount();
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                          <span>Switch Profile</span>
                        </button>
                      )}
                      {onLogout && (
                        <button
                          onClick={() => {
                            onClose();
                            onLogout();
                          }}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Biometric Passkey Management Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-50 to-teal-500/5 dark:from-emerald-950/30 dark:via-slate-850 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 space-y-4 shadow-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Fingerprint className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {hardwareName} Authentication
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Fast, passwordless cryptographic device passkey integration
                          </p>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        currentUser.hasBiometrics
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700'
                      }`}>
                        {currentUser.hasBiometrics ? 'Enrolled & Active' : 'Not Enrolled'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                      <p>
                        • Uses native <strong>WebAuthn / FIDO2</strong> platform authenticators (Apple Touch ID, Face ID, Windows Hello).
                      </p>
                      <p>
                        • Your biometric secrets never leave the secure enclave of your device.
                      </p>
                    </div>

                    {/* Biometric Actions */}
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      {currentUser.hasBiometrics ? (
                        <>
                          <button
                            onClick={handleTestBiometrics}
                            disabled={isBioTesting}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95"
                          >
                            <ScanFace className="w-4 h-4" />
                            <span>{isBioTesting ? 'Prompting Device...' : `Test ${hardwareName}`}</span>
                          </button>

                          {onRemoveBiometrics && (
                            <button
                              onClick={onRemoveBiometrics}
                              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold cursor-pointer transition-colors"
                            >
                              Remove Passkey
                            </button>
                          )}
                        </>
                      ) : (
                        onEnrollBiometrics && (
                          <button
                            onClick={onEnrollBiometrics}
                            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                          >
                            <Fingerprint className="w-4 h-4" />
                            <span>Enroll Device Passkey ({hardwareName})</span>
                          </button>
                        )
                      )}
                    </div>

                    {bioTestStatus && (
                      <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        bioTestStatus.includes('Success')
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                      }`}>
                        {bioTestStatus.includes('Success') ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                        <span>{bioTestStatus}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-6 text-center text-slate-400">
                  <p>No active user profile logged in.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: CURRENCY & FX SETTINGS */}
          {activeTab === 'currency' && (
            <div className="space-y-6">
              {/* Active Currency Live Card */}
              <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-950/40 dark:via-slate-850 dark:to-slate-900 p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700/60 flex items-center justify-center text-3xl shadow-xs shrink-0">
                    {currentDisplayDetail.flag}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                      Active Global Currency
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {currentDisplayDetail.name} ({currentDisplayDetail.code})
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Symbol: <strong>{currentDisplayDetail.symbol}</strong> &bull; Exchange Rate:{' '}
                      <strong>
                        1 USD ={' '}
                        {(
                          currencyConfig.customRates[currentDisplayDetail.code] ??
                          currentDisplayDetail.rateFromUSD
                        ).toFixed(4)}{' '}
                        {currentDisplayDetail.code}
                      </strong>
                    </p>
                  </div>
                </div>

                {/* Live Converted Preview */}
                <div className="bg-white dark:bg-slate-800/90 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/60 text-right sm:min-w-[170px] shadow-xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Sample Conversion
                  </span>
                  <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(sampleAmountUSD, currencyConfig.displayCurrency, {
                      fromCurrency: 'USD',
                      customRates: currencyConfig.customRates,
                    })}
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    from $2,450.00 USD
                  </span>
                </div>
              </div>

              {/* Currency Selector Grid */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Select Global Display Currency ({CURRENCY_LIST.length} Available)
                  </h4>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search currency, code, country..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-56"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {filteredCurrencies.map((c) => {
                    const isSelected = currencyConfig.displayCurrency === c.code;
                    const effectiveRate =
                      currencyConfig.customRates[c.code] ?? c.rateFromUSD;
                    const isCustomized =
                      currencyConfig.customRates[c.code] !== undefined;

                    return (
                      <div
                        key={c.code}
                        onClick={() => handleSelectCurrency(c.code)}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 shadow-xs'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl shrink-0">{c.flag}</span>
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs">{c.code}</span>
                              <span className="text-[11px] text-slate-400">
                                ({c.symbol.trim()})
                              </span>
                              {isCustomized && (
                                <span className="text-[9px] px-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                                  Custom FX
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {c.name}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <div className="text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                              1 $ = {effectiveRate.toFixed(c.decimals === 0 ? 0 : 2)}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Exchange Rate Overrides Section */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Custom Exchange Rates &amp; FX Adjustment
                    </h4>
                  </div>
                  {Object.keys(currencyConfig.customRates).length > 0 && (
                    <button
                      onClick={handleResetAllRates}
                      className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset All to Defaults</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  By default, real-time benchmark rates are applied. You can optionally override exchange rates for any currency to match your bank or card conversion terms.
                </p>

                {/* Edit specific rate input */}
                {editingCustomRate ? (
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-850 p-2.5 rounded-xl border border-emerald-400">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      1 USD =
                    </span>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      placeholder="e.g. 0.95"
                      value={customRateInput}
                      onChange={(e) => setCustomRateInput(e.target.value)}
                      className="w-28 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white font-mono"
                      autoFocus
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {editingCustomRate}
                    </span>
                    <button
                      onClick={() => handleSaveCustomRate(editingCustomRate)}
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-500"
                    >
                      Save FX
                    </button>
                    <button
                      onClick={() => setEditingCustomRate(null)}
                      className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-xs text-slate-500">Quick adjust FX rate for:</span>
                    {['EUR', 'GBP', 'CAD', 'INR', 'JPY', 'AUD', 'SGD'].map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setEditingCustomRate(c as CurrencyCode);
                          setCustomRateInput(
                            String(
                              currencyConfig.customRates[c as CurrencyCode] ??
                                SUPPORTED_CURRENCIES[c as CurrencyCode].rateFromUSD
                            )
                          );
                        }}
                        className="text-xs px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-650 rounded-lg text-slate-700 dark:text-slate-300 hover:border-emerald-400 font-semibold"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SECURITY & BIOMETRIC SETTINGS */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Privacy Blur Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Public Privacy Mask (Blur Numbers)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Mask sensitive monetary amounts with bullet dots when viewing in public
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    onUpdateSecurityConfig({
                      privacyBlur: !securityConfig.privacyBlur,
                    })
                  }
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    securityConfig.privacyBlur ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      securityConfig.privacyBlur ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Biometrics Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Biometric Touch ID / Face ID
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Unlock vault using device biometric authentication
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    onUpdateSecurityConfig({
                      biometricEnabled: !securityConfig.biometricEnabled,
                    })
                  }
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    securityConfig.biometricEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      securityConfig.biometricEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* PIN Code Setup */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Numeric PIN Protection
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {securityConfig.pinEnabled
                          ? 'PIN lock is active and required upon launch'
                          : 'Set a 4-digit code to protect your ledger'}
                      </p>
                    </div>
                  </div>

                  {securityConfig.pinEnabled ? (
                    <button
                      onClick={onDisablePin}
                      className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold hover:bg-rose-100"
                    >
                      Disable PIN
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsSettingPin(true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
                    >
                      Setup PIN
                    </button>
                  )}
                </div>

                {/* PIN setup form */}
                {isSettingPin && (
                  <form onSubmit={handleSavePin} className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                          New 4-Digit PIN
                        </label>
                        <input
                          type="password"
                          maxLength={6}
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-center text-lg tracking-widest text-slate-900 dark:text-white font-mono"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                          Confirm PIN
                        </label>
                        <input
                          type="password"
                          maxLength={6}
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-center text-lg tracking-widest text-slate-900 dark:text-white font-mono"
                        />
                      </div>
                    </div>

                    {pinError && (
                      <p className="text-xs text-rose-500 font-semibold">{pinError}</p>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSettingPin(false);
                          setPinError('');
                        }}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-500"
                      >
                        Save PIN Code
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: AUTO-SYNC SETTINGS */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Automatic Google Sheets Sync Interval
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select how frequently background sync telemetry pushes and pulls changes with Google Sheets.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  {[
                    { val: 0, label: 'Manual Only' },
                    { val: 1, label: 'Every 1 Min' },
                    { val: 5, label: 'Every 5 Mins' },
                    { val: 15, label: 'Every 15 Mins' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() =>
                        onUpdateSheetConfig({
                          autoSyncIntervalMinutes: opt.val,
                        })
                      }
                      className={`p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        sheetConfig.autoSyncIntervalMinutes === opt.val
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-650 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 shrink-0">
          <span className="text-xs text-slate-400">
            Active Currency: <strong>{currentDisplayDetail.code} ({currentDisplayDetail.symbol})</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
