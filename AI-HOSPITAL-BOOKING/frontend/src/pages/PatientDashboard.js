import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../utils/socket';
import API from '../utils/api';
import toast from 'react-hot-toast';
import MapComponent from '../components/MapComponent';

const Navbar = ({ user, logout }) => (
    <nav className="navbar">
        <div className="navbar-brand">🚨 <span>RED ALERT</span>NETWORK</div>
        <div className="navbar-links">
            <Link to="/blood-availability" className="nav-link">🩸 Blood</Link>
            <Link to="/emergency-request" className="btn btn-primary btn-sm">🚨 Emergency</Link>
            <button className="btn btn-outline btn-sm" onClick={logout}>Logout</button>
        </div>
    </nav>
);

const PatientDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [emergencies, setEmergencies] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        const socket = getSocket();
        if (socket) {
            socket.on('emergency-created', (data) => {
                setEmergencies(prev => [data.emergency, ...prev]);
                toast.success('Emergency request submitted!');
            });
            socket.on('emergency-updated', (updated) => {
                setEmergencies(prev => prev.map(e => e._id === updated._id ? updated : e));
            });
            socket.on('emergency-escalated', (data) => {
                toast.error(`⚡ ${data.message}`, { duration: 6000 });
            });
        }
        return () => {
            if (socket) { socket.off('emergency-created'); socket.off('emergency-updated'); socket.off('emergency-escalated'); }
        };
    }, []);

    const fetchData = async () => {
        try {
            const [eRes, hRes] = await Promise.all([
                API.get('/emergency'),
                API.get('/hospitals')
            ]);
            setEmergencies(eRes.data.data || []);
            setHospitals(hRes.data.data || []);
        } catch (err) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const map = {
            pending: 'badge-warning', hospital_assigned: 'badge-info', ambulance_dispatched: 'badge-info',
            en_route: 'badge-medium', arrived: 'badge-success', admitted: 'badge-success',
            escalated: 'badge-critical', resolved: 'badge-success', cancelled: 'badge-warning'
        };
        return map[status] || 'badge-info';
    };

    const getSeverityBadge = (severity) => {
        const map = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };
        return map[severity] || 'badge-info';
    };

    const activeEmergency = emergencies.find(e => !['resolved', 'cancelled'].includes(e.status));

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner"></div>
        </div>
    );

    return (
        <div className="page">
            <Navbar user={user} logout={logout} />
            <div className="page-content">
                {/* Header */}
                <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 className="page-title">Welcome, {user?.name} 👋</h1>
                        <p className="page-subtitle">
                            Blood Type: <strong style={{ color: 'var(--primary)' }}>{user?.bloodType || 'Not set'}</strong>
                        </p>
                    </div>
                    <Link to="/emergency-request" className="btn btn-primary btn-lg">
                        🚨 Request Emergency
                    </Link>
                </div>

                {/* Active Emergency Alert */}
                {activeEmergency && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div className="flex items-center gap-3">
                            <span className="pulse-dot pulse-red"></span>
                            <div>
                                <div style={{ fontWeight: 700, color: 'var(--primary)' }}>Active Emergency</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    {activeEmergency.emergencyType} • {activeEmergency.status.replace(/_/g, ' ')}
                                </div>
                            </div>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/emergency/${activeEmergency._id}`)}>
                            Track Emergency →
                        </button>
                    </div>
                )}

                {/* Stats */}
                <div className="grid-4 mb-6">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)' }}>🚨</div>
                        <div>
                            <div className="stat-value" style={{ color: 'var(--primary)' }}>{emergencies.length}</div>
                            <div className="stat-label">Total Emergencies</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>✅</div>
                        <div>
                            <div className="stat-value" style={{ color: 'var(--success)' }}>
                                {emergencies.filter(e => e.status === 'resolved').length}
                            </div>
                            <div className="stat-label">Resolved</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(14,165,233,0.1)' }}>🏥</div>
                        <div>
                            <div className="stat-value" style={{ color: 'var(--secondary)' }}>{hospitals.length}</div>
                            <div className="stat-label">Hospitals Available</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>⚡</div>
                        <div>
                            <div className="stat-value" style={{ color: 'var(--accent)' }}>
                                {emergencies.filter(e => e.status === 'escalated').length}
                            </div>
                            <div className="stat-label">Escalated</div>
                        </div>
                    </div>
                </div>

                <div className="grid-2">
                    {/* Emergency History */}
                    <div className="card">
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Emergency History</h3>
                        {emergencies.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                                <p>No emergencies yet</p>
                                <Link to="/emergency-request" className="btn btn-primary btn-sm mt-4">Request Emergency</Link>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {emergencies.slice(0, 5).map(e => (
                                    <div key={e._id} style={{ background: 'var(--bg-dark)', borderRadius: '0.5rem', padding: '0.875rem', cursor: 'pointer' }}
                                        onClick={() => navigate(`/emergency/${e._id}`)}>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{e.emergencyType?.replace(/_/g, ' ')}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                                    {new Date(e.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className={`badge ${getSeverityBadge(e.severity)}`}>{e.severity}</span>
                                                <span className={`badge ${getStatusBadge(e.status)}`}>{e.status?.replace(/_/g, ' ')}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Nearby Hospitals */}
                    <div className="card">
                        <div className="flex justify-between items-center mb-4">
                            <h3 style={{ fontWeight: 700 }}>Nearby Hospitals Map</h3>
                            <Link to="/blood-availability" className="btn btn-outline btn-sm">🩸 Blood Map</Link>
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <MapComponent
                                hospitals={hospitals}
                                center={[28.6139, 77.2090]}
                                zoom={11}
                                height="250px"
                            />
                        </div>
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Nearby Hospitals List</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {hospitals.slice(0, 4).map(h => (
                                <div key={h._id} style={{ background: 'var(--bg-dark)', borderRadius: '0.5rem', padding: '0.875rem' }}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{h.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                                {h.onDutyDoctors} doctors • Load: {h.currentEmergencyLoad}/{h.emergencyCapacity}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '50%',
                                                background: h.readinessScore > 70 ? 'rgba(16,185,129,0.15)' : h.readinessScore > 40 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.7rem', fontWeight: 700,
                                                color: h.readinessScore > 70 ? 'var(--success)' : h.readinessScore > 40 ? 'var(--warning)' : 'var(--danger)'
                                            }}>
                                                {h.readinessScore}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;
