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
        <div className="page-container" style={{ background: '#f8fafc', minHeight: '100vh' }}>
            <div className="card flex-between-center" style={{ marginBottom: '2rem', padding: '1.5rem 2rem', borderLeft: '5px solid var(--primary)' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#1e3a8a', fontSize: '1.8rem' }}>{department?.name}</h1>
                    <p style={{ margin: 0, color: '#64748b' }}>Department Overview & Faculty</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Head of Department</div>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{department?.hodId?.name || 'Not Assigned'}</div>
                </div>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Faculty Members</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {faculty.map(f => (
                        <div key={f._id} style={{
                            padding: '1.5rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            background: 'white',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            transition: 'transform 0.2s',
                            cursor: 'pointer'
                        }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{f.name}</h3>
                                <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.7rem', height: 'fit-content' }}>
                                    {f.designation}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
                                {f.email}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span>Workload: <strong>{f.currentHours}</strong>/{f.maxHours} hrs</span>
                                <span style={{
                                    color: (f.currentHours / f.maxHours) >= 1 ? '#ef4444' : (f.currentHours / f.maxHours) >= 0.8 ? '#f59e0b' : '#10b981',
                                    fontWeight: '600'
                                }}>
                                    {(f.currentHours / f.maxHours) >= 1 ? 'Overloaded' : (f.currentHours / f.maxHours) >= 0.8 ? 'Near Capacity' : 'Available'}
                                </span>
                            </div>
                        </div>
                    ))}
                    {faculty.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px', border: '2px dashed #e2e8f0' }}>
                            No faculty members found in this department.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DepartmentDetails;
