import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../utils/socket';
import API from '../utils/api';
import toast from 'react-hot-toast';

const EMERGENCY_TYPES = ['cardiac', 'trauma', 'stroke', 'respiratory', 'burns', 'obstetric', 'pediatric', 'other'];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
const SEVERITIES = ['critical', 'high', 'medium', 'low'];

const EmergencyRequest = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [form, setForm] = useState({
        emergencyType: '',
        severity: '',
        description: '',
        locationAddress: '',
        patientBloodType: user?.bloodType || '',
        location: { type: 'Point', coordinates: [77.2090, 28.5672] } // Default: Delhi
    });

    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setForm(prev => ({
                        ...prev,
                        location: { type: 'Point', coordinates: [pos.coords.longitude, pos.coords.latitude] }
                    }));
                    toast.success('Location detected!');
                },
                () => toast.error('Could not get location, using default (Delhi)')
            );
        }
    };

    useEffect(() => { getLocation(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.emergencyType || !form.severity) {
            toast.error('Please fill all required fields');
            return;
        }
        setLoading(true);
        try {
            const { data } = await API.post('/emergency', form);
            setResult(data);
            setStep(3);
            toast.success('Emergency request submitted!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit emergency');
        } finally {
            setLoading(false);
        }
    };

    const severityColors = { critical: '#ef4444', high: '#f59e0b', medium: '#0ea5e9', low: '#10b981' };
    const typeEmojis = { cardiac: '❤️', trauma: '🩹', stroke: '🧠', respiratory: '🫁', burns: '🔥', obstetric: '🤱', pediatric: '👶', other: '🏥' };

    return (
        <div className="page">
            <nav className="navbar">
                <div className="navbar-brand">🚨 <span>RED ALERT</span>NETWORK</div>
                <Link to="/patient-dashboard" className="btn btn-outline btn-sm">← Back</Link>
            </nav>

            <div className="page-content" style={{ maxWidth: '700px' }}>
                {/* Progress */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                    {[1, 2, 3].map(s => (
                        <React.Fragment key={s}>
                            <div style={{
                                width: '2rem', height: '2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '0.875rem',
                                background: step >= s ? 'var(--primary)' : 'var(--bg-card)',
                                color: step >= s ? 'white' : 'var(--text-muted)',
                                border: `2px solid ${step >= s ? 'var(--primary)' : 'var(--border)'}`
                            }}>{s}</div>
                            {s < 3 && <div style={{ flex: 1, height: '2px', background: step > s ? 'var(--primary)' : 'var(--border)' }} />}
                        </React.Fragment>
                    ))}
                </div>

                {step === 1 && (
                    <div className="card fade-in">
                        <h2 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.5rem' }}>🚨 Emergency Details</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Select the type and severity of emergency</p>

                        <div className="form-group">
                            <label className="form-label">Emergency Type *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                                {EMERGENCY_TYPES.map(type => (
                                    <button key={type} type="button"
                                        onClick={() => setForm({ ...form, emergencyType: type })}
                                        style={{
                                            padding: '0.75rem 0.5rem', borderRadius: '0.5rem', border: `2px solid ${form.emergencyType === type ? 'var(--primary)' : 'var(--border)'}`,
                                            background: form.emergencyType === type ? 'rgba(239,68,68,0.1)' : 'var(--bg-dark)',
                                            color: form.emergencyType === type ? 'var(--primary)' : 'var(--text-secondary)',
                                            cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center', transition: 'all 0.2s'
                                        }}>
                                        <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{typeEmojis[type]}</div>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Severity *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                                {SEVERITIES.map(sev => (
                                    <button key={sev} type="button"
                                        onClick={() => setForm({ ...form, severity: sev })}
                                        style={{
                                            padding: '0.75rem', borderRadius: '0.5rem', border: `2px solid ${form.severity === sev ? severityColors[sev] : 'var(--border)'}`,
                                            background: form.severity === sev ? `${severityColors[sev]}20` : 'var(--bg-dark)',
                                            color: form.severity === sev ? severityColors[sev] : 'var(--text-secondary)',
                                            cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700, transition: 'all 0.2s'
                                        }}>
                                        {sev.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button className="btn btn-primary w-full btn-lg mt-4"
                            onClick={() => { if (!form.emergencyType || !form.severity) { toast.error('Select type and severity'); return; } setStep(2); }}
                        >
                            Next: Patient Info →
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="card fade-in">
                        <h2 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.5rem' }}>👤 Patient & Location</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Provide patient details and location</p>

                        <div className="form-group">
                            <label className="form-label">Blood Type</label>
                            <select className="form-input form-select" value={form.patientBloodType}
                                onChange={e => setForm({ ...form, patientBloodType: e.target.value })}>
                                {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Location Address</label>
                            <div className="flex gap-2">
                                <input type="text" className="form-input" placeholder="Enter your current address"
                                    value={form.locationAddress} onChange={e => setForm({ ...form, locationAddress: e.target.value })} />
                                <button type="button" className="btn btn-outline" onClick={getLocation} title="Use GPS">📍</button>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                GPS: [{form.location.coordinates[1].toFixed(4)}, {form.location.coordinates[0].toFixed(4)}]
                            </p>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Additional Description</label>
                            <textarea className="form-input" rows={3} placeholder="Describe the emergency situation..."
                                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                style={{ resize: 'vertical' }} />
                        </div>

                        <div className="flex gap-3">
                            <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
                            <button className="btn btn-primary w-full btn-lg" onClick={handleSubmit} disabled={loading}>
                                {loading ? <><span className="spinner" style={{ width: '1rem', height: '1rem' }}></span> Finding Best Hospital...</> : '🚨 Submit Emergency Request'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && result && (
                    <div className="fade-in">
                        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
                            <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--success)' }}>Emergency Submitted!</h2>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Ambulance dispatched. Hospital notified with case summary.</p>
                        </div>

                        {/* Recommended Hospital */}
                        {result.rankedHospitals?.[0] && (
                            <div className="card mb-4">
                                <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>🏥 Assigned Hospital</h3>
                                <div style={{ background: 'var(--bg-dark)', borderRadius: '0.5rem', padding: '1rem' }}>
                                    <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{result.rankedHospitals[0].hospital?.name}</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                        {result.rankedHospitals[0].hospital?.address}
                                    </div>
                                    <div className="flex gap-4 mt-3">
                                        <div><span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Distance</span><div style={{ fontWeight: 700 }}>{result.rankedHospitals[0].distance} km</div></div>
                                        <div><span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ETA</span><div style={{ fontWeight: 700 }}>{result.rankedHospitals[0].estimatedTime} min</div></div>
                                        <div><span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Score</span><div style={{ fontWeight: 700, color: 'var(--success)' }}>{result.rankedHospitals[0].score}/100</div></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Case Summary */}
                        {result.caseSummary && (
                            <div className="card mb-4">
                                <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>📋 AI Case Summary (Sent to Hospital)</h3>
                                <pre style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '0.5rem', maxHeight: '200px', overflow: 'auto' }}>
                                    {result.caseSummary}
                                </pre>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button className="btn btn-primary w-full btn-lg" onClick={() => navigate(`/emergency/${result.data?._id}`)}>
                                📍 Track Emergency
                            </button>
                            <button className="btn btn-outline" onClick={() => navigate('/patient-dashboard')}>Dashboard</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmergencyRequest;
