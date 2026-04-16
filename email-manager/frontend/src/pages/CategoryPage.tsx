import { useParams } from 'react-router-dom';
import EmailList from '../components/email/EmailList';
import EmailDetail from '../components/email/EmailDetail';
import type { EmailCategory } from '../../shared/types';
import { CATEGORY_LABELS } from '../utils/categoryColors';

export default function CategoryPage() {
  const { category } = useParams<{ category: EmailCategory }>();

  return (
    <div className="flex h-full">
      <EmailList category={category as EmailCategory} folder="inbox" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            {CATEGORY_LABELS[category as EmailCategory] || category}
            {category === 'ceo_board' && (
              <span className="ml-2 text-xs font-normal text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                Manual replies only
              </span>
            )}
          </h2>
        </div>
        <EmailDetail />
      </div>
    </div>
  );
}
