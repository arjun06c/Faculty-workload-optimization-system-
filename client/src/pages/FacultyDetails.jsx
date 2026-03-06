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

        // Instant Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload to Backend
        const formData = new FormData();
        formData.append('picture', file);

        try {
            setUploading(true);
            const res = await api.post('/faculty/upload-picture', formData, {
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
            // The baseURL in axios includes '/api', we need the root server URL for uploads
            const serverRoot = api.defaults.baseURL.replace('/api', '');
            return `${serverRoot}${pic}`;
        }
        return null;
    };

    // Removed early loading return to allow instant layout render

    if (error) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-red-500 font-medium">{error}</div>;

    return (
        <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center py-20 px-4 font-sans selection:bg-purple-100 selection:text-purple-900">
            {/* Centered Profile Card - 420px Max Width */}
            <div className="w-full max-w-[420px] bg-white rounded-[20px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8 relative">

                {/* Top Cover Image - 180px Height */}
                <div className="h-[180px] w-full relative overflow-hidden">
                    <img
                        src={bitBackground}
                        alt="BIT Campus"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/5"></div>
                </div>

                {/* Profile Image - Centered and Half Overlapping (130x130px) */}
                <div className="flex justify-center -mt-[65px] relative px-6 z-10">
                    <div className="relative group">
                        <div className="w-[130px] h-[130px] rounded-full border-[5px] border-white shadow-lg overflow-hidden bg-slate-50 ring-[4px] ring-[#EAB308]">
                            {loading ? (
                                <div className="w-full h-full bg-slate-200 animate-pulse"></div>
                            ) : getProfilePicture() ? (
                                <img src={getProfilePicture()} alt={faculty?.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-[#3b236b] flex items-center justify-center text-white text-[54px] font-black italic shadow-inner">
                                    {faculty?.name?.charAt(0)}
                                </div>
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                                </div>
                            )}
                        </div>

                        {/* Profile Photo Upload Trigger - Small Camera Icon */}
                        <label className="absolute bottom-1 right-1 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-yellow-600 hover:scale-110 active:scale-95 transition-all border-[3px] border-white">
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} disabled={loading} />
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </label>
                    </div>
                </div>

                {/* Information Section - All Centered */}
                <div className="flex flex-col items-center px-8 mt-6 text-center">
                    {loading ? (
                        <div className="flex flex-col items-center w-full space-y-3 animate-pulse">
                            <div className="h-8 bg-slate-200 rounded-full w-48"></div>
                            <div className="h-5 bg-slate-100 rounded-full w-32 mt-1"></div>
                            <div className="h-8 bg-slate-100 rounded-lg w-40 mt-4"></div>
                            <div className="h-5 bg-slate-100 rounded-full w-full max-w-[200px] mt-4"></div>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-[26px] font-black text-[#3b236b] leading-tight">
                                {faculty?.name}
                            </h1>
                            <p className="text-[18px] font-bold text-[#3d2b7c] mt-1.5 uppercase tracking-wide">
                                {faculty?.designation || 'Professor'}
                            </p>

                            <div className="mt-4 py-1.5 px-4 bg-purple-50 rounded-lg">
                                <p className="text-[14px] font-black text-purple-700 tracking-wide font-serif italic uppercase">
                                    AICTE ID: <span className="font-extrabold not-italic">{faculty?.facultyId || '1-2659955023'}</span>
                                </p>
                            </div>

                            <a href={`mailto:${faculty?.userId?.email}`} className="mt-4 text-[15px] font-bold text-[#5b4699] hover:underline decoration-2 underline-offset-4">
                                {faculty?.userId?.email}
                            </a>
                        </>
                    )}

                    {/* Secondary Details Section */}
                    <div className="w-full mt-8 space-y-4 pt-6 border-t border-slate-50">
                        {loading ? (
                            <div className="space-y-6 animate-pulse w-full">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex flex-col items-center">
                                        <div className="w-9 h-9 bg-slate-100 rounded-full mb-2"></div>
                                        <div className="h-3 bg-slate-100 w-24 rounded-full mt-1 mb-2"></div>
                                        <div className="h-4 bg-slate-200 w-32 rounded-full"></div>
                                    </div>
                                ))}
                                <div className="flex justify-center gap-2 mt-4 pt-2 border-t border-slate-50">
                                    {[1, 2, 3].map(i => <div key={i} className="h-6 w-16 bg-slate-100 rounded-lg"></div>)}
                                </div>
                            </div>
                        ) : (
                            <>
                                <DetailRowIcon
                                    label="Department"
                                    value={faculty?.department?.name}
                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                                />
                                <DetailRowIcon
                                    label="Contact"
                                    value={faculty?.phone || 'Not Shared'}
                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                                />
                                <DetailRowIcon
                                    label="Years Active"
                                    value={`${faculty?.experience || 0} Years Experience`}
                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                                />
                                <div className="flex flex-col gap-2 pt-1 pb-2">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Expertise & Skills</span>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {faculty?.skills?.length > 0 ? faculty.skills.map((skill, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-[12px] font-bold border border-slate-100">
                                                {skill}
                                            </span>
                                        )) : <span className="text-[13px] font-bold text-slate-400 italic">No skills listed</span>}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full mt-8 space-y-3">
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="w-full py-[12px] bg-white text-[#3b236b] rounded-xl font-black text-[15px] border-2 border-purple-50 hover:bg-purple-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Edit Profile Details
                        </button>
                        <button
                            onClick={() => navigate('/faculty')}
                            className="w-full py-[12px] bg-[#3b236b] text-white rounded-xl font-black text-[15px] hover:bg-[#2d1a51] transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-100"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-[#3b236b]/40 backdrop-blur-[6px] z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
                            <h3 className="text-xl font-black text-[#3b236b] tracking-tight text-center w-full">Update Profile</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="absolute right-8 top-8 w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-red-500 transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="p-10 space-y-7">
                            <div className="space-y-2.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                <input
                                    type="text"
                                    className="w-full px-5 h-13 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-0 focus:border-purple-500 outline-none transition-all font-bold text-[#3b236b]"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 h-13 text-slate-400 font-bold hover:text-slate-800 transition-all">Cancel</button>
                                <button type="submit" className="flex-1 h-13 bg-[#3b236b] text-white rounded-xl font-black shadow-lg shadow-purple-100 hover:bg-[#2d1a51] transition-all">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const DetailRowIcon = ({ label, value, icon }) => (
    <div className="flex flex-col items-center pb-4 border-b border-slate-50 last:border-0 last:pb-0">
        <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-1">
            {icon}
        </div>
        <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</span>
            <span className="text-[14px] font-bold text-slate-700 leading-snug mt-0.5">{value || 'N/A'}</span>
        </div>
    </div>
);

export default FacultyDetails;
