import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import CustomSelect from '../components/CustomSelect';

const FacultyDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [facultyProfile, setFacultyProfile] = useState(null);
    const [timetable, setTimetable] = useState([]);
    const [allTimetable, setAllTimetable] = useState([]); // Full timetable for workload form period picker
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
        otherReason: '', // Added for custom reason
        type: 'SINGLE', // 'SINGLE' | 'FULL_DAY'
        periods: []
    });

    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [workloadNotification, setWorkloadNotification] = useState(null);

    const showWorkloadNotification = (type, msg) => {
        setWorkloadNotification({ type, msg });
        setTimeout(() => setWorkloadNotification(null), 7000);
    };

    // Editing State for Queries
    const [isEditingQuery, setIsEditingQuery] = useState(false);
    const [editingQueryData, setEditingQueryData] = useState(null);

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

            // Always fetch the full (all weeks) timetable regardless of view mode
            // This is used by the workload request form's smart period picker
            const fullTimetableRes = await api.get('/faculty/timetable');
            setAllTimetable(fullTimetableRes.data);

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

    const handleDeleteQuery = async (id) => {
        if (!window.confirm('Are you sure you want to delete this query?')) return;
        try {
            await api.delete(`/queries/${id}`);
            fetchFacultyData();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error deleting query. Only admins can delete queries currently.');
        }
    };

    const handleEditQuerySubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/queries/${editingQueryData._id}`, editingQueryData);
            setIsEditingQuery(false);
            setEditingQueryData(null);
            fetchFacultyData();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error updating query.');
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Basic validation
        const filetypes = /jpeg|jpg|png/;
        const isImage = filetypes.test(file.type);
        if (!isImage) {
            alert('Only images (jpg, jpeg, png) are allowed!');
            return;
        }

        const formData = new FormData();
        formData.append('picture', file);

        try {
            setUploading(true);
            const res = await api.post('/faculty/upload-picture', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            // Update local state
            setFacultyProfile(prev => ({
                ...prev,
                userId: {
                    ...prev.userId,
                    picture: res.data.picture
                }
            }));
            
            alert('Profile picture updated!');
        } catch (err) {
            console.error('Upload error:', err);
            alert(err.response?.data?.msg || 'Error uploading image');
        } finally {
            setUploading(false);
        }
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        try {
            // Frontend validation
            if (!workloadForm.date || !workloadForm.reason) {
                showWorkloadNotification('error', 'Please fill in the Date and Reason fields.');
                return;
            }
            if (workloadForm.type === 'SINGLE' && !workloadForm.period) {
                showWorkloadNotification('error', 'Please select an assigned period for your request.');
                return;
            }
            if (workloadForm.reason === 'Other (Specify Reason)' && !workloadForm.otherReason.trim()) {
                showWorkloadNotification('error', 'Please specify the reason in the text field.');
                return;
            }

            const payload = {
                date: workloadForm.date,
                reason: workloadForm.reason === 'Other (Specify Reason)' ? workloadForm.otherReason : workloadForm.reason,
                type: workloadForm.type,
                periods: workloadForm.type === 'FULL_DAY'
                    ? [1, 2, 3, 4, 5, 6, 7, 8]
                    : [parseInt(workloadForm.period)]
            };

            await api.post('/faculty/workload-request', payload);
            setWorkloadForm({
                date: new Date().toISOString().split('T')[0],
                period: '',
                reason: '',
                otherReason: '',
                type: 'SINGLE',
                periods: []
            });
            showWorkloadNotification('success', 'Workload request submitted successfully!');
            fetchFacultyData();
        } catch (err) {
            showWorkloadNotification('error', err.response?.data?.msg || 'Error submitting request. Please try again.');
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

    // Removed early loading return to allow instant layout render

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
                    <div 
                        className={`faculty-profile-avatar ${uploading ? '' : 'hover:scale-110 transition-transform duration-300'}`}
                        onClick={() => !uploading && document.getElementById('avatar-input').click()}
                        style={{
                            background: facultyProfile?.userId?.picture ? `url("${BASE_URL}${facultyProfile.userId.picture}")` : 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            border: '4px solid #f8fafc',
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: uploading ? 'wait' : 'pointer',
                            position: 'relative'
                        }}
                    >
                        {uploading ? (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <>
                                {!facultyProfile?.userId?.picture && (facultyProfile?.name?.charAt(0) || 'F')}
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <svg className="w-8 h-8 text-white/90 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                            </>
                        )}
                        {/* Hidden File Input */}
                        <input 
                            id="avatar-input"
                            type="file" 
                            accept="image/*" 
                            style={{ display: 'none' }} 
                            onChange={handleImageUpload}
                        />
                    </div>
                    <div>
                        {loading ? (
                            <div className="animate-pulse flex flex-col gap-2">
                                <div className="h-8 bg-slate-200 rounded w-48 mb-2"></div>
                                <div className="flex gap-4">
                                    <div className="h-5 bg-slate-200 rounded w-32"></div>
                                    <div className="h-5 bg-slate-200 rounded w-32"></div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="faculty-profile-heading" style={{ color: '#0f172a' }}>
                                    Welcome, {facultyProfile?.name}
                                </h1>
                                <div className="faculty-profile-details" style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: '#64748b' }}>
                                    <span style={{ fontSize: '1rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1.2rem' }}>💼</span> {facultyProfile?.designation || 'Faculty Member'}
                                    </span>
                                    <span style={{ fontSize: '1rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1.2rem' }}>🏢</span> {facultyProfile?.department?.name || 'Department'}
                                    </span>
                                    <Link to="/faculty/details" style={{
                                        color: '#3b82f6',
                                        fontWeight: '600',
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        padding: '0.25rem 0.75rem',
                                        background: '#eff6ff',
                                        borderRadius: '8px',
                                        border: '1px solid #dbeafe',
                                        transition: 'all 0.2s'
                                    }} className="hover:bg-blue-100">
                                        <span>📄</span> View Full Details
                                    </Link>
                                </div>
                            </>
                        )}
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

                        {loading ? (
                            <div className="animate-pulse">
                                <div className="h-10 bg-slate-200 rounded w-24 mb-4"></div>
                                <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                                <div className="h-3 bg-slate-200 rounded w-full"></div>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1e293b', lineHeight: 1 }}>
                                        {facultyProfile?.currentHours || 0}
                                    </span>
                                    <span style={{ fontSize: '1rem', color: '#64748b', marginBottom: '0.4rem' }}>
                                        / {facultyProfile?.maxHours || 16} weekly hours
                                    </span>
                                </div>

                                <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden', marginBottom: '1.25rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                                    <div style={{
                                        width: `${Math.min(workloadPercentage || 0, 100)}%`,
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
                            </>
                        )}
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

                        {loading ? (
                            <div className="animate-pulse space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-24 bg-slate-100 rounded-xl"></div>
                                ))}
                            </div>
                        ) : viewMode === 'daily' ? (
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
                                <CustomSelect
                                    label="Priority"
                                    placeholder="Select Priority"
                                    value={queryForm.priority}
                                    onChange={(val) => setQueryForm({ ...queryForm, priority: val })}
                                    options={[
                                        { value: 'Low', label: 'Low', sub: 'Standard response' },
                                        { value: 'Medium', label: 'Medium', sub: 'Urgent attention' }
                                    ]}
                                    required
                                />
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
                    {newRequest.type === 'workload' && (() => {
                        // Derive the day name from the selected date
                        const selectedDateObj = workloadForm.date ? new Date(workloadForm.date) : null;
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const selectedDayName = selectedDateObj ? dayNames[selectedDateObj.getUTCDay()] : null;

                        // Filter allTimetable to get only periods assigned to THIS faculty on THAT day
                        const assignedPeriodsForDate = allTimetable.filter(slot =>
                            slot.day === selectedDayName
                        ).sort((a, b) => a.period - b.period);

                        const isWeekend = selectedDayName === 'Saturday' || selectedDayName === 'Sunday';
                        const hasNoClasses = !isWeekend && selectedDayName && assignedPeriodsForDate.length === 0;

                        return (
                            <div className="card premium-form-card" style={{ padding: '2rem' }}>
                                <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>📅</span> Submit Workload Request
                                </h2>

                                {/* Inline Notification Banner */}
                                {workloadNotification && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '0.75rem',
                                        padding: '0.9rem 1.1rem',
                                        marginBottom: '1.25rem',
                                        borderRadius: '10px',
                                        border: `1px solid ${workloadNotification.type === 'success' ? '#86efac' : '#fca5a5'}`,
                                        background: workloadNotification.type === 'success' ? '#f0fdf4' : '#fff5f5',
                                        color: workloadNotification.type === 'success' ? '#166534' : '#991b1b',
                                        animation: 'fadeInDown 0.3s ease',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        lineHeight: '1.5'
                                    }}>
                                        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>
                                            {workloadNotification.type === 'success' ? '✅' : '🚫'}
                                        </span>
                                        <span style={{ flex: 1 }}>{workloadNotification.msg}</span>
                                        <button type="button" onClick={() => setWorkloadNotification(null)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6, fontSize: '1rem', padding: 0 }}>✕</button>
                                    </div>
                                )}

                                {/* No-classes notice for selected date */}
                                {(isWeekend || hasNoClasses) && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.65rem',
                                        padding: '0.75rem 1rem',
                                        marginBottom: '1.25rem',
                                        borderRadius: '10px',
                                        border: '1px solid #fde68a',
                                        background: '#fffbeb',
                                        color: '#92400e',
                                        fontSize: '0.85rem',
                                        fontWeight: '500'
                                    }}>
                                        <span style={{ fontSize: '1rem' }}>⚠️</span>
                                        {isWeekend
                                            ? `${selectedDayName} is a weekend. No classes are scheduled. Please select a weekday.`
                                            : `You have no classes assigned on ${selectedDayName}. Please pick a date when you have classes to request workload changes.`
                                        }
                                    </div>
                                )}

                                <form onSubmit={handleRequestSubmit} className="form-grid">
                                    <div className="input-group">
                                        <label className="input-label">Date</label>
                                        <input
                                            type="date"
                                            className="input-field"
                                            value={workloadForm.date}
                                            onChange={(e) => setWorkloadForm({ ...workloadForm, date: e.target.value, period: '' })}
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
                                                    onChange={() => setWorkloadForm({ ...workloadForm, type: 'SINGLE', period: '' })}
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

                                    {/* Smart Period Picker — only assigned periods */}
                                    {workloadForm.type === 'SINGLE' && (
                                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                            <CustomSelect
                                                label="Select Assigned Period"
                                                placeholder={
                                                    !workloadForm.date
                                                        ? 'Select a date first'
                                                        : assignedPeriodsForDate.length === 0
                                                            ? 'No assigned periods on this day'
                                                            : 'Select your assigned period'
                                                }
                                                value={workloadForm.period}
                                                onChange={(val) => setWorkloadForm({ ...workloadForm, period: val })}
                                                disabled={assignedPeriodsForDate.length === 0}
                                                options={assignedPeriodsForDate.map(slot => ({
                                                    value: slot.period,
                                                    label: `Period ${slot.period} — ${slot.subject}`,
                                                    sub: `${slot.classYear} • Room ${slot.roomNumber} • ${slot.type}`
                                                }))}
                                                required
                                            />
                                            {assignedPeriodsForDate.length > 0 && (
                                                <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.4rem' }}>
                                                    🔒 Only your assigned periods for {selectedDayName} are shown.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Full Day Summary */}
                                    {workloadForm.type === 'FULL_DAY' && assignedPeriodsForDate.length > 0 && (
                                        <div style={{
                                            gridColumn: 'span 2',
                                            padding: '0.85rem 1rem',
                                            borderRadius: '10px',
                                            background: '#f0f9ff',
                                            border: '1px solid #bae6fd',
                                            color: '#0369a1',
                                            fontSize: '0.85rem',
                                            fontWeight: '500'
                                        }}>
                                            📋 This will cover all <strong>{assignedPeriodsForDate.length} period(s)</strong> you are assigned on <strong>{selectedDayName}</strong>:&nbsp;
                                            {assignedPeriodsForDate.map(s => `Period ${s.period} (${s.subject})`).join(', ')}
                                        </div>
                                    )}

                                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                        <CustomSelect
                                            label="Reason"
                                            placeholder="Select Reason"
                                            value={workloadForm.reason}
                                            options={[
                                                { value: 'On Duty (OD) – Official Academic Work', label: 'On Duty (OD)', sub: 'Official Academic Work' },
                                                { value: 'Medical Leave', label: 'Medical Leave', sub: 'Personal health' },
                                                { value: 'Personal Leave', label: 'Personal Leave', sub: 'Urgent personal work' },
                                                { value: 'Department Meeting / Administrative Work', label: 'Dept. Meeting', sub: 'Administrative Work' },
                                                { value: 'University / Examination Duty', label: 'Uni / Exam Duty', sub: 'Official Exam Duty' },
                                                { value: 'Seminar / Workshop / Conference Participation', label: 'Seminar / Workshop', sub: 'Academic Conference' },
                                                { value: 'Research or Project Work', label: 'Research Work', sub: 'Academic Research' },
                                                { value: 'Student Mentoring or Academic Counseling', label: 'Student Mentoring', sub: 'Counseling Work' },
                                                { value: 'Over Workload – Request Redistribution', label: 'Over Workload', sub: 'Redistribution Request' },
                                                { value: 'Class Schedule Conflict', label: 'Schedule Conflict', sub: 'Clash Resolution' },
                                                { value: 'Not Available for This Period', label: 'Not Available', sub: 'Unavailable' },
                                                { value: 'Emergency Leave', label: 'Emergency', sub: 'Sudden Emergency' },
                                                { value: 'Other (Specify Reason)', label: 'Other', sub: 'Specify specialized reason' }
                                            ]}
                                            onChange={(val) => setWorkloadForm({ ...workloadForm, reason: val })}
                                            required
                                        />
                                    </div>

                                    {workloadForm.reason === 'Other (Specify Reason)' && (
                                        <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                            <label className="input-label">Specify Reason</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder="Type your custom reason here..."
                                                value={workloadForm.otherReason}
                                                onChange={(e) => setWorkloadForm({ ...workloadForm, otherReason: e.target.value })}
                                                required
                                            />
                                        </div>
                                    )}
                                    <button type="submit" className="btn btn-primary-gradient" style={{ gridColumn: 'span 2' }}>
                                        Submit Request →
                                    </button>
                                </form>
                            </div>
                        );
                    })()}

                    {/* History Section */}
                    <div className="card" style={{ padding: '2rem', flex: 1 }}>
                        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: '#0f172a' }}>History & Status</h2>

                        {loading ? (
                            <div className="animate-pulse space-y-4">
                                {[1, 2].map(i => (
                                    <div key={i} className="h-24 bg-slate-100 rounded-xl"></div>
                                ))}
                            </div>
                        ) : (
                            <>
                                {/* Queries List */}
                                {newRequest.type === 'query' && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-1">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800">Recent Queries</h3>
                                                <p className="text-xs text-slate-500 font-medium">{queries.length} total queries</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                            {queries.length === 0 ? (
                                                <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                                                    <p className="text-sm">No queries found.</p>
                                                </div>
                                            ) : (
                                                queries.map(q => (
                                                    <div
                                                        key={q._id}
                                                        className={`relative bg-white rounded-xl shadow-sm border-l-4 p-5 transition-all hover:shadow-md hover:translate-x-1 ${
                                                            q.priority === 'High' ? 'border-l-red-500' : 
                                                            q.priority === 'Medium' ? 'border-l-amber-500' : 'border-l-blue-500'
                                                        }`}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h4 className="font-bold text-slate-800 text-sm">{facultyProfile?.name}</h4>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase">
                                                                {new Date(q.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                            </span>
                                                        </div>

                                                        <p className="text-slate-700 font-semibold text-sm mb-3">{q.subject}</p>
                                                        
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                                    q.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                                    q.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                                    'bg-blue-50 text-blue-600 border border-blue-100'
                                                                }`}>
                                                                    {q.priority}
                                                                </span>
                                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                                    q.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                                                                    'bg-slate-100 text-slate-600 border border-slate-200'
                                                                }`}>
                                                                    {q.status}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <button 
                                                                    onClick={() => { setEditingQueryData({ ...q }); setIsEditingQuery(true); }}
                                                                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200"
                                                                    title="Edit Query"
                                                                >
                                                                    <span className="text-xs">✏️</span>
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeleteQuery(q._id)}
                                                                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors border border-red-100"
                                                                    title="Delete Query"
                                                                >
                                                                    <span className="text-xs">🗑️</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {/* Edit Query Modal */}
                                        {isEditingQuery && editingQueryData && (
                                            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1100] p-4"
                                                onClick={() => { setIsEditingQuery(false); setEditingQueryData(null); }}>
                                                <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in duration-200"
                                                    onClick={e => e.stopPropagation()}>
                                                    <div className="flex items-center gap-3 mb-5">
                                                        <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">✏️</div>
                                                        <h3 className="text-lg font-bold text-slate-800">Edit Query</h3>
                                                    </div>
                                                    <form onSubmit={handleEditQuerySubmit} className="space-y-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Subject</label>
                                                            <input
                                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-700 font-medium text-sm"
                                                                value={editingQueryData.subject}
                                                                onChange={e => setEditingQueryData({ ...editingQueryData, subject: e.target.value })}
                                                                required
                                                            />
                                                        </div>
                                                        <CustomSelect
                                                            label="Priority"
                                                            placeholder="Select Priority"
                                                            value={editingQueryData.priority}
                                                            options={[
                                                                { value: 'Low', label: 'Low', sub: 'Routine response' },
                                                                { value: 'Medium', label: 'Medium', sub: 'Standard response' },
                                                                { value: 'High', label: 'High', sub: 'Urgent attention' }
                                                            ]}
                                                            onChange={(val) => setEditingQueryData({ ...editingQueryData, priority: val })}
                                                        />
                                                        <div className="flex gap-2 pt-2">
                                                            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all">
                                                                Save
                                                            </button>
                                                            <button type="button" 
                                                                    onClick={() => { setIsEditingQuery(false); setEditingQueryData(null); }}
                                                                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm transition-all">
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        )}
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
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default FacultyDashboard;
