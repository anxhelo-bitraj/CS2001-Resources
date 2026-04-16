import type { EmailCategory } from '../../../shared/types';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../utils/categoryColors';

interface Props {
  category?: EmailCategory | string;
  size?: 'sm' | 'md';
}

export default function CategoryBadge({ category, size = 'sm' }: Props) {
  if (!category) return null;
  const colors = CATEGORY_COLORS[category as EmailCategory] || CATEGORY_COLORS.unknown;
  const label = CATEGORY_LABELS[category as EmailCategory] || category;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium
        ${colors.bg} ${colors.text} ${colors.border}
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  );
}
