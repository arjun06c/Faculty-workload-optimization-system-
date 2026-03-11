import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import CustomSelect from '../components/CustomSelect';

const AcademicsDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [view, setView] = useState('timetable'); // 'timetable' | 'requests' | 'queries' | 'scheduledDetails'
    const [drillDown, setDrillDown] = useState({ step: 'depts', deptId: null, facultyId: null });

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
    const [isEditingQuery, setIsEditingQuery] = useState(false);
    const [editingQueryData, setEditingQueryData] = useState(null);
    // Scheduled Details State
    const [officeFaculties, setOfficeFaculties] = useState([]);
    const [officeFullDetails, setOfficeFullDetails] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditingEntry, setIsEditingEntry] = useState(false);
    const [editingEntryData, setEditingEntryData] = useState(null);
    const [notification, setNotification] = useState(null); // { type: 'success'|'error'|'warning', msg: string }

    const showNotification = (type, msg) => {
        setNotification({ type, msg });
        setTimeout(() => setNotification(null), 5000);
    };

    useEffect(() => {
        fetchData();
    }, [view, drillDown.step, drillDown.deptId, drillDown.facultyId]);

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

        if (view === 'scheduledDetails') {
            if (drillDown.step === 'faculties' && drillDown.deptId) {
                try {
                    const res = await api.get(`/academics/office/scheduled/${drillDown.deptId}`);
                    setOfficeFaculties(res.data);
                } catch (err) { console.error('Fetching office faculties failed:', err); }
            } else if (drillDown.step === 'details' && drillDown.facultyId) {
                try {
                    const res = await api.get(`/academics/office/faculty/${drillDown.facultyId}`);
                    setOfficeFullDetails(res.data);
                } catch (err) { console.error('Fetching faculty full details failed:', err); }
            }
        }
    };


    const handleAddEntry = async (e) => {
        e.preventDefault();
        try {
            await api.post('/academics/timetable', newEntry);
            showNotification('success', 'Timetable entry added successfully!');
            setNewEntry({ ...newEntry, subject: '', period: '', roomNumber: '' });
            fetchData();
        } catch (err) {
            showNotification('error', err.response?.data?.msg || 'Error adding entry');
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

    const handleDeleteQuery = async (id) => {
        if (!window.confirm('Are you sure you want to delete this query?')) return;
        try {
            await api.delete(`/queries/${id}`);
            setQueries(queries.filter(q => q._id !== id));
            if (selectedQuery && selectedQuery._id === id) setSelectedQuery(null);
        } catch (err) {
            alert('Error deleting query');
        }
    };

    const handleEditQuerySubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/queries/${editingQueryData._id}`, {
                subject: editingQueryData.subject,
                priority: editingQueryData.priority,
                status: editingQueryData.status
            });
            const updatedQueries = await api.get('/queries');
            setQueries(updatedQueries.data);
            if (selectedQuery && selectedQuery._id === editingQueryData._id) {
                const updated = updatedQueries.data.find(q => q._id === editingQueryData._id);
                setSelectedQuery(updated || null);
            }
            setIsEditingQuery(false);
            setEditingQueryData(null);
        } catch (err) {
            alert('Error updating query');
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

    const handleDeleteEntry = async (id) => {
        if (!window.confirm('Are you sure you want to delete this schedule entry?')) return;
        try {
            await api.delete(`/academics/timetable/${id}`);
            showNotification('success', 'Schedule entry deleted successfully.');
            fetchData();
        } catch (err) {
            showNotification('error', err.response?.data?.msg || 'Error deleting entry');
        }
    };

    const handleEditEntrySubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/academics/timetable/${editingEntryData._id}`, editingEntryData);
            showNotification('success', 'Timetable entry updated successfully!');
            setIsEditingEntry(false);
            fetchData();
        } catch (err) {
            showNotification('error', err.response?.data?.msg || 'Error updating entry');
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
                <button
                    className={`btn ${view === 'scheduledDetails' ? '' : 'btn-secondary'}`}
                    onClick={() => { setView('scheduledDetails'); setDrillDown({ step: 'depts', deptId: null, facultyId: null }); }}
                    style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', flex: '1 0 auto' }}
                >
                    📊 Scheduled Faculty Details
                </button>
            </div>

            <div style={{ padding: '0 0.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>📌</span>
                    <h2 style={{ margin: 0, color: '#1e3a8a', fontSize: '1.4rem' }}>Scheduled Faculty</h2>
                </div>
                <div
                    className="card"
                    style={{
                        padding: '1.5rem 2rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        borderLeft: '5px solid #3b82f6',
                        background: view === 'scheduledDetails' ? '#eff6ff' : 'white'
                    }}
                    onClick={() => { setView('scheduledDetails'); setDrillDown({ step: 'depts', deptId: null, facultyId: null }); }}
                >
                    <div>
                        <h3 style={{ margin: 0, color: '#1e293b' }}>View Department-wise Schedules</h3>
                        <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                            Explore scheduled faculty across CSE, ECE, IT, and MECH departments.
                        </p>
                    </div>
                    <button className="btn btn-primary-gradient" style={{ borderRadius: '20px', padding: '0.5rem 1.5rem' }}>
                        Browse Details →
                    </button>
                </div>
            </div>

            {view === 'timetable' && (
                <div className="split-panel-layout">
                    <div className="card premium-form-card">
                        <div style={{ marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                            <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                ✨ Generate Timetable Entry
                            </h2>
                            <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                                Schedule a new class for a faculty member.
                            </p>
                        </div>

                        {/* Conflict / Validation Notification Banner */}
                        {notification && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.75rem',
                                padding: '0.9rem 1.1rem',
                                marginBottom: '1.25rem',
                                borderRadius: '10px',
                                border: `1px solid ${notification.type === 'success' ? '#86efac' : notification.type === 'warning' ? '#fde68a' : '#fca5a5'}`,
                                background: notification.type === 'success' ? '#f0fdf4' : notification.type === 'warning' ? '#fffbeb' : '#fff5f5',
                                color: notification.type === 'success' ? '#166534' : notification.type === 'warning' ? '#92400e' : '#991b1b',
                                animation: 'fadeInDown 0.3s ease',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                lineHeight: '1.4'
                            }}>
                                <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '0.05rem' }}>
                                    {notification.type === 'success' ? '✅' : notification.type === 'warning' ? '⚠️' : '🚫'}
                                </span>
                                <span style={{ flex: 1 }}>{notification.msg}</span>
                                <button
                                    type="button"
                                    onClick={() => setNotification(null)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'inherit', opacity: 0.6, fontSize: '1rem',
                                        padding: '0', lineHeight: 1, flexShrink: 0
                                    }}
                                >✕</button>
                            </div>
                        )}

                        <form onSubmit={handleAddEntry} className="form-grid">
                            {/* Date Input */}
                            <div className="input-group">
                                <label className="input-label">Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={newEntry.date}
                                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <CustomSelect
                                    label="Department"
                                    placeholder="Select Department"
                                    value={newEntry.department}
                                    onChange={(val) => setNewEntry({ ...newEntry, department: val })}
                                    options={departments.map(d => ({ value: d._id, label: d.name }))}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <CustomSelect
                                    label="Faculty"
                                    placeholder="Select Faculty"
                                    value={newEntry.facultyId}
                                    onChange={(val) => setNewEntry({ ...newEntry, facultyId: val, subject: '' })}
                                    disabled={!newEntry.department}
                                    options={facultyList
                                        .filter(f => f.department?._id === newEntry.department)
                                        .map(f => ({ 
                                            value: f._id, 
                                            label: f.name, 
                                            sub: `${f.designation} • ${f.currentHours}/${f.maxHours}h` 
                                        }))}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <CustomSelect
                                    label="Subject Name"
                                    placeholder={newEntry.facultyId ? "Select Subject" : "Select Faculty first"}
                                    value={newEntry.subject}
                                    onChange={(val) => setNewEntry({ ...newEntry, subject: val })}
                                    disabled={!newEntry.facultyId}
                                    options={facultyList.find(f => f._id === newEntry.facultyId)?.skills?.map(skill => ({
                                        value: skill,
                                        label: skill,
                                        sub: "Primary Subject Area"
                                    })) || []}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <CustomSelect
                                    label="Session Type"
                                    placeholder="Select Type"
                                    value={newEntry.type}
                                    onChange={(val) => setNewEntry({ ...newEntry, type: val })}
                                    options={[
                                        { value: 'Theory', label: 'Theory', sub: '1 hour session' },
                                        { value: 'Lab', label: 'Lab', sub: '1.5 hour session' }
                                    ]}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <CustomSelect
                                    label="Day"
                                    placeholder="Select Day"
                                    value={newEntry.day}
                                    onChange={(val) => setNewEntry({ ...newEntry, day: val })}
                                    options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => ({ value: d, label: d }))}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Period Slot</label>
                                <input type="number" className="input-field" placeholder="Period (1-8)" min="1" max="8" value={newEntry.period} onChange={(e) => setNewEntry({ ...newEntry, period: e.target.value })} required />
                            </div>

                            {/* [CHANGED] Class / Year is now a dropdown */}
                            <div className="input-group">
                                <CustomSelect
                                    label="Class / Year"
                                    placeholder="Select Year"
                                    value={newEntry.classYear}
                                    onChange={(val) => setNewEntry({ ...newEntry, classYear: val })}
                                    options={[
                                        { value: '1st Year', label: '1st Year', sub: 'Undergraduate' },
                                        { value: '2nd Year', label: '2nd Year', sub: 'Undergraduate' },
                                        { value: '3rd Year', label: '3rd Year', sub: 'Undergraduate' },
                                        { value: '4th Year', label: '4th Year', sub: 'Undergraduate' }
                                    ]}
                                    required
                                />
                            </div>

                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label className="input-label">Room No.</label>
                                <input className="input-field" placeholder="e.g. L-102" value={newEntry.roomNumber} onChange={(e) => setNewEntry({ ...newEntry, roomNumber: e.target.value })} required />
                            </div>

                            <button type="submit" className="btn btn-primary-gradient" style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
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
                                            onClick={() => navigate(`/academic/faculty/${f._id}`)}
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
                                <CustomSelect
                                    label="Department"
                                    placeholder="Select Department"
                                    value={editingRequest.department || ''}
                                    onChange={(val) => setEditingRequest({ ...editingRequest, department: val })}
                                    options={departments.map(d => ({ value: d._id, label: d.name }))}
                                    required
                                />
                                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="input-label">Reason</label>
                                    <input
                                        className="input-field"
                                        value={editingRequest.reason || ''}
                                        onChange={(e) => setEditingRequest({ ...editingRequest, reason: e.target.value })}
                                        required
                                    />
                                </div>
                                <CustomSelect
                                    label="Status"
                                    placeholder="Select Status"
                                    value={editingRequest.status}
                                    onChange={(val) => setEditingRequest({ ...editingRequest, status: val })}
                                    options={[
                                        { value: 'Pending', label: 'Pending', sub: 'Awaiting review' },
                                        { value: 'Approved', label: 'Approved', sub: 'Request accepted' },
                                        { value: 'Rejected', label: 'Rejected', sub: 'Request declined' },
                                        { value: 'Escalated', label: 'Escalated', sub: 'Requires higher review' },
                                        { value: 'Reassigned', label: 'Reassigned', sub: 'Shifted to another faculty' }
                                    ]}
                                    required
                                />
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
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <th style={{ padding: '0.75rem 1rem' }}>Faculty Member</th>
                                        <th style={{ padding: '0.75rem 1rem' }}>Department</th>
                                        <th style={{ padding: '0.75rem 1rem' }}>Reason for Request</th>
                                        <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '60px' }}>Edit</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '60px' }}>Delete</th>
                                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '130px' }}>Auto Assign</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map(req => {
                                        let badgeColor = '#94a3b8';
                                        let badgeBg = '#f1f5f9';
                                        if (req.status === 'Pending' || req.status === 'Escalated') { badgeColor = '#d97706'; badgeBg = '#fff7ed'; }
                                        else if (req.status === 'Approved' || req.status === 'Reassigned') { badgeColor = '#059669'; badgeBg = '#ecfdf5'; }
                                        else if (req.status === 'Rejected') { badgeColor = '#dc2626'; badgeBg = '#fef2f2'; }

                                        const canReassign = req.status === 'Pending' || req.status === 'Escalated';

                                        return (
                                            <tr key={req._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} className="table-row-hover">
                                                <td style={{ padding: '1rem', fontWeight: 'bold', color: '#334155' }}>{req.facultyId?.name}</td>
                                                <td style={{ padding: '1rem', color: '#64748b' }}>{req.department?.name}</td>
                                                <td style={{ padding: '1rem', color: '#64748b', maxWidth: '260px' }}>
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
                                                        background: badgeBg,
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {req.status}
                                                    </span>
                                                </td>

                                                {/* Edit Column */}
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => handleEditRequest(req)}
                                                        title="Edit Request"
                                                        style={{
                                                            width: '36px', height: '36px', borderRadius: '8px',
                                                            border: '1px solid #e2e8f0', background: '#f8fafc',
                                                            cursor: 'pointer', fontSize: '1rem',
                                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseOver={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                                                        onMouseOut={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                                    >
                                                        ✏️
                                                    </button>
                                                </td>

                                                {/* Delete Column */}
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => handleDeleteRequest(req._id)}
                                                        title="Delete Request"
                                                        style={{
                                                            width: '36px', height: '36px', borderRadius: '8px',
                                                            border: '1px solid #fecaca', background: '#fef2f2',
                                                            cursor: 'pointer', fontSize: '1rem',
                                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseOver={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#f87171'; }}
                                                        onMouseOut={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fecaca'; }}
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>

                                                {/* Auto Assign Column */}
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    {canReassign ? (
                                                        <button
                                                            onClick={() => handleSmartReassign(req._id)}
                                                            title="Smart reassign: finds available faculty in same dept with capacity"
                                                            style={{
                                                                padding: '0.4rem 0.85rem',
                                                                borderRadius: '8px',
                                                                border: 'none',
                                                                background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
                                                                color: 'white',
                                                                fontWeight: '600',
                                                                fontSize: '0.78rem',
                                                                cursor: 'pointer',
                                                                whiteSpace: 'nowrap',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.3rem',
                                                                transition: 'opacity 0.2s'
                                                            }}
                                                            onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
                                                            onMouseOut={e => e.currentTarget.style.opacity = '1'}
                                                        >
                                                            🚀 Auto Assign
                                                        </button>
                                                    ) : (
                                                        <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {requests.length === 0 && (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No active requests found</td>
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
                    {/* Left: Queries Table */}
                    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', fontWeight: '700' }}>💬 Faculty Queries</h2>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>{queries.length} total queries</p>
                        </div>
                        <div style={{ overflowY: 'auto', maxHeight: '75vh' }}>
                            {queries.length === 0 && (
                                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No queries found</div>
                            )}
                            {queries.map(q => (
                                <div
                                    key={q._id}
                                    onClick={() => setSelectedQuery(q)}
                                    style={{
                                        padding: '1rem 1.5rem',
                                        borderBottom: '1px solid #f1f5f9',
                                        cursor: 'pointer',
                                        background: selectedQuery?._id === q._id ? '#eff6ff' : 'white',
                                        borderLeft: selectedQuery?._id === q._id ? '4px solid #3b82f6' : '4px solid transparent',
                                        transition: 'background 0.15s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                        <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.9rem' }}>{q.facultyId?.name}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                                {new Date(q.createdAt).toLocaleDateString()}
                                            </span>
                                            {/* Edit Button */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditingQueryData({ ...q }); setIsEditingQuery(true); }}
                                                title="Edit Query"
                                                style={{
                                                    width: '26px', height: '26px', borderRadius: '6px',
                                                    border: '1px solid #e2e8f0', background: '#f8fafc',
                                                    cursor: 'pointer', fontSize: '0.75rem',
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >✏️</button>
                                            {/* Delete Button */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteQuery(q._id); }}
                                                title="Delete Query"
                                                style={{
                                                    width: '26px', height: '26px', borderRadius: '6px',
                                                    border: '1px solid #fecaca', background: '#fef2f2',
                                                    cursor: 'pointer', fontSize: '0.75rem',
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >🗑️</button>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '0.4rem', fontWeight: '500' }}>
                                        {q.subject}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <span style={{
                                            fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px',
                                            background: q.priority === 'High' ? '#fee2e2' : '#fefce8',
                                            color: q.priority === 'High' ? '#dc2626' : '#d97706',
                                            fontWeight: '600'
                                        }}>
                                            {q.priority}
                                        </span>
                                        <span style={{
                                            fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px',
                                            background: q.status === 'Resolved' ? '#dcfce7' : '#f1f5f9',
                                            color: q.status === 'Resolved' ? '#166534' : '#64748b',
                                            fontWeight: '600'
                                        }}>
                                            {q.status}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {/* Edit Query Modal */}
                            {isEditingQuery && editingQueryData && (
                                <div style={{
                                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                                }}
                                    onClick={() => { setIsEditingQuery(false); setEditingQueryData(null); }}
                                >
                                    <div
                                        style={{ background: 'white', borderRadius: '12px', padding: '2rem', width: '420px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <h3 style={{ margin: '0 0 1.5rem', color: '#1e293b', fontSize: '1.1rem' }}>✏️ Edit Query</h3>
                                        <form onSubmit={handleEditQuerySubmit}>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#475569', marginBottom: '0.4rem' }}>Subject</label>
                                                <input
                                                    className="input-field"
                                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                                    value={editingQueryData.subject}
                                                    onChange={e => setEditingQueryData({ ...editingQueryData, subject: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <CustomSelect
                                                    label="Priority"
                                                    placeholder="Select Priority"
                                                    value={editingQueryData.priority}
                                                    onChange={(val) => setEditingQueryData({ ...editingQueryData, priority: val })}
                                                    options={[
                                                        { value: 'Low', label: 'Low' },
                                                        { value: 'Medium', label: 'Medium' },
                                                        { value: 'High', label: 'High' }
                                                    ]}
                                                />
                                            </div>
                                            <div style={{ marginBottom: '1.5rem' }}>
                                                <CustomSelect
                                                    label="Status"
                                                    placeholder="Select Status"
                                                    value={editingQueryData.status}
                                                    onChange={(val) => setEditingQueryData({ ...editingQueryData, status: val })}
                                                    options={[
                                                        { value: 'Pending', label: 'Pending', sub: 'Waiting for action' },
                                                        { value: 'Resolved', label: 'Resolved', sub: 'Issue handled' }
                                                    ]}
                                                    required
                                                />
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                <button type="submit" style={{
                                                    flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none',
                                                    background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
                                                    color: 'white', fontWeight: '600', cursor: 'pointer'
                                                }}>Save Changes</button>
                                                <button type="button" onClick={() => { setIsEditingQuery(false); setEditingQueryData(null); }} style={{
                                                    flex: 1, padding: '0.6rem', borderRadius: '8px',
                                                    border: '1px solid #e2e8f0', background: '#f8fafc',
                                                    color: '#475569', fontWeight: '600', cursor: 'pointer'
                                                }}>Cancel</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Query Detail Form */}
                    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                        {selectedQuery ? (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                {/* Header */}
                                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h3 style={{ margin: '0 0 0.4rem', color: '#0f172a', fontSize: '1.05rem' }}>{selectedQuery.subject}</h3>
                                            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                                                From: <strong>{selectedQuery.facultyId?.name}</strong>
                                                {selectedQuery.facultyId?.department?.name && ` • ${selectedQuery.facultyId.department.name}`}
                                            </p>
                                        </div>
                                        {selectedQuery.status !== 'Resolved' && (
                                            <button
                                                onClick={() => handleResolveQuery(selectedQuery._id)}
                                                style={{
                                                    padding: '0.45rem 1rem', borderRadius: '8px', border: 'none',
                                                    background: '#dcfce7', color: '#166534', fontWeight: '600',
                                                    fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap'
                                                }}
                                            >
                                                ✅ Mark Resolved
                                            </button>
                                        )}
                                    </div>
                                    {/* Meta info row */}
                                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                            📅 <strong>Date:</strong> {new Date(selectedQuery.createdAt).toLocaleDateString()}
                                        </span>
                                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                            🔔 <strong>Priority:</strong> {selectedQuery.priority}
                                        </span>
                                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                            📌 <strong>Status:</strong> {selectedQuery.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Messages List */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: 'white' }}>
                                    <h4 style={{ margin: '0 0 1rem', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Conversation ({selectedQuery.messages?.length || 0} messages)
                                    </h4>
                                    {selectedQuery.messages && selectedQuery.messages.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {selectedQuery.messages.map((msg, idx) => (
                                                <div key={idx} style={{
                                                    padding: '0.85rem 1rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid #e2e8f0',
                                                    background: msg.sender === 'academic' ? '#eff6ff' : '#f8fafc',
                                                    borderLeft: `3px solid ${msg.sender === 'academic' ? '#3b82f6' : '#94a3b8'}`
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                                        <span style={{
                                                            fontSize: '0.75rem', fontWeight: '700',
                                                            color: msg.sender === 'academic' ? '#1e40af' : '#475569',
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            {msg.sender === 'academic' ? '🏛️ Academics Office' : '👤 Faculty'}
                                                        </span>
                                                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                                            {new Date(msg.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                        </span>
                                                    </div>
                                                    <p style={{ margin: 0, color: '#334155', fontSize: '0.9rem', lineHeight: '1.5' }}>{msg.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #e2e8f0' }}>
                                            No messages yet
                                        </div>
                                    )}
                                </div>

                                {/* Reply Form */}
                                {selectedQuery.status !== 'Resolved' && (
                                    <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                        <form onSubmit={handleReply}>
                                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>
                                                Reply to Faculty
                                            </label>
                                            <textarea
                                                className="input-field"
                                                rows={3}
                                                style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                                                placeholder="Type your response here..."
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                required
                                            />
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                                                <button type="submit" style={{
                                                    padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none',
                                                    background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
                                                    color: 'white', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer'
                                                }}>
                                                    Send Reply →
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', color: '#94a3b8' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                                <p style={{ margin: 0, fontWeight: '500' }}>Select a query to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {view === 'scheduledDetails' && (
                <div style={{ padding: '1rem', minHeight: '600px' }}>

                    {/* Breadcrumbs / Back Navigation */}
                    <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <button
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                            onClick={() => {
                                if (drillDown.step === 'details') setDrillDown({ ...drillDown, step: 'faculties', facultyId: null });
                                else if (drillDown.step === 'faculties') setDrillDown({ ...drillDown, step: 'depts', deptId: null });
                            }}
                            disabled={drillDown.step === 'depts'}
                        >
                            ← Back
                        </button>
                        <nav style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>
                            <span style={{ cursor: 'pointer' }} onClick={() => setDrillDown({ step: 'depts', deptId: null, facultyId: null })}>Departments</span>
                            {drillDown.deptId && (
                                <>
                                    <span style={{ margin: '0 0.5rem' }}>/</span>
                                    <span style={{ cursor: 'pointer' }} onClick={() => setDrillDown({ ...drillDown, step: 'faculties', facultyId: null })}>
                                        {departments.find(d => d._id === drillDown.deptId)?.name || 'Faculty'}
                                    </span>
                                </>
                            )}
                            {drillDown.facultyId && (
                                <>
                                    <span style={{ margin: '0 0.5rem' }}>/</span>
                                    <span style={{ color: '#1e3a8a' }}>{officeFullDetails?.profile?.name || 'Details'}</span>
                                </>
                            )}
                        </nav>
                    </div>

                    {/* Step 1: Departments Selection */}
                    {drillDown.step === 'depts' && (
                        <div>
                            <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>Select Department</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                {departments.map(dept => (
                                    <div
                                        key={dept._id}
                                        className="card"
                                        style={{
                                            padding: '2rem',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            borderTop: '5px solid #3b82f6'
                                        }}
                                        onClick={() => setDrillDown({ step: 'faculties', deptId: dept._id, facultyId: null })}
                                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏢</div>
                                        <h3 style={{ margin: 0, color: '#1e3a8a' }}>{dept.name}</h3>
                                        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Click to view scheduled faculty</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Faculty List in Department */}
                    {drillDown.step === 'faculties' && (
                        <div className="card" style={{ padding: '2rem' }}>
                            <div className="flex-between-center" style={{ marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0, color: '#1e293b' }}>
                                    {departments.find(d => d._id === drillDown.deptId)?.name} Faculty Workload
                                </h2>
                                    <input
                                        className="input-field"
                                        style={{ width: '100%', maxWidth: '300px' }}
                                        placeholder="Search faculty..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="table-container">
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#f8fafc' }}>
                                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                                            <th style={{ padding: '1rem' }}>Faculty Name</th>
                                            <th style={{ padding: '1rem' }}>Designation</th>
                                            <th style={{ padding: '1rem' }}>Total Hours</th>
                                            <th style={{ padding: '1rem' }}>Status</th>
                                            <th style={{ padding: '1rem', textAlign: 'center' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {officeFaculties.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).map(f => {
                                            const workloadPercentage = (f.currentHours / f.maxHours) * 100;
                                            let status = 'Balanced';
                                            let color = '#059669';
                                            let bg = '#ecfdf5';

                                            if (workloadPercentage >= 100) {
                                                status = 'Overloaded';
                                                color = '#dc2626';
                                                bg = '#fef2f2';
                                            } else if (workloadPercentage >= 80) {
                                                status = 'Near Limit';
                                                color = '#d97706';
                                                bg = '#fff7ed';
                                            }

                                            return (
                                                <tr key={f._id} className="table-row-hover" style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '1rem', fontWeight: '600' }}>{f.name}</td>
                                                    <td style={{ padding: '1rem', color: '#64748b' }}>{f.designation}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{ fontWeight: 'bold' }}>{f.currentHours}</span> / {f.maxHours}h
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600',
                                                            background: bg, color: color
                                                        }}>{status}</span>
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                        <button
                                                            className="btn btn-secondary"
                                                            onClick={() => setDrillDown({ ...drillDown, step: 'details', facultyId: f._id })}
                                                        >View Full Schedule</button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Full Faculty Details */}
                    {drillDown.step === 'details' && officeFullDetails && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {/* Profile Section */}
                            <div className="card" style={{ padding: '2rem', borderLeft: '6px solid var(--primary)' }}>
                                <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                    <div style={{
                                        width: '100px', height: '100px', borderRadius: '50%', background: '#eff6ff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: '#3b82f6'
                                    }}>
                                        {officeFullDetails.profile.name.charAt(0)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h2 style={{ margin: 0, color: '#1e3a8a' }}>{officeFullDetails.profile.name}</h2>
                                            <span style={{
                                                padding: '0.4rem 1rem', background: '#ecfdf5', color: '#059669', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold'
                                            }}>Scheduled Profile</span>
                                        </div>
                                        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Department</label>
                                                <div style={{ fontWeight: '600', color: '#334155' }}>{officeFullDetails.profile.department?.name}</div>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Designation</label>
                                                <div style={{ fontWeight: '600', color: '#334155' }}>{officeFullDetails.profile.designation}</div>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Email</label>
                                                <div style={{ fontWeight: '600', color: '#334155' }}>{officeFullDetails.profile.userId?.email}</div>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Employment</label>
                                                <div style={{ fontWeight: '600', color: '#334155' }}>Full-Time</div>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', display: 'flex', gap: '2rem' }}>
                                            <div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Current Workload</div>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>{officeFullDetails.profile.currentHours} / {officeFullDetails.profile.maxHours}h</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Remaining Hours</div>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                                                    {Math.max(0, officeFullDetails.profile.maxHours - officeFullDetails.profile.currentHours)}h
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Schedule Table Section */}
                            <div className="card" style={{ padding: '2rem' }}>
                                <h3 style={{ marginBottom: '1.5rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    📅 Faculty Schedule Table
                                </h3>
                                <div className="table-container">
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead style={{ background: '#f8fafc' }}>
                                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                                                <th style={{ padding: '1rem' }}>Date</th>
                                                <th style={{ padding: '1rem' }}>Day</th>
                                                <th style={{ padding: '1rem' }}>Period</th>
                                                <th style={{ padding: '1rem' }}>Subject</th>
                                                <th style={{ padding: '1rem' }}>Class / Year</th>
                                                <th style={{ padding: '1rem' }}>Session</th>
                                                <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {officeFullDetails.timetable.length > 0 ? officeFullDetails.timetable.map(slot => (
                                                <tr key={slot._id} className="table-row-hover" style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '1rem', color: '#334155' }}>{new Date(slot.date).toLocaleDateString('en-GB')}</td>
                                                    <td style={{ padding: '1rem', color: '#334155' }}>{slot.day}</td>
                                                    <td style={{ padding: '1rem', fontWeight: 'bold', color: '#1e3a8a' }}>{slot.period}</td>
                                                    <td style={{ padding: '1rem', fontWeight: '500' }}>{slot.subject}</td>
                                                    <td style={{ padding: '1rem', color: '#64748b' }}>{slot.classYear}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600',
                                                            background: slot.type === 'Lab' ? '#fef3c7' : '#e0e7ff',
                                                            color: slot.type === 'Lab' ? '#92400e' : '#3730a3'
                                                        }}>{slot.type}</span>
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                            <button
                                                                className="btn btn-secondary"
                                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                                                onClick={() => {
                                                                    setEditingEntryData({
                                                                        _id: slot._id,
                                                                        facultyId: slot.facultyId._id || slot.facultyId,
                                                                        subject: slot.subject,
                                                                        day: slot.day,
                                                                        period: slot.period,
                                                                        classYear: slot.classYear,
                                                                        roomNumber: slot.roomNumber,
                                                                        type: slot.type,
                                                                        date: new Date(slot.date).toISOString().split('T')[0]
                                                                    });
                                                                    setIsEditingEntry(true);
                                                                }}
                                                            >✏️</button>
                                                            <button
                                                                className="btn btn-secondary"
                                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: '#dc2626' }}
                                                                onClick={() => handleDeleteEntry(slot._id)}
                                                            >❌</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No scheduled classes found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {/* Edit Entry Modal */}
            {isEditingEntry && editingEntryData && (
                <div className="modal-overlay">
                    <div className="card modal-content">
                        <h2 style={{ marginBottom: '1.5rem', color: '#1e3a8a' }}>✏️ Edit Timetable Entry</h2>
                        {/* Conflict / Validation Notification Banner (Edit Modal) */}
                        {notification && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.75rem',
                                padding: '0.85rem 1rem',
                                marginBottom: '1.25rem',
                                borderRadius: '10px',
                                border: `1px solid ${notification.type === 'success' ? '#86efac' : '#fca5a5'}`,
                                background: notification.type === 'success' ? '#f0fdf4' : '#fff5f5',
                                color: notification.type === 'success' ? '#166534' : '#991b1b',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                lineHeight: '1.4'
                            }}>
                                <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                                    {notification.type === 'success' ? '✅' : '🚫'}
                                </span>
                                <span style={{ flex: 1 }}>{notification.msg}</span>
                                <button type="button" onClick={() => setNotification(null)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6, fontSize: '0.9rem', padding: 0 }}>✕</button>
                            </div>
                        )}
                        <form onSubmit={handleEditEntrySubmit} className="form-grid">
                            <div className="form-group">
                                <CustomSelect
                                    label="Faculty Member"
                                    placeholder="Select Faculty"
                                    value={editingEntryData.facultyId}
                                    onChange={(val) => setEditingEntryData({ ...editingEntryData, facultyId: val })}
                                    options={facultyList.map(f => ({ 
                                        value: f._id, 
                                        label: f.name,
                                        sub: f.designation 
                                    }))}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={editingEntryData.date}
                                    onChange={(e) => setEditingEntryData({ ...editingEntryData, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <CustomSelect
                                    label="Period (1-8)"
                                    placeholder="Select Period"
                                    value={editingEntryData.period}
                                    onChange={(val) => setEditingEntryData({ ...editingEntryData, period: val })}
                                    options={[1, 2, 3, 4, 5, 6, 7, 8].map(p => ({ value: p, label: `Period ${p}` }))}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <CustomSelect
                                    label="Day"
                                    placeholder="Select Day"
                                    value={editingEntryData.day}
                                    onChange={(val) => setEditingEntryData({ ...editingEntryData, day: val })}
                                    options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => ({ value: d, label: d }))}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Subject</label>
                                <input
                                    className="input-field"
                                    value={editingEntryData.subject}
                                    onChange={(e) => setEditingEntryData({ ...editingEntryData, subject: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Room Number</label>
                                <input
                                    className="input-field"
                                    value={editingEntryData.roomNumber}
                                    onChange={(e) => setEditingEntryData({ ...editingEntryData, roomNumber: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <CustomSelect
                                    label="Type"
                                    placeholder="Select Type"
                                    value={editingEntryData.type}
                                    onChange={(val) => setEditingEntryData({ ...editingEntryData, type: val })}
                                    options={[
                                        { value: 'Theory', label: 'Theory', sub: '1 hour' },
                                        { value: 'Lab', label: 'Lab', sub: '1.5 hours' }
                                    ]}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <CustomSelect
                                    label="Class / Year"
                                    placeholder="Select Year"
                                    value={editingEntryData.classYear}
                                    onChange={(val) => setEditingEntryData({ ...editingEntryData, classYear: val })}
                                    options={[
                                        { value: '1st Year', label: '1st Year', sub: 'UG' },
                                        { value: '2nd Year', label: '2nd Year', sub: 'UG' },
                                        { value: '3rd Year', label: '3rd Year', sub: 'UG' },
                                        { value: '4th Year', label: '4th Year', sub: 'UG' }
                                    ]}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', gridColumn: 'span 2' }}>
                                <button type="submit" className="btn btn-primary-gradient" style={{ flex: 1 }}>Save Changes</button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ flex: 1 }}
                                    onClick={() => setIsEditingEntry(false)}
                                >Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};



export default AcademicsDashboard;
