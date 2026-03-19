import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [staff, setStaff] = useState([]);

  // Mock Visitor State (until Day 3 backend is complete)
  const [visitors, setVisitors] = useState([]);

  // Resident Form / Modal States
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [isVisitorModalOpen, setIsVisitorModalOpen] = useState(false);
  
  // Tabs State
  const [activeTab, setActiveTab] = useState('maintenance');

  // Form Fields (Tasks)
  const [category, setCategory] = useState('Plumbing');
  const [description, setDescription] = useState('');

  // Form Fields (Visitors)
  const [visitorName, setVisitorName] = useState('');
  const [visitorCNIC, setVisitorCNIC] = useState('');
  const [expectedDate, setExpectedDate] = useState('');

  // Fetch data on load
  useEffect(() => {
    fetchComplaints();
    if (user?.role === 'Resident') {
      fetchVisitors();
    }
  }, [user]);

  const fetchComplaints = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('http://localhost:5000/api/complaints', config);
      setComplaints(data);
    } catch (error) {
      console.error('Error fetching complaints', error);
    }
  };

  const fetchVisitors = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('http://localhost:5000/api/visitors', config);
      setVisitors(data);
    } catch (error) {
      console.error('Error fetching visitors', error);
    }
  };

  const fetchStaff = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('http://localhost:5000/api/complaints/staff', config);
      setStaff(data);
    } catch (error) {
      console.error('Error fetching staff', error);
    }
  };

  const submitComplaint = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' } };
      await axios.post('http://localhost:5000/api/complaints', { category, description }, config);
      setDescription('');
      setIsComplaintModalOpen(false);
      fetchComplaints(); // refresh list
      alert('Complaint Submitted Successfully!');
    } catch (error) {
      alert('Error submitting complaint');
    }
  };

  const submitVisitor = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' } };
      await axios.post('http://localhost:5000/api/visitors', { visitorName, visitorCNIC, expectedDate }, config);
      setVisitorName('');
      setVisitorCNIC('');
      setExpectedDate('');
      setIsVisitorModalOpen(false);
      fetchVisitors(); // refresh list
      alert('Visitor Registered Successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error registering visitor');
    }
  };

  // Stats calculation
  const activeComplaintsCount = complaints.filter(c => c.status !== 'Resolved').length;
  // Count approved visitors
  const approvedVisitorsCount = visitors.filter(v => v.status === 'Approved').length; 

  // Helpers
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open': return <span className="badge badge-open">Open</span>;
      case 'In Progress': return <span className="badge badge-progress">In Progress</span>;
      case 'Resolved': return <span className="badge badge-resolved">Resolved</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Global Dashboard Navbar */}
      <nav className="dashboard-nav">
        <div className="dashboard-logo">IBA Hostel Portal</div>
        <div className="nav-user-info">
          <span>{user.name} ({user.role})</span>
          <button onClick={logout} className="btn-logout">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        
        {/* RESIDENT VIEW */}
        {user.role === 'Resident' && (
          <>
            {/* 1. Hero Header */}
            <div className="hero-header">
              <h2>Welcome, {user.name} | Room {user.roomNumber || 'N/A'}</h2>
              <div className="stats-container">
                <div className="stat-card">
                  <h4>Active Complaints</h4>
                  <p className="stat-value">{activeComplaintsCount}</p>
                </div>
                <div className="stat-card">
                  <h4>Approved Visitors</h4>
                  <p className="stat-value">{approvedVisitorsCount}</p>
                </div>
              </div>
            </div>

            {/* 2. Quick Launch Buttons */}
            <div className="quick-launch">
              <button 
                className="btn-quick btn-report"
                onClick={() => setIsComplaintModalOpen(true)}
              >
                ⚠️ Report an Issue
              </button>
              <button 
                className="btn-quick btn-visitor"
                onClick={() => setIsVisitorModalOpen(true)}
              >
                👤 Register a Visitor
              </button>
            </div>

            {/* 3. My Activity Section (Tabs) */}
            <div className="tabs-container">
              <div className="tabs-header">
                <button 
                  className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
                  onClick={() => setActiveTab('maintenance')}
                >
                  Maintenance Tickets
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'visitors' ? 'active' : ''}`}
                  onClick={() => setActiveTab('visitors')}
                >
                  Visitor Requests
                </button>
              </div>
              
              <div className="tab-content">
                {/* Maintenance Tab Content */}
                {activeTab === 'maintenance' && (
                  <>
                    {complaints.length === 0 ? (
                      <p>You have no maintenance complaints.</p>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Complaint ID</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Assigned To</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {complaints.map(comp => (
                            <tr key={comp._id}>
                              <td><strong>{comp.complaintId}</strong></td>
                              <td>{comp.category}</td>
                              <td>{comp.description}</td>
                              <td>{comp.assignedTo ? comp.assignedTo.name : 'Unassigned'}</td>
                              <td>{getStatusBadge(comp.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </>
                )}

                {/* Visitors Tab Content */}
                {activeTab === 'visitors' && (
                  <>
                    {visitors.length === 0 ? (
                      <p>No visitor requests found.</p>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Visitor Name</th>
                            <th>Expected Date / Time</th>
                            <th>CNIC</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visitors.map(vis => (
                            <tr key={vis._id}>
                              <td><strong>{vis.visitorName}</strong></td>
                              <td>{new Date(vis.expectedDate).toLocaleString()}</td>
                              <td>{vis.visitorCNIC}</td>
                              <td>
                                {vis.status === 'Pending' && <span className="badge badge-open">Pending</span>}
                                {vis.status === 'Approved' && <span className="badge badge-resolved">Approved</span>}
                                {vis.status === 'Rejected' && (
                                  <div>
                                    <span className="badge badge-progress" style={{backgroundColor: '#ef4444', color: 'white'}}>Rejected</span>
                                    <br/><small style={{color: '#ef4444'}}>{vis.rejectReason}</small>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Sidebar / Footer Policy Notice */}
            <footer className="dashboard-footer">
              <p>📌 <span className="text-maroon">Hostel Policy Notice:</span> Visitor requests are strictly not allowed after 10:00 PM.</p>
            </footer>
          </>
        )}

        {/* NON-RESIDENT (Admin/Maintenance) BASIC CONVERTED VIEW */}
        {user.role !== 'Resident' && (
          <div className="tabs-container">
            <div className="tabs-header">
              <button className="tab-btn active">Manage Complaints</button>
            </div>
            <div className="tab-content">
              {complaints.length === 0 ? (
                <p>No complaints found.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID & Date</th>
                      <th>Category & Desc</th>
                      <th>Status</th>
                      {user.role === 'Admin' && <th>Resident</th>}
                      <th>Assigned To</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((comp) => (
                      <tr key={comp._id}>
                        <td>
                          <strong>{comp.complaintId}</strong><br />
                          <small>{new Date(comp.createdAt).toLocaleDateString()}</small>
                        </td>
                        <td>
                          <strong>{comp.category}</strong><br />
                          {comp.description}
                        </td>
                        <td>{getStatusBadge(comp.status)}</td>
                        
                        {user.role === 'Admin' && (
                          <td>{comp.resident?.name} <br/><small>Room: {comp.resident?.roomNumber || 'N/A'}</small></td>
                        )}
                        
                        <td>{comp.assignedTo ? comp.assignedTo.name : 'Unassigned'}</td>

                        {/* ACTIONS */}
                        <td>
                          {user.role === 'Admin' && (
                            <select 
                              className="modal-select"
                              value={comp.assignedTo ? comp.assignedTo._id : ''} 
                              onChange={async (e) => {
                                const config = { headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' } };
                                await axios.put(`http://localhost:5000/api/complaints/${comp._id}/assign`, { staffId: e.target.value }, config);
                                fetchComplaints();
                              }}
                              style={{ display: 'block', marginBottom: '5px', padding: '5px' }}
                            >
                              <option value="">-- Assign Staff --</option>
                              {staff.map((s) => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                              ))}
                            </select>
                          )}

                          <select 
                            className="modal-select"
                            value={comp.status} 
                            onChange={async (e) => {
                                const config = { headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' } };
                                await axios.put(`http://localhost:5000/api/complaints/${comp._id}/status`, { status: e.target.value }, config);
                                fetchComplaints();
                            }}
                            style={{ padding: '5px' }}
                          >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Modals for Action Buttons */}
      {isComplaintModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Report an Issue</h3>
            <form onSubmit={submitComplaint}>
              <label>Category</label>
              <select className="modal-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Carpentry">Carpentry</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Other">Other</option>
              </select>

              <label>Description</label>
              <textarea 
                className="modal-textarea"
                rows="4" 
                placeholder="Describe the issue..."
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                required 
              />
              
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsComplaintModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-submit">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isVisitorModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Register a Visitor</h3>
            <form onSubmit={submitVisitor}>
              <label>Visitor Name</label>
              <input 
                type="text"
                className="modal-select"
                style={{ width: '100%', padding: '10px', marginBottom: '15px' }}
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                required
              />

              <label>Visitor CNIC</label>
              <input 
                type="text"
                className="modal-select"
                style={{ width: '100%', padding: '10px', marginBottom: '15px' }}
                value={visitorCNIC}
                onChange={(e) => setVisitorCNIC(e.target.value)}
                required
              />

              <label>Expected Date & Time</label>
              <input 
                type="datetime-local"
                className="modal-select"
                style={{ width: '100%', padding: '10px', marginBottom: '15px' }}
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                required
              />

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsVisitorModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-submit">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
