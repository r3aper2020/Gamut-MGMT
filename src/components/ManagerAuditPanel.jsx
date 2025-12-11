import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function ManagerAuditPanel({ claim }) {
    if (!claim || !claim.lineItems) return null;

    // Audit Logic
    const highValueItems = claim.lineItems.filter(item => item.total > 1000);
    const missingPhotosItems = claim.lineItems.filter(item => !item.linkedPhotoIds || item.linkedPhotoIds.length === 0);
    const userAddedItems = claim.lineItems.filter(item => item.source === 'USER');

    // Check for "Selector" compliance (missing selector)
    const missingSelectorItems = claim.lineItems.filter(item => !item.selector || item.selector.length < 3);

    const hasIssues = highValueItems.length > 0 || missingPhotosItems.length > 0 || missingSelectorItems.length > 0;

    return (
        <div className="card bg-slate-900/50 border-slate-700 mb-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <AlertTriangle className={hasIssues ? "text-orange-500" : "text-green-500"} size={20} />
                Manager QA Audit
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* High Value Warning */}
                <div className={`p-4 rounded-lg border ${highValueItems.length > 0 ? 'bg-orange-950/20 border-orange-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-300">High Value Items</span>
                        {highValueItems.length > 0 ? <AlertCircle size={16} className="text-orange-400" /> : <CheckCircle size={16} className="text-green-500" />}
                    </div>
                    <p className="text-2xl font-bold text-gray-100">{highValueItems.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Items &gt; $1,000</p>
                </div>

                {/* Missing Evidence Warning */}
                <div className={`p-4 rounded-lg border ${missingPhotosItems.length > 0 ? 'bg-red-950/20 border-red-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-300">Missing Evidence</span>
                        {missingPhotosItems.length > 0 ? <AlertCircle size={16} className="text-red-400" /> : <CheckCircle size={16} className="text-green-500" />}
                    </div>
                    <p className="text-2xl font-bold text-gray-100">{missingPhotosItems.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Items with no photos</p>
                </div>

                {/* Xactimate Compliance */}
                <div className={`p-4 rounded-lg border ${missingSelectorItems.length > 0 ? 'bg-yellow-950/20 border-yellow-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-300">Code Issues</span>
                        {missingSelectorItems.length > 0 ? <AlertCircle size={16} className="text-yellow-400" /> : <CheckCircle size={16} className="text-green-500" />}
                    </div>
                    <p className="text-2xl font-bold text-gray-100">{missingSelectorItems.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Missing Xactimate codes</p>
                </div>

                {/* User Added Info */}
                <div className="p-4 rounded-lg border bg-blue-950/20 border-blue-500/30">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-300">Manual Items</span>
                        <Info size={16} className="text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-100">{userAddedItems.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Manually added by user</p>
                </div>
            </div>

            {/* Detailed Flags List */}
            {hasIssues && (
                <div className="mt-6 space-y-3">
                    <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Audit Findings</h4>
                    {highValueItems.map((item, i) => (
                        <div key={`hv-${i}`} className="flex items-center gap-3 text-sm text-orange-300 bg-orange-950/10 p-2 rounded border border-orange-500/20">
                            <AlertTriangle size={14} className="shrink-0" />
                            <span>High Value: <strong>{item.category} / {item.selector}</strong> - ${item.total.toLocaleString()}</span>
                        </div>
                    ))}
                    {missingPhotosItems.map((item, i) => (
                        <div key={`mp-${i}`} className="flex items-center gap-3 text-sm text-red-300 bg-red-950/10 p-2 rounded border border-red-500/20">
                            <AlertTriangle size={14} className="shrink-0" />
                            <span>Missing Photo: <strong>{item.category} / {item.selector || item.description}</strong></span>
                        </div>
                    ))}
                    {missingSelectorItems.map((item, i) => (
                        <div key={`ms-${i}`} className="flex items-center gap-3 text-sm text-yellow-300 bg-yellow-950/10 p-2 rounded border border-yellow-500/20">
                            <AlertTriangle size={14} className="shrink-0" />
                            <span>Missing Code: <strong>{item.description}</strong></span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
