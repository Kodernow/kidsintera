import React from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Zap, Shield, Users, Sparkles, ArrowRight, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAdmin } from '../context/AdminContext';
import './Landing.css';

const Landing: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { plans } = useAdmin();

  const activePlans = plans.filter(plan => plan.isActive && plan.billingPeriod === 'monthly');

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="header-content">
          <Link to="/" className="landing-logo">
            <CheckSquare size={32} />
            <span>TaskFlow</span>
          </Link>
          
          <nav className="landing-nav">
            <div className="nav-links">
              <a href="#features" className="nav-link">Features</a>
              <a href="#pricing" className="nav-link">Pricing</a>
              <a href="#about" className="nav-link">About</a>
              <a href="#contact" className="nav-link">Contact</a>
            </div>
            
            <div className="auth-buttons">
              <Link to="/auth/signin" className="btn-outline">
                Sign In
              </Link>
              <Link to="/auth/signup" className="btn-primary">
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <h1 className="hero-title">
            Organize Your Tasks Like Never Before
          </h1>
          <p className="hero-subtitle">
            Boost your productivity with our intuitive task management platform. Organize, prioritize, and complete your work with ease using our powerful Kanban-style boards.
          </p>
          
          <div className="hero-cta">
            <Link to="/auth/signup" className="btn-primary btn-large">
              Start Organizing Free
              <ArrowRight size={20} style={{ marginLeft: '8px' }} />
            </Link>
            <Link to="#features" className="btn-outline btn-large">
              Learn More
            </Link>
          </div>
          
          <div className="hero-image">
            <img 
              src="https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1200" 
              alt="Task management workspace with organized boards and notes"
            />
          </div>
        </section>

        <section id="features" className="features-section">
          <div className="features-container">
            <h2 className="section-title">Everything You Need to Stay Organized</h2>
            <p className="section-subtitle">
              Powerful features designed to help you manage tasks efficiently and boost your productivity.
            </p>
            
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <CheckSquare size={32} />
                </div>
                <h3>Kanban Boards</h3>
                <p>Visualize your workflow with intuitive drag-and-drop Kanban boards. Move tasks through different stages effortlessly.</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <Zap size={32} />
                </div>
                <h3>Real-time Updates</h3>
                <p>Stay synchronized across all your devices with real-time updates. Never miss an important task or deadline.</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <Users size={32} />
                </div>
                <h3>Team Collaboration</h3>
                <p>Work together seamlessly with team members. Share boards, assign tasks, and track progress collaboratively.</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <Shield size={32} />
                </div>
                <h3>Secure & Reliable</h3>
                <p>Your data is protected with enterprise-grade security. Automatic backups ensure your tasks are always safe.</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <Sparkles size={32} />
                </div>
                <h3>Smart Organization</h3>
                <p>Intelligent categorization and filtering help you find and organize tasks quickly. Focus on what matters most.</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">
                  <CheckSquare size={32} />
                </div>
                <h3>Custom Workflows</h3>
                <p>Create custom workflows that match your process. Adapt the system to work exactly how you need it to.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="pricing-section">
          <div className="pricing-container">
            <h2 className="section-title">Choose Your Plan</h2>
            <p className="section-subtitle">
              Select the perfect plan for your productivity needs
            </p>
            
            <div className="pricing-grid">
              {activePlans.map(plan => (
                <div key={plan.id} className={`pricing-card ${plan.name === 'Pro' ? 'featured' : ''}`}>
                  {plan.name === 'Pro' && (
                    <div className="featured-badge">
                      <Zap size={16} />
                      Most Popular
                    </div>
                  )}
                  
                  <div className="plan-header">
                    <h3 className="plan-name">{plan.name}</h3>
                    <p className="plan-description">{plan.description}</p>
                  </div>

                  <div className="plan-pricing">
                    <span className="plan-price">${plan.price}</span>
                    <span className="plan-period">/{plan.billingPeriod}</span>
                  </div>

                  <div className="plan-features">
                    <div className="feature-item">
                      <Check size={16} className="feature-icon" />
                      <span>Task Management</span>
                    </div>
                    
                    {plan.features.todoboardEnabled && (
                      <div className="feature-item">
                        <Check size={16} className="feature-icon" />
                        <span>Kanban Boards</span>
                      </div>
                    )}
                    
                    {plan.features.customDomain && (
                      <div className="feature-item">
                        <Check size={16} className="feature-icon" />
                        <span>Custom Domain</span>
                      </div>
                    )}
                    
                    {plan.features.prioritySupport && (
                      <div className="feature-item">
                        <Check size={16} className="feature-icon" />
                        <span>Priority Support</span>
                      </div>
                    )}
                  </div>

                  <div className="plan-action">
                    <Link to="/auth/signup" className={`plan-button ${plan.name === 'Pro' ? 'primary' : 'secondary'}`}>
                      Get Started
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pricing-cta">
              <Link to="/pricing" className="btn-outline">
                View All Plans & Features
              </Link>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-container">
            <h2 className="cta-title">Ready to Boost Your Productivity?</h2>
            <p className="cta-subtitle">
              Join thousands of users who trust TaskFlow to organize their work and achieve their goals.
            </p>
            <Link to="/auth/signup" className="btn-white">
              Start Your Free Trial
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-links">
            <a href="#privacy" className="footer-link">Privacy Policy</a>
            <a href="#terms" className="footer-link">Terms of Service</a>
            <a href="#support" className="footer-link">Support</a>
            <a href="#blog" className="footer-link">Blog</a>
          </div>
          <p>&copy; 2024 TaskFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;