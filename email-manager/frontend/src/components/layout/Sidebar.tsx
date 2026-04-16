import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Mail, Star, Truck, Users, Building2, ChefHat, Inbox, BarChart2, BookTemplate, ListTodo, Settings, Sun, PenSquare } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import type { EmailCategory } from '../../../shared/types';
import { CATEGORY_LABELS } from '../../utils/categoryColors';
import { useUiStore } from '../../store/uiStore';

const categories: { id: EmailCategory; icon: React.ReactNode; label: string }[] = [
  { id: 'ceo_board', icon: <Star size={15} />, label: CATEGORY_LABELS.ceo_board },
  { id: 'admin_ops', icon: <Building2 size={15} />, label: CATEGORY_LABELS.admin_ops },
  { id: 'guest', icon: <ChefHat size={15} />, label: CATEGORY_LABELS.guest },
  { id: 'supplier', icon: <Truck size={15} />, label: CATEGORY_LABELS.supplier },
  { id: 'staff', icon: <Users size={15} />, label: CATEGORY_LABELS.staff },
];

const CATEGORY_RING: Record<EmailCategory, string> = {
  ceo_board: 'bg-red-500',
  admin_ops: 'bg-orange-500',
  guest: 'bg-blue-500',
  supplier: 'bg-green-500',
  staff: 'bg-purple-500',
  unknown: 'bg-slate-400',
};

export default function Sidebar() {
  const navigate = useNavigate();
  const setComposeOpen = useUiStore((s) => s.setComposeOpen);

  const { data: counts } = useQuery({
    queryKey: ['emailCounts'],
    queryFn: () => axiosClient.get<Array<{ category: string; count: number; unread: number }>>('/emails/counts'),
    refetchInterval: 60000,
    select: (r) => {
      const map: Record<string, number> = {};
      r.data?.forEach((c) => { map[c.category] = c.unread; });
      return map;
    },
  });

  const navItem = (to: string, icon: React.ReactNode, label: string, badge?: number) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
        }`
      }
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </NavLink>
  );

  return (
    <aside className="w-60 flex flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="text-blue-600" size={22} />
          <span className="font-bold text-slate-900 dark:text-white text-base">GM Mail</span>
        </div>
        <button
          onClick={() => setComposeOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
        >
          <PenSquare size={15} />
          Compose
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 scrollbar-thin">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-1.5">Main</p>
        {navItem('/app/briefing', <Sun size={15} />, 'Morning Briefing')}
        {navItem('/app/inbox', <Inbox size={15} />, 'All Inbox')}

        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-1.5 mt-3">Categories</p>
        {categories.map((cat) => (
          <NavLink
            key={cat.id}
            to={`/app/category/${cat.id}`}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
              }`
            }
          >
            <span className={`w-2 h-2 rounded-full ${CATEGORY_RING[cat.id]}`} />
            {cat.icon}
            <span className="flex-1">{cat.label}</span>
            {counts?.[cat.id] ? (
              <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {counts[cat.id]}
              </span>
            ) : null}
          </NavLink>
        ))}

        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-1.5 mt-3">Tools</p>
        {navItem('/app/tasks', <ListTodo size={15} />, 'Tasks')}
        {navItem('/app/templates', <BookTemplate size={15} />, 'Templates')}
        {navItem('/app/contacts', <Users size={15} />, 'Contacts')}
        {navItem('/app/analytics', <BarChart2 size={15} />, 'Analytics')}
        {navItem('/app/settings', <Settings size={15} />, 'Settings')}
      </nav>
    </aside>
  );
}
