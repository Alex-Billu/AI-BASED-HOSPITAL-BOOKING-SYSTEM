import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { getSocket } from '../utils/socket';
import toast from 'react-hot-toast';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const bloodColors = {
    'A+': '#ef4444', 'A-': '#f97316', 'B+': '#3b82f6', 'B-': '#8b5cf6',
    'AB+': '#10b981', 'AB-': '#06b6d4', 'O+': '#f59e0b', 'O-': '#ec4899'
};

const BloodAvailability = () => {
    const [hospitals, setHospitals] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchType, setSearchType] = useState('');
    const [searchResults, setSearchResults] = useState(null);

    useEffect(() => {
        fetchData();
        const socket = getSocket();
        if (socket) {
            socket.on('hospital-updated', () => fetchData());
            socket.on('blood-critical', (data) => {
                toast.error(`🩸 Critical blood shortage at ${data.hospitalName}!`, { duration: 8000 });
            });
        }
        return () => {
            if (socket) { socket.off('hospital-updated'); socket.off('blood-critical'); }
        };
    }, []);

    const fetchData = async () => {
        try {
            const [bRes, sRes] = await Promise.all([
                API.get('/blood'),
                API.get('/blood/summary')
            ]);
            setHospitals(bRes.data.data || []);
            setSummary(sRes.data.data || {});
        } catch (err) {
            toast.error('Failed to load blood data');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchType) return;
        try {
            const { data } = await API.get(`/blood/search?bloodType=${searchType}&minUnits=1`);
            setSearchResults(data.data);
        } catch (err) {
            toast.error('Search failed');
        }
    };

    const getUnitColor = (units, critical) => {
        if (units === 0) return '#ef4444';
        if (units <= critical) return '#f59e0b';
        return '#10b981';
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
                    <Link to="/" className="nav-link">Home</Link>
                    <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
                </div>
            </nav>

            <div className="page-content">
                <div className="page-header">
                    <h1 className="page-title">🩸 Blood Availability</h1>
                    <p className="page-subtitle">Real-time blood inventory across all connected hospitals</p>
                </div>

                {/* City-wide Summary */}
                <div className="card mb-6">
                    <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>City-Wide Blood Summary</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0.75rem' }}>
                        {BLOOD_TYPES.map(type => {
                            const data = summary[type] || { totalUnits: 0, hospitalCount: 0, criticalHospitals: 0 };
                            const isCritical = data.criticalHospitals > 0 && data.totalUnits < 20;
                            return (
                                <div key={type} style={{
                                    background: 'var(--bg-dark)', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center',
                                    border: `2px solid ${isCritical ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
                                    position: 'relative'
                                }}>
                                    {isCritical && (
                                        <div style={{ position: 'absolute', top: '-6px', right: '-6px' }}>
                                            <span className="pulse-dot pulse-red" style={{ width: '12px', height: '12px' }}></span>
                                        </div>
                                    )}
                                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: bloodColors[type] }}>{type}</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: isCritical ? '#ef4444' : 'var(--text-primary)' }}>
                                        {data.totalUnits}
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>units</div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{data.hospitalCount} hospitals</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Search by Blood Type */}
                <div className="card mb-6">
                    <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>🔍 Find Hospitals by Blood Type</h3>
                    <div className="flex gap-3 items-center" style={{ flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {BLOOD_TYPES.map(type => (
                                <button key={type} onClick={() => setSearchType(type)}
                                    style={{
                                        padding: '0.5rem 0.875rem', borderRadius: '0.5rem', fontWeight: 700,
                                        border: `2px solid ${searchType === type ? bloodColors[type] : 'var(--border)'}`,
                                        background: searchType === type ? `${bloodColors[type]}20` : 'var(--bg-dark)',
                                        color: searchType === type ? bloodColors[type] : 'var(--text-secondary)',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}>
                                    {type}
                                </button>
                            ))}
                        </div>
                        <button className="btn btn-primary" onClick={handleSearch} disabled={!searchType}>
                            Search
                        </button>
                    </div>

                    {searchResults !== null && (
                        <div style={{ marginTop: '1rem' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                                {searchResults.length} hospital(s) have <strong style={{ color: bloodColors[searchType] }}>{searchType}</strong> blood available
                            </p>
                            {searchResults.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                                    ⚠️ No hospitals currently have {searchType} blood available
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {searchResults.map(h => {
                                        const bloodEntry = h.bloodInventory?.find(b => b.type === searchType);
                                        return (
                                            <div key={h._id} style={{ background: 'var(--bg-dark)', borderRadius: '0.5rem', padding: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{h.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{h.address}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 800, fontSize: '1.25rem', color: bloodColors[searchType] }}>
                                                        {bloodEntry?.units || 0} units
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{h.phone}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Hospital-wise Blood Inventory */}
                <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Hospital Blood Inventory</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {hospitals.map(h => (
                        <div key={h.hospitalId} className="card">
                            <div className="flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{h.hospitalName}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{h.address} • {h.phone}</div>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <span className={`badge ${h.isAcceptingEmergencies ? 'badge-success' : 'badge-critical'}`}>
                                        {h.isAcceptingEmergencies ? '✅ Accepting' : '❌ Not Accepting'}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Readiness: <strong style={{ color: h.readinessScore > 70 ? 'var(--success)' : h.readinessScore > 40 ? 'var(--warning)' : 'var(--danger)' }}>{h.readinessScore}%</strong>
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0.5rem' }}>
                                {BLOOD_TYPES.map(type => {
                                    const entry = h.bloodInventory?.find(b => b.type === type);
                                    const units = entry?.units ?? 0;
                                    const critical = entry?.criticalLevel ?? 5;
                                    const color = getUnitColor(units, critical);
                                    return (
                                        <div key={type} style={{
                                            background: 'var(--bg-dark)', borderRadius: '0.5rem', padding: '0.625rem', textAlign: 'center',
                                            border: `1px solid ${units === 0 ? 'rgba(239,68,68,0.3)' : units <= critical ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`
                                        }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: bloodColors[type] }}>{type}</div>
                                            <div style={{ fontSize: '1.125rem', fontWeight: 800, color, marginTop: '0.25rem' }}>{units}</div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>units</div>
                                            {units <= critical && units > 0 && <div style={{ fontSize: '0.6rem', color: '#f59e0b', marginTop: '0.125rem' }}>⚠️ Low</div>}
                                            {units === 0 && <div style={{ fontSize: '0.6rem', color: '#ef4444', marginTop: '0.125rem' }}>❌ None</div>}
                                        </div>
                                    );
                                })}
                            </div>

                            {h.criticalTypes?.length > 0 && (
                                <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.08)', borderRadius: '0.375rem', fontSize: '0.75rem', color: '#ef4444' }}>
                                    ⚠️ Critical shortage: {h.criticalTypes.join(', ')}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BloodAvailability;
