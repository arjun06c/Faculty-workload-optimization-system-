import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const FacultyDashboard = () => {
    const { logout } = useAuth();
    const [facultyProfile, setFacultyProfile] = useState(null);
    const [timetable, setTimetable] = useState([]);
    const [requests, setRequests] = useState([]);
    const [newRequest, setNewRequest] = useState({ reason: '', affectedPeriods: [] });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchFacultyData();
    }, []);

    const fetchFacultyData = async () => {
        try {
            setLoading(true);
            setError('');
            const profileRes = await api.get('/faculty/me');
            setFacultyProfile(profileRes.data);

            const timetableRes = await api.get('/faculty/timetable');
            setTimetable(timetableRes.data);

            const requestsRes = await api.get('/faculty/workload-requests');
            setRequests(requestsRes.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.msg || 'Failed to load faculty data.');
            setLoading(false);
        }
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/faculty/workload-request', newRequest);
            setNewRequest({ reason: '', affectedPeriods: [] });
            fetchFacultyData();

            alert('Request submitted successfully');
        } catch (err) {
            alert('Error submitting request');
        }
    };

    if (loading) return <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="loader">Loading Dashboard...</div>
    </div>;

    if (error) return (
        <div className="page-container">
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Access Denied or Error</h2>
                <p style={{ color: 'var(--text-scnd)', marginBottom: '2rem' }}>{error}</p>
                <button onClick={fetchFacultyData} className="btn" style={{ marginRight: '1rem' }}>Try Again</button>
                <button onClick={logout} className="btn btn-secondary">Logout</button>
            </div>
        </div>
    );

    if (!facultyProfile) return <div className="page-container">Profile not found.</div>;

    const workloadPercentage = (facultyProfile.currentHours / facultyProfile.maxHours) * 100;
    let statusColor = '#10b981'; // Success Green
    if (workloadPercentage >= 100) statusColor = '#ef4444'; // Danger Red
    else if (workloadPercentage >= 80) statusColor = '#f59e0b'; // Warning Yellow

    // Group timetable by day for better visualization
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    return (
        <>
            <style>{`
                @media (max-width: 1024px) {
                    .faculty-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
                @media (max-width: 768px) {
                    .faculty-header {
                        flex-direction: column !important;
                        text-align: center !important;
                    }
                    .faculty-info {
                        flex-wrap: wrap !important;
                        justify-content: center !important;
                    }
                    .faculty-legend {
                        flex-wrap: wrap !important;
                        gap: 1rem !important;
                    }
                }
            `}</style>
            <div className="page-container" style={{ background: '#f8fafc', minHeight: '100vh', padding: '2rem 3rem', maxWidth: '1800px', margin: '0 auto' }}>
                {/* Professional Profile Header */}
                <div className="card faculty-header" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2rem',
                    marginBottom: '2rem',
                    padding: '2rem',
                    background: 'linear-gradient(to right, #ffffff, #f1f5f9)',
                    borderLeft: '5px solid var(--primary)'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'var(--primary)',
                        color: 'white',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                    }}>
                        {facultyProfile.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#1e293b' }}>{facultyProfile.name}</h1>
                        <div className="faculty-info" style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', color: '#64748b' }}>
                            <span><strong>Designation:</strong> {facultyProfile.designation}</span>
                            <span><strong>Department:</strong> {facultyProfile.department?.name}</span>
                            <span><strong>Phone:</strong> {facultyProfile.phone || 'N/A'}</span>
                        </div>
                    </div>
                    <button onClick={logout} className="btn btn-secondary" style={{ borderRadius: '8px' }}>Log Out</button>
                </div>

                <div className="faculty-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' }}>
                    {/* Column 1: Workload & Timetable */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Workload Status */}
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Current Workload Status</h2>
                                <span style={{
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '20px',
                                    background: `${statusColor}22`,
                                    color: statusColor,
                                    fontWeight: 'bold',
                                    fontSize: '0.85rem'
                                }}>
                                    {workloadPercentage >= 100 ? 'Overloaded' : workloadPercentage >= 80 ? 'Heavy Workload' : 'Optimal'}
                                </span>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ color: '#64748b' }}>Weekly Hours Utilized</span>
                                    <span style={{ fontWeight: 'bold', color: '#1e293b' }}>
                                        {facultyProfile.currentHours} / {facultyProfile.maxHours} hrs
                                    </span>
                                </div>
                                <div style={{ width: '100%', height: '12px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${Math.min(workloadPercentage, 100)}%`,
                                        height: '100%',
                                        background: statusColor,
                                        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}></div>
                                </div>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontStyle: 'italic' }}>
                                {workloadPercentage >= 100
                                    ? 'Notice: You have exceeded your weekly hour limit. Please coordinate with the Academics Office.'
                                    : workloadPercentage >= 80
                                        ? 'Caution: You are approaching your maximum workload capacity.'
                                        : 'Your current assignment is within the professional guidelines.'}
                            </p>
                        </div>

                        {/* Weekly Timetable Grid */}
                        <div className="card">
                            <h2 style={{ marginBottom: '1.5rem' }}>📅 My Weekly Schedule</h2>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    minWidth: '700px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc' }}>
                                            <th style={{
                                                padding: '0.75rem',
                                                textAlign: 'center',
                                                borderRight: '1px solid #e2e8f0',
                                                borderBottom: '2px solid #e2e8f0',
                                                color: '#475569',
                                                fontWeight: '600',
                                                fontSize: '0.85rem',
                                                width: '80px'
                                            }}>Period</th>
                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                                                <th key={day} style={{
                                                    padding: '0.75rem',
                                                    textAlign: 'center',
                                                    borderRight: '1px solid #e2e8f0',
                                                    borderBottom: '2px solid #e2e8f0',
                                                    color: '#1e40af',
                                                    fontWeight: '600',
                                                    fontSize: '0.85rem'
                                                }}>{day}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(period => (
                                            <tr key={period}>
                                                <td style={{
                                                    padding: '0.75rem',
                                                    textAlign: 'center',
                                                    borderRight: '1px solid #e2e8f0',
                                                    borderBottom: '1px solid #e2e8f0',
                                                    background: '#f8fafc',
                                                    fontWeight: '700',
                                                    color: '#334155',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    {period}
                                                </td>
                                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                                                    const slot = timetable.find(s => s.day === day && s.period === period);
                                                    return (
                                                        <td key={`${day}-${period}`} style={{
                                                            padding: '0.5rem',
                                                            borderRight: '1px solid #e2e8f0',
                                                            borderBottom: '1px solid #e2e8f0',
                                                            background: slot ? (slot.type === 'Lab' ? '#fef3c7' : '#e0e7ff') : 'white',
                                                            verticalAlign: 'top',
                                                            minHeight: '70px'
                                                        }}>
                                                            {slot ? (
                                                                <div style={{ fontSize: '0.75rem' }}>
                                                                    <div style={{
                                                                        fontWeight: '600',
                                                                        color: slot.type === 'Lab' ? '#92400e' : '#3730a3',
                                                                        marginBottom: '0.15rem'
                                                                    }}>
                                                                        {slot.subject}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                                                        Year: {slot.classYear}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                                                        {slot.roomNumber || 'TBA'}
                                                                    </div>
                                                                    <div style={{ marginTop: '0.15rem' }}>
                                                                        <span style={{
                                                                            fontSize: '0.65rem',
                                                                            padding: '1px 4px',
                                                                            borderRadius: '3px',
                                                                            background: slot.type === 'Lab' ? '#fbbf24' : '#6366f1',
                                                                            color: 'white',
                                                                            fontWeight: '600'
                                                                        }}>
                                                                            {slot.type}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '0.7rem' }}>—</div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Legend */}
                            <div className="faculty-legend" style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', justifyContent: 'center', alignItems: 'center', fontSize: '0.8rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <div style={{ width: '16px', height: '16px', background: '#e0e7ff', border: '1px solid #c7d2fe', borderRadius: '3px' }}></div>
                                    <span style={{ color: '#64748b' }}>Theory</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <div style={{ width: '16px', height: '16px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '3px' }}></div>
                                    <span style={{ color: '#64748b' }}>Lab</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <div style={{ width: '16px', height: '16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '3px' }}></div>
                                    <span style={{ color: '#64748b' }}>Free</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Request Actions & History */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Raise Request */}
                        <div className="card" style={{ padding: '2rem' }}>
                            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', color: '#1e293b', fontWeight: '600' }}>📝 Request Workload Relief</h2>
                            <form onSubmit={handleRequestSubmit}>
                                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                                    If you are facing any scheduling conflicts or workload issues, please submit a formal request here.
                                </p>
                                <textarea
                                    className="input-field"
                                    placeholder="Detailed reason for reassignment request..."
                                    value={newRequest.reason}
                                    onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                                    required
                                    style={{
                                        height: '140px',
                                        marginBottom: '1.5rem',
                                        padding: '1rem',
                                        fontSize: '0.9rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        resize: 'vertical'
                                    }}
                                />
                                <button type="submit" className="btn btn-block" style={{
                                    fontWeight: '600',
                                    padding: '0.875rem',
                                    fontSize: '0.95rem',
                                    borderRadius: '8px'
                                }}>
                                    ✉️ Submit Official Request
                                </button>
                            </form>
                        </div>

                        {/* Request History */}
                        <div className="card" style={{ padding: '2rem' }}>
                            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: '#1e293b', fontWeight: '600' }}>📋 Recent Requests History</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {requests.length > 0 ? requests.map(req => (
                                    <div key={req._id} style={{
                                        padding: '1.25rem',
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0',
                                        background: 'white',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                        transition: 'all 0.2s ease'
                                    }}
                                        onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500' }}>
                                                📅 {new Date(req.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </span>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                padding: '0.35rem 0.75rem',
                                                borderRadius: '6px',
                                                background: req.status === 'Reassigned' ? '#d1fae5' : req.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                                                color: req.status === 'Reassigned' ? '#065f46' : req.status === 'Rejected' ? '#991b1b' : '#92400e',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em'
                                            }}>
                                                {req.status}
                                            </span>
                                        </div>
                                        <div style={{
                                            fontSize: '0.925rem',
                                            color: '#1e293b',
                                            marginBottom: '0.75rem',
                                            fontWeight: '500',
                                            lineHeight: '1.5'
                                        }}>
                                            {req.reason}
                                        </div>
                                        {req.decisionLog && (
                                            <div style={{
                                                fontSize: '0.825rem',
                                                color: '#475569',
                                                padding: '0.75rem',
                                                borderLeft: '3px solid #3b82f6',
                                                background: '#eff6ff',
                                                borderRadius: '4px',
                                                marginTop: '0.75rem'
                                            }}>
                                                <strong style={{ color: '#1e40af' }}>Admin Note:</strong> {req.decisionLog}
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '3rem 1rem',
                                        color: '#94a3b8',
                                        background: '#f8fafc',
                                        borderRadius: '8px',
                                        border: '2px dashed #e2e8f0'
                                    }}>
                                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
                                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '500' }}>No past requests found.</p>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem' }}>Your request history will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default FacultyDashboard;
