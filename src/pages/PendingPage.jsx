import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function PendingPage() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="card max-w-md w-full text-center space-y-6">
                <div className="p-4 bg-yellow-500/10 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                    <span className="text-4xl">⏳</span>
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-gray-100 mb-2">Account Pending Approval</h1>
                    <p className="text-gray-400">
                        Hello <span className="text-white font-medium">{user?.displayName}</span>, your account is currently under review.
                        Please contact your administrator to approve your access.
                    </p>
                </div>

                <div className="pt-4 border-t border-slate-700">
                    <button
                        onClick={handleLogout}
                        className="btn btn-secondary w-full flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
