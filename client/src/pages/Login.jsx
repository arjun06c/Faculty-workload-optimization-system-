import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import bitLogo from '../Images/bit.png';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleRedirect = () => {
        const role = localStorage.getItem('role');
        if (role === 'admin') navigate('/admin');
        else if (role === 'academics') navigate('/academics');
        else if (role === 'faculty') navigate('/faculty');
        else navigate('/');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) return;
        setError('');
        setIsLoading(true);

        try {
            const res = await login(email, password);
            if (res.success) {
                handleRedirect();
            } else {
                setError('Login failed. Please check your email and password.');
            }
        } catch (err) {
            console.error('Login submit error:', err);
            setError('Login failed. Please check your email and password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6 font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Premium Focused Login Card - Exactly 420px width */}
            <div className="w-[420px] bg-gradient-to-b from-white to-gray-50 rounded-[18px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] border border-white p-10 flex flex-col items-center text-center gap-5">

                {/* Clean Modern Login Header */}
                <div className="flex flex-col items-center text-center">
                    <span className="text-slate-400 text-[16px] font-medium tracking-[0.05em] mb-2 uppercase">
                        Faculty Workload Optimization System
                    </span>
                    <h1 className="text-[#0f172a] text-[30px] font-bold tracking-tight leading-tight">
                        Welcome Back
                    </h1>
                </div>

                {/* Centered Logo with Increased Spacing */}
                <div className="mt-6 mb-4">
                    <img
                        src={bitLogo}
                        alt="BIT Logo"
                        className="w-[90px] h-auto object-contain mx-auto opacity-95 transition-all hover:scale-105"
                        onError={(e) => {
                            e.target.src = 'https://upload.wikimedia.org/wikipedia/en/b/b5/Bannari_Amman_Institute_of_Technology_logo.png';
                        }}
                    />
                </div>

                {/* Authentication Form with 320px items */}
                <div className="w-[320px] flex flex-col gap-5">

                    {error && (
                        <div className="w-full p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg font-medium">
                            {error}
                        </div>
                    )}

                    {/* Email/Password Fields */}
                    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
                        <div className="flex flex-col gap-5">
                            <input
                                type="email"
                                className="w-full h-[50px] px-[14px] bg-white border border-[#d9dee7] rounded-[12px] text-[15px] focus:outline-none focus:border-[#2563eb] focus:ring-[3px] focus:ring-[#2563eb]/15 transition-all placeholder:text-slate-400 text-slate-700"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email Address"
                                required
                            />
                            <input
                                type="password"
                                className="w-full h-[50px] px-[14px] bg-white border border-[#d9dee7] rounded-[12px] text-[15px] focus:outline-none focus:border-[#2563eb] focus:ring-[3px] focus:ring-[#2563eb]/15 transition-all placeholder:text-slate-400 text-slate-700"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                required
                            />
                        </div>

                        {/* Continue Button: Green Gradient */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-[48px] bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-[12px] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Processing...</span>
                                </div>
                            ) : (
                                'Continue'
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer and Legal */}
                <div className="text-center text-[11px] text-slate-400 font-medium">
                    © 2026 BITS SATHY
                </div>
            </div>
        </div>
    );
};

export default Login;
