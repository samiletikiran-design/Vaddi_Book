import React, { useState } from 'react';

interface LoginProps {
    onLogin: (mobileNumber: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [mobile, setMobile] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple validation for mobile number format (e.g., 10 digits)
        if (mobile.trim().length >= 10 && mobile.trim().match(/^\d+$/)) {
            onLogin(mobile.trim());
        } else {
            alert('Please enter a valid mobile number (at least 10 digits).');
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-brand-primary">Lender's Ledger</h1>
                    <p className="text-slate-500 mt-2">Sign in or create an account with your mobile number.</p>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
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
                                />
                            </div>
                        </div>
                        
                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                            >
                                Sign In / Sign Up
                            </button>
                        </div>
                    </form>
                </div>
                <p className="text-center text-xs text-slate-500 mt-6">
                    &copy; 2024 Lender's Ledger. All data is saved locally in your browser.
                </p>
            </div>
        </div>
    );
};