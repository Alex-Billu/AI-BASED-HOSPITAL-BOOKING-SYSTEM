import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../utils/socket';
import API from '../utils/api';
import toast from 'react-hot-toast';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const bloodColors = {
    'A+': '#ef4444', 'A-': '#f97316', 'B+': '#3b82f6', 'B-': '#8b5cf6',
    'AB+': '#10b981', 'AB-': '#06b6d4', 'O+': '#f59e0b', 'O-': '#ec4899'
};

const HospitalDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [hospital, setHospital] = useState(null);
    const [emergencies, setEmergencies] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [bloodEdit, setBloodEdit] = useState({});
    const [statusEdit, setStatusEdit] = useState({});

    useEffect(() => {
        fetchData();
        const socket = getSocket();
        if (socket) {
            socket.on('new-emergency', (data) => {
                setEmergencies(prev => [data.emergency, ...prev]);
                toast.error(`🚨 New Emergency! ${data.emergency?.emergencyType} - ${data.emergency?.severity}`, { duration: 10000 });
            });
            socket.on('escalated-emergency', (data) => {
                setEmergencies(prev => [data.emergency, ...prev]);
                toast.error(`⚡ ESCALATED Emergency Assigned!`, { duration: 10000 });
            });
        }
        return () => {
            if (socket) { socket.off('new-emergency'); socket.off('escalated-emergency'); }
        };
    }, []);

    const fetchData = async () => {
        try {
            const [hRes, eRes, nRes] = await Promise.all([
                user.hospitalId ? API.get(`/hospitals/${user.hospitalId}`) : Promise.resolve({ data: { data: null } }),
                API.get('/emergency'),
                API.get('/notifications')
            ]);
            setHospital(hRes.data.data);
            setEmergencies(eRes.data.data || []);
            setNotifications(nRes.data.data || []);
            if (hRes.data.data) {
                const inv = {};
                hRes.data.data.bloodInventory?.forEach(b => { inv[b.type] = b.units; });
                setBloodEdit(inv);
                setStatusEdit({
                    onDutyDoctors: hRes.data.data.onDutyDoctors,
                    currentEmergencyLoad: hRes.data.data.currentEmergencyLoad,
                    isAcceptingEmergencies: hRes.data.data.isAcceptingEmergencies
                });
            }
        } catch (err) {
            toast.error('Failed to load hospital data');
        } finally {
            setLoading(false);
        }
    };

    const updateBlood = async (bloodType) => {
        if (!hospital) return;
        try {
            await API.put(`/hospitals/${hospital._id}/blood`, { bloodType, units: parseInt(bloodEdit[bloodType] || 0) });
            toast.success(`${bloodType} updated!`);
            fetchData();
        } catch (err) {
            toast.error('Update failed');
        }
    };

    const updateStatus = async () => {
        if (!hospital) return;
        try {
            await API.put(`/hospitals/${hospital._id}`, statusEdit);
            toast.success('Hospital status updated!');
            fetchData();
        } catch (err) {
            toast.error('Update failed');
        }
    };

    const respondToEmergency = async (emergencyId, action) => {
        try {
            await API.put(`/emergency/${emergencyId}/respond`, { action });
            toast.success(action === 'accept' ? 'Emergency accepted!' : 'Emergency rejected, escalating...');
            fetchData();
        } catch (err) {
            toast.error('Response failed');
        }
    };

    const markNotifRead = async (id) => {
        await API.put(`/notifications/${id}/read`);
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;
    const activeEmergencies = emergencies.filter(e => !['resolved', 'cancelled'].includes(e.status));

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
                    <div style={{ position: 'relative' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => setActiveTab('notifications')}>
                            🔔 Alerts {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                        </button>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={logout}>Logout</button>
                </div>
            </nav>

            <div className="page-content">
                <div className="page-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 className="page-title">🏥 {hospital?.name || 'Hospital Dashboard'}</h1>
                        <p className="page-subtitle">{hospital?.address}</p>
                    </div>
                    <div className="flex gap-2">
                        <span className={`badge ${hospital?.isAcceptingEmergencies ? 'badge-success' : 'badge-critical'}`} style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                            {hospital?.isAcceptingEmergencies ? '✅ Accepting Emergencies' : '❌ Not Accepting'}
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid-4 mb-6">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)' }}>🚨</div>
                        <div>
                            <div className="stat-value" style={{ color: 'var(--primary)' }}>{activeEmergencies.length}</div>
                            <div className="stat-label">Active Emergencies</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(14,165,233,0.1)' }}>👨‍⚕️</div>
                        <div>
                            <div className="stat-value" style={{ color: 'var(--secondary)' }}>{hospital?.onDutyDoctors || 0}</div>
                            <div className="stat-label">Doctors On Duty</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>📊</div>
                        <div>
                            <div className="stat-value" style={{ color: 'var(--accent)' }}>
                                {hospital?.currentEmergencyLoad || 0}/{hospital?.emergencyCapacity || 0}
                            </div>
                            <div className="stat-label">Emergency Load</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>⭐</div>
                        <div>
                            <div className="stat-value" style={{ color: 'var(--success)' }}>{hospital?.readinessScore || 0}%</div>
                            <div className="stat-label">Readiness Score</div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
                    {['overview', 'emergencies', 'blood', 'notifications'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '0.625rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
                                fontWeight: 600, fontSize: '0.875rem', borderBottom: `2px solid ${activeTab === tab ? 'var(--primary)' : 'transparent'}`,
                                color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)', transition: 'all 0.2s',
                                position: 'relative', bottom: '-1px'
                            }}>
                            {tab === 'notifications' && unreadCount > 0 ? `🔔 Alerts (${unreadCount})` :
                                tab === 'emergencies' ? `🚨 Emergencies (${activeEmergencies.length})` :
                                    tab === 'blood' ? '🩸 Blood Inventory' : tab === 'overview' ? '📊 Overview' : tab}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="grid-2 fade-in">
                        <div className="card">
                            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Update Hospital Status</h3>
                            <div className="form-group">
                                <label className="form-label">Doctors On Duty</label>
                                <input type="number" className="form-input" min={0}
                                    value={statusEdit.onDutyDoctors || 0}
                                    onChange={e => setStatusEdit({ ...statusEdit, onDutyDoctors: parseInt(e.target.value) })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Current Emergency Load</label>
                                <input type="number" className="form-input" min={0} max={hospital?.emergencyCapacity || 100}
                                    value={statusEdit.currentEmergencyLoad || 0}
                                    onChange={e => setStatusEdit({ ...statusEdit, currentEmergencyLoad: parseInt(e.target.value) })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Accepting Emergencies</label>
                                <select className="form-input form-select"
                                    value={statusEdit.isAcceptingEmergencies ? 'true' : 'false'}
                                    onChange={e => setStatusEdit({ ...statusEdit, isAcceptingEmergencies: e.target.value === 'true' })}>
                                    <option value="true">Yes - Accepting</option>
                                    <option value="false">No - Not Accepting</option>
                                </select>
                            </div>
                            <button className="btn btn-primary w-full" onClick={updateStatus}>Update Status</button>
                        </div>

                        <div className="card">
                            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Recent Emergencies</h3>
                            {activeEmergencies.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: '2rem' }}>✅</div>
                                    <p>No active emergencies</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {activeEmergencies.slice(0, 4).map(e => (
                                        <div key={e._id} style={{ background: 'var(--bg-dark)', borderRadius: '0.5rem', padding: '0.875rem' }}>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{e.patientName}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.emergencyType} • {e.patientBloodType}</div>
                                                </div>
                                                <span className={`badge badge-${e.severity}`}>{e.severity}</span>
                                            </div>
                                            {e.status === 'hospital_assigned' && (
                                                <div className="flex gap-2 mt-2">
                                                    <button className="btn btn-success btn-sm" onClick={() => respondToEmergency(e._id, 'accept')}>✅ Accept</button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => respondToEmergency(e._id, 'reject')}>❌ Reject</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Emergencies Tab */}
                {activeTab === 'emergencies' && (
                    <div className="card fade-in">
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>All Emergencies</h3>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Patient</th><th>Type</th><th>Severity</th><th>Blood Type</th><th>Status</th><th>Time</th><th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {emergencies.map(e => (
                                        <tr key={e._id}>
                                            <td><div style={{ fontWeight: 600 }}>{e.patientName}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.patientPhone}</div></td>
                                            <td>{e.emergencyType}</td>
                                            <td><span className={`badge badge-${e.severity}`}>{e.severity}</span></td>
                                            <td style={{ fontWeight: 700, color: bloodColors[e.patientBloodType] || 'var(--text-primary)' }}>{e.patientBloodType || '?'}</td>
                                            <td><span className="badge badge-info">{e.status?.replace(/_/g, ' ')}</span></td>
                                            <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(e.createdAt).toLocaleTimeString()}</td>
                                            <td>
                                                {e.status === 'hospital_assigned' && (
                                                    <div className="flex gap-1">
                                                        <button className="btn btn-success btn-sm" onClick={() => respondToEmergency(e._id, 'accept')}>Accept</button>
                                                        <button className="btn btn-danger btn-sm" onClick={() => respondToEmergency(e._id, 'reject')}>Reject</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Blood Tab */}
                {activeTab === 'blood' && (
                    <div className="card fade-in">
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>🩸 Blood Inventory Management</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                            {BLOOD_TYPES.map(type => {
                                const entry = hospital?.bloodInventory?.find(b => b.type === type);
                                const units = bloodEdit[type] ?? entry?.units ?? 0;
                                const critical = entry?.criticalLevel ?? 5;
                                const isCritical = units <= critical;
                                return (
                                    <div key={type} style={{
                                        background: 'var(--bg-dark)', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center',
                                        border: `2px solid ${isCritical ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`
                                    }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: bloodColors[type], marginBottom: '0.5rem' }}>{type}</div>
                                        <input type="number" min={0}
                                            style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.375rem', color: 'var(--text-primary)', textAlign: 'center', fontSize: '1.125rem', fontWeight: 700 }}
                                            value={units}
                                            onChange={e => setBloodEdit({ ...bloodEdit, [type]: parseInt(e.target.value) || 0 })}
                                        />
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>units (critical: {critical})</div>
                                        {isCritical && <div style={{ fontSize: '0.7rem', color: '#f59e0b', marginBottom: '0.25rem' }}>⚠️ Critical Level</div>}
                                        <button className="btn btn-primary btn-sm w-full" onClick={() => updateBlood(type)}>Update</button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                    <div className="card fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 style={{ fontWeight: 700 }}>Notifications</h3>
                            <button className="btn btn-outline btn-sm" onClick={async () => {
                                await API.put('/notifications/read-all');
                                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                            }}>Mark All Read</button>
                        </div>
                        {notifications.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No notifications</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {notifications.map(n => (
                                    <div key={n._id} style={{
                                        background: n.isRead ? 'var(--bg-dark)' : 'rgba(239,68,68,0.05)',
                                        border: `1px solid ${n.isRead ? 'var(--border)' : 'rgba(239,68,68,0.2)'}`,
                                        borderRadius: '0.5rem', padding: '0.875rem', cursor: 'pointer'
                                    }} onClick={() => markNotifRead(n._id)}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{n.title}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{n.message}</div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                                                <span className={`badge badge-${n.priority === 'critical' ? 'critical' : n.priority === 'high' ? 'high' : 'info'}`}>{n.priority}</span>
                                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HospitalDashboard;
