import React from 'react';
import { Info } from 'lucide-react';
import { type Office, type Department } from '@/types/org';
import { type UserProfile } from '@/types/team';

interface JobGeneralInfoProps {
    officeId: string;
    setOfficeId: (id: string) => void;
    departmentId: string;
    setDepartmentId: (id: string) => void;
    offices: Office[];
    departments: Department[];
    profile: UserProfile | null;
    customerName: string;
    setCustomerName: (val: string) => void;
    customerPhone: string;
    setCustomerPhone: (val: string) => void;
    address: string;
    setAddress: (val: string) => void;
    city: string;
    setCity: (val: string) => void;
    state: string;
    setState: (val: string) => void;
    zip: string;
    setZip: (val: string) => void;
    county: string;
    setCounty: (val: string) => void;
    fnolReceivedDate: string;
    setFnolReceivedDate: (val: string) => void;
}

export const JobGeneralInfo: React.FC<JobGeneralInfoProps> = ({
    officeId, setOfficeId,
    departmentId, setDepartmentId,
    offices, departments, profile,
    customerName, setCustomerName,
    customerPhone, setCustomerPhone,
    address, setAddress,
    city, setCity,
    state, setState,
    zip, setZip,
    county, setCounty,
    fnolReceivedDate, setFnolReceivedDate
}) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-accent-electric mb-4">
                <Info size={18} />
                <h3 className="text-sm font-black uppercase tracking-widest">General Info</h3>
            </div>

            {/* Office Context */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase">Office</label>
                    <select
                        value={officeId}
                        onChange={(e) => setOfficeId(e.target.value)}
                        required
                        disabled={Boolean(profile?.officeId)} // Lock if user is bound to an office
                        className={`input-field appearance-none ${profile?.officeId ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <option value="" className="bg-bg-tertiary">Select...</option>
                        {offices.map(o => <option key={o.id} value={o.id} className="bg-bg-tertiary">{o.name}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase">Department</label>
                    <select
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        required
                        disabled={!officeId || !!profile?.departmentId} // Lock if bound to dept (Manager/Member)
                        className={`input-field appearance-none ${(!officeId || !!profile?.departmentId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <option value="" className="bg-bg-tertiary">Select...</option>
                        {departments.map(d => <option key={d.id} value={d.id} className="bg-bg-tertiary">{d.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Customer Name */}
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase">Customer Name</label>
                <input
                    placeholder="Full Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="input-field"
                />
            </div>

            {/* Address Block */}
            <div className="space-y-2 bg-white/5 p-4 rounded-xl border border-white/5">
                <label className="text-[10px] font-bold text-text-muted uppercase">Property Address</label>
                <input
                    placeholder="Street Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="input-field mb-2"
                />
                <div className="grid grid-cols-2 gap-2">
                    <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="input-field" />
                    <input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <input placeholder="ZIP" value={zip} onChange={(e) => setZip(e.target.value)} className="input-field" />
                    <input placeholder="County" value={county} onChange={(e) => setCounty(e.target.value)} className="input-field" />
                </div>
            </div>

            {/* Phone and Date */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase">Phone Number</label>
                    <input
                        placeholder="(555) 555-5555"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="input-field"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase">Job Received (Date & Time)</label>
                    <input
                        type="datetime-local"
                        value={fnolReceivedDate}
                        onChange={(e) => setFnolReceivedDate(e.target.value)}
                        className="input-field"
                    />
                </div>
            </div>
        </div>
    );
};
