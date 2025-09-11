import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface OTPLoginProps {
    onLogin: (mobileNumber: string) => void;
}

type Step = 'MOBILE' | 'OTP';

export const OTPLogin: React.FC<OTPLoginProps> = ({ onLogin }) => {
    const [step, setStep] = useState<Step>('MOBILE');
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [demoOtp, setDemoOtp] = useState(''); // For demo purposes
    const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        // Simple validation for mobile number format
        if (!mobile.trim().match(/^\d{10,15}$/)) {
            setError('Please enter a valid mobile number (10-15 digits).');
            return;
        }

        setLoading(true);
        
        try {
            const { data, error: rpcError } = await supabase.rpc('generate_otp', {
                mobile_number: mobile.trim()
            });

            if (rpcError) {
                console.error('RPC Error:', rpcError);
                throw new Error('Failed to send OTP. Please try again.');
            }

            if (data && data.success) {
                setStep('OTP');
                setDemoOtp(data.demo_otp); // For demo - remove in production
                setError('');
            } else {
                setError(data?.error || 'Failed to send OTP. Please try again.');
            }
        } catch (err) {
            console.error('Error sending OTP:', err);
            setError(err instanceof Error ? err.message : 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!otp.trim() || otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP.');
            return;
        }

        setLoading(true);
        
        try {
            const { data, error: rpcError } = await supabase.rpc('verify_otp', {
                mobile_number: mobile.trim(),
                otp_code: otp.trim()
            });

            if (rpcError) {
                console.error('RPC Error:', rpcError);
                throw new Error('Failed to verify OTP. Please try again.');
            }

            if (data && data.success) {
                onLogin(mobile.trim());
            } else {
                setError(data?.error || 'Invalid OTP. Please try again.');
                if (data?.attempts_remaining !== undefined) {
                    setAttemptsRemaining(data.attempts_remaining);
                }
            }
        } catch (err) {
            console.error('Error verifying OTP:', err);
            setError(err instanceof Error ? err.message : 'Failed to verify OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setOtp('');
        setError('');
        setAttemptsRemaining(null);
        setLoading(true);
        
        try {
            const { data, error: rpcError } = await supabase.rpc('generate_otp', {
                mobile_number: mobile.trim()
            });

            if (rpcError) {
                console.error('RPC Error:', rpcError);
                throw new Error('Failed to resend OTP. Please try again.');
            }

            if (data && data.success) {
                setDemoOtp(data.demo_otp); // For demo - remove in production
                setError('');
            } else {
                setError(data?.error || 'Failed to resend OTP. Please try again.');
            }
        } catch (err) {
            console.error('Error resending OTP:', err);
            setError(err instanceof Error ? err.message : 'Failed to resend OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToMobile = () => {
        setStep('MOBILE');
        setOtp('');
        setError('');
        setDemoOtp('');
        setAttemptsRemaining(null);
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-brand-primary">Lender's Ledger</h1>
                    <p className="text-slate-500 mt-2">
                        {step === 'MOBILE' 
                            ? 'Enter your mobile number to receive OTP' 
                            : 'Enter the OTP sent to your mobile'
                        }
                    </p>
                </div>
                
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                            {attemptsRemaining !== null && (
                                <div className="text-sm mt-1">
                                    Attempts remaining: {attemptsRemaining}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Demo OTP Display - Remove in production */}
                    {demoOtp && step === 'OTP' && (
                        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                            <strong>Demo OTP:</strong> {demoOtp}
                            <div className="text-sm mt-1">
                                (This is for demo purposes only)
                            </div>
                        </div>
                    )}

                    {step === 'MOBILE' ? (
                        <form onSubmit={handleSendOTP} className="space-y-6">
                            <div>
                                <label htmlFor="mobile" className="block text-sm font-medium text-slate-700">
                                    Mobile Number
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="mobile"
                                        name="mobile"
                                        type="tel"
                                        autoComplete="tel"
                                        required
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                                        placeholder="e.g., 1234567890"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Sending OTP...' : 'Send OTP'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium text-slate-700">
                                    Enter OTP
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="otp"
                                        name="otp"
                                        type="text"
                                        maxLength={6}
                                        required
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-center text-2xl tracking-widest"
                                        placeholder="000000"
                                        disabled={loading}
                                    />
                                </div>
                                <p className="mt-1 text-sm text-slate-500">
                                    OTP sent to {mobile}
                                </p>
                            </div>
                            
                            <div className="space-y-3">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Verifying...' : 'Verify OTP'}
                                </button>
                                
                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        onClick={handleBackToMobile}
                                        disabled={loading}
                                        className="flex-1 py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Change Number
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleResendOTP}
                                        disabled={loading}
                                        className="flex-1 py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Resend OTP
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
                
                <p className="text-center text-xs text-slate-500 mt-6">
                    &copy; 2024 Lender's Ledger. Secure OTP-based authentication.
                </p>
            </div>
        </div>
    );
};