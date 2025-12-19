import React from 'react';
import { DailyPulse } from './DailyPulse';

export const BranchDashboard: React.FC = () => {
    // Uses officeId from URL implicitly via context or just renders Pulse for now

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Re-using DailyPulse for now as the "Hub Pulse" */}
            <DailyPulse />
        </div>
    );
};
