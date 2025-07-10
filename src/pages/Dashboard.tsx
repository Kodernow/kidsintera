import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';
import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import Flashcards from './Flashcards';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  
  const isUserAdmin = user && isAdmin(user.email || '');
  
  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <h1 className="page-heading">🌟 Learning Dashboard 🌟</h1>
          {isUserAdmin && (
            <Link 
              to="/admin" 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--primary-100)',
                color: 'var(--primary-700)',
                padding: '8px 16px',
                borderRadius: 'var(--border-radius-md)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'var(--transition-base)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary-200)';
                e.currentTarget.style.color = 'var(--primary-800)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary-100)';
                e.currentTarget.style.color = 'var(--primary-700)';
              }}
            >
              <Shield size={16} />
              Admin Panel
            </Link>
          )}
        </div>
        <p className="subtitle">Interactive learning with sounds, animations, and AI detection for kids</p>
      </div>
      
      {/* Embed Flashcards component */}
      <Flashcards isEmbeddedInDashboard={true} />
    </div>
  );
};

export default Dashboard;