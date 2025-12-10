import { Building2, Users, FileText, TrendingUp, Calendar } from 'lucide-react';
import { useOrganization } from '../hooks/useOrganization';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function OrganizationPage() {
    const { organization, loading: orgLoading } = useOrganization();

    // We can fetch real stats later, for now mock stats or use zeros
    const totalTeams = 0;
    const totalMembers = 0;
    const totalClaims = 0;
    const totalAmount = 0;

    if (orgLoading) return <div>Loading...</div>;

    if (!organization) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">No Organization Found</h2>
                <Link to="/onboarding" className="btn btn-primary">Setup Organization</Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-100">Organization</h1>
                <p className="text-gray-500 mt-1">Organization overview and settings</p>
            </div>

            {/* Organization Header */}
            <div className="card bg-gradient-to-br from-primary-600 to-primary-700 text-white">
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-slate-900/20 p-4 rounded-xl">
                        <Building2 size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold">{organization.name}</h2>
                        <p className="text-primary-100">Organization ID: {organization.id}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-primary-100 text-sm">Teams</p>
                        <p className="text-2xl font-bold">{totalTeams}</p>
                    </div>
                    <div>
                        <p className="text-primary-100 text-sm">Team Members</p>
                        <p className="text-2xl font-bold">{totalMembers}</p>
                    </div>
                    <div>
                        <p className="text-primary-100 text-sm">Total Claims</p>
                        <p className="text-2xl font-bold">{totalClaims}</p>
                    </div>
                    <div>
                        <p className="text-primary-100 text-sm">Total Amount</p>
                        <p className="text-2xl font-bold">${(totalAmount / 1000).toFixed(0)}K</p>
                    </div>
                </div>
            </div>

            {/* Organization Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-100 mb-4">Organization Details</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b border-slate-700">
                            <span className="text-gray-400">Organization ID</span>
                            <span className="font-medium text-gray-100 font-mono text-xs">{organization.id}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-700">
                            <span className="text-gray-400">Name</span>
                            <span className="font-medium text-gray-100">{organization.name}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-700">
                            <span className="text-gray-400">Timezone</span>
                            <span className="font-medium text-gray-100">{organization.settings?.timezone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-700">
                            <span className="text-gray-400">Currency</span>
                            <span className="font-medium text-gray-100">{organization.settings?.currency || 'USD'}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-gray-400">Created</span>
                            <span className="font-medium text-gray-100">
                                {organization.createdAt ? new Date(organization.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-100 mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                            <div className="bg-blue-500/20 p-2 rounded-lg">
                                <Users className="text-blue-400" size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-400">Active Teams</p>
                                <p className="text-xl font-bold text-gray-100">{totalTeams}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                            <div className="bg-green-500/20 p-2 rounded-lg">
                                <FileText className="text-green-400" size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-400">Total Claims Processed</p>
                                <p className="text-xl font-bold text-gray-100">{totalClaims}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                            <div className="bg-purple-500/20 p-2 rounded-lg">
                                <TrendingUp className="text-purple-400" size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-400">Total Claim Value</p>
                                <p className="text-xl font-bold text-gray-100">${totalAmount.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Teams Overview */}
            <div className="card">
                <h3 className="text-lg font-semibold text-gray-100 mb-4">Teams Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Teams list would go here - removing mocks for now */}
                    <p className="text-gray-400 col-span-full text-center py-4">Teams functionality coming soon.</p>
                </div>
            </div>
        </div>
    );
}
