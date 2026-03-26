import React, { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import './Dashboard.css'; 
import './MaintenanceDashboard.css'; 

const MaintenanceDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [assignedTasks, setAssignedTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [resolutionRemarks, setResolutionRemarks] = useState('');
    const [statusToUpdate, setStatusToUpdate] = useState('');
    const [notification, setNotification] = useState(null);
    const [activeTab, setActiveTab] = useState('All'); // For tab filtering

    useEffect(() => {
        if (user && user.role === 'Maintenance') {
            fetchTasks();
            const interval = setInterval(fetchTasks, 30000); 
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchTasks = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/complaints', config);
            
            setAssignedTasks(prevTasks => {
                if (prevTasks.length > 0 && data.length > prevTasks.length) {
                    setNotification('New task assigned to you!');
                    setTimeout(() => setNotification(null), 5000);
                }
                return data;
            });
        } catch (error) {
            console.error('Error fetching tasks', error);
        }
    };

    if (!user) return <Navigate to="/login" />;
    if (user.role !== 'Maintenance') return <Navigate to="/" />;

    const currentDate = new Date();
    const checkIsUrgent = (dateString, status) => {
        if (status === 'Resolved') return false;
        const diffInHours = (currentDate - new Date(dateString)) / (1000 * 60 * 60);
        return diffInHours > 48;
    };

    const sortedTasks = [...assignedTasks].sort((a, b) => {
        if (a.status === 'Resolved') return 1;
        if (b.status === 'Resolved') return -1;
        const aUrgent = checkIsUrgent(a.createdAt, a.status);
        const bUrgent = checkIsUrgent(b.createdAt, b.status);
        if (aUrgent && !bUrgent) return -1;
        if (!aUrgent && bUrgent) return 1;
        return 0;
    });

    // Tab Filtering Logic
    const displayTasks = sortedTasks.filter(task => {
        if (activeTab === 'All') return true;
        if (activeTab === 'Pending') return task.status === 'Open' || task.status === 'In Progress';
        if (activeTab === 'Urgent') return checkIsUrgent(task.createdAt, task.status);
        if (activeTab === 'Escalated') return task.status === 'Escalated' || task.status === 'On Hold';
        if (activeTab === 'Resolved') return task.status === 'Resolved';
        return true;
    });

    const activeTasks = assignedTasks.filter(t => t.status !== 'Resolved');
    const tasksResolvedToday = assignedTasks.filter(t => {
        if (t.status !== 'Resolved') return false;
        const updatedDate = new Date(t.updatedAt);
        return updatedDate.toDateString() === currentDate.toDateString();
    });

    const completionPercentage = assignedTasks.length === 0 ? 100 : Math.round((assignedTasks.filter(t => t.status === 'Resolved').length / assignedTasks.length) * 100);

    const openTaskModal = (task) => {
        setSelectedTask(task);
        setStatusToUpdate(task.status);
        setResolutionRemarks(task.resolutionRemarks || '');
    };

    const handleUpdateStatus = async () => {
        if (selectedTask.status === 'Open' && statusToUpdate === 'Resolved') {
            toast.error('Testing Constraint: Cannot jump from Open directly to Resolved.');
            return;
        }

        if ((statusToUpdate === 'Resolved' || statusToUpdate === 'Escalated' || statusToUpdate === 'On Hold') && !resolutionRemarks.trim()) {
            toast.error(`Testing Constraint: You must provide remarks before marking this task as ${statusToUpdate}.`);
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' } };
            await axios.put(`http://localhost:5000/api/complaints/${selectedTask._id}/status`, { 
                status: statusToUpdate,
                resolutionRemarks: resolutionRemarks
            }, config);
            
            setSelectedTask(null);
            fetchTasks();
            toast.success(`Task marked as ${statusToUpdate}!`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error updating status');
        }
    };

    const quickEscalate = async () => {
        if (!resolutionRemarks.trim()) {
            toast.warn("Please enter a reason for escalation (e.g. Needs parts) in the text box.");
            return;
        }
        setStatusToUpdate('Escalated');
        // Setting state is async, we can just do the API call here directly:
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' } };
            await axios.put(`http://localhost:5000/api/complaints/${selectedTask._id}/status`, { 
                status: 'Escalated',
                resolutionRemarks: resolutionRemarks
            }, config);
            
            setSelectedTask(null);
            fetchTasks();
            toast.info('Task Escalated. Admin notified.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error escalating task');
        }
    };

    return (
        <div className="dashboard-container mnt-dashboard">
            <nav className="dashboard-nav">
                <div className="dashboard-logo">Maintenance Portal</div>
                <div className="nav-user-info">
                    <span>{user.name}</span>
                    <button onClick={logout} className="btn-logout">Logout</button>
                </div>
            </nav>

            {notification && (
                <div className="toast-notification">🔔 {notification}</div>
            )}

            <div className="dashboard-content">
                {/* Modern Header summary */}
                <div className="mnt-top-summary">
                    <div className="summary-left">
                        <h2>Welcome back, {user.name.split(' ')[0]}</h2>
                        <p>Here is your work queue for today.</p>
                    </div>
                    <div className="summary-right">
                        <div className="progress-container">
                            <div className="progress-text">
                                <span>Daily Completion</span>
                                <strong>{completionPercentage}%</strong>
                            </div>
                            <div className="progress-bar-bg">
                                <div className="progress-bar-fill" style={{width: `${completionPercentage}%`}}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="mnt-tabs">
                    {['All', 'Pending', 'Urgent', 'Escalated', 'Resolved'].map(tab => (
                        <button 
                            key={tab} 
                            className={`mnt-tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="mnt-cards-grid">
                    {displayTasks.length === 0 ? (
                        <div className="no-data-box">
                            <div className="no-data-icon">🛋️</div>
                            <p className="no-data">No jobs found in this category.</p>
                        </div>
                    ) : (
                        displayTasks.map(task => {
                            const isDelayed = checkIsUrgent(task.createdAt, task.status);
                            
                            return (
                                <div 
                                    key={task._id} 
                                    className={`mnt-card ${isDelayed ? 'border-delayed' : ''} ${task.status === 'Resolved' ? 'card-resolved' : ''}`}
                                    onClick={() => openTaskModal(task)}
                                >
                                    <div className="mnt-card-top">
                                        <span className="mnt-id">{task.complaintId}</span>
                                        {isDelayed && <span className="delayed-badge">URGENT</span>}
                                        {task.status === 'Resolved' && <span className="resolved-badge">Done</span>}
                                        {task.status === 'Escalated' && <span className="escalated-badge">Escalated</span>}
                                        {task.status === 'On Hold' && <span className="hold-badge">On Hold</span>}
                                    </div>
                                    <h3 className="mnt-room">Room: {task.resident?.roomNumber || 'Unknown'}</h3>
                                    <p className="mnt-category">{task.category}</p>
                                    <div className="mnt-card-bottom">
                                        <p className="mnt-status">Status: <strong>{task.status}</strong></p>
                                        <span className="mnt-time">{(new Date(task.createdAt)).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Task Detail Modal */}
            {selectedTask && (
                <div className="modal-overlay">
                    <div className="modal-content mnt-modal-content">
                        <div className="modal-header">
                            <h3>Task Action View - {selectedTask.complaintId}</h3>
                            <button className="close-btn" onClick={() => setSelectedTask(null)}>×</button>
                        </div>
                        
                        <div className="task-detail-grid">
                            <div className="task-info">
                                <p><strong>Category:</strong> {selectedTask.category}</p>
                                <p><strong>Room:</strong> {selectedTask.resident?.roomNumber}</p>
                                <p><strong>Resident:</strong> {selectedTask.resident?.name}</p>
                                <div className="mnt-desc-box">
                                    <p><strong>Issue Description:</strong></p>
                                    <p>{selectedTask.description}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mnt-action-panel">
                            <h4>Update Progress</h4>
                            <div className="form-group">
                                <label>Change Activity Status:</label>
                                <select 
                                    value={statusToUpdate} 
                                    onChange={(e) => setStatusToUpdate(e.target.value)}
                                    className="modal-select mnt-select"
                                >
                                    <option value="Open">Open</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="On Hold">On Hold (Needs parts, etc)</option>
                                    <option value="Escalated">Escalated (Cannot Fix)</option>
                                    <option value="Resolved">Resolved</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Remarks / Issue Explanation <span className="req-star">*</span>:</label>
                                <textarea 
                                    className="modal-textarea mnt-textarea"
                                    rows="3"
                                    placeholder="Tell us what you did, or why it can't be fixed..."
                                    value={resolutionRemarks}
                                    onChange={(e) => setResolutionRemarks(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="modal-actions mnt-actions-flex">
                            <div className="left-actions">
                                <button className="btn-escalate" onClick={quickEscalate}>
                                    🚨 Cannot Fix
                                </button>
                            </div>
                            <div className="right-actions">
                                <button className="btn-cancel" onClick={() => setSelectedTask(null)}>Close</button>
                                <button 
                                    className="btn-submit" 
                                    onClick={handleUpdateStatus}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaintenanceDashboard;