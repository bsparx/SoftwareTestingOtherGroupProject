import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Auth.css'; // Reuse auth styles

const VerifyEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('Verifying your email...');
    const hasFetched = React.useRef(false); // Ref to prevent double fetching

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        const verify = async () => {
            try {
                const { data } = await axios.get(`http://localhost:5000/api/auth/verify/${token}`);
                setStatus('Email verified successfully! You can now log in.');
                toast.success(data.message || 'Email verified successfully!');
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } catch (error) {
                // If it fails but we just successfully did it half a second ago, the user might be fine
                setStatus('Verification invalid or already completed. Please log in.');
                toast.error(error.response?.data?.message || 'Verification failed / already verified');
            }
        };

        if (token) {
            verify();
        }
    }, [token, navigate]);

    return (
        <div className="auth-container">
            <div className="auth-right" style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="auth-form-container" style={{ textAlign: 'center' }}>
                    <div className="auth-branding-icon">IBA</div>
                    <h2 className="auth-title">Email Verification</h2>
                    <p className="auth-subtitle" style={{ marginTop: '20px', fontSize: '1.2rem', color: '#800000' }}>
                        {status}
                    </p>
                    <div style={{ marginTop: '30px' }}>
                        <Link to="/login" className="auth-btn" style={{ textDecoration: 'none', display: 'inline-block', padding: '10px 20px' }}>
                            Go to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;