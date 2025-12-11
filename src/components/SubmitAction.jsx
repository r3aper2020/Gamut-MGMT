import React, { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import Modal from './Modal';
import { Send, RotateCcw } from 'lucide-react';

export default function SubmitAction({ claim, id, user, onStatusUpdate }) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Determine mode based on status
    const isResubmit = claim.status === 'revision_requested';
    const actionLabel = isResubmit ? 'Submit Revisions' : 'Submit Claim';
    const ActionIcon = isResubmit ? RotateCcw : Send;

    const handleSubmit = async () => {
        setProcessing(true);
        try {
            const updates = {
                status: 'submitted',
                submittedAt: Timestamp.now(), // Update submission time
                'metadata.lastAction': isResubmit ? 'Users resubmitted revisions' : 'User submitted claim'
            };

            await updateDoc(doc(db, 'claims', id), updates);

            // Local state update
            const localUpdates = { ...updates };
            localUpdates.submittedAt = new Date();

            if (onStatusUpdate) onStatusUpdate(localUpdates);
            setShowConfirm(false);
        } catch (error) {
            console.error("Error submitting claim:", error);
            alert("Failed to submit claim.");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="card h-full flex flex-col justify-center">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">Actions</h2>

            <p className="text-sm text-gray-400 mb-4">
                {isResubmit
                    ? "You have addressed the requested revisions. Submit for re-evaluation?"
                    : "Claim is in draft mode. Submit to manager for review?"
                }
            </p>

            <button
                onClick={() => setShowConfirm(true)}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
                <ActionIcon size={20} />
                {actionLabel}
            </button>

            <Modal
                isOpen={showConfirm}
                onClose={() => !processing && setShowConfirm(false)}
                title={actionLabel}
                footer={
                    <>
                        <button
                            onClick={() => setShowConfirm(false)}
                            disabled={processing}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={processing}
                            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2"
                        >
                            {processing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            Confirm Submission
                        </button>
                    </>
                }
            >
                <p className="text-gray-300">
                    Are you sure you want to {isResubmit ? "resubmit" : "submit"} this claim?
                    It will be moved to the <strong>New Submissions</strong> queue for manager review.
                </p>
            </Modal>
        </div>
    );
}
