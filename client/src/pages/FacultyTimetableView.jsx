import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const FacultyTimetableView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [faculty, setFaculty] = useState(null);
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const periods = [1, 2, 3, 4, 5, 6, 7, 8];

    useEffect(() => {
        fetchFacultyTimetable();
    }, [id]);

    const fetchFacultyTimetable = async () => {
        try {
            setLoading(true);
            // Fetch faculty details
            const facultyRes = await api.get('/admin/faculty');
            const currentFaculty = facultyRes.data.find(f => f._id === id);
            setFaculty(currentFaculty);

            // Fetch timetable for this faculty
            const timetableRes = await api.get(`/academics/timetable?facultyId=${id}`);
            setTimetable(timetableRes.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    // Helper: Get dates for the current week (Mon-Fri) based on selectedDate
    const getWeekDates = () => {
        const current = new Date(selectedDate);
        const day = current.getDay(); // 0=Sun, 1=Mon...
        const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday

        const monday = new Date(current.setDate(diff));
        const weekDates = {};

        days.forEach((d, index) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + index);
            weekDates[d] = date.toISOString().split('T')[0];
        });
        return weekDates;
    };

    const weekDates = getWeekDates();

    const getSlotForDayPeriod = (day, period) => {
        const targetDate = weekDates[day];
        return timetable.find(slot => {
            const slotDate = new Date(slot.date).toISOString().split('T')[0];
            return slot.day === day && slot.period === period && slotDate === targetDate;
        });
    };

    if (loading) return <div className="page-container">Loading Faculty Timetable...</div>;
    if (!faculty) return <div className="page-container">Faculty not found.</div>;

    const workloadPercentage = (faculty.currentHours / faculty.maxHours) * 100;
    let statusColor = '#10b981';
    if (workloadPercentage >= 100) statusColor = '#ef4444';
    else if (workloadPercentage >= 80) statusColor = '#f59e0b';

    return (
        <div className="page-container" style={{ background: '#f8fafc', minHeight: '100vh', padding: '2rem 1rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <button onClick={() => navigate('/academics')} className="btn btn-secondary" style={{ marginBottom: '1rem' }}>
                    ← Back to Academics Dashboard
                </button>

                {/* Faculty Header */}
                <div className="card flex-between-center" style={{
                    padding: '2rem',
                    borderLeft: '5px solid var(--primary)',
                    flexWrap: 'wrap',
                    gap: '1.5rem'
                }}>
                    <div>
                        <h1 style={{ margin: 0, color: '#1e3a8a', fontSize: '2rem' }}>{faculty.name}</h1>
                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', color: '#64748b', fontSize: '1rem', flexWrap: 'wrap' }}>
                            <span><strong>Designation:</strong> {faculty.designation}</span>
                            <span><strong>Department:</strong> {faculty.department?.name}</span>
                            <span><strong>Email:</strong> {faculty.userId?.email}</span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>Workload Status</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: statusColor }}>
                                {faculty.currentHours} / {faculty.maxHours}h
                            </span>
                        </div>
                        <div style={{
                            fontSize: '0.8rem',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '1rem',
                            background: workloadPercentage >= 100 ? '#fef2f2' : workloadPercentage >= 80 ? '#fffbeb' : '#ecfdf5',
                            color: statusColor,
                            fontWeight: '600',
                            display: 'inline-block',
                            marginTop: '0.25rem'
                        }}>
                            {workloadPercentage >= 100 ? 'Overloaded' : workloadPercentage >= 80 ? 'Near Capacity' : 'Available'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Weekly Timetable Grid */}
            <div className="card" style={{ padding: '2rem' }}>
                <div className="flex-between-center" style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>📅 Weekly Schedule</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Week of:</span>
                        <input
                            type="date"
                            className="input-field"
                            style={{ width: 'auto', padding: '0.4rem' }}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        minWidth: '900px',
                        border: '1px solid #e2e8f0'
                    }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{
                                    padding: '1rem',
                                    textAlign: 'center',
                                    borderRight: '1px solid #e2e8f0',
                                    borderBottom: '2px solid #e2e8f0',
                                    color: '#475569',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    width: '100px'
                                }}>Period / Day</th>
                                {days.map(day => (
                                    <th key={day} style={{
                                        padding: '1rem',
                                        textAlign: 'center',
                                        borderRight: '1px solid #e2e8f0',
                                        borderBottom: '2px solid #e2e8f0',
                                        color: '#1e40af',
                                        fontWeight: '600',
                                        fontSize: '0.95rem'
                                    }}>
                                        <div>{day}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal', marginTop: '0.2rem' }}>
                                            {weekDates[day]}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {periods.map(period => (
                                <tr key={period}>
                                    <td style={{
                                        padding: '1rem',
                                        textAlign: 'center',
                                        borderRight: '1px solid #e2e8f0',
                                        borderBottom: '1px solid #e2e8f0',
                                        background: '#f8fafc',
                                        fontWeight: '700',
                                        color: '#334155',
                                        fontSize: '1rem'
                                    }}>
                                        {period}
                                    </td>
                                    {days.map(day => {
                                        const slot = getSlotForDayPeriod(day, period);
                                        return (
                                            <td key={`${day}-${period}`} style={{
                                                padding: '0.75rem',
                                                borderRight: '1px solid #e2e8f0',
                                                borderBottom: '1px solid #e2e8f0',
                                                background: slot ? (slot.type === 'Lab' ? '#fef3c7' : '#e0e7ff') : 'white',
                                                verticalAlign: 'top',
                                                minHeight: '80px'
                                            }}>
                                                {slot ? (
                                                    <div style={{ fontSize: '0.85rem' }}>
                                                        <div style={{
                                                            fontWeight: '600',
                                                            color: slot.type === 'Lab' ? '#92400e' : '#3730a3',
                                                            marginBottom: '0.25rem'
                                                        }}>
                                                            {slot.subject}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                            Year: {slot.classYear}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                            Room: {slot.roomNumber || 'TBA'}
                                                        </div>
                                                        <div style={{ marginTop: '0.25rem' }}>
                                                            <span style={{
                                                                fontSize: '0.7rem',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                background: slot.type === 'Lab' ? '#fbbf24' : '#6366f1',
                                                                color: 'white',
                                                                fontWeight: '600'
                                                            }}>
                                                                {slot.type}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '0.75rem' }}>—</div>
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
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '20px', height: '20px', background: '#e0e7ff', border: '1px solid #c7d2fe', borderRadius: '4px' }}></div>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Theory Class</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '20px', height: '20px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '4px' }}></div>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Lab Session</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '20px', height: '20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px' }}></div>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Free Period</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacultyTimetableView;
