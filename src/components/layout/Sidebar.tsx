import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutGrid, CheckSquare, Settings, X, User, Shield, BookOpen } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../context/AdminContext';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { isFeatureEnabled } = useSubscription();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-mobile-open' : ''}`}>
      <div className="sidebar-header">
        <Link to="/dashboard" className="logo">
          <CheckSquare size={24} />
          <span className="logo-text">TaskFlow</span>
        </Link>
        <button className="close-sidebar" onClick={toggleSidebar}>
          <X size={20} />
        </button>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <LayoutGrid size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink to="/flashcards" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <BookOpen size={20} />
          <span>Flashcards</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <User size={20} />
          <span>Profile</span>
        </NavLink>
        
        <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
        
        {user && isAdmin(user.email || '') && (
          <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-link active admin-nav-link' : 'nav-link admin-nav-link'}>
            <Shield size={20} />
            <span>Admin Panel</span>
          </NavLink>
        )}
      </nav>
      
      <div className="sidebar-footer">
        <div className="app-version">v1.0.0</div>
      </div>
    </aside>
  );
};

export default Sidebar;