import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const DepartmentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [department, setDepartment] = useState(null);
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDeptData();
    }, [id]);

    const fetchDeptData = async () => {
        try {
            setLoading(true);
            const deptRes = await api.get('/admin/departments');
            const currentDept = deptRes.data.find(d => d._id === id);
            setDepartment(currentDept);

            const facultyRes = await api.get(`/admin/departments/${id}/faculty`);
            setFaculty(facultyRes.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    if (loading) return <div className="page-container">Loading Department Details...</div>;
    if (!department) return <div className="page-container">Department not found.</div>;

    return (
        <div className="page-container" style={{ background: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <button onClick={() => navigate('/admin')} className="btn btn-secondary" style={{ marginBottom: '1rem' }}>
                    ← Back to Dashboard
                </button>
                <div className="card" style={{ padding: '2rem', borderLeft: '5px solid var(--primary)' }}>
                    <h1 style={{ margin: 0, color: '#1e3a8a' }}>{department.name} Department</h1>
                    <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '0.5rem' }}>
                        HOD: <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{department.hodId?.name || 'Not Assigned'}</span>
                    </p>
                </div>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Faculty Members</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {faculty.map(f => (
                        <div key={f._id} style={{
                            padding: '1.5rem',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}>
                            <h3 style={{ margin: 0, color: '#1e293b' }}>{f.name}</h3>
                            <p style={{ margin: '0.25rem 0 1rem 0', color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem' }}>{f.designation}</p>

                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                                <div>✉️ {f.userId?.email}</div>
                                <div>📞 {f.phone || 'N/A'}</div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Skills</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {f.skills?.map(skill => (
                                        <span key={skill} style={{
                                            background: '#f1f5f9',
                                            color: '#475569',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem'
                                        }}>{skill}</span>
                                    ))}
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Workload</span>
                                <span style={{ fontWeight: 'bold' }}>{f.currentHours} / {f.maxHours}h</span>
                            </div>
                        </div>
                    ))}
                    {faculty.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                            No faculty members found in this department.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DepartmentDetails;
