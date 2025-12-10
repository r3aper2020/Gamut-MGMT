import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, User, Briefcase, CheckCircle } from 'lucide-react';
import { createOrganization, updateUserProfile } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { getAuth } from 'firebase/auth';

export default function OnboardingPage() {
    const { user, login, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 1: Profile
    const [jobTitle, setJobTitle] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    // Step 2: Organization
    const [orgName, setOrgName] = useState('');
    const [orgAddress, setOrgAddress] = useState('');
    const [orgIndustry, setOrgIndustry] = useState('');
    const [orgSize, setOrgSize] = useState('1-10');
    const [timezone, setTimezone] = useState('UTC');
    const [currency, setCurrency] = useState('USD');

    const handleStep1 = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await updateUserProfile({ jobTitle, phoneNumber });
            setStep(2);
        } catch (err) {
            setError(err.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleStep2 = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await createOrganization({
                name: orgName,
                address: orgAddress,
                industry: orgIndustry,
                size: orgSize,
                timezone,
                currency
            });

            // Force refresh user to get new organizationId
            await refreshUser();

            navigate('/');
        } catch (err) {
            setError(err.message || "Failed to create organization");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/20 text-primary-400 rounded-2xl mb-4">
                        {step === 1 ? <User size={32} /> : <Building2 size={32} />}
                    </div>
                    <h1 className="text-3xl font-bold text-gray-100">
                        {step === 1 ? 'Your Profile' : 'Organization Setup'}
                    </h1>
                    <p className="text-gray-400 mt-2">
                        {step === 1 ? 'Tell us a bit about yourself.' : 'Tell us about your company.'}
                    </p>
                    <div className="flex justify-center gap-2 mt-4">
                        <div className={`h-2 w-8 rounded-full ${step >= 1 ? 'bg-primary-500' : 'bg-slate-700'}`}></div>
                        <div className={`h-2 w-8 rounded-full ${step >= 2 ? 'bg-primary-500' : 'bg-slate-700'}`}></div>
                    </div>
                </div>

                <div className="card border-slate-700">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleStep1} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Job Title</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-3 text-gray-500" size={18} />
                                    <input
                                        type="text"
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        className="input w-full pl-10"
                                        placeholder="CEO / Founder"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="input w-full"
                                    placeholder="+1 (555) 000-0000"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary w-full flex items-center justify-center gap-2"
                            >
                                {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <>Next Step <ArrowRight size={20} /></>}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleStep2} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Organization Name</label>
                                <input
                                    type="text"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    className="input w-full"
                                    placeholder="Acme Inc."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                                <input
                                    type="text"
                                    value={orgAddress}
                                    onChange={(e) => setOrgAddress(e.target.value)}
                                    className="input w-full"
                                    placeholder="123 Main St, City, Country"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Industry</label>
                                    <input
                                        type="text"
                                        value={orgIndustry}
                                        onChange={(e) => setOrgIndustry(e.target.value)}
                                        className="input w-full"
                                        placeholder="Construction"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Company Size</label>
                                    <select
                                        value={orgSize}
                                        onChange={(e) => setOrgSize(e.target.value)}
                                        className="input w-full bg-slate-800"
                                    >
                                        <option value="1-10">1-10 Employees</option>
                                        <option value="11-50">11-50 Employees</option>
                                        <option value="51-200">51-200 Employees</option>
                                        <option value="201+">200+ Employees</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Timezone</label>
                                    <select
                                        value={timezone}
                                        onChange={(e) => setTimezone(e.target.value)}
                                        className="input w-full bg-slate-800"
                                    >
                                        <option value="UTC">UTC</option>
                                        <option value="America/New_York">Eastern Time (US)</option>
                                        <option value="America/Los_Angeles">Pacific Time (US)</option>
                                        <option value="Europe/London">London</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Currency</label>
                                    <select
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="input w-full bg-slate-800"
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary w-full flex items-center justify-center gap-2"
                            >
                                {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <>Complete Setup <CheckCircle size={20} /></>}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
