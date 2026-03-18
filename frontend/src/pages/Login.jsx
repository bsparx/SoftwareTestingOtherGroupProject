import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);

  const submitHandler = (e) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <div className="auth-container">
      {/* Left Maroon Section */}
      <div className="auth-left">
        <Link to="/" className="auth-back">
          ← Back to Home
        </Link>
        <div className="auth-left-content">
          <h1>IBA HOSTEL & MAINTENANCE</h1>
          <p>
            An organized maintenance reporting system designed to save time, reduce hassle, and keep our campus living standards high.
          </p>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-branding-icon">IBA</div>
          
          <h2 className="auth-title">Login to your Account</h2>
          <p className="auth-subtitle">With Your Email Address</p>

          <form onSubmit={submitHandler}>
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                className="form-input"
                placeholder="your.email@iba.edu.pk"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                className="form-input"
                placeholder="Enter your password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>

            <div className="auth-options">
              <label>
                <input type="checkbox" /> Remember Me
              </label>
              <Link to="#" className="forgot-link">Forgot Password?</Link>
            </div>

            <button type="submit" className="auth-btn">Login</button>
          </form>

          <p className="auth-footer-text">
            Not Registered Yet? <Link to="/register" className="auth-footer-link">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
