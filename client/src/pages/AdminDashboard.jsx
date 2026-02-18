import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [view, setView] = useState('departments'); // 'departments' | 'faculty' | 'roles' | 'workload'

    // Departments State
    const [departments, setDepartments] = useState([]);
    const [newDeptName, setNewDeptName] = useState('');
    const [selectedDeptId, setSelectedDeptId] = useState(''); // For filtering faculty
    const [isEditingDept, setIsEditingDept] = useState(false);
    const [editingDeptId, setEditingDeptId] = useState(null);


    // Faculty State
    const [facultyList, setFacultyList] = useState([]);
    const [newFaculty, setNewFaculty] = useState({
        name: '', email: '', password: '', department: '', designation: '', phone: '', maxHours: 16, skills: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Academics State
    const [newAcademics, setNewAcademics] = useState({ email: '', password: '' });

    // Fetch Initial Data
    useEffect(() => {
        fetchDepartments();
    }, []);

    // Fetch Faculty when view changes or selectedDeptId changes
    useEffect(() => {
        if (view === 'faculty' || view === 'workload') {
            if (selectedDeptId) {
                fetchFacultyByDept(selectedDeptId);
            } else {
                fetchAllFaculty();
            }
        }
    }, [view, selectedDeptId]);

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/admin/departments');
            setDepartments(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAllFaculty = async () => {
        try {
            const res = await api.get('/admin/faculty');
            setFacultyList(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchFacultyByDept = async (deptId) => {
        try {
            const res = await api.get(`/admin/departments/${deptId}/faculty`);
            setFacultyList(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddDepartment = async (e) => {
        e.preventDefault();
        try {
            if (isEditingDept) {
                await api.put(`/admin/departments/${editingDeptId}`, { name: newDeptName });
                alert('Department updated successfully!');
            } else {
                await api.post('/admin/departments', { name: newDeptName });
                alert('Department created successfully!');
            }
            setNewDeptName('');
            setIsEditingDept(false);
            setEditingDeptId(null);
            fetchDepartments();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error saving department');
        }
    };

    const handleEditDepartment = (dept) => {
        setIsEditingDept(true);
        setEditingDeptId(dept._id);
        setNewDeptName(dept.name);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteDepartment = async (id) => {
        if (!window.confirm('Are you sure you want to delete this department? This may affect faculty assigned to it.')) return;
        try {
            await api.delete(`/admin/departments/${id}`);
            fetchDepartments();
            alert('Department deleted.');
        } catch (err) {
            alert(err.response?.data?.msg || 'Error deleting department');
        }
    };


    const handleAddFaculty = async (e) => {
        e.preventDefault();
        try {
            const facultyData = {
                ...newFaculty,
                skills: typeof newFaculty.skills === 'string'
                    ? newFaculty.skills.split(',').map(s => s.trim()).filter(s => s !== '')
                    : Array.isArray(newFaculty.skills) ? newFaculty.skills : []
            };

            if (isEditing) {
                await api.put(`/admin/faculty/${editingId}`, facultyData);
                alert('Faculty updated successfully!');
            } else {
                await api.post('/admin/faculty', facultyData);
                alert('Faculty added successfully!');
            }

            setNewFaculty({ name: '', email: '', password: '', department: '', designation: '', phone: '', maxHours: 16, skills: '' });
            setIsEditing(false);
            setEditingId(null);
            if (selectedDeptId) fetchFacultyByDept(selectedDeptId); else fetchAllFaculty();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error saving faculty');
        }
    };

    const handleEditFaculty = (f) => {
        setIsEditing(true);
        setEditingId(f._id);
        setNewFaculty({
            name: f.name,
            email: f.userId?.email || '',
            password: '', // Keep empty unless admin wants to change it
            department: f.department?._id || '',
            designation: f.designation,
            phone: f.phone || '',
            maxHours: f.maxHours,
            skills: Array.isArray(f.skills) ? f.skills.join(', ') : ''
        });

        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteFaculty = async (id) => {
        if (!window.confirm('Are you sure you want to delete this faculty member? This will also delete their login account.')) return;
        try {
            await api.delete(`/admin/faculty/${id}`);
            if (selectedDeptId) fetchFacultyByDept(selectedDeptId); else fetchAllFaculty();
            alert('Faculty member deleted.');
        } catch (err) {
            alert('Error deleting faculty');
        }
    };

    const handleAddAcademics = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/academics', newAcademics);
            setNewAcademics({ email: '', password: '' });
            alert('Academics Office user created!');
        } catch (err) {
            alert(err.response?.data?.msg || 'Error adding academics user');
        }
    };

    const handleAssignHOD = async (deptId, facultyId) => {
        try {
            await api.put(`/admin/departments/${deptId}/assign-hod`, { facultyId });
            fetchDepartments();
            alert('HOD Assigned!');
        } catch (err) {
            alert('Error assigning HOD');
        }
    };

    return (
        <div className="page-container" style={{ background: '#f0f4f8', minHeight: '100vh' }}>
            {/* Styled Header */}
            <header className="card flex-between-center" style={{ marginBottom: '2rem', padding: '1.5rem 2rem', borderLeft: '5px solid var(--primary)' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#1e3a8a', fontSize: '1.8rem' }}>Admin Dashboard</h1>
                    <p style={{ margin: 0, color: '#64748b' }}>University Resource & Workload Management</p>
                </div>
                <button onClick={logout} className="btn btn-secondary">Logout</button>
            </header>

            {/* View Switcher Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <button className={`btn ${view === 'departments' ? '' : 'btn-secondary'}`} onClick={() => setView('departments')}>Departments</button>
                <button className={`btn ${view === 'faculty' ? '' : 'btn-secondary'}`} onClick={() => setView('faculty')}>Faculty Management</button>
                <button className={`btn ${view === 'roles' ? '' : 'btn-secondary'}`} onClick={() => setView('roles')}>Roles</button>
                <button className={`btn ${view === 'workload' ? '' : 'btn-secondary'}`} onClick={() => setView('workload')}>Workload Monitor</button>
            </div>

            {/* View Content */}
            {view === 'departments' && (
                <div className="card" style={{ padding: '2rem' }}>
                    <h2 style={{ marginBottom: '1.5rem' }}>{isEditingDept ? '📝 Update Department' : 'University Departments'}</h2>
                    <form onSubmit={handleAddDepartment} className="flex-gap-1" style={{ maxWidth: '500px', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Department Name (e.g. CSE, EEE)"
                            value={newDeptName}
                            onChange={(e) => setNewDeptName(e.target.value)}
                            required
                            style={{ flex: 1, minWidth: '200px' }}
                        />
                        <button type="submit" className="btn">{isEditingDept ? 'Update' : 'Create'}</button>
                        {isEditingDept && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    setIsEditingDept(false);
                                    setEditingDeptId(null);
                                    setNewDeptName('');
                                }}
                            >
                                Cancel
                            </button>
                        )}
                    </form>


                    <div className="table-container">
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                                    <th style={{ padding: '1rem' }}>Department Name</th>
                                    <th style={{ padding: '1rem' }}>Current HOD</th>
                                    <th style={{ padding: '1rem' }}>Manage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {departments.map(dept => (
                                    <tr key={dept._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div
                                                onClick={() => navigate(`/admin/department/${dept._id}`)}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    color: '#1e40af',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    fontSize: '0.9rem',
                                                    background: '#eff6ff',
                                                    padding: '0.4rem 0.8rem',
                                                    borderRadius: '6px',
                                                    border: '1px solid #dbeafe',
                                                    transition: 'all 0.2s',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                }}
                                                onMouseOver={(e) => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                                onMouseOut={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                            >
                                                🏢 {dept.name}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{dept.hodId?.name || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <button
                                                    onClick={() => handleEditDepartment(dept)}
                                                    style={{
                                                        background: '#f1f5f9',
                                                        border: 'none',
                                                        padding: '0.4rem',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        color: '#475569'
                                                    }}
                                                    title="Edit Department"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDepartment(dept._id)}
                                                    style={{
                                                        background: '#fee2e2',
                                                        border: 'none',
                                                        padding: '0.4rem',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        color: '#dc2626'
                                                    }}
                                                    title="Delete Department"
                                                >
                                                    🗑️
                                                </button>
                                                <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 0.5rem' }} />
                                                <select
                                                    className="input-field select-action"
                                                    onChange={(e) => handleAssignHOD(dept._id, e.target.value)}
                                                    value={dept.hodId?._id || ''}
                                                >
                                                    <option value="">Assign HOD...</option>
                                                    {facultyList.filter(f => f.department?._id === dept._id).map(f => (
                                                        <option key={f._id} value={f._id}>{f.name}</option>
                                                    ))}
                                                </select>

                                            </div>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === 'faculty' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card" style={{ padding: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>{isEditing ? '📝 Update Faculty Details' : '👤 Onboard New Faculty'}</h2>
                        <form onSubmit={handleAddFaculty} className="form-grid three-col">
                            <input className="input-field" placeholder="Full Name" value={newFaculty.name} onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })} required />
                            <input type="email" className="input-field" placeholder="Email Address" value={newFaculty.email} onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })} required />
                            <input type="password" className="input-field" placeholder={isEditing ? "New Password (leave blank to keep current)" : "Password"} value={newFaculty.password} onChange={(e) => setNewFaculty({ ...newFaculty, password: e.target.value })} required={!isEditing} />

                            <select className="input-field" value={newFaculty.department} onChange={(e) => setNewFaculty({ ...newFaculty, department: e.target.value })} required>
                                <option value="">Select Department</option>
                                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                            </select>
                            <input className="input-field" placeholder="Designation" value={newFaculty.designation} onChange={(e) => setNewFaculty({ ...newFaculty, designation: e.target.value })} required />
                            <input className="input-field" placeholder="Contact Number" value={newFaculty.phone} onChange={(e) => setNewFaculty({ ...newFaculty, phone: e.target.value })} />
                            <input type="number" className="input-field" placeholder="Max Hours/Week" value={newFaculty.maxHours} onChange={(e) => setNewFaculty({ ...newFaculty, maxHours: e.target.value })} />
                            <input className="input-field" placeholder="Skills (Java, AI, etc.)" value={newFaculty.skills} onChange={(e) => setNewFaculty({ ...newFaculty, skills: e.target.value })} style={{ gridColumn: 'span 2' }} />
                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" className="btn" style={{ flex: 1 }}>{isEditing ? 'Save Changes' : 'Register Faculty Member'}</button>
                                {isEditing && (
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setNewFaculty({ name: '', email: '', password: '', department: '', designation: '', phone: '', maxHours: 16, skills: '' });
                                        }}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="card" style={{ padding: '2rem' }}>
                        <div className="flex-between-center" style={{ marginBottom: '2rem' }}>
                            <h2 style={{ margin: 0 }}>Faculty Records</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <label style={{ color: '#64748b', fontSize: '0.9rem' }}>Filter:</label>
                                <select
                                    className="input-field select-action"
                                    value={selectedDeptId}
                                    onChange={(e) => setSelectedDeptId(e.target.value)}
                                    style={{ minWidth: '180px' }}
                                >
                                    <option value="">All Departments</option>
                                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                </select>

                            </div>
                        </div>

                        <div className="table-container">
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px', minWidth: '800px' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.9rem' }}>
                                        <th style={{ padding: '0.5rem 1rem' }}>Name & Designation</th>
                                        <th style={{ padding: '0.5rem 1rem' }}>Department</th>
                                        <th style={{ padding: '0.5rem 1rem' }}>Expertise</th>
                                        <th style={{ padding: '0.5rem 1rem' }}>Capacity</th>
                                        <th style={{ padding: '0.5rem 1rem', textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {facultyList.length > 0 ? facultyList.map(f => (
                                        <tr key={f._id} style={{ background: '#f8fafc', borderRadius: '8px' }}>
                                            <td style={{ padding: '1rem', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>
                                                <div style={{ fontWeight: 'bold' }}>{f.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{f.designation}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600' }}>
                                                    {f.department?.name || 'N/A'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                {f.skills?.map(skill => (
                                                    <span key={skill} style={{ display: 'inline-block', margin: '2px', padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '0.75rem' }}>{skill}</span>
                                                ))}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <strong>{f.maxHours}</strong> hrs/wk
                                            </td>
                                            <td style={{ padding: '1rem', borderTopRightRadius: '8px', borderBottomRightRadius: '8px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => handleEditFaculty(f)}
                                                        style={{
                                                            background: '#f1f5f9',
                                                            border: 'none',
                                                            padding: '0.4rem',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            color: '#475569'
                                                        }}
                                                        title="Edit Faculty"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteFaculty(f._id)}
                                                        style={{
                                                            background: '#fee2e2',
                                                            border: 'none',
                                                            padding: '0.4rem',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            color: '#dc2626'
                                                        }}
                                                        title="Delete Faculty"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No faculty records found for the selection.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {view === 'roles' && (
                <div className="card" style={{ padding: '2rem' }}>
                    <h2>Role Base Access Control</h2>
                    <div style={{ marginTop: '2rem' }}>
                        <h3>Create Academics Office Account</h3>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Providing access to timetable generation and workload reassignment tools.</p>
                        <form onSubmit={handleAddAcademics} className="flex-gap-1" style={{ maxWidth: '600px', flexWrap: 'wrap' }}>
                            <input
                                type="email"
                                className="input-field"
                                placeholder="Corporate Email"
                                value={newAcademics.email}
                                onChange={(e) => setNewAcademics({ ...newAcademics, email: e.target.value })}
                                required
                                style={{ flex: 1, minWidth: '200px' }}
                            />
                            <input
                                type="password"
                                className="input-field"
                                placeholder="Secure Password"
                                value={newAcademics.password}
                                onChange={(e) => setNewAcademics({ ...newAcademics, password: e.target.value })}
                                required
                                style={{ flex: 1, minWidth: '200px' }}
                            />
                            <button type="submit" className="btn">Create Account</button>
                        </form>
                    </div>
                </div>
            )}

            {view === 'workload' && (
                <div className="card" style={{ padding: '2rem' }}>
                    <div className="flex-between-center" style={{ marginBottom: '2rem' }}>
                        <h2 style={{ margin: 0 }}>Faculty Workload Analytics</h2>
                        <select
                            className="input-field select-action"
                            value={selectedDeptId}
                            onChange={(e) => setSelectedDeptId(e.target.value)}
                            style={{ minWidth: '200px' }}
                        >
                            <option value="">Filter by Department...</option>
                            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                        </select>

                    </div>

                    <div className="table-container">
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                                    <th style={{ padding: '1rem' }}>Faculty</th>
                                    <th style={{ padding: '1rem' }}>Department</th>
                                    <th style={{ padding: '1rem' }}>Usage (Hours)</th>
                                    <th style={{ padding: '1rem' }}>Status Indicator</th>
                                </tr>
                            </thead>
                            <tbody>
                                {facultyList.map(f => {
                                    const percentage = (f.currentHours / (f.maxHours || 16)) * 100;
                                    let color = '#10b981';
                                    if (percentage >= 100) color = '#ef4444';
                                    else if (percentage >= 80) color = '#f59e0b';

                                    return (
                                        <tr key={f._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>{f.name}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600' }}>
                                                    {f.department?.name}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ width: '120px', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${Math.min(percentage, 100)}%`, height: '100%', background: color }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{f.currentHours} / {f.maxHours} hrs</span>
                                            </td>
                                            <td style={{ padding: '1rem', color: color, fontWeight: 'bold' }}>
                                                {percentage >= 100 ? 'Overloaded' : percentage >= 80 ? 'Near Capacity' : 'Normal'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
