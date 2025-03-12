import { activeSidebarAtom, setActiveSidebarAtom } from '@/stores/funnel';
import { useAtom } from 'jotai';
import { DesktopSidebarFragment } from './fragments/desktop-sidebar-fragment';

export function SidebarModule() {
  const [activePanel] = useAtom(activeSidebarAtom);
  const setActivePanel = useAtom(setActiveSidebarAtom)[1];

  return <DesktopSidebarFragment activePanel={activePanel} setActivePanel={setActivePanel} />;
}
