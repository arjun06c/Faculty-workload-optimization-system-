import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import CustomSelect from '../components/CustomSelect';

const AdminDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [view, setView] = useState('departments'); // 'departments' | 'faculty' | 'subjects' | 'roles' | 'workload'

    // Departments State
    const [departments, setDepartments] = useState([]);
    const [newDeptName, setNewDeptName] = useState('');
    const [selectedDeptId, setSelectedDeptId] = useState(''); // For filtering faculty
    const [isEditingDept, setIsEditingDept] = useState(false);
    const [editingDeptId, setEditingDeptId] = useState(null);


    // Faculty State
    const [facultyList, setFacultyList] = useState([]);
    const [newFaculty, setNewFaculty] = useState({
        name: '', email: '', password: '', department: '', designation: '', phone: '', maxHours: 16
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Teaching Subjects State (multi-select picker)
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [teachingSubjects, setTeachingSubjects] = useState([]); // array of "CODE - Name" strings

    // Subjects Module State
    const [newSubject, setNewSubject] = useState({ subjectCode: '', subjectName: '', departmentId: '' });
    const [isEditingSubject, setIsEditingSubject] = useState(false);
    const [editingSubjectId, setEditingSubjectId] = useState(null);

    // Academics State
    const [newAcademics, setNewAcademics] = useState({ email: '', password: '' });

    // Fetch Initial Data
    useEffect(() => {
        fetchDepartments();
    }, []);

    // Fetch Faculty when view changes or selectedDeptId changes
    useEffect(() => {
        if (view === 'departments') {
            fetchAllFaculty();
        } else if (view === 'faculty' || view === 'workload') {
            if (selectedDeptId) {
                fetchFacultyByDept(selectedDeptId);
            } else {
                fetchAllFaculty();
            }
        }
        if (view === 'faculty' || view === 'subjects') {
            fetchSubjects();
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

    const fetchSubjects = async () => {
        try {
            const res = await api.get('/admin/subjects');
            setSubjects(res.data);
        } catch (err) {
            console.error('Failed to fetch subjects', err);
        }
    };

    const handleAddTeachingSubject = () => {
        if (!selectedSubject) return;
        if (teachingSubjects.includes(selectedSubject)) {
            alert('This subject is already added.');
            return;
        }
        setTeachingSubjects(prev => [...prev, selectedSubject]);
        setSelectedSubject('');
    };

    const handleRemoveTeachingSubject = (subjectStr) => {
        setTeachingSubjects(prev => prev.filter(s => s !== subjectStr));
    };

    // ── Subjects CRUD ──────────────────────────────────────────
    const handleSaveSubject = async (e) => {
        e.preventDefault();
        try {
            if (isEditingSubject) {
                await api.put(`/admin/subjects/${editingSubjectId}`, newSubject);
                alert('Subject updated successfully!');
            } else {
                await api.post('/admin/subjects', newSubject);
                alert('Subject created successfully!');
            }
            setNewSubject({ subjectCode: '', subjectName: '', departmentId: '' });
            setIsEditingSubject(false);
            setEditingSubjectId(null);
            fetchSubjects();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error saving subject');
        }
    };

    const handleEditSubject = (s) => {
        setIsEditingSubject(true);
        setEditingSubjectId(s._id);
        setNewSubject({
            subjectCode: s.subjectCode,
            subjectName: s.subjectName,
            departmentId: s.department?._id || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteSubject = async (id) => {
        if (!window.confirm('Delete this subject? Faculty records referencing it will not be affected.')) return;
        try {
            await api.delete(`/admin/subjects/${id}`);
            fetchSubjects();
            alert('Subject deleted.');
        } catch (err) {
            alert(err.response?.data?.msg || 'Error deleting subject');
        }
    };
    // ───────────────────────────────────────────────────────────

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
                skills: teachingSubjects
            };

            if (isEditing) {
                await api.put(`/admin/faculty/${editingId}`, facultyData);
                alert('Faculty updated successfully!');
            } else {
                await api.post('/admin/faculty', facultyData);
                alert('Faculty added successfully!');
            }

            setNewFaculty({ name: '', email: '', password: '', department: '', designation: '', phone: '', maxHours: 16 });
            setTeachingSubjects([]);
            setSelectedSubject('');
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
            maxHours: f.maxHours
        });
        setTeachingSubjects(Array.isArray(f.skills) ? f.skills : []);
        setSelectedSubject('');

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
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <button className={`btn ${view === 'departments' ? '' : 'btn-secondary'}`} onClick={() => setView('departments')}>🏢 Departments</button>
                <button className={`btn ${view === 'faculty' ? '' : 'btn-secondary'}`} onClick={() => setView('faculty')}>👤 Faculty</button>
                <button
                    className={`btn ${view === 'subjects' ? '' : 'btn-secondary'}`}
                    onClick={() => setView('subjects')}
                    style={view === 'subjects' ? {} : { position: 'relative' }}
                >
                    📚 Subjects
                </button>
                <button className={`btn ${view === 'roles' ? '' : 'btn-secondary'}`} onClick={() => setView('roles')}>🔐 Roles</button>
                <button className={`btn ${view === 'workload' ? '' : 'btn-secondary'}`} onClick={() => setView('workload')}>📊 Workload</button>
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
                            style={{ flex: 1 }}
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
                                                <CustomSelect
                                                    placeholder="Assign HOD..."
                                                    className="select-action"
                                                    value={dept.hodId?._id || ''}
                                                    onChange={(val) => handleAssignHOD(dept._id, val)}
                                                    options={facultyList.filter(f => f.department?._id === dept._id).map(f => ({
                                                        value: f._id,
                                                        label: f.name,
                                                        sub: f.designation
                                                    }))}
                                                />

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
                            <input type="email" className="input-field" placeholder="Email Address" value={newFaculty.email} onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })} required autoComplete="off" />
                            <input type="password" className="input-field" placeholder={isEditing ? "New Password (leave blank to keep current)" : "Password"} value={newFaculty.password} onChange={(e) => setNewFaculty({ ...newFaculty, password: e.target.value })} required={!isEditing} autoComplete="new-password" />

                            <CustomSelect
                                label="Department"
                                placeholder="Select Department"
                                value={newFaculty.department}
                                onChange={(val) => setNewFaculty({ ...newFaculty, department: val })}
                                options={departments.map(d => ({ value: d._id, label: d.name }))}
                                required
                            />
                            <input className="input-field" placeholder="Designation" value={newFaculty.designation} onChange={(e) => setNewFaculty({ ...newFaculty, designation: e.target.value })} required />
                            <input className="input-field" placeholder="Contact Number" value={newFaculty.phone} onChange={(e) => setNewFaculty({ ...newFaculty, phone: e.target.value })} />
                            <input type="number" className="input-field" placeholder="Max Hours/Week" value={newFaculty.maxHours} onChange={(e) => setNewFaculty({ ...newFaculty, maxHours: e.target.value })} />

                            {/* ── Teaching Subjects Picker ── */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    📚 Teaching Subjects
                                </label>

                                {/* Dropdown + Add button row */}
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <CustomSelect
                                        placeholder="-- Select Subject --"
                                        value={selectedSubject}
                                        onChange={(val) => setSelectedSubject(val)}
                                        options={subjects.map(s => ({
                                            value: `${s.subjectCode} - ${s.subjectName}`,
                                            label: s.subjectName,
                                            sub: s.subjectCode
                                        }))}
                                        className="flex-1"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddTeachingSubject}
                                        className="btn"
                                        style={{ whiteSpace: 'nowrap', padding: '0.75rem 1.25rem' }}
                                        disabled={!selectedSubject}
                                    >
                                        + Add
                                    </button>
                                </div>

                                {subjects.length === 0 && (
                                    <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                        ⚠️ No subjects found. Please
                                        <button
                                            type="button"
                                            onClick={() => setView('subjects')}
                                            style={{ background: 'none', border: 'none', color: '#1d4ed8', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem', padding: '0', textDecoration: 'underline' }}
                                        >
                                            go to the Subjects tab
                                        </button>
                                        to create subjects first.
                                    </p>
                                )}

                                {/* Selected subjects tag list */}
                                {teachingSubjects.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                                        {teachingSubjects.map((subj, idx) => (
                                            <span
                                                key={idx}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem',
                                                    background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
                                                    border: '1px solid #c7d2fe',
                                                    color: '#3730a3',
                                                    padding: '0.35rem 0.75rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.82rem',
                                                    fontWeight: '600',
                                                    boxShadow: '0 1px 3px rgba(99,102,241,0.15)'
                                                }}
                                            >
                                                📖 {subj}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTeachingSubject(subj)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: '#6366f1',
                                                        fontSize: '0.85rem',
                                                        lineHeight: 1,
                                                        padding: '0 2px',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                    title="Remove subject"
                                                >
                                                    ✖
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {teachingSubjects.length === 0 && (
                                    <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                        No teaching subjects added yet.
                                    </p>
                                )}
                            </div>

                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" className="btn" style={{ flex: 1 }}>{isEditing ? 'Save Changes' : 'Register Faculty Member'}</button>
                                {isEditing && (
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditingId(null);
                                            setNewFaculty({ name: '', email: '', password: '', department: '', designation: '', phone: '', maxHours: 16 });
                                            setTeachingSubjects([]);
                                            setSelectedSubject('');
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
                                <CustomSelect
                                    placeholder="All Departments"
                                    className="select-action"
                                    value={selectedDeptId}
                                    onChange={(val) => setSelectedDeptId(val)}
                                    options={departments.map(d => ({ value: d._id, label: d.name }))}
                                />

                            </div>
                        </div>

                        <div className="table-container">
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
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

            {/* ════════════════════════════════════════════════
                SUBJECTS MODULE
            ════════════════════════════════════════════════ */}
            {view === 'subjects' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* ── Create / Edit Subject Form ── */}
                    <div className="card" style={{
                        padding: '2rem',
                        borderTop: '4px solid #6366f1',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f7ff 100%)'
                    }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, color: '#1e293b' }}>
                                {isEditingSubject ? '📝 Edit Subject' : '➕ Create New Subject'}
                            </h2>
                            <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                                {isEditingSubject
                                    ? 'Update the subject details below.'
                                    : 'All subjects created here will be available in the Faculty Onboarding form.'}
                            </p>
                        </div>

                        <form onSubmit={handleSaveSubject} className="form-grid three-col">
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject Code</label>
                                <input
                                    className="input-field"
                                    placeholder="e.g. CS301"
                                    value={newSubject.subjectCode}
                                    onChange={(e) => setNewSubject({ ...newSubject, subjectCode: e.target.value.toUpperCase() })}
                                    required
                                    style={{ textTransform: 'uppercase' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject Name</label>
                                <input
                                    className="input-field"
                                    placeholder="e.g. Computer Networks"
                                    value={newSubject.subjectName}
                                    onChange={(e) => setNewSubject({ ...newSubject, subjectName: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <CustomSelect
                                    label="Department"
                                    placeholder="Select Department"
                                    value={newSubject.departmentId}
                                    onChange={(val) => setNewSubject({ ...newSubject, departmentId: val })}
                                    options={departments.map(d => ({ value: d._id, label: d.name }))}
                                    required
                                />
                            </div>

                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <button type="submit" className="btn" style={{ flex: 1 }}>
                                    {isEditingSubject ? '💾 Save Changes' : '✚ Create Subject'}
                                </button>
                                {isEditingSubject && (
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setIsEditingSubject(false);
                                            setEditingSubjectId(null);
                                            setNewSubject({ subjectCode: '', subjectName: '', departmentId: '' });
                                        }}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* ── Subjects Table ── */}
                    <div className="card" style={{ padding: '2rem' }}>
                        <div className="flex-between-center" style={{ marginBottom: '1.5rem' }}>
                            <div>
                                <h2 style={{ margin: 0 }}>📋 All Subjects</h2>
                                <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                                    {subjects.length} subject{subjects.length !== 1 ? 's' : ''} in the system
                                </p>
                            </div>
                            <CustomSelect
                                placeholder="All Departments"
                                className="select-action"
                                value={selectedDeptId}
                                onChange={(val) => setSelectedDeptId(val)}
                                options={departments.map(d => ({ value: d._id, label: d.name }))}
                            />
                        </div>

                        <div className="table-container">
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', minWidth: '600px' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '0.82rem' }}>
                                        <th style={{ padding: '0.5rem 1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Code</th>
                                        <th style={{ padding: '0.5rem 1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject Name</th>
                                        <th style={{ padding: '0.5rem 1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department</th>
                                        <th style={{ padding: '0.5rem 1rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjects
                                        .filter(s => !selectedDeptId || s.department?._id === selectedDeptId)
                                        .length > 0
                                        ? subjects
                                            .filter(s => !selectedDeptId || s.department?._id === selectedDeptId)
                                            .map((s, idx) => (
                                                <tr
                                                    key={s._id}
                                                    style={{
                                                        background: idx % 2 === 0 ? '#f8fafc' : '#ffffff',
                                                        borderRadius: '8px',
                                                        transition: 'background 0.15s'
                                                    }}
                                                >
                                                    <td style={{ padding: '0.85rem 1rem', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                                                            color: '#3730a3',
                                                            padding: '0.25rem 0.7rem',
                                                            borderRadius: '8px',
                                                            fontFamily: 'monospace',
                                                            fontWeight: '700',
                                                            fontSize: '0.85rem',
                                                            letterSpacing: '0.05em'
                                                        }}>
                                                            {s.subjectCode}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.85rem 1rem', fontWeight: '500', color: '#1e293b' }}>
                                                        {s.subjectName}
                                                    </td>
                                                    <td style={{ padding: '0.85rem 1rem' }}>
                                                        <span style={{
                                                            background: '#dbeafe',
                                                            color: '#1e40af',
                                                            padding: '0.2rem 0.6rem',
                                                            borderRadius: '12px',
                                                            fontSize: '0.78rem',
                                                            fontWeight: '600'
                                                        }}>
                                                            {s.department?.name || '—'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                            <button
                                                                onClick={() => handleEditSubject(s)}
                                                                title="Edit Subject"
                                                                style={{
                                                                    background: '#f1f5f9',
                                                                    border: 'none',
                                                                    padding: '0.45rem 0.6rem',
                                                                    borderRadius: '8px',
                                                                    cursor: 'pointer',
                                                                    color: '#475569',
                                                                    fontSize: '1rem',
                                                                    transition: 'all 0.15s'
                                                                }}
                                                                onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
                                                                onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSubject(s._id)}
                                                                title="Delete Subject"
                                                                style={{
                                                                    background: '#fee2e2',
                                                                    border: 'none',
                                                                    padding: '0.45rem 0.6rem',
                                                                    borderRadius: '8px',
                                                                    cursor: 'pointer',
                                                                    color: '#dc2626',
                                                                    fontSize: '1rem',
                                                                    transition: 'all 0.15s'
                                                                }}
                                                                onMouseOver={(e) => { e.currentTarget.style.background = '#fecaca'; }}
                                                                onMouseOut={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        : (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
                                                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>No subjects found</div>
                                                    <div style={{ fontSize: '0.85rem' }}>Use the form above to create the first subject.</div>
                                                </td>
                                            </tr>
                                        )
                                    }
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
                                style={{ flex: 1 }}
                                autoComplete="off"
                            />
                            <input
                                type="password"
                                className="input-field"
                                placeholder="Secure Password"
                                value={newAcademics.password}
                                onChange={(e) => setNewAcademics({ ...newAcademics, password: e.target.value })}
                                required
                                style={{ flex: 1 }}
                                autoComplete="new-password"
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
                        <CustomSelect
                            placeholder="Filter by Department..."
                            className="select-action"
                            value={selectedDeptId}
                            onChange={(val) => setSelectedDeptId(val)}
                            options={departments.map(d => ({ value: d._id, label: d.name }))}
                        />

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
