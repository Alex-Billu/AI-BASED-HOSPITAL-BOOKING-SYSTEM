import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const Register = () => {
    const { register, loading } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '', email: '', password: '', role: 'patient', phone: '', bloodType: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await register(form);
        if (result.success) {
            toast.success('Account created successfully!');
            if (result.user.role === 'hospital_admin') navigate('/hospital-dashboard');
            else if (result.user.role === 'ambulance') navigate('/ambulance-dashboard');
            else navigate('/patient-dashboard');
        } else {
            toast.error(result.message);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--gradient-hero)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ width: '100%', maxWidth: '440px' }}>
                <div className="text-center mb-6">
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>
                            🚨 <span style={{ color: 'var(--primary)' }}>RED ALERT</span>NETWORK
                        </div>
                    </Link>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                        Create your emergency response account
                    </p>
                </div>

                <div className="card fade-in">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Create Account</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input type="text" className="form-input" placeholder="Your full name"
                                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input type="email" className="form-input" placeholder="you@example.com"
                                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input type="password" className="form-input" placeholder="Min 6 characters"
                                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input type="tel" className="form-input" placeholder="+91-XXXXXXXXXX"
                                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <select className="form-input form-select"
                                    value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                                    <option value="patient">Patient</option>
                                    <option value="ambulance">Ambulance Driver</option>
                                    <option value="hospital_admin">Hospital Admin</option>
                                </select>
                            </div>
                            {form.role === 'patient' && (
                                <div className="form-group">
                                    <label className="form-label">Blood Type</label>
                                    <select className="form-input form-select"
                                        value={form.bloodType} onChange={e => setForm({ ...form, bloodType: e.target.value })}>
                                        <option value="">Unknown</option>
                                        {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                        <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                            {loading ? <><span className="spinner" style={{ width: '1rem', height: '1rem' }}></span> Creating...</> : '✅ Create Account'}
                        </button>
                    </form>
                    <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
