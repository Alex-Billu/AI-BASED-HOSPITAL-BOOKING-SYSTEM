import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
    const { login, loading } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(form.email, form.password);
        if (result.success) {
            toast.success(`Welcome back, ${result.user.name}!`);
            if (result.user.role === 'hospital_admin') navigate('/hospital-dashboard');
            else if (result.user.role === 'ambulance') navigate('/ambulance-dashboard');
            else navigate('/patient-dashboard');
        } else {
            toast.error(result.message);
        }
    };

    const fillDemo = (role) => {
        const creds = {
            patient: { email: 'patient@demo.com', password: 'password123' },
            hospital: { email: 'admin@aiims.com', password: 'password123' },
            ambulance: { email: 'driver@demo.com', password: 'password123' }
        };
        setForm(creds[role]);
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--gradient-hero)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>
                {/* Logo */}
                <div className="text-center mb-6">
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>
                            🚨 <span style={{ color: 'var(--primary)' }}>RED ALERT</span>NETWORK
                        </div>
                    </Link>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                        Real-Time Emergency Healthcare Coordination
                    </p>
                </div>

                <div className="card fade-in">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Sign In</h2>

                    {/* Demo quick-fill */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Quick Demo Login:</p>
                        <div className="flex gap-2">
                            <button className="btn btn-outline btn-sm" onClick={() => fillDemo('patient')}>Patient</button>
                            <button className="btn btn-outline btn-sm" onClick={() => fillDemo('hospital')}>Hospital</button>
                            <button className="btn btn-outline btn-sm" onClick={() => fillDemo('ambulance')}>Ambulance</button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                            {loading ? <><span className="spinner" style={{ width: '1rem', height: '1rem' }}></span> Signing in...</> : '🔐 Sign In'}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Don't have an account?{' '}
                        <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Register</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
