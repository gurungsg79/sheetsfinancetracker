import React, { useState, useEffect } from 'react';
import {
  Fingerprint,
  Lock,
  Mail,
  KeyRound,
  User,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ScanFace,
  Globe,
  Zap,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  getStoredUsers,
  loginWithEmailPassword,
  loginWithPin,
  loginWithBiometrics,
  registerUser,
  enrollUserBiometrics,
} from '../services/authService';
import { getBiometricHardwareName } from '../services/biometricService';

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'biometric' | 'password' | 'pin' | 'register'>('biometric');
  const [storedUsers, setStoredUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [biometricScanning, setBiometricScanning] = useState(false);

  const hardwareName = getBiometricHardwareName();

  useEffect(() => {
    const users = getStoredUsers();
    setStoredUsers(users);
    if (users.length > 0) {
      // Pick first user or user with biometrics
      const defaultUser = users.find((u) => u.hasBiometrics) || users[0];
      setSelectedUser(defaultUser);
      setEmail(defaultUser.email);
    }
  }, []);

  // Attempt 1-click Biometric Auth
  const handleBiometricLogin = async (targetUser?: UserProfile) => {
    const u = targetUser || selectedUser || storedUsers[0];
    setErrorMessage(null);
    setSuccessMessage(null);
    setBiometricScanning(true);
    setIsLoading(true);

    try {
      const res = await loginWithBiometrics(u?.id);
      if (res.success && res.user) {
        setSuccessMessage(`Welcome back, ${res.user.name}!`);
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 500);
      } else {
        setErrorMessage(res.error || 'Biometric verification failed. Please use PIN or password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Biometric verification error.');
    } finally {
      setIsLoading(false);
      setBiometricScanning(false);
    }
  };

  // Handle Email & Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await loginWithEmailPassword(email, password);
      if (res.success && res.user) {
        setSuccessMessage(`Authenticated successfully!`);
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 400);
      } else {
        setErrorMessage(res.error || 'Invalid credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle PIN Keypad Login
  const handlePinLogin = async (enteredPin: string) => {
    if (!selectedUser && !email) {
      setErrorMessage('Please select a user account first.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const targetId = selectedUser ? selectedUser.id : email;
      const res = await loginWithPin(targetId, enteredPin);
      if (res.success && res.user) {
        setSuccessMessage(`PIN verified!`);
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 400);
      } else {
        setErrorMessage(res.error || 'Incorrect PIN code.');
        setPin('');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'PIN login failed.');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle New User Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const defaultPin = pin.trim() || '1234';
      const res = await registerUser(name, email, password, defaultPin);
      if (res.success && res.user) {
        // Attempt quick biometric enrollment
        try {
          await enrollUserBiometrics(res.user.id);
        } catch (e) {
          // ignore
        }

        setSuccessMessage(`Account created! Welcome, ${name}.`);
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 500);
      } else {
        setErrorMessage(res.error || 'Registration failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not register user.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Switch Profile
  const handleSelectAccount = (user: UserProfile) => {
    setSelectedUser(user);
    setEmail(user.email);
    setErrorMessage(null);
    setSuccessMessage(null);
    setPin('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden text-slate-100">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-900/50 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-xl shadow-emerald-500/10 mb-1">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Sheets Finance Tracker
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            AI-Powered Personal & Business Financial Hub
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Biometric Passkey & Vault Security</span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-4 p-1 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs font-semibold">
            <button
              onClick={() => {
                setAuthMode('biometric');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'biometric'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Biometric</span>
              <span className="sm:hidden">Bio</span>
            </button>
            <button
              onClick={() => {
                setAuthMode('password');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'password'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Password</span>
              <span className="sm:hidden">Pass</span>
            </button>
            <button
              onClick={() => {
                setAuthMode('pin');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'pin'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>PIN</span>
            </button>
            <button
              onClick={() => {
                setAuthMode('register');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'register'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Register</span>
              <span className="sm:hidden">Sign Up</span>
            </button>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="flex-1 font-semibold">{successMessage}</span>
            </div>
          )}

          {/* 1. BIOMETRIC OPTIMIZED LOGIN MODE */}
          {authMode === 'biometric' && (
            <div className="space-y-5 text-center py-2 animate-fadeIn">
              {/* Selected Profile Avatar */}
              {selectedUser ? (
                <div className="space-y-2">
                  <div className="relative inline-block">
                    <img
                      src={selectedUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={selectedUser.name}
                      className="w-16 h-16 rounded-full border-2 border-emerald-500/60 p-0.5 object-cover mx-auto shadow-lg"
                    />
                    <span className="absolute bottom-0 right-0 p-1 bg-emerald-500 text-slate-950 rounded-full shadow-sm">
                      <Fingerprint className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{selectedUser.name}</h3>
                    <p className="text-xs text-slate-400">{selectedUser.email}</p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-300">Select an account below</div>
              )}

              {/* Touch ID / Face ID Biometric Action Sensor */}
              <div className="py-2">
                <button
                  type="button"
                  onClick={() => handleBiometricLogin()}
                  disabled={isLoading}
                  className={`w-24 h-24 mx-auto rounded-3xl border flex flex-col items-center justify-center transition-all cursor-pointer relative group ${
                    biometricScanning
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 scale-105 shadow-2xl shadow-emerald-500/50'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-emerald-400 border-slate-700/80 hover:border-emerald-500/50 shadow-lg'
                  }`}
                >
                  {biometricScanning ? (
                    <>
                      <ScanFace className="w-10 h-10 animate-pulse" />
                      <span className="text-[10px] font-bold mt-1">Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-10 h-10 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-[10px] font-bold mt-1 text-slate-300 group-hover:text-white">Touch / Tap</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-200">
                  Authenticate with {hardwareName}
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Instant passwordless passkey login with military-grade device hardware security
                </p>
              </div>

              {/* Instant Biometric Primary Action Button */}
              <button
                onClick={() => handleBiometricLogin()}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Fingerprint className="w-4 h-4" />
                <span>Sign In with {hardwareName}</span>
              </button>
            </div>
          )}

          {/* 2. PASSWORD LOGIN MODE */}
          {authMode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  <span className="text-[11px] text-emerald-400/80">Default: admin123</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Remember this device</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAuthMode('biometric')}
                  className="text-emerald-400 hover:underline text-xs"
                >
                  Use Biometrics instead
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Vault</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 3. PIN KEYPAD LOGIN MODE */}
          {authMode === 'pin' && (
            <div className="space-y-4 text-center animate-fadeIn">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-300">
                  Enter 4-Digit Security Vault PIN
                </p>
                <p className="text-[11px] text-slate-400">
                  {selectedUser ? `Account: ${selectedUser.name}` : 'Default PIN: 1234'}
                </p>
              </div>

              {/* PIN Bubbles */}
              <div className="flex justify-center items-center gap-3 py-1">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full transition-all ${
                      pin.length > idx
                        ? 'bg-emerald-400 scale-110 shadow-md shadow-emerald-400/50'
                        : 'bg-slate-800 border border-slate-700'
                    }`}
                  />
                ))}
              </div>

              {/* Keypad Grid */}
              <div className="grid grid-cols-3 gap-2.5 max-w-[220px] mx-auto pt-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      if (pin.length < 4) {
                        const next = pin + num;
                        setPin(next);
                        if (next.length === 4) {
                          handlePinLogin(next);
                        }
                      }
                    }}
                    className="w-14 h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-750 text-base font-bold text-white border border-slate-700/60 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleBiometricLogin()}
                  title="Switch to Biometrics"
                  className="w-14 h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-750 text-emerald-400 border border-slate-700/60 transition-all flex items-center justify-center cursor-pointer"
                >
                  <Fingerprint className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pin.length < 4) {
                      const next = pin + '0';
                      setPin(next);
                      if (next.length === 4) {
                        handlePinLogin(next);
                      }
                    }
                  }}
                  className="w-14 h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-750 text-base font-bold text-white border border-slate-700/60 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setPin((prev) => prev.slice(0, -1))}
                  className="w-14 h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-750 text-xs font-semibold text-slate-400 border border-slate-700/60 transition-all flex items-center justify-center cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* 4. REGISTER NEW ACCOUNT MODE */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5 animate-fadeIn">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Maya Chen"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    4-Digit PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="1234"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono text-center"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Biometric passkey will be automatically enrolled on completion.</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create & Enroll Biometrics</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Profile Switcher Footer */}
          {storedUsers.length > 0 && authMode !== 'register' && (
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-emerald-400" />
                  <span>Quick Demo Profiles</span>
                </span>
                <span className="text-[10px] text-slate-500">Tap to Switch</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {storedUsers.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectAccount(u)}
                      className={`p-2 rounded-xl text-left border transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                      }`}
                    >
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-700"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate text-slate-200">{u.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{u.role || u.email}</div>
                      </div>
                      {u.hasBiometrics && (
                        <Fingerprint className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Security Disclosures */}
        <div className="flex items-center justify-center gap-4 text-slate-500 text-[11px]">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>FIDO2 / WebAuthn Certified</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>AES-256 Vault Encryption</span>
          </span>
        </div>
      </div>
    </div>
  );
};
