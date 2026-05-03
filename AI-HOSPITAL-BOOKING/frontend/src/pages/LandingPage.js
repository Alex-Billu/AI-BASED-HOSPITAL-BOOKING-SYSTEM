import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
    { icon: '🏥', title: 'Real-Time Hospital Readiness', desc: 'Live blood availability, doctor count, and emergency load across all hospitals.' },
    { icon: '🩸', title: 'Blood Availability Tracking', desc: 'Instant visibility into blood type availability across the city network.' },
    { icon: '🤖', title: 'AI Hospital Recommendation', desc: 'Intelligent scoring based on distance, readiness, blood type, and emergency severity.' },
    { icon: '🚑', title: 'Live Ambulance Tracking', desc: 'Real-time GPS tracking of ambulances en route to your location.' },
    { icon: '📋', title: 'Digital Pre-Registration', desc: 'AI-generated case summary sent to hospital before patient arrival.' },
    { icon: '⚡', title: 'Auto-Escalation', desc: 'Automatic rerouting if hospital fails to respond within 3 minutes.' },
];

const stats = [
    { value: '< 3 min', label: 'Hospital Response Time' },
    { value: '4+', label: 'Hospitals Connected' },
    { value: '8 Types', label: 'Blood Types Tracked' },
    { value: '24/7', label: 'Real-Time Monitoring' },
];

const LandingPage = () => {
    const { user } = useAuth();

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-brand">
                    🚨 <span>RED ALERT</span>NETWORK
                </div>
                <div className="navbar-links">
                    <Link to="/blood-availability" className="nav-link">🩸 Blood Availability</Link>
                    {user ? (
                        <Link to="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link">Sign In</Link>
                            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero */}
            <section style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0f172a 100%)',
                padding: '6rem 1.5rem',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Glow effects */}
                <div style={{ position: 'absolute', top: '20%', left: '10%', width: '300px', height: '300px', background: 'rgba(239,68,68,0.08)', borderRadius: '50%', filter: 'blur(60px)' }} />
                <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: '300px', height: '300px', background: 'rgba(14,165,233,0.08)', borderRadius: '50%', filter: 'blur(60px)' }} />

                <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '9999px', padding: '0.375rem 1rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--primary)' }}>
                        <span className="pulse-dot pulse-red" style={{ width: '8px', height: '8px' }}></span>
                        Live Emergency Coordination Platform
                    </div>

                    <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem' }}>
                        Save Lives with{' '}
                        <span style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Real-Time
                        </span>{' '}
                        Emergency Coordination
                    </h1>

                    <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
                        RED ALERT NETWORK connects patients, ambulances, and hospitals instantly. AI-powered hospital recommendations, live blood availability, and auto-escalation to minimize emergency response time.
                    </p>

                    <div className="flex gap-4 justify-center" style={{ flexWrap: 'wrap' }}>
                        <Link to="/register" className="btn btn-primary btn-lg">
                            🚨 Request Emergency Help
                        </Link>
                        <Link to="/blood-availability" className="btn btn-outline btn-lg">
                            🩸 Check Blood Availability
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section style={{ padding: '3rem 1.5rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', textAlign: 'center' }}>
                    {stats.map((s, i) => (
                        <div key={i}>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>{s.value}</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section style={{ padding: '5rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
                <div className="text-center mb-6">
                    <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Everything You Need in an Emergency</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Comprehensive tools for patients, ambulances, and hospitals</p>
                </div>
                <div className="grid-3" style={{ marginTop: '3rem' }}>
                    {features.map((f, i) => (
                        <div key={i} className="card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{f.icon}</div>
                            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{f.title}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section style={{ padding: '5rem 1.5rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(239,68,68,0.05), rgba(14,165,233,0.05))' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Ready to Save Lives?</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Join the RED ALERT NETWORK today</p>
                <div className="flex gap-4 justify-center" style={{ flexWrap: 'wrap' }}>
                    <Link to="/register" className="btn btn-primary btn-lg">Create Account</Link>
                    <Link to="/login" className="btn btn-outline btn-lg">Sign In</Link>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '2rem 1.5rem', textAlign: 'center', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <p>🚨 <strong style={{ color: 'var(--primary)' }}>RED ALERT NETWORK</strong> – Real-Time Emergency Healthcare Coordination Platform</p>
                <p style={{ marginTop: '0.5rem' }}>Built for Hackathon 2024 | AI Avengers Team</p>
            </footer>
        </div>
    );
};

export default LandingPage;
