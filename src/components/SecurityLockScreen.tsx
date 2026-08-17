import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Fingerprint,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Clock,
  AlertCircle,
  Check,
  Sparkles,
} from 'lucide-react';
import { SecurityConfig } from '../types';
import {
  authenticateBiometrics,
  registerBiometrics,
  verifyPin,
  hashPin,
  checkBiometricAvailability,
} from '../services/biometricService';

interface SecurityLockScreenProps {
  securityConfig: SecurityConfig;
  onUnlockSuccess: () => void;
  onUpdateSecurityConfig: (config: Partial<SecurityConfig>) => void;
}

export const SecurityLockScreen: React.FC<SecurityLockScreenProps> = ({
  securityConfig,
  onUnlockSuccess,
  onUpdateSecurityConfig,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Auto trigger biometrics on mount if biometric enabled
  useEffect(() => {
    if (securityConfig.biometricEnabled && securityConfig.isLocked) {
      handleBiometricAuth();
    }
  }, [securityConfig.biometricEnabled, securityConfig.isLocked]);

  const handleBiometricAuth = async () => {
    setIsAuthenticating(true);
    setErrorMsg(null);
    try {
      const res = await authenticateBiometrics(securityConfig.credentialId);
      if (res.success) {
        onUnlockSuccess();
      } else {
        setErrorMsg(res.error || 'Biometric authentication was cancelled.');
      }
    } catch (err) {
      setErrorMsg('Biometric authentication failed.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePinSubmit = async (enteredPin: string) => {
    if (!securityConfig.pinHash) {
      // Default fallback PIN if none configured is 1234
      if (enteredPin === '1234') {
        onUnlockSuccess();
        return;
      }
    }

    if (securityConfig.pinHash) {
      const isValid = await verifyPin(enteredPin, securityConfig.pinHash);
      if (isValid) {
        onUnlockSuccess();
        return;
      }
    }

    setErrorMsg('Incorrect PIN. Please try again.');
    setPinInput('');
  };

  const handleKeypadPress = (num: string) => {
    if (pinInput.length >= 6) return;
    const next = pinInput + num;
    setPinInput(next);
    if (next.length === 4 && (!securityConfig.pinHash || securityConfig.pinHash.length > 0)) {
      handlePinSubmit(next);
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
  };

  if (!securityConfig.isLocked) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-fadeIn">
        {/* Shield Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Finance Vault Locked
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Authenticate using Touch ID, Face ID, or PIN
          </p>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center justify-center gap-1.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PIN Indicators */}
        <div className="flex justify-center items-center gap-3 py-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                pinInput.length > idx
                  ? 'bg-emerald-400 scale-110 shadow-sm shadow-emerald-400/50'
                  : 'bg-slate-700 border border-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeypadPress(num)}
              className="w-16 h-16 rounded-2xl bg-slate-800/80 hover:bg-slate-750 active:bg-emerald-600 active:text-white text-lg font-bold text-white border border-slate-750 transition-all flex items-center justify-center cursor-pointer"
            >
              {num}
            </button>
          ))}

          {/* Biometric trigger button */}
          <button
            onClick={handleBiometricAuth}
            disabled={isAuthenticating}
            title="Authenticate with Touch ID / Face ID"
            className="w-16 h-16 rounded-2xl bg-slate-800/50 hover:bg-slate-750 text-emerald-400 border border-slate-750 transition-all flex items-center justify-center cursor-pointer"
          >
            <Fingerprint className="w-6 h-6" />
          </button>

          {/* 0 Key */}
          <button
            onClick={() => handleKeypadPress('0')}
            className="w-16 h-16 rounded-2xl bg-slate-800/80 hover:bg-slate-750 active:bg-emerald-600 active:text-white text-lg font-bold text-white border border-slate-750 transition-all flex items-center justify-center cursor-pointer"
          >
            0
          </button>

          {/* Backspace Key */}
          <button
            onClick={handleBackspace}
            title="Delete"
            className="w-16 h-16 rounded-2xl bg-slate-800/50 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-750 transition-all flex items-center justify-center cursor-pointer text-xs font-semibold"
          >
            Delete
          </button>
        </div>

        {/* Default hint */}
        <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
          Default Vault PIN is <code className="text-emerald-400 font-mono font-bold">1234</code> or use platform biometrics.
        </div>
      </div>
    </div>
  );
};
