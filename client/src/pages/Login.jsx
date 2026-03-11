import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import bitLogo from '../Images/bit.png';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleRedirect = (role) => {
        if (role === 'academics') navigate('/academic/dashboard');
        else if (role === 'faculty') navigate('/faculty/dashboard');
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
                if (res.role === 'admin') {
                    setError('Admins must use the dedicated Admin Portal.');
                    localStorage.clear();
                } else {
                    handleRedirect(res.role);
                }
            } else {
                setError(res.error || 'Login failed. Please check your email and password.');
            }
        } catch (err) {
            console.error('Login submit error:', err);
            setError('Login failed. Please check your email and password.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setIsLoading(true);
        setError('');
        try {
            const res = await loginWithGoogle(credentialResponse.credential);
            if (res.success) {
                handleRedirect(res.role);
            } else {
                setError(res.error || 'Unauthorized user');
            }
        } catch (err) {
            console.error('Google login error:', err);
            setError('Google login failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Google Login Failed');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
            <div 
                className="w-full max-w-md bg-white rounded-2xl shadow-xl flex flex-col items-center border border-slate-100"
                style={{ maxWidth: '420px', padding: '35px' }}
            >
                
                {/* Header Section */}
                <div className="flex flex-col items-center text-center w-full mb-6">
                    <span className="text-gray-500 text-[11px] font-bold tracking-widest mb-2 uppercase">
                        Faculty Workload Optimization System
                    </span>
                    <h1 className="text-gray-900 text-2xl font-bold tracking-tight">
                        Welcome Back
                    </h1>
                </div>

                {/* Logo Section */}
                <div className="flex justify-center mb-8 w-full">
                    <img
                        src={bitLogo}
                        alt="BIT Logo"
                        style={{ height: '150px', width: 'auto' }}
                        className="object-contain"
                        onError={(e) => {
                            e.target.src = 'https://upload.wikimedia.org/wikipedia/en/b/b5/Bannari_Amman_Institute_of_Technology_logo.png';
                        }}
                    />
                </div>

                {/* Authentication Form */}
                <div className="w-full flex flex-col gap-3">

                    {error && (
                        <div className="w-full p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg font-medium text-center">
                            {error}
                        </div>
                    )}

                    {/* Email/Password Fields and Login Button */}
                    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
                        <div className="flex flex-col gap-5">
                            <div className="w-full">
                                <input
                                    type="email"
                                    className="w-full h-12 px-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all placeholder-gray-400 text-gray-700 font-medium shadow-sm"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email Address"
                                    required
                                />
                            </div>
                            <div className="w-full">
                                <input
                                    type="password"
                                    className="w-full h-12 px-4 py-3 bg-white border border-gray-300 rounded-xl text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all placeholder-gray-400 text-gray-700 font-medium shadow-sm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    required
                                />
                            </div>
                        </div>

                        {/* Login Button */}
                        <div className="w-full">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center text-base"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-blue-200 border-t-white rounded-full animate-spin"></div>
                                        <span>Authenticating...</span>
                                    </div>
                                ) : (
                                    'Login to Dashboard'
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Separator */}
                    <div className="w-full">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-gray-200"></div>
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">OR</span>
                            <div className="flex-1 h-px bg-gray-200"></div>
                        </div>
                    </div>

                    {/* Google Login Button */}
                    <div className="w-full flex justify-center">
                        <div className="w-[350px] flex justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                theme="outline"
                                size="large"
                                width="350"
                                shape="pill"
                                text="continue_with"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Center Section */}
                <div className="mt-10 text-sm text-gray-400 font-medium text-center tracking-wide">
                    © 2026 BITS SATHY
                </div>

            </div>
        </div>
    );
};

export default Login;
