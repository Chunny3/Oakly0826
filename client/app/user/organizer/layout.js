// 在 client/app/user/organizer/layout.js 建立這個檔案
import { TabProvider } from '@/contexts/TabContext';

export default function OrganizerLayout({ children }) {
  return (
    <TabProvider>
      {children}
    </TabProvider>
  );
}