import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const FacultyDashboard = () => {
    const { logout } = useAuth();
    const [facultyProfile, setFacultyProfile] = useState(null);
    const [timetable, setTimetable] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD

    // Feature States
    const [newRequest, setNewRequest] = useState({ type: 'query' }); // type: 'query' | 'workload'
    const [queries, setQueries] = useState([]);
    const [requests, setRequests] = useState([]);
    const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'weekly'

    // Forms
    const [queryForm, setQueryForm] = useState({ subject: '', priority: 'Medium', message: '' });
    const [workloadForm, setWorkloadForm] = useState({
        date: new Date().toISOString().split('T')[0],
        period: '',
        reason: '',
        type: 'SINGLE', // 'SINGLE' | 'FULL_DAY'
        periods: []
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchFacultyData();
    }, [selectedDate, viewMode]);

    const fetchFacultyData = async () => {
        try {
            setLoading(true);
            setError('');
            const profileRes = await api.get('/faculty/me');
            setFacultyProfile(profileRes.data);

            const timetableUrl = viewMode === 'daily'
                ? `/faculty/timetable?date=${selectedDate}`
                : `/faculty/timetable`; // Fetch all for weekly
            const timetableRes = await api.get(timetableUrl);
            setTimetable(timetableRes.data);

            const requestsRes = await api.get('/faculty/workload-requests');
            setRequests(requestsRes.data);

            const queriesRes = await api.get('/queries'); // New: Fetch Queries
            setQueries(queriesRes.data);

            setLoading(false);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.msg || 'Failed to load faculty data.');
            setLoading(false);
        }
    };

    const handleQuerySubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/queries', { ...queryForm, facultyId: facultyProfile._id });
            setQueryForm({ subject: '', priority: 'Medium', message: '' });
            alert('Query submitted!');
            fetchFacultyData();
        } catch (err) {
            alert('Error submitting query');
        }
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        try {
            // Validate
            if (!workloadForm.date || !workloadForm.reason) {
                alert('Please fill Date and Reason');
                return;
            }
            if (workloadForm.type === 'SINGLE' && !workloadForm.period) {
                alert('Please select a period for single leave');
                return;
            }

            const payload = {
                date: workloadForm.date,
                reason: workloadForm.reason,
                type: workloadForm.type,
                periods: workloadForm.type === 'FULL_DAY'
                    ? [1, 2, 3, 4, 5, 6, 7, 8] // Assume all periods for now
                    : [parseInt(workloadForm.period)]
            };

            await api.post('/faculty/workload-request', payload);
            setWorkloadForm({
                date: new Date().toISOString().split('T')[0],
                period: '',
                reason: '',
                type: 'SINGLE',
                periods: []
            });
            alert('Workload request submitted!');
            fetchFacultyData();
        } catch (err) {
            alert('Error submitting request');
        }
    };

    // Helper: Safely format date to YYYY-MM-DD string regardless of local timezone
    const toISODate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    };

    // Helper: Get dates for the current week (Mon-Fri) based on selectedDate
    const getWeekDates = () => {
        const current = new Date(selectedDate);
        const day = current.getDay(); // 0=Sun, 1=Mon...
        const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday

        const monday = new Date(current.setDate(diff));
        const weekDates = {};

        const daysArr = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        daysArr.forEach((d, index) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + index);
            weekDates[d] = date.toISOString().split('T')[0];
        });
        return weekDates;
    };

    // Definitions must come before calls
    const weekDates = getWeekDates();

    const getSlotForDayPeriod = (day, period) => {
        const targetDate = weekDates[day];
        if (!timetable) return null;

        return timetable.find(slot => {
            const slotDate = toISODate(slot.date);
            // Use Number() to ensure type-safe comparison for period (string vs number)
            return slot.day === day && Number(slot.period) === Number(period) && slotDate === targetDate;
        });
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

    return (
        <div className="page-container" style={{ background: '#f8fafc', minHeight: '100vh', padding: '2rem 1rem' }}>
            {/* Professional Profile Header */}
            {/* Professional Profile Header */}
            <div className="card faculty-profile-card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div className="faculty-profile-content" style={{ position: 'relative', zIndex: 1 }}>
                    <div className="faculty-profile-avatar animate-pulse-soft" style={{
                        background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                        border: '4px solid #f8fafc',
                        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
                    }}>
                        {facultyProfile?.name?.charAt(0) || 'F'}
                    </div>
                    <div>
                        <h1 className="faculty-profile-heading" style={{ color: '#0f172a' }}>
                            Welcome, {facultyProfile?.name}
                        </h1>
                        <div className="faculty-profile-details" style={{ marginTop: '0.75rem', gap: '1.5rem', color: '#64748b' }}>
                            <span style={{ fontSize: '1rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>💼</span> {facultyProfile?.designation || 'Faculty Member'}
                            </span>
                            <span style={{ fontSize: '1rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>🏢</span> {facultyProfile?.department?.name || 'Department'}
                            </span>
                            <span style={{ fontSize: '1rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>📧</span> {facultyProfile?.email}
                            </span>
                        </div>
                    </div>
                </div>
                <button onClick={logout} className="btn btn-secondary faculty-signout-btn" style={{
                    whiteSpace: 'nowrap',
                    fontWeight: '600',
                    zIndex: 2
                }}>Sign Out</button>
            </div>

            <div className="split-panel-layout">
                {/* Column 1: Workload & Timetable */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Workload Status Card */}
                    <div className="card" style={{ padding: '2rem', background: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Current Workload</h2>
                            <span style={{
                                padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600',
                                background: workloadPercentage >= 100 ? '#fef2f2' : (workloadPercentage >= 80 ? '#fffbeb' : '#ecfdf5'),
                                color: workloadPercentage >= 100 ? '#dc2626' : (workloadPercentage >= 80 ? '#d97706' : '#059669'),
                                border: '1px solid currentColor'
                            }}>
                                {workloadPercentage >= 100 ? '⚠️ Overloaded' : (workloadPercentage >= 80 ? '⚡ Heavy' : '✅ Optimized')}
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1e293b', lineHeight: 1 }}>
                                {facultyProfile.currentHours}
                            </span>
                            <span style={{ fontSize: '1rem', color: '#64748b', marginBottom: '0.4rem' }}>
                                / {facultyProfile.maxHours} weekly hours
                            </span>
                        </div>

                        <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden', marginBottom: '1.25rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                            <div style={{
                                width: `${Math.min(workloadPercentage, 100)}%`,
                                height: '100%',
                                background: workloadPercentage >= 100
                                    ? 'linear-gradient(90deg, #ef4444, #b91c1c)'
                                    : (workloadPercentage >= 80 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #10b981, #059669)'),
                                borderRadius: '6px',
                                transition: 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                            }}></div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                            <span>0%</span>
                            <span style={{ fontWeight: '600', color: workloadPercentage >= 100 ? '#dc2626' : '#64748b' }}>
                                {workloadPercentage >= 100 ? 'Limit Exceeded' : (workloadPercentage >= 80 ? 'Approaching Limit' : 'Optimal Workload')}
                            </span>
                            <span>100%</span>
                        </div>
                    </div>

                    {/* Timetable Grid with Toggle */}
                    <div className="card" style={{ padding: '2rem', flex: 1 }}>
                        <div className="flex-between-center" style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>📅 My Schedule</h2>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <div style={{ background: '#f1f5f9', padding: '0.25rem', borderRadius: '8px', display: 'flex', gap: '0.25rem', marginRight: '1rem' }}>
                                    <button
                                        onClick={() => setViewMode('daily')}
                                        style={{
                                            padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600',
                                            background: viewMode === 'daily' ? 'white' : 'transparent',
                                            color: viewMode === 'daily' ? '#3b82f6' : '#64748b',
                                            boxShadow: viewMode === 'daily' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                        }}
                                    >Daily</button>
                                    <button
                                        onClick={() => setViewMode('weekly')}
                                        style={{
                                            padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600',
                                            background: viewMode === 'weekly' ? 'white' : 'transparent',
                                            color: viewMode === 'weekly' ? '#3b82f6' : '#64748b',
                                            boxShadow: viewMode === 'weekly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                        }}
                                    >Weekly</button>
                                </div>
                                <input
                                    type="date"
                                    className="input-field"
                                    style={{ width: 'auto', padding: '0.4rem' }}
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {viewMode === 'daily' ? (
                            <div className="table-container">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {timetable.length > 0 ? timetable.map(session => (
                                        <div key={session._id} className="ticket-card" style={{
                                            borderLeftColor: session.type === 'Lab' ? '#0ea5e9' : '#eab308'
                                        }}>
                                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '50px', height: '50px', borderRadius: '12px',
                                                    background: session.type === 'Lab' ? '#e0f2fe' : '#fef9c3',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '1.25rem', fontWeight: '800', color: session.type === 'Lab' ? '#0369a1' : '#a16207'
                                                }}>
                                                    {session.period}
                                                </div>
                                                <div>
                                                    <div className="ticket-period">Period {session.period}</div>
                                                    <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '1.15rem', marginBottom: '0.2rem' }}>
                                                        {session.subject}
                                                    </div>
                                                    <div style={{ color: '#64748b', fontSize: '0.9rem', display: 'flex', gap: '0.75rem' }}>
                                                        <span>📍 Room {session.roomNumber}</span>
                                                        <span>👥 {session.classYear}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{
                                                    padding: '0.35rem 0.85rem',
                                                    background: session.type === 'Lab' ? '#f0f9ff' : '#fffbeb',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    color: session.type === 'Lab' ? '#0369a1' : '#a16207',
                                                    border: `1px solid ${session.type === 'Lab' ? '#bae6fd' : '#fef08a'}`
                                                }}>
                                                    {session.type} ({session.hours}h)
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px' }}>
                                            No classes scheduled for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0' }}>P / D</th>
                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => (
                                                <th key={d} style={{ padding: '0.75rem', textAlign: 'center', border: '1px solid #e2e8f0', color: '#1e40af' }}>
                                                    <div style={{ fontSize: '0.8rem' }}>{d}</div>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#64748b' }}>{weekDates[d]}</div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(period => (
                                            <tr key={period}>
                                                <td style={{ padding: '1rem', textAlign: 'center', border: '1px solid #f1f5f9', background: '#f8fafc', fontWeight: '800', color: '#64748b' }}>{period}</td>
                                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                                                    const slot = getSlotForDayPeriod(day, period);
                                                    return (
                                                        <td key={`${day}-${period}`} style={{
                                                            padding: '0.75rem',
                                                            border: '1px solid #f1f5f9',
                                                            background: slot ? (slot.type === 'Lab' ? '#fffaf0' : '#f5f7ff') : 'white',
                                                            fontSize: '0.8rem',
                                                            transition: 'background 0.2s ease'
                                                        }}>
                                                            {slot ? (
                                                                <div style={{
                                                                    padding: '0.5rem',
                                                                    borderRadius: '8px',
                                                                    background: 'white',
                                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                                                                    borderLeft: `3px solid ${slot.type === 'Lab' ? '#f59e0b' : '#3b82f6'}`
                                                                }}>
                                                                    <div style={{ fontWeight: '800', color: slot.type === 'Lab' ? '#b45309' : '#1e40af' }}>{slot.subject}</div>
                                                                    <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.2rem' }}>{slot.classYear}</div>
                                                                    <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>📍 {slot.roomNumber}</div>
                                                                </div>
                                                            ) : <div style={{ textAlign: 'center', color: '#e2e8f0' }}>empty</div>}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 2: Query & Request Management */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '0.75rem', padding: '0.4rem', background: '#f1f5f9', borderRadius: '12px' }}>
                        <button
                            className={`btn ${newRequest.type === 'query' ? '' : 'btn-secondary'}`}
                            onClick={() => { setNewRequest({ ...newRequest, type: 'query' }); setError(''); }}
                            style={{
                                flex: 1,
                                background: newRequest.type === 'query' ? 'var(--primary)' : 'transparent',
                                color: newRequest.type === 'query' ? 'white' : '#64748b',
                                border: 'none',
                                boxShadow: newRequest.type === 'query' ? 'var(--shadow)' : 'none'
                            }}
                        >
                            💬 General Query
                        </button>
                        <button
                            className={`btn ${newRequest.type === 'workload' ? '' : 'btn-secondary'}`}
                            onClick={() => { setNewRequest({ ...newRequest, type: 'workload' }); setError(''); }}
                            style={{
                                flex: 1,
                                background: newRequest.type === 'workload' ? 'var(--primary)' : 'transparent',
                                color: newRequest.type === 'workload' ? 'white' : '#64748b',
                                border: 'none',
                                boxShadow: newRequest.type === 'workload' ? 'var(--shadow)' : 'none'
                            }}
                        >
                            📅 Workload Request
                        </button>
                    </div>

                    {/* General Query Form */}
                    {newRequest.type === 'query' && (
                        <div className="card premium-form-card" style={{ padding: '2rem' }}>
                            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>✉️</span> Ask a Query
                            </h2>
                            <form onSubmit={handleQuerySubmit} className="form-grid">
                                <div className="input-group">
                                    <label className="input-label">Subject</label>
                                    <input
                                        className="input-field"
                                        placeholder="e.g. Timetable Clash"
                                        value={queryForm.subject}
                                        onChange={(e) => setQueryForm({ ...queryForm, subject: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Priority</label>
                                    <select
                                        className="input-field"
                                        value={queryForm.priority}
                                        onChange={(e) => setQueryForm({ ...queryForm, priority: e.target.value })}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="input-label">Message</label>
                                    <textarea
                                        className="input-field"
                                        rows="3"
                                        placeholder="Type your question..."
                                        value={queryForm.message}
                                        onChange={(e) => setQueryForm({ ...queryForm, message: e.target.value })}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary-gradient" style={{ gridColumn: 'span 2' }}>
                                    Send Message →
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Workload Request Form */}
                    {newRequest.type === 'workload' && (
                        <div className="card premium-form-card" style={{ padding: '2rem' }}>
                            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>📅</span> Submit Request
                            </h2>
                            <form onSubmit={handleRequestSubmit} className="form-grid">
                                <div className="input-group">
                                    <label className="input-label">Date</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={workloadForm.date}
                                        onChange={(e) => setWorkloadForm({ ...workloadForm, date: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* Request Type Toggle */}
                                <div className="input-group">
                                    <label className="input-label">Leave Type</label>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', height: '100%' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="reqType"
                                                checked={workloadForm.type === 'SINGLE'}
                                                onChange={() => setWorkloadForm({ ...workloadForm, type: 'SINGLE' })}
                                            /> Single Period
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="reqType"
                                                checked={workloadForm.type === 'FULL_DAY'}
                                                onChange={() => setWorkloadForm({ ...workloadForm, type: 'FULL_DAY', period: '' })}
                                            /> Full Day
                                        </label>
                                    </div>
                                </div>

                                {workloadForm.type === 'SINGLE' && (
                                    <div className="input-group">
                                        <label className="input-label">Period (1-8)</label>
                                        <input
                                            type="number"
                                            min="1" max="8"
                                            className="input-field"
                                            value={workloadForm.period}
                                            onChange={(e) => setWorkloadForm({ ...workloadForm, period: e.target.value })}
                                            required
                                        />
                                    </div>
                                )}

                                <div className="input-group" style={{ gridColumn: workloadForm.type === 'SINGLE' ? 'span 1' : 'span 2' }}>
                                    <label className="input-label">Reason</label>
                                    <select
                                        className="input-field"
                                        value={workloadForm.reason}
                                        onChange={(e) => setWorkloadForm({ ...workloadForm, reason: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Reason</option>
                                        <option value="Absent today">Absent today</option>
                                        <option value="Not available this period">Not available this period</option>
                                        <option value="Over workload">Over workload</option>
                                        <option value="Need workload transfer">Need workload transfer</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-primary-gradient" style={{ gridColumn: 'span 2' }}>
                                    Submit Request →
                                </button>
                            </form>
                        </div>
                    )}

                    {/* History Section */}
                    <div className="card" style={{ padding: '2rem', flex: 1 }}>
                        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: '#0f172a' }}>History & Status</h2>

                        {/* Queries List */}
                        {newRequest.type === 'query' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {queries.length > 0 ? queries.map(q => (
                                    <div key={q._id} style={{
                                        borderRadius: '12px',
                                        padding: '1.25rem',
                                        background: 'white',
                                        border: '1px solid #f1f5f9',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: '600' }}>{q.subject}</span>
                                            <span style={{
                                                fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px',
                                                background: q.status === 'Resolved' ? '#dcfce7' : '#ffedd5',
                                                color: q.status === 'Resolved' ? '#166534' : '#9a3412'
                                            }}>{q.status}</span>
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
                                            {q.messages[q.messages.length - 1]?.text}
                                        </div>
                                        {/* Simple Chat View (Last 2 messages) */}
                                        <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                                            {q.messages.map((msg, idx) => (
                                                <div key={idx} style={{ marginBottom: '0.25rem', textAlign: msg.sender === 'faculty' ? 'right' : 'left' }}>
                                                    <span style={{ fontWeight: 'bold' }}>{msg.sender === 'faculty' ? 'You' : 'Admin'}: </span>
                                                    {msg.text}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )) : <p style={{ color: '#94a3b8', textAlign: 'center' }}>No queries found.</p>}
                            </div>
                        )}

                        {/* Workload Requests List */}
                        {newRequest.type === 'workload' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {requests.length > 0 ? requests.map(req => (
                                    <div key={req._id} style={{
                                        padding: '1.25rem',
                                        borderRadius: '12px',
                                        background: 'white',
                                        border: '1px solid #f1f5f9',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                {req.date ? new Date(req.date).toLocaleDateString() : 'General'}
                                                {/* Show Periods */}
                                                {req.type === 'FULL_DAY'
                                                    ? ' • Full Day'
                                                    : (req.periods && req.periods.length > 0 ? ` • P${req.periods.join(', ')}` : '')
                                                }
                                            </span>
                                            <span style={{
                                                fontSize: '0.75rem', fontWeight: '600', padding: '2px 8px', borderRadius: '12px',
                                                background: req.status === 'Approved' || req.status === 'Reassigned' ? '#dcfce7' : '#fff7ed',
                                                color: req.status === 'Approved' || req.status === 'Reassigned' ? '#166534' : '#9a3412'
                                            }}>
                                                {req.status}
                                            </span>
                                        </div>
                                        <div style={{ fontWeight: '500', color: '#334155' }}>
                                            {req.reason}
                                        </div>
                                        {req.decisionLog && (
                                            <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#eff6ff', borderRadius: '4px', fontSize: '0.8rem', color: '#1e40af' }}>
                                                <strong>Admin:</strong> {req.decisionLog}
                                            </div>
                                        )}
                                    </div>
                                )) : <p style={{ color: '#94a3b8', textAlign: 'center' }}>No requests found.</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default FacultyDashboard;
