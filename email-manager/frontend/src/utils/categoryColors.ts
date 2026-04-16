import type { EmailCategory } from '../../shared/types';

export const CATEGORY_LABELS: Record<EmailCategory, string> = {
  ceo_board: 'CEO / Board',
  admin_ops: 'Admin / Ops',
  guest: 'Guest',
  supplier: 'Supplier',
  staff: 'Staff',
  unknown: 'Uncategorised',
};

export const CATEGORY_COLORS: Record<EmailCategory, { bg: string; text: string; border: string; dot: string }> = {
  ceo_board: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  admin_ops: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  guest: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  supplier: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
  staff: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  unknown: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
};

export const CATEGORY_SIDEBAR_ICONS: Record<EmailCategory | 'all', string> = {
  all: '📥',
  ceo_board: '👔',
  admin_ops: '🏢',
  guest: '🍽️',
  supplier: '🚚',
  staff: '👥',
  unknown: '❓',
};
