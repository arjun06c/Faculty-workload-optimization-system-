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
        department: '', facultyId: '', subject: '', day: '', period: '', classYear: '', roomNumber: '', type: 'Theory',
        date: new Date().toISOString().split('T')[0]
    });

    // Workload Requests State
    const [requests, setRequests] = useState([]);
    const [timetable, setTimetable] = useState([]);
    const [isEditingRequest, setIsEditingRequest] = useState(false);
    const [editingRequest, setEditingRequest] = useState(null);

    // Queries State
    const [queries, setQueries] = useState([]);
    const [selectedQuery, setSelectedQuery] = useState(null);
    const [replyText, setReplyText] = useState('');

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

        if (view === 'queries') {
            try {
                const queriesRes = await api.get('/queries');
                setQueries(queriesRes.data);
            } catch (err) {
                console.error('Fetching queries failed:', err);
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

    // Query Handlers
    const handleValueResize = (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    };

    const handleReply = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/queries/${selectedQuery._id}/reply`, {
                text: replyText,
                sender: 'academic'
            });
            setReplyText('');
            // Refresh Selected Query
            const updatedQueries = await api.get('/queries');
            setQueries(updatedQueries.data);
            const updatedSelected = updatedQueries.data.find(q => q._id === selectedQuery._id);
            setSelectedQuery(updatedSelected);
        } catch (err) {
            alert('Error sending reply');
        }
    };

    const handleResolveQuery = async (id) => {
        try {
            await api.put(`/queries/${id}/status`, { status: 'Resolved' });
            fetchData();
            if (selectedQuery && selectedQuery._id === id) {
                setSelectedQuery(prev => ({ ...prev, status: 'Resolved' }));
            }
        } catch (err) {
            alert('Error resolving query');
        }
    };

    // New Handlers for Edit/Delete
    const handleDeleteRequest = async (id) => {
        if (!window.confirm('Are you sure you want to delete this request?')) return;
        try {
            await api.delete(`/academics/workload-requests/${id}`);
            setRequests(requests.filter(r => r._id !== id));
            alert('Request deleted');
        } catch (err) {
            alert('Error deleting request');
        }
    };

    const handleEditRequest = (req) => {
        setEditingRequest({ ...req, department: req.department?._id });
        setIsEditingRequest(true);
        // Scroll to edit form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleUpdateRequest = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/academics/workload-requests/${editingRequest._id}`, {
                reason: editingRequest.reason,
                status: editingRequest.status,
                department: editingRequest.department
            });
            alert('Request updated successfully');
            setIsEditingRequest(false);
            setEditingRequest(null);
            fetchData();
        } catch (err) {
            alert('Error updating request');
        }
    };


    return (
        <div className="page-container" style={{ background: '#f8fafc', minHeight: '100vh' }}>
            <header className="card flex-between-center" style={{ marginBottom: '2rem', padding: '1.5rem 2rem', borderLeft: '5px solid var(--accent)' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#1e3a8a', fontSize: '1.8rem' }}>Academics & Timetable Office</h1>
                    <p style={{ margin: 0, color: '#64748b' }}>University Schedule & Workload Administration</p>
                </div>
                <button onClick={logout} className="btn btn-secondary">Logout</button>
            </header>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <button
                    className={`btn ${view === 'timetable' ? '' : 'btn-secondary'}`}
                    onClick={() => setView('timetable')}
                    style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', flex: '1 0 auto' }}
                >
                    🗓️ Timetable Generation
                </button>
                <button
                    className={`btn ${view === 'requests' ? '' : 'btn-secondary'}`}
                    onClick={() => setView('requests')}
                    style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', flex: '1 0 auto' }}
                >
                    📨 Workload Requests
                </button>
                <button
                    className={`btn ${view === 'queries' ? '' : 'btn-secondary'}`}
                    onClick={() => setView('queries')}
                    style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', flex: '1 0 auto' }}
                >
                    💬 Faculty Queries
                </button>
            </div>

            {view === 'timetable' && (
                <div className="split-panel-layout">
                    <div className="card" style={{ padding: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>Generate Timetable Entry</h2>
                        <form onSubmit={handleAddEntry} className="form-grid">
                            {/* Date Input */}
                            <div className="input-group" style={{ gridColumn: 'span 1' }}>
                                <label className="input-label">Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={newEntry.date}
                                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                                    required
                                />
                            </div>
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
                            <button type="submit" className="btn btn-block" style={{ gridColumn: '1 / -1', marginTop: '1rem', padding: '1rem', fontSize: '1rem', background: 'linear-gradient(to right, #2563eb, #1d4ed8)' }}>
                                ✨ Add to Schedule
                            </button>
                        </form>
                    </div>

                    <div className="card sticky-panel" style={{ padding: '2rem' }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Edit Form - Only visible when editing */}
                    {isEditingRequest && editingRequest && (
                        <div className="card" style={{ padding: '2rem', border: '2px solid #3b82f6' }}>
                            <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>📝 Edit Request</h2>
                            <form onSubmit={handleUpdateRequest} className="form-grid">
                                <div className="input-group">
                                    <label className="input-label">Faculty Member</label>
                                    <input className="input-field" value={editingRequest.facultyId?.name || ''} disabled style={{ background: '#f1f5f9' }} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Department</label>
                                    <select
                                        className="input-field"
                                        value={editingRequest.department || ''}
                                        onChange={(e) => setEditingRequest({ ...editingRequest, department: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="input-label">Reason</label>
                                    <input
                                        className="input-field"
                                        value={editingRequest.reason || ''}
                                        onChange={(e) => setEditingRequest({ ...editingRequest, reason: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Status</label>
                                    <select
                                        className="input-field"
                                        value={editingRequest.status}
                                        onChange={(e) => setEditingRequest({ ...editingRequest, status: e.target.value })}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Rejected">Rejected</option>
                                        <option value="Escalated">Escalated</option>
                                        <option value="Reassigned">Reassigned</option>
                                    </select>
                                </div>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="submit" className="btn" style={{ flex: 1 }}>Update Request</button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => { setIsEditingRequest(false); setEditingRequest(null); }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="card" style={{ padding: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>Manage Workload Overload Requests</h2>
                        <div className="table-container">
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
                                                <td style={{ padding: '1rem', color: '#64748b', maxWidth: '300px' }}>
                                                    {req.reason}
                                                    <div style={{ fontSize: '0.75rem', marginTop: '4px', color: '#94a3b8' }}>
                                                        {req.date ? new Date(req.date).toLocaleDateString() : ''}
                                                        {req.type === 'FULL_DAY'
                                                            ? ' • Full Day'
                                                            : (req.periods && req.periods.length > 0 ? ` • P${req.periods.join(', ')}` : '')
                                                        }
                                                    </div>
                                                    {req.decisionLog && (
                                                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#3b82f6' }}>
                                                            Log: {req.decisionLog}
                                                        </div>
                                                    )}
                                                </td>
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
                                                        <button
                                                            onClick={() => handleEditRequest(req)}
                                                            className="btn btn-secondary"
                                                            style={{ padding: '0.4rem', color: '#475569' }}
                                                            title="Edit Request"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteRequest(req._id)}
                                                            className="btn btn-secondary"
                                                            style={{ padding: '0.4rem', color: '#dc2626', background: '#fee2e2', border: 'none' }}
                                                            title="Delete Request"
                                                        >
                                                            🗑️
                                                        </button>

                                                        {(req.status === 'Pending' || req.status === 'Escalated') && (
                                                            <button
                                                                onClick={() => handleSmartReassign(req._id)}
                                                                className="btn"
                                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                                                title="Find replacement and shift workload"
                                                            >
                                                                🚀 Auto Assign
                                                            </button>
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
                    </div>
                </div>
            )}

            {view === 'queries' && (
                <div className="split-panel-layout">
                    {/* List of Queries */}
                    <div className="card" style={{ padding: '0', overflow: 'hidden', height: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>💬 Faculty Queries</h2>
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {queries.map(q => (
                                <div
                                    key={q._id}
                                    onClick={() => setSelectedQuery(q)}
                                    style={{
                                        padding: '1rem 1.5rem',
                                        borderBottom: '1px solid #f1f5f9',
                                        cursor: 'pointer',
                                        background: selectedQuery?._id === q._id ? '#f0f9ff' : 'white',
                                        borderLeft: selectedQuery?._id === q._id ? '4px solid #3b82f6' : '4px solid transparent'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifySelf: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: '600', color: '#334155' }}>{q.facultyId?.name}</span>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: 'auto' }}>
                                            {new Date(q.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>
                                        {q.subject}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <span style={{
                                            fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px',
                                            background: q.priority === 'High' ? '#fee2e2' : '#fefce8',
                                            color: q.priority === 'High' ? '#dc2626' : '#d97706'
                                        }}>
                                            {q.priority}
                                        </span>
                                        <span style={{
                                            fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px',
                                            background: q.status === 'Resolved' ? '#dcfce7' : '#f1f5f9',
                                            color: q.status === 'Resolved' ? '#166534' : '#64748b'
                                        }}>
                                            {q.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="card" style={{ padding: '0', overflow: 'hidden', height: '80vh', display: 'flex', flexDirection: 'column' }}>
                        {selectedQuery ? (
                            <>
                                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{selectedQuery.subject}</h3>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                                            From: <strong>{selectedQuery.facultyId?.name}</strong> • {selectedQuery.facultyId?.department?.name}
                                        </p>
                                    </div>
                                    {selectedQuery.status !== 'Resolved' && (
                                        <button onClick={() => handleResolveQuery(selectedQuery._id)} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                                            ✅ Mark Resolved
                                        </button>
                                    )}
                                </div>
                                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'white' }}>
                                    {selectedQuery.messages.map((msg, idx) => (
                                        <div key={idx} style={{
                                            maxWidth: '80%',
                                            alignSelf: msg.sender === 'academic' ? 'flex-end' : 'flex-start',
                                        }}>
                                            <div style={{
                                                padding: '0.75rem 1rem',
                                                borderRadius: '12px',
                                                background: msg.sender === 'academic' ? '#eff6ff' : '#f1f5f9',
                                                color: msg.sender === 'academic' ? '#1e3a8a' : '#334155',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                borderBottomRightRadius: msg.sender === 'academic' ? '4px' : '12px',
                                                borderBottomLeftRadius: msg.sender === 'academic' ? '12px' : '4px',
                                            }}>
                                                {msg.text}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem', textAlign: msg.sender === 'academic' ? 'right' : 'left' }}>
                                                {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', background: 'white' }}>
                                    <form onSubmit={handleReply} style={{ display: 'flex', gap: '1rem' }}>
                                        <input
                                            className="input-field"
                                            style={{ flex: 1 }}
                                            placeholder="Type a reply..."
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            required
                                        />
                                        <button type="submit" className="btn">Send ➡️</button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                                <p>Select a query to view conversation</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademicsDashboard;
