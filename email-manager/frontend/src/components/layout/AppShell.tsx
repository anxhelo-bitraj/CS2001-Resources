import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useUiStore } from '../../store/uiStore';
import ComposeModal from '../compose/ComposeModal';

export default function AppShell() {
  const composeOpen = useUiStore((s) => s.composeOpen);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      {composeOpen && <ComposeModal />}
    </div>
  );
}
