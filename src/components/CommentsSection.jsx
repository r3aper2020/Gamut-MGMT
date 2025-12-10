import React, { useState } from 'react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { MessageSquare, Send } from 'lucide-react';

/**
 * Component to display list of comments and a form to add new ones.
 * @param {Object} props
 * @param {string} props.claimId - The ID of the claim
 * @param {Array} props.comments - List of comment objects
 * @param {Object} props.user - Current user object
 */
export default function CommentsSection({ claimId, comments, user }) {
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!comment.trim() || submitting) return;

        setSubmitting(true);
        try {
            await addDoc(collection(db, 'comments'), {
                claimId: claimId,
                userId: user.uid,
                text: comment,
                createdAt: Timestamp.now(),
            });
            setComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
            alert("Failed to post comment.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="card h-full max-h-[500px] overflow-y-auto custom-scrollbar">
            <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                <MessageSquare size={20} />
                Comments ({comments.length})
            </h2>

            <div className="space-y-4 mb-6">
                {comments.map((comment) => (
                    <div key={comment.id} className="bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-gray-100">User {comment.userId?.substring(0, 8)}</p>
                            <p className="text-sm text-gray-500">
                                {comment.createdAt?.toDate ? new Date(comment.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                            </p>
                        </div>
                        <p className="text-gray-300">{comment.text}</p>
                    </div>
                ))}
            </div>

            <form onSubmit={handleAddComment} className="space-y-3">
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    className="input resize-none"
                    disabled={submitting}
                />
                <button
                    type="submit"
                    className="btn btn-primary flex items-center gap-2 w-full justify-center"
                    disabled={submitting}
                >
                    <Send size={18} />
                    {submitting ? 'Posting...' : 'Post Comment'}
                </button>
            </form>
        </div>
    );
}
