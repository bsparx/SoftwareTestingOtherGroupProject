import React, { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './Dashboard.css'; // Reusing base structural layout
import './MaintenanceDashboard.css'; // specific styles for maintenance

const MaintenanceDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [assignedTasks, setAssignedTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [resolutionRemarks, setResolutionRemarks] = useState('');
    const [statusToUpdate, setStatusToUpdate] = useState('');
    const [notification, setNotification] = useState(null);

    // Initial Load & polling for notification
    useEffect(() => {
        if (user && user.role === 'Maintenance') {
            fetchTasks();
            const interval = setInterval(fetchTasks, 30000); // pull every 30s to check for new tasks (simulate real-time)
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchTasks = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/complaints', config);
            
            // Notification logic for newly assigned tasks
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

    // Helper for SLA and State
    const currentDate = new Date();
    const checkIsUrgent = (dateString, status) => {
        if (status === 'Resolved') return false;
        const diffInHours = (currentDate - new Date(dateString)) / (1000 * 60 * 60);
        return diffInHours > 48;
    };

    // Sort: Urgent (SLA breached) first, then Open, then In Progress, then Resolved
    const sortedTasks = [...assignedTasks].sort((a, b) => {
        if (a.status === 'Resolved') return 1;
        if (b.status === 'Resolved') return -1;
        const aUrgent = checkIsUrgent(a.createdAt, a.status);
        const bUrgent = checkIsUrgent(b.createdAt, b.status);
        if (aUrgent && !bUrgent) return -1;
        if (!aUrgent && bUrgent) return 1;
        return 0;
    });

    const activeTasks = assignedTasks.filter(t => t.status !== 'Resolved');
    
    // Check if task resolved today
    const tasksResolvedToday = assignedTasks.filter(t => {
        if (t.status !== 'Resolved') return false;
        const updatedDate = new Date(t.updatedAt);
        return updatedDate.toDateString() === currentDate.toDateString();
    });

    const openTaskModal = (task) => {
        setSelectedTask(task);
        setStatusToUpdate(task.status);
        setResolutionRemarks(task.resolutionRemarks || '');
    };

    const handleUpdateStatus = async () => {
        if (selectedTask.status === 'Open' && statusToUpdate === 'Resolved') {
            alert('Testing Constraint: Cannot jump from Open directly to Resolved. Please move to In Progress first.');
            return;
        }

        if (statusToUpdate === 'Resolved' && !resolutionRemarks.trim()) {
            alert('Testing Constraint: You must provide Resolution Remarks before marking this task as Resolved.');
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
            alert('Task Updated!');
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating status');
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

            {/* Notification Toast */}
            {notification && (
                <div className="toast-notification">🔔 {notification}</div>
            )}

            <div className="dashboard-content">
                <div className="hero-header mnt-hero">
                    <h2>Active Jobs</h2>
                </div>

                <div className="mnt-cards-grid">
                    {sortedTasks.length === 0 ? (
                        <p className="no-data">No jobs assigned to you yet. You can relax!</p>
                    ) : (
                        sortedTasks.map(task => {
                            const isDelayed = checkIsUrgent(task.createdAt, task.status);
                            
                            return (
                                <div 
                                    key={task._id} 
                                    className={`mnt-card ${isDelayed ? 'border-delayed' : ''} ${task.status === 'Resolved' ? 'card-resolved' : ''}`}
                                    onClick={() => openTaskModal(task)}
                                >
                                    <div className="mnt-card-top">
                                        <span className="mnt-id">{task.complaintId}</span>
                                        {isDelayed && <span className="delayed-badge">DELAYED</span>}
                                        {task.status === 'Resolved' && <span className="resolved-badge">Done</span>}
                                    </div>
                                    <h3 className="mnt-room">Room: {task.resident?.roomNumber || 'Unknown'}</h3>
                                    <p className="mnt-category">{task.category}</p>
                                    <p className="mnt-status">Status: <strong>{task.status}</strong></p>
                                </div>
                            )
                        })
                    )}
                </div>

                <footer className="mnt-footer">
                    <div className="mnt-stat-box">
                        <h4>Assigned to Me</h4>
                        <span>{activeTasks.length}</span>
                    </div>
                    <div className="mnt-stat-box">
                        <h4>Resolved Today</h4>
                        <span>{tasksResolvedToday.length}</span>
                    </div>
                </footer>
            </div>

            {/* Task Detail Modal */}
            {selectedTask && (
                <div className="modal-overlay">
                    <div className="modal-content mnt-modal-content">
                        <h3>Task Action View - {selectedTask.complaintId}</h3>
                        
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
                            
                            <div className="task-media">
                                <p><strong>Visual Context:</strong></p>
                                <div className="img-placeholder">
                                    <div className="mock-img">📷 <span>No image provided</span></div>
                                </div>
                            </div>
                        </div>

                        <div className="mnt-action-panel">
                            <h4>Update Progress</h4>
                            <div className="form-group">
                                <label>Change Status:</label>
                                <select 
                                    value={statusToUpdate} 
                                    onChange={(e) => setStatusToUpdate(e.target.value)}
                                    className="modal-select mnt-select"
                                >
                                    <option value="Open">Open</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Resolution Remarks {statusToUpdate === 'Resolved' && <span className="req-star">*</span>}:</label>
                                <textarea 
                                    className="modal-textarea mnt-textarea"
                                    rows="3"
                                    placeholder="Required before marking as Resolved..."
                                    value={resolutionRemarks}
                                    onChange={(e) => setResolutionRemarks(e.target.value)}
                                    disabled={statusToUpdate === 'Open'}
                                />
                            </div>
                        </div>

                        <div className="modal-actions mnt-actions">
                            <button className="btn-cancel" onClick={() => setSelectedTask(null)}>Close</button>
                            <button 
                                className="btn-submit" 
                                onClick={handleUpdateStatus}
                                disabled={selectedTask.status === 'Resolved' && statusToUpdate === 'Resolved' && resolutionRemarks === selectedTask.resolutionRemarks}
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaintenanceDashboard;