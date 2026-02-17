import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const AcademicsDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [view, setView] = useState('timetable'); // 'timetable' | 'requests'

    // Timetable State
    const [departments, setDepartments] = useState([]);
    const [facultyList, setFacultyList] = useState([]);
    const [newEntry, setNewEntry] = useState({
        department: '', facultyId: '', subject: '', day: '', period: '', classYear: '', roomNumber: '', type: 'Theory'
    });

    // Workload Requests State
    const [requests, setRequests] = useState([]);
    const [timetable, setTimetable] = useState([]);

    useEffect(() => {
        fetchData();
    }, [view]);

    const fetchData = async () => {
        try {
            const deptsRes = await api.get('/admin/departments');
            setDepartments(deptsRes.data);

            const facultyRes = await api.get('/admin/faculty');
            setFacultyList(facultyRes.data);
        } catch (err) {
            console.error('Fetching admin data failed:', err);
        }

        if (view === 'timetable') {
            try {
                const timetableRes = await api.get('/academics/timetable');
                setTimetable(timetableRes.data);
            } catch (err) {
                console.error('Fetching timetable failed:', err);
            }
        }

        if (view === 'requests') {
            try {
                const requestsRes = await api.get('/academics/workload-requests');
                setRequests(requestsRes.data);
            } catch (err) {
                console.error('Fetching requests failed:', err);
            }
        }
    };


    const handleAddEntry = async (e) => {
        e.preventDefault();
        try {
            await api.post('/academics/timetable', newEntry);
            alert('Entry added successfully!');
            setNewEntry({ ...newEntry, subject: '', period: '', roomNumber: '' });
            fetchData(); // Refresh faculty workload hours
        } catch (err) {
            alert(err.response?.data?.msg || 'Error adding entry');
        }
    };

    const handleSmartReassign = async (requestId) => {
        try {
            const res = await api.post(`/academics/workload-requests/${requestId}/reassign`);
            alert(res.data.msg + (res.data.replacement ? ` (Replacement: ${res.data.replacement})` : ''));
            fetchData();
        } catch (err) {
            alert(err.response?.data?.msg || 'Reassignment failed');
        }
    };

    const updateRequestStatus = async (id, status) => {
        try {
            await api.put(`/academics/workload-requests/${id}`, { status });
            fetchData();
        } catch (err) {
            alert('Error updating status');
        }
    };

    return (
        <div className="page-container" style={{ background: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                padding: '1.5rem 2rem',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>
                <div>
                    <h1 style={{ margin: 0, color: '#1e3a8a', fontSize: '1.8rem' }}>Academics & Timetable Office</h1>
                    <p style={{ margin: 0, color: '#64748b' }}>University Schedule & Workload Administration</p>
                </div>
                <button onClick={logout} className="btn btn-secondary">Logout</button>
            </header>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    className={`btn ${view === 'timetable' ? '' : 'btn-secondary'}`}
                    onClick={() => setView('timetable')}
                    style={{ padding: '0.75rem 1.5rem', borderRadius: '8px' }}
                >
                    🗓️ Timetable Generation
                </button>
                <button
                    className={`btn ${view === 'requests' ? '' : 'btn-secondary'}`}
                    onClick={() => setView('requests')}
                    style={{ padding: '0.75rem 1.5rem', borderRadius: '8px' }}
                >
                    📨 Workload Requests
                </button>
            </div>

            {view === 'timetable' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2rem' }}>
                    <div className="card" style={{ padding: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>Generate Timetable Entry</h2>
                        <form onSubmit={handleAddEntry} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                            <div className="input-group" style={{ gridColumn: 'span 1' }}>
                                <label className="input-label">Department</label>
                                <select className="input-field" value={newEntry.department} onChange={(e) => setNewEntry({ ...newEntry, department: e.target.value })} required>
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Faculty</label>
                                <select className="input-field" value={newEntry.facultyId} onChange={(e) => setNewEntry({ ...newEntry, facultyId: e.target.value })} required>
                                    <option value="">Select Faculty</option>
                                    {facultyList.filter(f => f.department?._id === newEntry.department).map(f => (
                                        <option key={f._id} value={f._id}>{f.name} ({f.currentHours}/{f.maxHours}h)</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Subject Name</label>
                                <input className="input-field" placeholder="e.g. Data Structures" value={newEntry.subject} onChange={(e) => setNewEntry({ ...newEntry, subject: e.target.value })} required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Session Type</label>
                                <select className="input-field" value={newEntry.type} onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })} required>
                                    <option value="Theory">Theory (1h)</option>
                                    <option value="Lab">Lab (1.5h)</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Day</label>
                                <select className="input-field" value={newEntry.day} onChange={(e) => setNewEntry({ ...newEntry, day: e.target.value })} required>
                                    <option value="">Select Day</option>
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Period Slot</label>
                                <input type="number" className="input-field" placeholder="Period (1-8)" min="1" max="8" value={newEntry.period} onChange={(e) => setNewEntry({ ...newEntry, period: e.target.value })} required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Class / Year</label>
                                <input className="input-field" placeholder="e.g. 3rd Year CSE A" value={newEntry.classYear} onChange={(e) => setNewEntry({ ...newEntry, classYear: e.target.value })} required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Room No.</label>
                                <input className="input-field" placeholder="e.g. L-102" value={newEntry.roomNumber} onChange={(e) => setNewEntry({ ...newEntry, roomNumber: e.target.value })} required />
                            </div>
                            <button type="submit" className="btn btn-block" style={{ gridColumn: 'span 2', marginTop: '1rem', padding: '1rem', fontSize: '1rem', background: 'linear-gradient(to right, #2563eb, #1d4ed8)' }}>
                                ✨ Add to Schedule
                            </button>
                        </form>
                    </div>

                    <div className="card" style={{ padding: '2rem', height: 'fit-content', position: 'sticky', top: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem', color: '#1e293b', fontSize: '1.3rem', fontWeight: '600' }}>📊 Faculty Availability Monitor</h2>
                        {newEntry.department ? (
                            <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {facultyList.filter(f => f.department?._id === newEntry.department).map(f => {
                                    const percentage = (f.currentHours / f.maxHours) * 100;
                                    let color = '#10b981';
                                    let bgColor = '#ecfdf5';
                                    let statusText = 'Available';

                                    if (percentage >= 100) {
                                        color = '#ef4444';
                                        bgColor = '#fef2f2';
                                        statusText = 'Overloaded';
                                    } else if (percentage >= 80) {
                                        color = '#f59e0b';
                                        bgColor = '#fffbeb';
                                        statusText = 'Near Capacity';
                                    }

                                    return (
                                        <div
                                            key={f._id}
                                            onClick={() => navigate(`/academics/faculty/${f._id}`)}
                                            style={{
                                                marginBottom: '1rem',
                                                padding: '1.25rem',
                                                background: 'white',
                                                borderRadius: '10px',
                                                border: '1px solid #e2e8f0',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                                transition: 'all 0.2s ease',
                                                cursor: 'pointer'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.95rem' }}>{f.name}</span>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    color: color,
                                                    background: bgColor
                                                }}>
                                                    {statusText}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Workload</span>
                                                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>
                                                    <span style={{ color }}>{f.currentHours}h</span> / {f.maxHours}h
                                                </span>
                                            </div>
                                            <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${Math.min(percentage, 100)}%`,
                                                    height: '100%',
                                                    background: `linear-gradient(to right, ${color}, ${color}dd)`,
                                                    transition: 'width 0.3s ease',
                                                    borderRadius: '10px'
                                                }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '3rem 1rem',
                                color: '#94a3b8',
                                background: '#f8fafc',
                                borderRadius: '8px',
                                border: '2px dashed #e2e8f0'
                            }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📂</div>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>Select a department to view faculty workload</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {view === 'requests' && (
                <div className="card" style={{ padding: '2rem', overflowX: 'auto' }}>
                    <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>Manage Workload Overload Requests</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                                <th style={{ padding: '1rem' }}>Faculty Member</th>
                                <th style={{ padding: '1rem' }}>Department</th>
                                <th style={{ padding: '1rem' }}>Reason for Request</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(req => {
                                let badgeColor = '#94a3b8';
                                let badgeBg = '#f1f5f9';
                                if (req.status === 'Pending' || req.status === 'Escalated') { badgeColor = '#d97706'; badgeBg = '#fff7ed'; }
                                else if (req.status === 'Approved' || req.status === 'Reassigned') { badgeColor = '#059669'; badgeBg = '#ecfdf5'; }
                                else if (req.status === 'Rejected') { badgeColor = '#dc2626'; badgeBg = '#fef2f2'; }

                                return (
                                    <tr key={req._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} className="table-row-hover">
                                        <td style={{ padding: '1rem', fontWeight: 'bold', color: '#334155' }}>{req.facultyId?.name}</td>
                                        <td style={{ padding: '1rem', color: '#64748b' }}>{req.department?.name}</td>
                                        <td style={{ padding: '1rem', color: '#64748b', maxWidth: '300px' }}>{req.reason}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.85rem',
                                                fontWeight: '600',
                                                color: badgeColor,
                                                background: badgeBg
                                            }}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                {(req.status === 'Pending' || req.status === 'Escalated') ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleSmartReassign(req._id)}
                                                            className="btn"
                                                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                                            title="Find replacement and shift workload"
                                                        >
                                                            🚀 Smart Reassign
                                                        </button>
                                                        <button
                                                            onClick={() => updateRequestStatus(req._id, 'Rejected')}
                                                            className="btn btn-secondary"
                                                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: '#ef4444' }}
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontStyle: 'italic' }}>Processed</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No active requests found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AcademicsDashboard;
