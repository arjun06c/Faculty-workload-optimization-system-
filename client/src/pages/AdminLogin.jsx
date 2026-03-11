import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import bitLogo from '../Images/bit.png';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { adminLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) return;
        setError('');
        setIsLoading(true);

        try {
            const res = await adminLogin(email, password);
            if (res.success) {
                navigate('/admin/dashboard');
            } else {
                setError(res.error || 'Authentication Failed.');
            }
        } catch (err) {
            console.error('Admin login submit error:', err);
            setError('Authentication Failed. Check credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
            {/* Premium Professional Admin Card - Max 420px width via standard max-w-md */}
            <div 
                className="w-full max-w-md bg-white rounded-2xl shadow-xl flex flex-col items-center border border-slate-100"
                style={{ maxWidth: '420px', padding: '35px' }}
            >
                
                {/* Header Section */}
                <div className="flex flex-col items-center text-center w-full mb-6">
                    <span className="text-gray-500 text-sm font-semibold tracking-widest mb-2 uppercase">
                        Restricted Access
                    </span>
                    <h1 className="text-gray-900 text-3xl font-bold tracking-tight">
                        Administrator
                    </h1>
                </div>

                {/* Logo Section */}
                <div className="flex justify-center mb-8 w-full">
                    <img
                        src={bitLogo}
                        alt="BIT Logo"
                        style={{ height: '150px', width: 'auto' }}
                        className="object-contain transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                            e.target.src = 'https://upload.wikimedia.org/wikipedia/en/b/b5/Bannari_Amman_Institute_of_Technology_logo.png';
                        }}
                    />
                </div>

                {/* Authentication Form */}
                <div className="w-full flex flex-col">

                    {error && (
                        <div className="w-full p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg font-medium mb-4 text-center">
                            {error}
                        </div>
                    )}

                    {/* Email/Password Fields */}
                    <form onSubmit={handleSubmit} className="w-full flex flex-col">
                        <div className="flex flex-col gap-4" style={{ gap: '16px' }}>
                            <div className="w-full">
                                <input
                                    type="email"
                                    className="w-full h-12 px-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all placeholder-gray-400 text-gray-700"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email Address"
                                    required
                                />
                            </div>
                            <div className="w-full">
                                <input
                                    type="password"
                                    className="w-full h-12 px-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all placeholder-gray-400 text-gray-700"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    required
                                />
                            </div>
                        </div>

                        {/* Login Button */}
                        <div className="w-full mt-8" style={{ marginTop: '32px' }}>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-indigo-200 border-t-white rounded-full animate-spin"></div>
                                        <span>Processing...</span>
                                    </div>
                                ) : (
                                    'Admin Login'
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer Center Section */}
                <div className="mt-8 text-sm text-gray-400 font-medium text-center tracking-wide">
                    © 2026 Admin System
                </div>

            </div>
        </div>
    );
};

export default AdminLogin;
