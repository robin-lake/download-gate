import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './DashboardLayout.scss';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <Link to="/dashboard" className="dashboard-logo">
            Download Gate
          </Link>
          <nav className="dashboard-nav">
            <NavLink to="/dashboard" end>
              Gates
            </NavLink>
            <NavLink to="/dashboard/new">New gate</NavLink>
          </nav>
          <div className="dashboard-user">
            <span className="user-email">{user?.email}</span>
            <button type="button" onClick={handleLogout} className="btn-logout">
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}
