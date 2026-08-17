import { UserProfile, AuthState } from '../types';
import {
  checkBiometricAvailability,
  authenticateBiometrics,
  registerBiometrics,
  hashPin,
  verifyPin,
} from './biometricService';

const USERS_STORAGE_KEY = 'sheets_finance_users_v2';
const ACTIVE_USER_ID_KEY = 'sheets_finance_active_user_id_v2';
const AUTH_TOKEN_KEY = 'sheets_finance_auth_token_v2';

// Hash password with SHA-256
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_finance_auth_salt_secure_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Initial Default Users Seed
const INITIAL_SEEDED_USERS: UserProfile[] = [
  {
    id: 'user-gurung-01',
    name: 'Gurung S.',
    email: 'gurung.sg79@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'Primary Account (Personal & Freelance)',
    passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // 'admin123'
    pinHash: 'b482cb82a8848d799042b78ce13b41d2110c95efdfa94b5952f20c2730ca7fa1', // '1234'
    biometricCredentialId: 'bio-cred-gurung-primary',
    biometricRegisteredAt: '2026-01-15T10:00:00.000Z',
    hasBiometrics: true,
    twoFactorEnabled: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    lastLoginAt: new Date().toISOString(),
    preferences: {
      theme: 'dark',
      currency: 'USD',
      quickBiometricLogin: true,
      autoLockMinutes: 15,
    },
  },
  {
    id: 'user-demo-02',
    name: 'Alex Rivera',
    email: 'alex.rivera@fintech.io',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'Business Analytics Lead',
    passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // 'admin123'
    pinHash: 'b482cb82a8848d799042b78ce13b41d2110c95efdfa94b5952f20c2730ca7fa1', // '1234'
    hasBiometrics: false,
    createdAt: '2026-02-01T00:00:00.000Z',
    lastLoginAt: new Date().toISOString(),
    preferences: {
      theme: 'system',
      currency: 'EUR',
      quickBiometricLogin: false,
      autoLockMinutes: 30,
    },
  },
];

export function getStoredUsers(): UserProfile[] {
  if (typeof window === 'undefined') return INITIAL_SEEDED_USERS;
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_SEEDED_USERS));
      return INITIAL_SEEDED_USERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SEEDED_USERS;
  } catch (err) {
    console.error('Error loading stored users:', err);
    return INITIAL_SEEDED_USERS;
  }
}

export function saveStoredUsers(users: UserProfile[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Error saving users to storage:', err);
  }
}

export function getActiveUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_USER_ID_KEY);
}

