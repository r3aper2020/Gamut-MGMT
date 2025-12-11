
import React from 'react';
import { Building2, Calendar, FileText } from 'lucide-react';
import { useOrganization } from '../hooks/useOrganization';
import { Link } from 'react-router-dom';

export default function OrganizationPage() {
    const { organization, loading: orgLoading } = useOrganization();

    if (orgLoading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
    );

    if (!organization) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4 text-gray-100">No Organization Found</h2>
                <Link to="/onboarding" className="btn btn-primary">Setup Organization</Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-100">Organization Settings</h1>
                    <p className="text-gray-500 mt-1">Manage your organization details and configuration</p>
                </div>
            </div>

            {/* Organization Identity Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-inner">
                        <Building2 size={40} className="text-primary-400" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white mb-2">{organization.name}</h2>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
                                <span className="text-primary-400">ID:</span>
                                <span className="font-mono">{organization.id}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
                                <Calendar size={14} />
                                <span>Created {organization.createdAt ? new Date(organization.createdAt).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-8 text-center border-l border-slate-700 pl-8 hidden md:flex">
                        <div>
                            <div className="text-2xl font-bold text-white">{organization.settings?.timezone || 'UTC'}</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Timezone</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{organization.settings?.currency || 'USD'}</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Currency</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                        <Building2 size={20} className="text-primary-400" />
                        Organization Details
                    </h3>
                    <div className="space-y-4 bg-slate-800/30 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-800 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Industry</p>
                                <p className="font-medium text-gray-200">{organization.industry || 'Not set'}</p>
                            </div>
                            <div className="p-3 bg-slate-800 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Company Size</p>
                                <p className="font-medium text-gray-200">{organization.size || 'Not set'}</p>
                            </div>
                            <div className="col-span-2 p-3 bg-slate-800 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Address</p>
                                <p className="font-medium text-gray-200">{organization.address || 'Not set'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Placeholder for more settings like Billing, Integrations etc. */}
                <div className="card opacity-50 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10">
                        <span className="bg-slate-800 text-xs px-3 py-1 rounded-full border border-slate-700 text-gray-400">Coming Soon</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                        <FileText size={20} className="text-primary-400" />
                        Subscription & Billing
                    </h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-800 rounded-lg">
                            <div className="h-4 bg-slate-700 rounded w-1/3 mb-2"></div>
                            <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
