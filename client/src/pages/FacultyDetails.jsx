import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const FacultyDetails = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [faculty, setFaculty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({ phone: '', picture: '' });

    useEffect(() => {
        fetchFacultyDetails();
    }, []);

    const fetchFacultyDetails = async () => {
        try {
            setLoading(true);
            const res = await api.get('/faculty/me');
            setFaculty(res.data);
            setEditForm({ phone: res.data.phone || '', picture: res.data.userId?.picture || '' });
            setLoading(false);
        } catch (err) {
            setError('Failed to load profile. Please try again.');
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await api.put('/faculty/update-profile', editForm);
            setIsEditModalOpen(false);
            fetchFacultyDetails();
            alert('Profile updated successfully!');
        } catch (err) {
            alert('Failed to update profile');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-slate-200 border-t-blue-600"></div>
                <span className="text-slate-500 font-medium text-sm tracking-wide">Syncing profile details...</span>
            </div>
        </div>
    );

    if (error) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-red-500 font-medium">{error}</div>;

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center py-12 px-4 sm:px-6 font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Main Centered Container */}
            <div className="w-full max-w-[800px] flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Modern Header Section */}
                <div className="relative bg-white rounded-[32px] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                    {/* Subtle Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-indigo-50/20 opacity-70 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        {/* Avatar with Premium Styling */}
                        <div className="w-40 h-40 rounded-full border-[8px] border-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden mb-6 bg-slate-100 relative group transition-transform hover:scale-[1.03] duration-500">
                            {faculty?.userId?.picture ? (
                                <img src={faculty.userId.picture} alt={faculty.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white text-[64px] font-black italic tracking-tighter shadow-inner">
                                    {faculty?.name?.charAt(0)}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none"></div>
                        </div>

                        {/* Identity & Role Badge */}
                        <div className="mb-8">
                            <h1 className="text-[32px] sm:text-[40px] font-black text-[#0f172a] leading-tight mb-2 tracking-tight">
                                {faculty?.name}
                            </h1>
                            <div className="flex flex-col items-center gap-3">
                                <div className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-2xl text-[14px] font-extrabold uppercase tracking-widest shadow-[0_10px_20px_rgba(37,99,235,0.2)]">
                                    {faculty?.designation || 'Professor'}
                                </div>
                                <p className="text-slate-500 font-bold text-[18px] flex items-center gap-2">
                                    <span className="text-blue-500">🏢</span> {faculty?.department?.name}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-center gap-4 w-full">
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="h-14 px-8 bg-blue-50 text-blue-700 rounded-2xl font-black text-[15px] border border-blue-100/50 shadow-sm hover:bg-blue-100 hover:shadow-md transition-all active:scale-95 flex items-center gap-3 group"
                            >
                                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                Edit Profile
                            </button>
                            <button
                                onClick={() => navigate('/faculty')}
                                className="h-14 px-8 bg-slate-900 text-white rounded-2xl font-black text-[15px] shadow-[0_10px_25px_rgba(15,23,42,0.15)] hover:bg-slate-800 hover:shadow-xl transition-all active:scale-95 flex items-center gap-3 group"
                            >
                                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>

                {/* Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Card 1: Personal Information */}
                    <div className="bg-white rounded-[32px] shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden group hover:shadow-xl hover:border-blue-100 transition-all duration-500">
                        <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
                            <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                            <h2 className="text-[19px] font-black text-[#0f172a] tracking-tight">Personal Details</h2>
                        </div>
                        <div className="p-8 space-y-6">
                            <InfoItem label="Faculty ID" value={faculty?.facultyId || 'FAC-1001'} icon="🆔" />
                            <InfoItem label="Email Address" value={faculty?.userId?.email} icon="📧" />
                            <InfoItem label="Mobile Number" value={faculty?.phone || 'Not Shared'} icon="📱" />
                            <InfoItem label="Home Department" value={faculty?.department?.name} icon="🏠" />
                            <InfoItem label="Designation" value={faculty?.designation} icon="🎓" />
                        </div>
                    </div>

                    {/* Card 2: Professional Insights */}
                    <div className="bg-white rounded-[32px] shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden group hover:shadow-xl hover:border-emerald-100 transition-all duration-500">
                        <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
                            <div className="w-12 h-12 bg-white text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </div>
                            <h2 className="text-[19px] font-black text-[#0f172a] tracking-tight">Professional Insights</h2>
                        </div>
                        <div className="p-8 space-y-6">
                            <InfoItem label="Joining Date" value={faculty?.joiningDate ? new Date(faculty.joiningDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'March 2026'} icon="📅" />
                            <InfoItem label="Total Experience" value={`${faculty?.experience || 0} Years`} icon="⏳" />
                            <InfoItem label="Key Subjects" value={faculty?.subjectsAssigned?.length > 0 ? faculty.subjectsAssigned.join(', ') : 'No data'} icon="📚" />
                            <InfoItem label="Current Classes" value={faculty?.classesHandling?.length > 0 ? faculty.classesHandling.join(', ') : 'Not assigned'} icon="🏫" />

                            <div className="pt-4 mt-4 border-t border-slate-50">
                                <div className="flex justify-between items-center mb-2.5">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        ⚡ Weekly Workload
                                    </span>
                                    <span className="text-[14px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                                        {faculty?.currentHours || 0} / {faculty?.maxHours || 0}h
                                    </span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 shadow-sm"
                                        style={{ width: `${Math.min(((faculty?.currentHours || 0) / (faculty?.maxHours || 1)) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modern Footer */}
                <div className="text-center py-8">
                    <p className="text-[12px] text-slate-400 font-bold uppercase tracking-[0.4em] mb-1 opacity-50">Faculty Information System</p>
                    <p className="text-[14px] text-slate-500 font-extrabold flex items-center justify-center gap-2">
                        <span>🛡️</span> Secure BIT Portal • 2026
                    </p>
                </div>
            </div>

            {/* Premium Interactive Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[6px] z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
                        <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
                            <div>
                                <h3 className="text-[22px] font-black text-[#0f172a] tracking-tight">Edit Profile</h3>
                                <p className="text-[13px] text-slate-400 font-bold">Update your key information</p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm active:scale-95">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="p-10 space-y-8">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Number</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">📱</span>
                                    <input
                                        type="text"
                                        className="w-full pl-12 pr-6 h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-0 focus:border-blue-500 outline-none transition-all font-bold text-[#0f172a] placeholder:text-slate-300"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        placeholder="Mobile number"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Profile Image Link</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">🖼️</span>
                                    <input
                                        type="text"
                                        className="w-full pl-12 pr-6 h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-0 focus:border-blue-500 outline-none transition-all font-bold text-[#0f172a] placeholder:text-slate-300"
                                        value={editForm.picture}
                                        onChange={(e) => setEditForm({ ...editForm, picture: e.target.value })}
                                        placeholder="Direct image URL"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 h-14 text-slate-400 font-extrabold text-[15px] hover:text-slate-800 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 h-14 bg-blue-600 text-white rounded-2xl font-black text-[15px] shadow-[0_10px_20px_rgba(37,99,235,0.2)] hover:bg-blue-700 transition-all active:scale-95"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const InfoItem = ({ label, value, icon }) => (
    <div className="flex flex-col gap-1 group/item">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</span>
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl border border-transparent group-hover/item:border-blue-100 group-hover/item:bg-white transition-all duration-300">
            <span className="text-[16px] group-hover/item:scale-125 transition-transform duration-300">{icon}</span>
            <span className="text-[15px] font-extrabold text-[#334155] group-hover/item:text-[#0f172a] truncate">{value || 'N/A'}</span>
        </div>
    </div>
);

export default FacultyDetails;