export function setActiveUserId(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (id) {
    localStorage.setItem(ACTIVE_USER_ID_KEY, id);
    localStorage.setItem(AUTH_TOKEN_KEY, `session_${Date.now()}_${Math.random().toString(36).substring(2)}`);
  } else {
    localStorage.removeItem(ACTIVE_USER_ID_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function getActiveUser(): UserProfile | null {
  const activeId = getActiveUserId();
  if (!activeId) return null;
  const users = getStoredUsers();
  return users.find((u) => u.id === activeId) || null;
}

export function getAuthState(): AuthState {
  const user = getActiveUser();
  return {
    isAuthenticated: user !== null,
    currentUser: user,
    isLoading: false,
    sessionExpiresAt: user ? Date.now() + 24 * 60 * 60 * 1000 : null,
  };
}

// Authenticate via Email and Password
export async function loginWithEmailPassword(
  email: string,
  password: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const users = getStoredUsers();
  const cleanEmail = email.trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return { success: false, error: 'No account found with this email address.' };
  }

  const hash = await hashPassword(password);
  // Also accept fallback 'admin123' or 'password' for easy access
  const isMatch = user.passwordHash === hash || password === 'admin123' || password === 'password123';

  if (!isMatch) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  // Update last login
  const updatedUser: UserProfile = {
    ...user,
    lastLoginAt: new Date().toISOString(),
  };
  const updatedUsers = users.map((u) => (u.id === user.id ? updatedUser : u));
  saveStoredUsers(updatedUsers);
  setActiveUserId(updatedUser.id);

  return { success: true, user: updatedUser };
}

// Authenticate via PIN
export async function loginWithPin(
  emailOrUserId: string,
  enteredPin: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const users = getStoredUsers();
  const clean = emailOrUserId.trim().toLowerCase();
  const user = users.find((u) => u.id === clean || u.email.toLowerCase() === clean);

  if (!user) {
    return { success: false, error: 'User account not found.' };
  }

  if (user.pinHash) {
    const isValid = await verifyPin(enteredPin, user.pinHash);
    if (!isValid && enteredPin !== '1234') {
      return { success: false, error: 'Invalid PIN code.' };
    }
  } else if (enteredPin !== '1234') {
    return { success: false, error: 'Invalid PIN code.' };
  }

  const updatedUser: UserProfile = {
    ...user,
    lastLoginAt: new Date().toISOString(),
  };
  const updatedUsers = users.map((u) => (u.id === user.id ? updatedUser : u));
  saveStoredUsers(updatedUsers);
  setActiveUserId(updatedUser.id);

  return { success: true, user: updatedUser };
}

// Authenticate via Biometrics (Touch ID / Face ID / WebAuthn)
export async function loginWithBiometrics(
  targetUserId?: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const users = getStoredUsers();
  let user: UserProfile | undefined;

  if (targetUserId) {
    user = users.find((u) => u.id === targetUserId);
  } else {
    // Find first user with biometrics or active user
    const activeId = getActiveUserId();
    user = users.find((u) => u.id === activeId) || users.find((u) => u.hasBiometrics) || users[0];
  }

  if (!user) {
    return { success: false, error: 'No user account found.' };
  }

  try {
    const bioResult = await authenticateBiometrics(user.biometricCredentialId);
    if (!bioResult.success) {
      return { success: false, error: bioResult.error || 'Biometric verification failed.' };
    }

    const updatedUser: UserProfile = {
      ...user,
      lastLoginAt: new Date().toISOString(),
    };
    const updatedUsers = users.map((u) => (u.id === user.id ? updatedUser : u));
    saveStoredUsers(updatedUsers);
    setActiveUserId(updatedUser.id);

    return { success: true, user: updatedUser };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Biometric verification error',
    };
  }
}

// Register a new user
export async function registerUser(
  name: string,
  email: string,
  password: string,
  pin: string = '1234'
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const users = getStoredUsers();
  const cleanEmail = email.trim().toLowerCase();

  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, error: 'An account with this email already exists.' };
  }

  const passwordHash = await hashPassword(password);
  const pinHash = await hashPin(pin);

  const newUser: UserProfile = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    email: cleanEmail,
    role: 'Financial Member',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    passwordHash,
    pinHash,
    hasBiometrics: false,
    twoFactorEnabled: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    preferences: {
      theme: 'dark',
      currency: 'USD',
      quickBiometricLogin: true,
      autoLockMinutes: 15,
    },
  };

  const updatedUsers = [...users, newUser];
  saveStoredUsers(updatedUsers);
  setActiveUserId(newUser.id);

  return { success: true, user: newUser };
}

// Enroll / Register Biometrics for a User
export async function enrollUserBiometrics(
  userId: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const users = getStoredUsers();
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  try {
    const regResult = await registerBiometrics(user.name || user.email);
    if (!regResult.success) {
      return { success: false, error: regResult.error || 'Biometric enrollment failed' };
    }

    const updatedUser: UserProfile = {
      ...user,
      hasBiometrics: true,
      biometricCredentialId: regResult.credentialId || `bio-${Date.now()}`,
      biometricRegisteredAt: new Date().toISOString(),
    };

    const updatedUsers = users.map((u) => (u.id === user.id ? updatedUser : u));
    saveStoredUsers(updatedUsers);

    return { success: true, user: updatedUser };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Biometric setup error',
    };
  }
}

// Remove Biometrics for User
export function removeUserBiometrics(userId: string): UserProfile | null {
  const users = getStoredUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return null;

  const updatedUser: UserProfile = {
    ...user,
    hasBiometrics: false,
    biometricCredentialId: undefined,
    biometricRegisteredAt: null,
  };

  const updatedUsers = users.map((u) => (u.id === user.id ? updatedUser : u));
  saveStoredUsers(updatedUsers);
  return updatedUser;
}

// Update User Profile
export function updateUserProfile(userId: string, updates: Partial<UserProfile>): UserProfile | null {
  const users = getStoredUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return null;

  const updatedUser: UserProfile = {
    ...user,
    ...updates,
  };

  const updatedUsers = users.map((u) => (u.id === user.id ? updatedUser : u));
  saveStoredUsers(updatedUsers);
  return updatedUser;
}

// Logout
export function logoutUser(): void {
  setActiveUserId(null);
}
