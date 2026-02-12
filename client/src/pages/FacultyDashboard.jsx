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
        <div className="page-container" style={{ background: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
            {/* Professional Profile Header */}
            <div className="card" style={{
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
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', color: '#64748b' }}>
                        <span><strong>Designation:</strong> {facultyProfile.designation}</span>
                        <span><strong>Department:</strong> {facultyProfile.department?.name}</span>
                        <span><strong>Phone:</strong> {facultyProfile.phone || 'N/A'}</span>
                    </div>
                </div>
                <button onClick={logout} className="btn btn-secondary" style={{ borderRadius: '8px' }}>Log Out</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '2rem' }}>
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

                    {/* Weekly Timetable */}
                    <div className="card">
                        <h2 style={{ marginBottom: '1.5rem' }}>My Weekly Schedule</h2>
                        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <th style={{ padding: '0.5rem 1rem' }}>Day</th>
                                        <th style={{ padding: '0.5rem 1rem' }}>Slot</th>
                                        <th style={{ padding: '0.5rem 1rem' }}>Subject Details</th>
                                        <th style={{ padding: '0.5rem 1rem', textAlign: 'center' }}>Room</th>
                                        <th style={{ padding: '0.5rem 1rem', textAlign: 'center' }}>Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {timetable.length > 0 ? timetable.map(slot => (
                                        <tr key={slot._id} style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderRadius: '8px' }}>
                                            <td style={{ padding: '1rem', fontWeight: 'bold', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px', color: 'var(--primary)' }}>{slot.day}</td>
                                            <td style={{ padding: '1rem', color: '#1e293b' }}>Period {slot.period}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: '500', color: '#1e293b' }}>{slot.subject}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Batch: {slot.classYear} Year</div>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>{slot.roomNumber}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.25rem 0.6rem',
                                                    borderRadius: '6px',
                                                    background: slot.type === 'Lab' ? '#eff6ff' : '#faf5ff',
                                                    color: slot.type === 'Lab' ? '#2563eb' : '#9333ea',
                                                    fontWeight: '600',
                                                    border: `1px solid ${slot.type === 'Lab' ? '#bfdbfe' : '#e9d5ff'}`
                                                }}>
                                                    {slot.type}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontStyle: 'italic' }}>No subjects assigned in the current timetable.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Column 2: Request Actions & History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Raise Request */}
                    <div className="card">
                        <h2 style={{ marginBottom: '1.25rem' }}>Request Workload Relief</h2>
                        <form onSubmit={handleRequestSubmit}>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                                If you are facing any scheduling conflicts or workload issues, please submit a formal request here.
                            </p>
                            <textarea
                                className="input-field"
                                placeholder="Detailed reason for reassignment request..."
                                value={newRequest.reason}
                                onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                                required
                                style={{ height: '120px', marginBottom: '1.5rem' }}
                            />
                            <button type="submit" className="btn btn-block" style={{ fontWeight: 'bold' }}>Submit Official Request</button>
                        </form>
                    </div>

                    {/* Request History */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h2 style={{ marginBottom: '1.25rem', fontSize: '1.25rem' }}>Recent Requests History</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {requests.length > 0 ? requests.map(req => (
                                <div key={req._id} style={{
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    border: '1px solid #f1f5f9',
                                    background: '#f8fafc'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(req.createdAt).toLocaleDateString()}</span>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            color: req.status === 'Reassigned' ? '#10b981' : req.status === 'Rejected' ? '#ef4444' : '#f59e0b'
                                        }}>
                                            {req.status}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.5rem', fontWeight: '500' }}>{req.reason}</div>
                                    {req.decisionLog && (
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: '#64748b',
                                            padding: '0.5rem',
                                            borderLeft: '3px solid #cbd5e1',
                                            background: '#eff6ff'
                                        }}>
                                            <strong>Note:</strong> {req.decisionLog}
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', padding: '1rem' }}>No past requests found.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacultyDashboard;
