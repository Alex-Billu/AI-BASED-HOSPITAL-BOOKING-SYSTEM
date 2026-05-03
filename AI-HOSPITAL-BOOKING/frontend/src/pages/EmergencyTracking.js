import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../utils/socket';
import API from '../utils/api';
import toast from 'react-hot-toast';
import MapComponent from '../components/MapComponent';

const statusSteps = [
    { key: 'pending', label: 'Request Sent', icon: '📤' },
    { key: 'hospital_assigned', label: 'Hospital Assigned', icon: '🏥' },
    { key: 'ambulance_dispatched', label: 'Ambulance Dispatched', icon: '🚑' },
    { key: 'en_route', label: 'En Route', icon: '🛣️' },
    { key: 'arrived', label: 'Arrived', icon: '📍' },
    { key: 'admitted', label: 'Admitted', icon: '✅' },
];

const EmergencyTracking = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [emergency, setEmergency] = useState(null);
    const [loading, setLoading] = useState(true);
    const [ambulanceLocation, setAmbulanceLocation] = useState(null);
    const [userLocation, setUserLocation] = useState(null);

    useEffect(() => {
        fetchEmergency();
        const socket = getSocket();
        if (socket) {
            socket.emit('join-room', `emergency-${id}`);
            socket.on('emergency-updated', (updated) => {
                if (updated._id === id) {
                    setEmergency(updated);
                    toast.success(`Status updated: ${updated.status?.replace(/_/g, ' ')}`);
                }
            });
            socket.on('ambulance-moved', (data) => {
                if (data.emergencyId === id) {
                    setAmbulanceLocation([data.location.coordinates[1], data.location.coordinates[0]]);
                }
            });
            socket.on('emergency-escalated', (data) => {
                toast.error(`⚡ ${data.message}`, { duration: 8000 });
                fetchEmergency();
            });
        }
        return () => {
            if (socket) { socket.off('emergency-updated'); socket.off('ambulance-moved'); socket.off('emergency-escalated'); }
        };
    }, [id]);

    const fetchEmergency = async () => {
        try {
            const { data } = await API.get(`/emergency/${id}`);
            setEmergency(data.data);
            if (data.data.patientLocation) {
                setUserLocation([data.data.patientLocation.coordinates[1], data.data.patientLocation.coordinates[0]]);
            }
            if (data.data.assignedAmbulance?.currentLocation) {
                setAmbulanceLocation([
                    data.data.assignedAmbulance.currentLocation.coordinates[1],
                    data.data.assignedAmbulance.currentLocation.coordinates[0]
                ]);
            }
        } catch (err) {
            toast.error('Failed to load emergency');
        } finally {
            setLoading(false);
        }
    };

    const getCurrentStep = () => {
        if (!emergency) return 0;
        const idx = statusSteps.findIndex(s => s.key === emergency.status);
        return idx >= 0 ? idx : 0;
    };

    const severityColors = { critical: '#ef4444', high: '#f59e0b', medium: '#0ea5e9', low: '#10b981' };

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner"></div>
        </div>
    );

    if (!emergency) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '3rem' }}>❌</div>
            <p>Emergency not found</p>
            <Link to="/patient-dashboard" className="btn btn-primary">Back to Dashboard</Link>
        </div>
    );

    const currentStep = getCurrentStep();

    return (
        <div className="page">
            <nav className="navbar">
                <div className="navbar-brand">🚨 <span>RED ALERT</span>NETWORK</div>
                <Link to="/patient-dashboard" className="btn btn-outline btn-sm">← Dashboard</Link>
            </nav>

            <div className="page-content" style={{ maxWidth: '800px' }}>
                {/* Header */}
                <div style={{
                    background: `rgba(${emergency.severity === 'critical' ? '239,68,68' : emergency.severity === 'high' ? '245,158,11' : '14,165,233'},0.1)`,
                    border: `1px solid rgba(${emergency.severity === 'critical' ? '239,68,68' : emergency.severity === 'high' ? '245,158,11' : '14,165,233'},0.3)`,
                    borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.5rem'
                }}>
                    <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="pulse-dot pulse-red"></span>
                                <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>Emergency Tracking</span>
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                {emergency.emergencyType?.toUpperCase()} • {emergency.locationAddress || 'Location tracked'}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, fontSize: '1.5rem', color: severityColors[emergency.severity] }}>
                                {emergency.severity?.toUpperCase()}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {new Date(emergency.createdAt).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Steps */}
                {!['escalated', 'resolved', 'cancelled'].includes(emergency.status) && (
                    <div className="card mb-4">
                        <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Response Progress</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                            {statusSteps.map((step, idx) => (
                                <React.Fragment key={step.key}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: idx < statusSteps.length - 1 ? 'none' : 1 }}>
                                        <div style={{
                                            width: '2.5rem', height: '2.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1rem', background: idx <= currentStep ? 'var(--primary)' : 'var(--bg-dark)',
                                            border: `2px solid ${idx <= currentStep ? 'var(--primary)' : 'var(--border)'}`,
                                            transition: 'all 0.3s'
                                        }}>
                                            {idx < currentStep ? '✓' : step.icon}
                                        </div>
                                        <div style={{ fontSize: '0.65rem', color: idx <= currentStep ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '0.375rem', textAlign: 'center', maxWidth: '60px' }}>
                                            {step.label}
                                        </div>
                                    </div>
                                    {idx < statusSteps.length - 1 && (
                                        <div style={{ flex: 1, height: '2px', background: idx < currentStep ? 'var(--primary)' : 'var(--border)', transition: 'all 0.3s', margin: '0 0.25rem', marginBottom: '1.5rem' }} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}

                {/* Escalation Alert */}
                {emergency.status === 'escalated' && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1rem' }}>
                        <div className="flex items-center gap-2">
                            <span className="pulse-dot pulse-red"></span>
                            <div>
                                <div style={{ fontWeight: 700, color: 'var(--primary)' }}>⚡ Emergency Escalated</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    Escalation #{emergency.escalationCount} — Searching for next available hospital
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Resolved */}
                {emergency.status === 'resolved' && (
                    <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                        <div style={{ fontWeight: 700, color: 'var(--success)' }}>Emergency Resolved</div>
                        {emergency.totalResponseTime && (
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                Total response time: {emergency.totalResponseTime} minutes
                            </div>
                        )}
                    </div>
                )}

                {/* Map Tracking */}
                {['ambulance_dispatched', 'en_route', 'arrived'].includes(emergency.status) && (
                    <div className="card mb-4">
                        <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>📍 Live Tracking</h3>
                        <MapComponent
                            center={ambulanceLocation || userLocation || [28.6139, 77.2090]}
                            zoom={14}
                            userLocation={userLocation}
                            ambulanceLocation={ambulanceLocation}
                            height="350px"
                        />
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <div className="flex items-center gap-1">
                                <span style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '50%' }}></span> Your Location
                            </div>
                            <div className="flex items-center gap-1">
                                <span style={{ width: '12px', height: '12px', background: '#f97316', borderRadius: '50%' }}></span> Ambulance
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid-2">
                    {/* Hospital Info */}
                    <div className="card">
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>🏥 Assigned Hospital</h3>
                        {emergency.assignedHospital ? (
                            <div>
                                <div style={{ fontWeight: 700 }}>{emergency.assignedHospital.name}</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{emergency.assignedHospital.address}</div>
                                <div style={{ marginTop: '0.75rem' }}>
                                    <a href={`tel:${emergency.assignedHospital.phone}`} className="btn btn-secondary btn-sm w-full">
                                        📞 {emergency.assignedHospital.phone}
                                    </a>
                                </div>
                            </div>
                        ) : <p style={{ color: 'var(--text-muted)' }}>Searching for hospital...</p>}
                    </div>

                    {/* Ambulance Info */}
                    <div className="card">
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>🚑 Ambulance</h3>
                        {emergency.assignedAmbulance ? (
                            <div>
                                <div style={{ fontWeight: 700 }}>{emergency.assignedAmbulance.vehicleNumber}</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                    Driver: {emergency.assignedAmbulance.driverName}
                                </div>
                                <div style={{ marginTop: '0.75rem' }}>
                                    <a href={`tel:${emergency.assignedAmbulance.phone}`} className="btn btn-secondary btn-sm w-full">
                                        📞 {emergency.assignedAmbulance.phone}
                                    </a>
                                </div>
                            </div>
                        ) : <p style={{ color: 'var(--text-muted)' }}>Dispatching ambulance...</p>}
                    </div>
                </div>

                {/* Timeline */}
                {emergency.timeline?.length > 0 && (
                    <div className="card mt-4">
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>📋 Event Timeline</h3>
                        <div className="timeline">
                            {[...emergency.timeline].reverse().map((t, i) => (
                                <div key={i} className="timeline-item">
                                    <div className="timeline-event">{t.event}</div>
                                    {t.details && <div className="timeline-detail">{t.details}</div>}
                                    <div className="timeline-time">{new Date(t.timestamp).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Case Summary */}
                {emergency.caseSummary && (
                    <div className="card mt-4">
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>📋 AI Case Summary</h3>
                        <pre style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '0.5rem', maxHeight: '200px', overflow: 'auto' }}>
                            {emergency.caseSummary}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmergencyTracking;
