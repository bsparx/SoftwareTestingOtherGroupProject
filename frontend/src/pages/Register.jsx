import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './Auth.css'; // Reusing the same CSS

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Resident');
  const [roomNumber, setRoomNumber] = useState('');
  const { register } = useContext(AuthContext);

  const submitHandler = (e) => {
    e.preventDefault();
    register(name, email, password, role, roomNumber);
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
            Join the centralized platform to report issues, request visitors, and manage the hostel securely.
          </p>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-branding-icon">IBA</div>
          
          <h2 className="auth-title">Create an Account</h2>
          <p className="auth-subtitle">Register to access the portal</p>

          <form onSubmit={submitHandler}>
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                className="form-input"
                placeholder="Ex. Syed Hasan"
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>

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
                placeholder="Create a password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <select 
                className="form-select"
                value={role} 
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Resident">Resident</option>
                <option value="Maintenance">Maintenance Worker</option>
                <option value="Admin">Admin</option>
                <option value="Guard">Guard</option>
              </select>
            </div>

            {role === 'Resident' && (
              <div className="form-group">
                <label>Room Number</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g. A-101"
                  value={roomNumber} 
                  onChange={(e) => setRoomNumber(e.target.value)} 
                  required 
                />
              </div>
            )}

            <button type="submit" className="auth-btn" style={{ marginTop: '10px' }}>Register</button>
          </form>

          <p className="auth-footer-text">
            Already have an account? <Link to="/login" className="auth-footer-link">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
