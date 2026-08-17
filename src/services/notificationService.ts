import { SpendingAlert, BudgetGoal, Transaction } from '../types';

// Play a subtle gentle alert chime using Web Audio API
export function playAlertChime(level: 'warning' | 'critical' | 'info' = 'info') {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (level === 'critical') {
      // Urgent double tone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(440.0, now + 0.12); // A4
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (level === 'warning') {
      // Warning chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Gentle notification pop
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  } catch (e) {
    // Audio contexts might be blocked until user gesture, safely ignore
  }
}

// Request Browser Push Notification permission
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
}

// Send Web Push notification if permission is granted
export function sendBrowserNotification(title: string, body: string, icon = '💰') {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>' + icon + '</text></svg>',
        badge: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚠️</text></svg>',
        tag: 'finance-budget-alert-' + Date.now(),
      });
    } catch (e) {
      console.warn('Native notification failed:', e);
    }
  }
}

// Evaluate budgets against current month transactions
export function evaluateBudgetAlerts(
  transactions: Transaction[],
  budgets: BudgetGoal[],
  previousAlerts: SpendingAlert[] = []
): { alerts: SpendingAlert[]; newAlertTriggered: boolean } {
  const currentYearMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  // Filter current month expenses
  const currentMonthExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.date.startsWith(currentYearMonth)
  );

  const categoryTotals: Record<string, number> = {};
  for (const t of currentMonthExpenses) {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
  }

  const newAlerts: SpendingAlert[] = [...previousAlerts];
  let triggered = false;

  for (const budget of budgets) {
    const spent = categoryTotals[budget.category] || 0;
    const percent = Math.round((spent / budget.monthlyLimit) * 100);
    const threshold = budget.alertThresholdPercent || 80;

    // Check if exceeded limit (100%)
    if (percent >= 100) {
      // Check if critical alert already triggered today for this category
      const alreadyAlertedCritical = previousAlerts.some(
        (a) =>
          a.category === budget.category &&
          a.level === 'critical' &&
          a.timestamp.startsWith(new Date().toISOString().slice(0, 10))
      );

      if (!alreadyAlertedCritical) {
        const overBy = spent - budget.monthlyLimit;
        const alert: SpendingAlert = {
          id: `alert-crit-${budget.id}-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'critical',
          category: budget.category,
          currentAmount: spent,
          limitAmount: budget.monthlyLimit,
          percentUsed: percent,
          message: `Critical Limit Exceeded: You have spent $${spent.toFixed(2)} on ${budget.category} (${percent}% of your $${budget.monthlyLimit} budget, $${overBy.toFixed(2)} over limit).`,
          read: false,
        };
        newAlerts.unshift(alert);
        triggered = true;
        sendBrowserNotification('🚨 Budget Limit Exceeded!', alert.message, '🚨');
        playAlertChime('critical');
      }
    } else if (percent >= threshold) {
      // Warning threshold (e.g. 80%)
      const alreadyAlertedWarning = previousAlerts.some(
        (a) =>
          a.category === budget.category &&
          a.timestamp.startsWith(new Date().toISOString().slice(0, 10))
      );

      if (!alreadyAlertedWarning) {
        const remaining = budget.monthlyLimit - spent;
        const alert: SpendingAlert = {
          id: `alert-warn-${budget.id}-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'warning',
          category: budget.category,
          currentAmount: spent,
          limitAmount: budget.monthlyLimit,
          percentUsed: percent,
          message: `Spending Alert: You've reached ${percent}% ($${spent.toFixed(2)}) of your $${budget.monthlyLimit} budget for ${budget.category}. Only $${remaining.toFixed(2)} remaining.`,
          read: false,
        };
        newAlerts.unshift(alert);
        triggered = true;
        sendBrowserNotification('⚠️ Budget Threshold Reached', alert.message, '⚠️');
        playAlertChime('warning');
      }
    }
  }

  return { alerts: newAlerts.slice(0, 30), newAlertTriggered: triggered };
}
