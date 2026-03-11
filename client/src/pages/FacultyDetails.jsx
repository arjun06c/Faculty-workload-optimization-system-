import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import bitBackground from '../Images/bitbackround.webp';

const FacultyDetails = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [faculty, setFaculty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({ phone: '', picture: '' });
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);

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

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);

        const formData = new FormData();
        formData.append('picture', file);

        try {
            setUploading(true);
            await api.post('/faculty/upload-picture', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploading(false);
            fetchFacultyDetails();
        } catch (err) {
            setUploading(false);
            alert('Failed to upload image. Please try again.');
            setImagePreview(null);
        }
    };

    const getProfilePicture = () => {
        if (imagePreview) return imagePreview;
        if (faculty?.userId?.picture) {
            const pic = faculty.userId.picture;
            if (pic.startsWith('http')) return pic;
            const serverRoot = api.defaults.baseURL.replace('/api', '');
            return `${serverRoot}${pic}`;
        }
        return null;
    };

    if (error) return <div className="min-h-screen flex items-center justify-center bg-[#f5f6fa] text-red-500 font-medium">{error}</div>;

    return (
        <div className="min-h-screen bg-[#f5f6fa] flex justify-center items-center py-6 px-4 font-['Inter',_'Poppins',_sans-serif] selection:bg-purple-100 selection:text-purple-900">

            {/* Compact Modern Profile Card (Max-Width: 420px) */}
            <div className="w-full max-w-[420px] bg-white rounded-[20px] shadow-[0_12px_45px_rgba(0,0,0,0.08)] flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 mx-auto">

                {/* 1. Header Section: Banner Image with Absolute Avatar */}
                <div className="w-full h-[150px] md:h-[180px] bg-slate-200 relative shrink-0">
                    {bitBackground ? (
                        <img src={bitBackground} alt="Campus Banner" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed]"></div>
                    )}
                    
                    {/* Centered Overlapping Avatar - Absolute Positioned */}
                    <div className="absolute left-1/2 -bottom-[50px] md:-bottom-[60px] -translate-x-1/2 z-10 w-[100px] h-[100px] md:w-[120px] md:h-[120px] shrink-0">
                        <div className="w-full h-full rounded-full border-[4px] border-[#EAB308] shadow-xl overflow-hidden bg-white ring-[4px] ring-white">
                            {loading ? (
                                <div className="w-full h-full bg-slate-200 animate-pulse"></div>
                            ) : getProfilePicture() ? (
                                <img src={getProfilePicture()} alt={faculty?.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-[#3b236b] flex items-center justify-center text-white text-[32px] md:text-[40px] font-bold">
                                    {faculty?.name?.charAt(0)}
                                </div>
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
                                </div>
                            )}
                        </div>

                        {/* Camera Upload Trigger - Anchored to Avatar Corner */}
                        <label className="absolute bottom-0 right-0 md:bottom-1 md:right-1 w-[28px] h-[28px] md:w-[32px] md:h-[32px] bg-white rounded-full flex items-center justify-center cursor-pointer shadow-md border border-slate-100 hover:bg-slate-50 transition-all z-20">
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} disabled={loading} />
                            <svg className="w-[14px] h-[14px] md:w-[16px] md:h-[16px] text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </label>
                    </div>
                </div>

                {/* 2. Profile Information Section (All Content Below Banner) */}
                <div className="flex flex-col px-5 sm:px-6 pt-[60px] md:pt-[75px] pb-8 w-full">
                    
                    {/* Primary Identity Section */}
                    <div className="text-center w-full mb-7">
                        {loading ? (
                            <div className="flex flex-col items-center space-y-2 animate-pulse">
                                <div className="h-6 bg-slate-200 rounded w-40"></div>
                                <div className="h-3 bg-slate-100 rounded w-24"></div>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-[22px] md:text-[24px] font-extrabold text-slate-800 tracking-tight break-words">
                                    {faculty?.name}
                                </h1>
                                <p className="text-[12px] font-bold text-[#7c3aed] uppercase tracking-[0.25em] mt-1 italic">
                                    {faculty?.designation || 'PROFESSOR'}
                                </p>
                                <div className="flex flex-col items-center gap-1.5 mt-4 text-[13px] text-slate-500 font-bold">
                                    <span className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100">ID: <span className="text-slate-700">{faculty?.facultyId || 'FAC-1000'}</span></span>
                                    <a href={`mailto:${faculty?.userId?.email}`} className="text-slate-400 hover:text-[#7c3aed] transition-colors break-all">
                                        {faculty?.userId?.email || 'arjun.ct23@bitsathy.ac.in'}
                                    </a>
                                </div>
                            </>
                        )}
                    </div>

                    {/* 3. Attribute Cards - Responsive Grid Layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                        {/* Department Card */}
                        <div className="bg-[#f8fafc] p-3 rounded-2xl flex flex-col items-center text-center border border-slate-100 hover:bg-white transition-all group">
                            <div className="w-10 h-10 rounded-full bg-[#f3e8ff] flex items-center justify-center mb-2 shrink-0 group-hover:bg-[#7c3aed] transition-colors">
                                <svg className="w-5 h-5 text-[#9333ea] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Dept</span>
                            <span className="text-[11px] font-bold text-slate-800 leading-tight break-words">{faculty?.department?.name || 'Computer Technology'}</span>
                        </div>

                        {/* Contact Card */}
                        <div className="bg-[#f8fafc] p-3 rounded-2xl flex flex-col items-center text-center border border-slate-100 hover:bg-white transition-all group">
                            <div className="w-10 h-10 rounded-full bg-[#eff6ff] flex items-center justify-center mb-2 shrink-0 group-hover:bg-[#3b82f6] transition-colors">
                                <svg className="w-5 h-5 text-[#3b82f6] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Contact</span>
                            <span className="text-[11px] font-bold text-slate-800 leading-tight break-all">{faculty?.phone || '9080846808'}</span>
                        </div>

                        {/* Experience Card */}
                        <div className="bg-[#f8fafc] p-3 rounded-2xl flex flex-col items-center text-center border border-slate-100 hover:bg-white transition-all group sm:col-span-2 md:col-span-1">
                            <div className="w-10 h-10 rounded-full bg-[#fff7ed] flex items-center justify-center mb-2 shrink-0 group-hover:bg-[#f97316] transition-colors">
                                <svg className="w-5 h-5 text-[#f97316] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Exp</span>
                            <span className="text-[11px] font-bold text-slate-800 leading-tight">{faculty?.experience || 0} Yrs</span>
                        </div>
                    </div>

                    {/* 4. Specialized Expertise */}
                    <div className="mb-10 text-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 block">Specialized Expertise</span>
                        <div className="flex flex-wrap justify-center gap-1.5">
                            {faculty?.skills?.length > 0 ? (
                                faculty.skills.map((skill, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-[#f5f3ff] text-[#7c3aed] rounded-full text-[10px] font-bold border border-purple-100 break-words">
                                        {skill}
                                    </span>
                                ))
                            ) : (
                                <span className="text-[#7c3aed] text-[11px] font-bold tracking-tight">IT101 • MECH101 • CSE102</span>
                            )}
                        </div>
                    </div>

                    {/* 5. Control Section - Side-by-Side but Responsive */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="flex-1 h-[48px] bg-[#7c3aed] text-white rounded-xl font-bold text-[14px] shadow-lg shadow-purple-100 hover:bg-[#6d28d9] transition-all tracking-tight"
                        >
                            Edit Profile Details
                        </button>
                        <button
                            onClick={() => navigate('/faculty')}
                            className="flex-1 h-[48px] bg-white text-[#7c3aed] border-2 border-[#7c3aed] rounded-xl font-bold text-[14px] hover:bg-purple-50 transition-all tracking-tight"
                        >
                            Back to Dashboard
                        </button>
                    </div>

                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-[400px] overflow-hidden">
                        <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100 bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800">Edit Profile Details</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="p-6">
                            <div className="space-y-2 mb-6">
                                <label className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide">Phone Number</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-[8px] focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all font-medium text-slate-800 text-[15px]"
                                    value={editForm.phone}
                                    placeholder="Enter your contact number"
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-[12px]">
                                <button type="submit" className="w-full h-[45px] bg-[#6b21a8] text-white rounded-[8px] font-medium text-[15px] hover:bg-[#581c87] transition-colors shadow flex items-center justify-center">
                                    Save Changes
                                </button>
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="w-full h-[45px] bg-white text-slate-600 border border-slate-300 rounded-[8px] font-medium text-[15px] hover:bg-slate-50 transition-colors flex items-center justify-center">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyDetails;
