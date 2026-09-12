import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

// Sidebar is fixed/overlay, so it can wrap any page (including the
// existing App/Dashboard content) without touching that page's own
// layout CSS.
function Layout() {
  return (
    <>
      <Sidebar />
      <Outlet />
    </>
  );
}

export default Layout;