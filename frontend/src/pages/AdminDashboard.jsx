import React, { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './Dashboard.css'; // Reusing base CSS
import './AdminDashboard.css';

const AdminDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    
    // State
    const [activeTab, setActiveTab] = useState('dashboard');
    const [complaints, setComplaints] = useState([]);
    const [staff, setStaff] = useState([]);
    const [users, setUsers] = useState([]);
    const [visitors, setVisitors] = useState([]);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectModalOpen, setRejectModalOpen] = useState(null);

    useEffect(() => {
        if (user && user.role === 'Admin') {
            fetchComplaints();
            fetchStaff();
            fetchUsersList();
            fetchVisitors();
        }
    }, [user]);

    const fetchVisitors = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/visitors', config);
            setVisitors(data);
        } catch (error) {
            console.error('Error fetching visitors', error);
        }
    };

    const fetchComplaints = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/complaints', config);
            setComplaints(data);
        } catch (error) {
            console.error('Error fetching complaints', error);
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

    const fetchUsersList = async () => {
        // We'll just mock this for now or call a generic endpoint if it exists
        // Since we don't have an explicit /api/users, let's just populate it with staff and maybe mock for testing
        setUsers([{ id: 1, name: 'Hasan', role: 'Resident', room: 'B-102' }]);
    };

    // Protect Route
    if (!user) return <Navigate to="/login" />;
    if (user.role === 'Resident') {
        return (
            <div className="access-denied-container">
                <h1>403 - Forbidden</h1>
                <p>Vertical Privilege Escalation Detected: Resident accounts cannot access the admin portal.</p>
                <a href="/">Return to Dashboard</a>
            </div>
        );
    }

    // Calculations for KPIs
    const openTickets = complaints.filter(c => c.status !== 'Resolved');
    
    // SLA Over 48 hours calculation
    const currentDate = new Date();
    const isCritical = (dateString) => {
        const diffInHours = (currentDate - new Date(dateString)) / (1000 * 60 * 60);
        return diffInHours > 48;
    };
    const criticalTickets = openTickets.filter(c => isCritical(c.createdAt));

    const handleAssign = async (complaintId, staffId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`http://localhost:5000/api/complaints/${complaintId}/assign`, { staffId }, config);
            fetchComplaints();
        } catch (err) {
            alert('Error assigning');
        }
    };

    const handleApproveVisitor = async (visitorId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`http://localhost:5000/api/visitors/${visitorId}/status`, { status: 'Approved' }, config);
            fetchVisitors();
            alert('Visitor Approved');
        } catch (err) {
            alert('Error approving visitor');
        }
    };

    const handleRejectVisitor = async () => {
        if (!rejectReason.trim()) {
            alert("Security Policy: Rejection reason must be provided.");
            return;
        }
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`http://localhost:5000/api/visitors/${rejectModalOpen}/status`, { 
                status: 'Rejected', 
                rejectReason 
            }, config);
            fetchVisitors();
            setRejectModalOpen(null);
            setRejectReason('');
            alert('Visitor Rejected');
        } catch (err) {
            alert('Error rejecting visitor');
        }
    };

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="sidebar-logo">Admin View</div>
                <ul className="sidebar-nav">
                    <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</li>
                    <li className={activeTab === 'complaints' ? 'active' : ''} onClick={() => setActiveTab('complaints')}>🛠️ Complaints</li>
                    <li className={activeTab === 'visitors' ? 'active' : ''} onClick={() => setActiveTab('visitors')}>📖 Visitors</li>
                    <li className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>👥 Users</li>
                    <li className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>📈 Reports</li>
                </ul>
                <div className="sidebar-footer">
                    <button onClick={logout} className="btn-logout-sidebar">Logout</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                <header className="admin-header">
                    <h2>Welcome to the Control Room, {user.name}</h2>
                    <div className="user-badge">{user.role}</div>
                </header>

                {activeTab === 'dashboard' && (
                    <div className="tab-pane">
                        <h3 className="section-title">Top-Level Metrics</h3>
                        <div className="kpi-row">
                            <div className="metric-card">
                                <h3>{openTickets.length}</h3>
                                <p>Total Open Tickets</p>
                            </div>
                            <div className="metric-card alert">
                                <h3>{criticalTickets.length}</h3>
                                <p>Critical Tickets (&gt;48hrs)</p>
                            </div>
                            <div className="metric-card">
                                <h3>{visitors.filter(v => v.status === 'Pending').length}</h3>
                                <p>Pending Visitors</p>
                            </div>
                            <div className="metric-card">
                                <h3>{staff.length}</h3>
                                <p>Staff Availability</p>
                            </div>
                        </div>

                        <div className="dashboard-grid">
                            <div className="grid-col priority-panel">
                                <h4>Urgent Action Items</h4>
                                {criticalTickets.length === 0 ? (
                                    <p className="no-data">No urgent tickets at this time.</p>
                                ) : (
                                    <ul className="urgent-list">
                                        {criticalTickets.map(ticket => (
                                            <li key={ticket._id} className="urgent-item">
                                                <strong>{ticket.complaintId}</strong> - {ticket.category}
                                                <span className="sla-badge">SLA Breached</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="grid-col stats-panel">
                                <h4>Monthly Stats</h4>
                                <div className="chart-placeholder">
                                    <p>Resolution Rate: <strong>85%</strong></p>
                                    <p>Personnel Bottlenecks: None</p>
                                    {/* Further implementation for charts */}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'complaints' && (
                    <div className="tab-pane">
                        <h3 className="section-title">The Maintenance "Control Room"</h3>
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID & Status</th>
                                        <th>Category & Desc</th>
                                        <th>Resident</th>
                                        <th>SLA Warning</th>
                                        <th>Assignment Queue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {complaints.map(comp => {
                                        const breached = comp.status !== 'Resolved' && isCritical(comp.createdAt);
                                        return (
                                            <tr key={comp._id} className={breached ? 'row-critical' : ''}>
                                                <td>
                                                    <strong>{comp.complaintId}</strong><br/>
                                                    <span className={`status-badge ${comp.status.toLowerCase().replace(' ', '-')}`}>{comp.status}</span>
                                                </td>
                                                <td>
                                                    <strong>{comp.category}</strong><br/>
                                                    {comp.description}
                                                </td>
                                                <td>{comp.resident?.name} (Rm: {comp.resident?.roomNumber})</td>
                                                <td>
                                                    {breached ? <span className="sla-badge">⚠️ &gt;48hrs</span> : <span className="on-track">On Track</span>}
                                                </td>
                                                <td>
                                                    <select 
                                                        className="assign-select"
                                                        value={comp.assignedTo?._id || ''}
                                                        onChange={(e) => handleAssign(comp._id, e.target.value)}
                                                    >
                                                        <option value="">-- Assign Staff --</option>
                                                        {staff.map(s => (
                                                            <option key={s._id} value={s._id}>{s.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'visitors' && (
                    <div className="tab-pane">
                        <h3 className="section-title">Visitor Approval Queue</h3>
                        <div className="policy-notice">
                            <strong>🔒 Policy Check:</strong> Visitor requests are strictly not allowed after 10:00 PM. No overnight stays.
                        </div>
                        
                        {visitors.length === 0 ? (
                           <p className="no-data">No visitor requests at this time.</p>
                        ) : (
                            <table className="admin-table">
                                <thead>
                                    <tr><th>Visitor Name</th><th>Resident</th><th>Expected Time</th><th>Status</th><th>Action</th></tr>
                                </thead>
                                <tbody>
                                    {visitors.map(vis => (
                                        <tr key={vis._id}>
                                            <td><strong>{vis.visitorName}</strong><br/><small>CNIC: {vis.visitorCNIC}</small></td>
                                            <td>{vis.resident?.name} (Room: {vis.resident?.roomNumber})</td>
                                            <td>{new Date(vis.expectedDate).toLocaleString()}</td>
                                            <td>{vis.status}</td>
                                            <td>
                                                {vis.status === 'Pending' && (
                                                    <div className="action-buttons">
                                                        <button className="btn-approve" onClick={() => handleApproveVisitor(vis._id)}>Approve</button>
                                                        <button className="btn-reject" onClick={() => setRejectModalOpen(vis._id)}>Reject</button>
                                                    </div>
                                                )}
                                                {vis.status === 'Rejected' && <small style={{color: 'red'}}>Reason: {vis.rejectReason}</small>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="tab-pane">
                        <h3 className="section-title">User Management & Audit Trail</h3>
                        <p className="no-data">Mocked Audit Log & Users</p>
                        <div className="audit-trail-box">
                            <h4>Immutable Audit Log</h4>
                            <ul>
                                <li><strong>[10:00 AM]</strong> System: SLA Warning triggered for ticket #CMP-123</li>
                                <li><strong>[09:45 AM]</strong> Admin A assigned ticket #CMP-122 to Staff B</li>
                                <li><strong>[09:00 AM]</strong> Admin A approved visitor request #V-01</li>
                            </ul>
                        </div>
                    </div>
                )}

            </main>

            {/* Rejection Modal */}
            {rejectModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Reject Visitor Request</h3>
                        <label>Reason for Rejection *</label>
                        <textarea 
                            className="modal-textarea" 
                            rows="3"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Must provide a reason..."
                        />
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => {setRejectModalOpen(null); setRejectReason('');}}>Cancel</button>
                            <button className="btn-submit btn-reject-confirm" onClick={handleRejectVisitor}>Confirm Rejection</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;