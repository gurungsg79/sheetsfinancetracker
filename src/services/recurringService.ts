import { RecurringTransaction, Transaction, RecurringFrequency } from '../types';

export function calculateNextDueDate(currentDateStr: string, frequency: RecurringFrequency): string {
  const date = new Date(currentDateStr);
  if (isNaN(date.getTime())) {
    return new Date().toISOString().split('T')[0];
  }

  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date.toISOString().split('T')[0];
}

export function isDue(nextDueDateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return nextDueDateStr <= today;
}

export function getDaysUntilDue(nextDueDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(nextDueDateStr);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function generateTransactionFromRecurring(
  recurring: RecurringTransaction,
  executionDate?: string
): Transaction {
  const dateToUse = executionDate || recurring.nextDueDate || new Date().toISOString().split('T')[0];
  return {
    id: `tx-rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    date: dateToUse,
    type: recurring.type,
    category: recurring.category,
    subcategory: recurring.subcategory || 'Recurring Scheduled',
    amount: recurring.amount,
    description: recurring.description,
    paymentMethod: recurring.paymentMethod,
    isTaxDeductible: recurring.isTaxDeductible,
    taxCategory: recurring.taxCategory,
    notes: recurring.notes ? `[Recurring: ${recurring.frequency}] ${recurring.notes}` : `[Recurring: ${recurring.frequency}]`,
    createdAt: new Date().toISOString(),
    isPendingSync: true,
    recurringId: recurring.id,
  };
}

export function advanceRecurringSchedule(recurring: RecurringTransaction): RecurringTransaction {
  const nextDate = calculateNextDueDate(recurring.nextDueDate, recurring.frequency);
  return {
    ...recurring,
    lastAppliedDate: recurring.nextDueDate,
    nextDueDate: nextDate,
  };
}

