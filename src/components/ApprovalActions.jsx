import React, { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import Modal from './Modal';
import { CheckCircle, XCircle, AlertTriangle, Send } from 'lucide-react';

/**
 * Component to handle Claim Approval workflow (Approve, Reject, Revision, Submit).
 * @param {Object} props
 * @param {Object} props.claim - The claim data
 * @param {string} props.id - The claim ID
 * @param {Object} props.user - The current user
 * @param {Function} props.onStatusUpdate - Callback when status changes (receives new partial claim data)
 */
export default function ApprovalActions({ claim, id, user, onStatusUpdate }) {
    const [activeModal, setActiveModal] = useState(null); // 'approve', 'reject', 'revise', 'submit'
    const [actionNote, setActionNote] = useState('');
    const [processingAction, setProcessingAction] = useState(false);

    const openActionModal = (type) => {
        setActionNote('');
        setActiveModal(type);
    };

    const handleConfirmAction = async () => {
        setProcessingAction(true);
        try {
            let updates = {};

            if (activeModal === 'approve') {
                updates = {
                    status: 'approved',
                    approvedAt: Timestamp.now(),
                    approvedBy: user.uid
                };
            } else if (activeModal === 'reject') {
                if (!actionNote.trim()) {
                    alert("Please provide a reason for rejection.");
                    setProcessingAction(false);
                    return;
                }
                updates = {
                    status: 'rejected',
                    rejectedAt: Timestamp.now(),
                    'metadata.rejectionReason': actionNote
                };
            } else if (activeModal === 'revise') {
                if (!actionNote.trim()) {
                    alert("Please provide revision instructions.");
                    setProcessingAction(false);
                    return;
                }
                updates = {
                    status: 'revision_requested',
                    updatedAt: Timestamp.now(),
                    'metadata.rejectionReason': actionNote
                };
            } else if (activeModal === 'submit') {
                updates = {
                    status: 'sent_to_insurance',
                    insuranceSubmittedAt: Timestamp.now()
                };
            }

            await updateDoc(doc(db, 'claims', id), updates);

            // Format updates for local state (convert Timestamps to Dates)
            const localUpdates = { ...updates };
            if (localUpdates.approvedAt) localUpdates.approvedAt = new Date();
            if (localUpdates.rejectedAt) localUpdates.rejectedAt = new Date();
            if (localUpdates.updatedAt) localUpdates.updatedAt = new Date();
            if (localUpdates.insuranceSubmittedAt) localUpdates.insuranceSubmittedAt = new Date();

            // Handle nested metadata update for local state
            if (localUpdates['metadata.rejectionReason']) {
                delete localUpdates['metadata.rejectionReason'];
                localUpdates.metadata = {
                    ...claim.metadata,
                    rejectionReason: actionNote
                };
            }

            onStatusUpdate(localUpdates);
            setActiveModal(null);
        } catch (error) {
            console.error(`Error processing ${activeModal}:`, error);
            alert(`Failed to ${activeModal} claim.`);
        } finally {
            setProcessingAction(false);
        }
    };

    return (
        <div className="card h-full">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Approval Actions</h2>

            {['pending_review', 'under_review', 'submitted'].includes(claim.status) ? (
                <div className="space-y-3">
                    <button
                        onClick={() => openActionModal('approve')}
                        className="btn btn-success w-full flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={20} />
                        Approve Claim
                    </button>
                    <button
                        onClick={() => openActionModal('revise')}
                        className="btn btn-warning w-full flex items-center justify-center gap-2 text-white"
                    >
                        <AlertTriangle size={20} />
                        Request Revision
                    </button>
                    <button
                        onClick={() => openActionModal('reject')}
                        className="btn btn-danger w-full flex items-center justify-center gap-2"
                    >
                        <XCircle size={20} />
                        Reject Claim
                    </button>
                </div>
            ) : claim.status === 'approved' ? (
                <div className="space-y-3">
                    <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-center">
                        <CheckCircle className="text-green-500 mx-auto mb-2" size={24} />
                        <p className="text-sm font-medium text-green-400">Claim Approved</p>
                    </div>
                    <button
                        onClick={() => openActionModal('submit')}
                        className="btn btn-primary w-full flex items-center justify-center gap-2"
                    >
                        <Send size={20} />
                        Submit to Insurance
                    </button>
                </div>
            ) : claim.status === 'sent_to_insurance' ? (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/50 rounded-lg text-center">
                    <Send className="text-indigo-400 mx-auto mb-2" size={24} />
                    <p className="text-sm font-medium text-indigo-300">Submitted to Insurance</p>
                    <p className="text-xs text-indigo-400 mt-1">
                        {claim.insuranceSubmittedAt ? new Date(claim.insuranceSubmittedAt).toLocaleDateString() : 'Just now'}
                    </p>
                </div>
            ) : claim.status === 'rejected' ? (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-center">
                    <XCircle className="text-red-500 mx-auto mb-2" size={24} />
                    <p className="text-sm font-medium text-red-400">Claim Rejected</p>
                </div>
            ) : claim.status === 'revision_requested' ? (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg text-center">
                    <AlertTriangle className="text-yellow-500 mx-auto mb-2" size={24} />
                    <p className="text-sm font-medium text-yellow-400">Revision Requested</p>
                </div>
            ) : null}

            <Modal
                isOpen={!!activeModal}
                onClose={() => !processingAction && setActiveModal(null)}
                title={
                    activeModal === 'approve' ? 'Approve Claim' :
                        activeModal === 'reject' ? 'Reject Claim' :
                            activeModal === 'revise' ? 'Request Revision' :
                                activeModal === 'submit' ? 'Submit to Insurance' : ''
                }
                footer={
                    <>
                        <button
                            onClick={() => setActiveModal(null)}
                            disabled={processingAction}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmAction}
                            disabled={processingAction}
                            className={`px-4 py-2 text-sm text-white rounded-lg transition-colors flex items-center gap-2 ${activeModal === 'approve' ? 'bg-green-600 hover:bg-green-500' :
                                    activeModal === 'reject' ? 'bg-red-600 hover:bg-red-500' :
                                        activeModal === 'revise' ? 'bg-yellow-600 hover:bg-yellow-500' :
                                            'bg-blue-600 hover:bg-blue-500'
                                }`}
                        >
                            {processingAction && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {activeModal === 'approve' ? 'Confirm Approval' :
                                activeModal === 'reject' ? 'Confirm Rejection' :
                                    activeModal === 'revise' ? 'Send Request' :
                                        'Confirm Submission'}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    {activeModal === 'approve' && (
                        <p className="text-gray-300">
                            Are you sure you want to approve this claim? This action will mark the claim as ready for submission.
                        </p>
                    )}

                    {activeModal === 'submit' && (
                        <p className="text-gray-300">
                            Are you sure you want to submit this claim to insurance? This will notify the relevant parties.
                        </p>
                    )}

                    {(activeModal === 'reject' || activeModal === 'revise') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {activeModal === 'reject' ? 'Reason for Rejection' : 'Revision Instructions'}
                            </label>
                            <textarea
                                value={actionNote}
                                onChange={(e) => setActionNote(e.target.value)}
                                className="input w-full min-h-[120px] resize-none"
                                placeholder={activeModal === 'reject'
                                    ? "Explain why this claim is being rejected..."
                                    : "Describe the changes needed..."}
                                autoFocus
                            />
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
