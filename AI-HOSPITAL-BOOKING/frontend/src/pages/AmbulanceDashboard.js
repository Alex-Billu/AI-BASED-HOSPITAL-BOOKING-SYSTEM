import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../utils/socket';
import API from '../utils/api';
import toast from 'react-hot-toast';

const AmbulanceDashboard = () => {
    const { user, logout } = useAuth();
    const [ambulances, setAmbulances] = useState([]);
    const [myAmbulance, setMyAmbulance] = useState(null);
    const [emergencies, setEmergencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [locationTracking, setLocationTracking] = useState(false);
    const [watchId, setWatchId] = useState(null);

    useEffect(() => {
        fetchData();
        const socket = getSocket();
        if (socket) {
            socket.on('ambulance-status-updated', (data) => {
                setAmbulances(prev => prev.map(a => a._id === data._id ? data : a));
            });
        }
        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    const fetchData = async () => {
        try {
            const [aRes, eRes] = await Promise.all([
                API.get('/ambulance'),
                API.get('/emergency')
            ]);
            setAmbulances(aRes.data.data || []);
            setEmergencies(eRes.data.data || []);
            // Find ambulance assigned to this driver
            const mine = aRes.data.data?.find(a => a.driverId === user?.id);
            setMyAmbulance(mine);
        } catch (err) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const startTracking = () => {
        if (!myAmbulance) { toast.error('No ambulance assigned to you'); return; }
        if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }

        const id = navigator.geolocation.watchPosition(
            async (pos) => {
                try {
                    await API.put(`/ambulance/${myAmbulance._id}/location`, {
                        longitude: pos.coords.longitude,
                        latitude: pos.coords.latitude,
                        address: `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
                    });
                } catch (err) { console.error('Location update failed'); }
            },
            (err) => toast.error('Location error: ' + err.message),
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
        setWatchId(id);
        setLocationTracking(true);
        toast.success('📍 Live location tracking started!');
    };

    const stopTracking = () => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
        setLocationTracking(false);
        toast.success('Location tracking stopped');
    };

    const updateStatus = async (ambulanceId, status) => {
        try {
            await API.put(`/ambulance/${ambulanceId}/status`, { status });
            toast.success(`Status updated to ${status}`);
            fetchData();
        } catch (err) {
            toast.error('Update failed');
        }
    };

    const statusColors = {
        available: '#10b981', dispatched: '#f59e0b', en_route: '#0ea5e9',
        at_scene: '#ef4444', transporting: '#8b5cf6', maintenance: '#64748b'
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner"></div>
        </div>
    );

    return (
        <div className="page">
            <nav className="navbar">
                <div className="navbar-brand">🚨 <span>RED ALERT</span>NETWORK</div>
                <div className="navbar-links">
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>🚑 {user?.name}</span>
                    <button className="btn btn-outline btn-sm" onClick={logout}>Logout</button>
                </div>
            </nav>

            <div className="page-content">
                <div className="page-header">
                    <h1 className="page-title">🚑 Ambulance Dashboard</h1>
                    <p className="page-subtitle">Real-time ambulance coordination and tracking</p>
                </div>

                {/* Stats */}
                <div className="grid-4 mb-6">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>✅</div>
                        <div>
                            <div className="stat-value" style={{ color: 'var(--success)' }}>
                                {ambulances.filter(a => a.status === 'available').length}
                            </div>
                            <div className="stat-label">Available</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>🚑</div>
                        <div>
                            <div className="stat-value" style={{ color: 'var(--accent)' }}>
                                {ambulances.filter(a => ['dispatched', 'en_route', 'at_scene', 'transporting'].includes(a.status)).length}
                            </div>
                            <div className="stat-label">Active</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)' }}>🚨</div>
                        <div>
                            <div className="stat-value" style={{ color: 'var(--primary)' }}>
                                {emergencies.filter(e => !['resolved', 'cancelled'].includes(e.status)).length}
                            </div>
                            <div className="stat-label">Active Emergencies</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(14,165,233,0.1)' }}>🚗</div>
                        <div>
                            <div className="stat-value" style={{ color: 'var(--secondary)' }}>{ambulances.length}</div>
                            <div className="stat-label">Total Fleet</div>
                        </div>
                    </div>
                </div>

                {/* My Ambulance */}
                {myAmbulance && (
                    <div className="card mb-6" style={{ border: '1px solid rgba(14,165,233,0.3)', background: 'rgba(14,165,233,0.05)' }}>
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>🚑 My Ambulance: {myAmbulance.vehicleNumber}</h3>
                        <div className="grid-2">
                            <div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                    Status: <span style={{ fontWeight: 700, color: statusColors[myAmbulance.status] }}>{myAmbulance.status?.replace(/_/g, ' ').toUpperCase()}</span>
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    Type: <strong>{myAmbulance.type?.replace(/_/g, ' ')}</strong>
                                </div>
                                {myAmbulance.locationAddress && (
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                        📍 {myAmbulance.locationAddress}
                                    </div>
                                )}
                            </div>
                            <div>
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <label className="form-label">Update Status</label>
                                    <select className="form-input form-select" value={myAmbulance.status}
                                        onChange={e => updateStatus(myAmbulance._id, e.target.value)}>
                                        <option value="available">Available</option>
                                        <option value="dispatched">Dispatched</option>
                                        <option value="en_route">En Route</option>
                                        <option value="at_scene">At Scene</option>
                                        <option value="transporting">Transporting</option>
                                        <option value="maintenance">Maintenance</option>
                                    </select>
                                </div>
                                <button
                                    className={`btn ${locationTracking ? 'btn-danger' : 'btn-success'} w-full`}
                                    onClick={locationTracking ? stopTracking : startTracking}>
                                    {locationTracking ? '⏹ Stop Tracking' : '📍 Start Live Tracking'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid-2">
                    {/* Fleet Status */}
                    <div className="card">
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Fleet Status</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {ambulances.map(a => (
                                <div key={a._id} style={{ background: 'var(--bg-dark)', borderRadius: '0.5rem', padding: '0.875rem' }}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.vehicleNumber}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {a.type?.replace(/_/g, ' ')} • {a.driverName || 'No driver'}
                                            </div>
                                        </div>
                                        <span style={{
                                            padding: '0.25rem 0.625rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700,
                                            background: `${statusColors[a.status]}20`, color: statusColors[a.status],
                                            border: `1px solid ${statusColors[a.status]}40`
                                        }}>
                                            {a.status?.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Active Emergencies */}
                    <div className="card">
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Active Emergencies</h3>
                        {emergencies.filter(e => !['resolved', 'cancelled'].includes(e.status)).length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '2rem' }}>✅</div>
                                <p>No active emergencies</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {emergencies.filter(e => !['resolved', 'cancelled'].includes(e.status)).map(e => (
                                    <div key={e._id} style={{ background: 'var(--bg-dark)', borderRadius: '0.5rem', padding: '0.875rem' }}>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{e.patientName}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {e.emergencyType} • {e.locationAddress || 'GPS tracked'}
                                                </div>
                                            </div>
                                            <span className={`badge badge-${e.severity}`}>{e.severity}</span>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                            Hospital: {e.assignedHospital?.name || 'Assigning...'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AmbulanceDashboard;
