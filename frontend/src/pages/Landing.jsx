import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="landing-navbar">
        <div className="landing-logo">
          <div className="branding-icon">IBA</div>
          Hostel Maintenance
        </div>
        <Link to="/login" className="btn-nav-login">Login</Link>
      </nav>

      {/* Hero Section */}
      <main className="landing-main">
        <div className="hero-content">
          <h1>Hostel Maintenance for IBA Students</h1>
          <p className="subtitle">
            A centralized platform to report maintenance issues, track complaints in real-time, 
            and ensure a comfortable living environment in your hostel. Join the secure portal 
            dedicated to keeping our campus operational!
          </p>
          
          <div className="hero-buttons">
            <Link to="/login" className="btn-primary">
              Login And Start Using
            </Link>
          </div>

          <p className="register-text">
            Don't have an account?{' '}
            <Link to="/register" className="register-link">
              Register here
            </Link>
          </p>
        </div>

        {/* Right side Graphic */}
        <div className="hero-graphic">
          <div className="graphic-outer-circle">
            <div className="graphic-inner-circle">
              {/* Simple Wrench/Tools SVG Icon for Maintenance */}
              <svg 
                className="checkmark-icon" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.5 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
              </svg>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© 2026 IBA Hostel Maintenance System</p>
        <p>Developed for Software Testing Course by Syed Hasan Imam, Agha Mohsin Hussain, Darshna Luhana & Dawood</p>
      </footer>
    </div>
  );
};

export default Landing;