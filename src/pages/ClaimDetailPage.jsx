import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useFirestoreComments } from '../hooks/useFirestore';
import ClaimStatusBadge from '../components/ClaimStatusBadge';
import { ArrowLeft, DollarSign, Calendar, Building2, X, User, MapPin, ImageIcon, MessageSquare, Send, CheckCircle, XCircle, ClipboardList, FileText, CheckCircle2, AlertTriangle, BookOpen, AlertCircle, Eye } from 'lucide-react';

export default function ClaimDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, canApprove } = useAuth();
    const [claim, setClaim] = useState(null);
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const { comments, loading: commentsLoading } = useFirestoreComments(id);
    const [comment, setComment] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        async function fetchClaim() {
            try {
                const claimDoc = await getDoc(doc(db, 'claims', id));
                if (claimDoc.exists()) {
                    const claimData = {
                        id: claimDoc.id,
                        ...claimDoc.data(),
                        submittedAt: claimDoc.data().submittedAt?.toDate(),
                        updatedAt: claimDoc.data().updatedAt?.toDate(),
                    };
                    console.log('DEBUG: Claim Data:', claimData);
                    console.log('DEBUG: Line Items:', claimData.lineItems);
                    console.log('DEBUG: AI Analysis:', claimData.aiAnalysis);
                    setClaim(claimData);

                    // Fetch team data
                    if (claimData.teamId) {
                        const teamDoc = await getDoc(doc(db, 'teams', claimData.teamId));
                        if (teamDoc.exists()) {
                            setTeam({ id: teamDoc.id, ...teamDoc.data() });
                        }
                    }
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching claim:', error);
                setLoading(false);
            }
        }

        fetchClaim();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="mt-4 text-gray-400">Loading claim...</p>
                </div>
            </div>
        );
    }

    if (!claim) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400">Claim not found</p>
                <button onClick={() => navigate('/claims')} className="btn btn-primary mt-4">
                    Back to Claims
                </button>
            </div>
        );
    }

    const handleApprove = () => {
        alert('Claim approved! (This is a mockup - no actual changes made)');
    };

    const handleReject = () => {
        alert('Claim rejected! (This is a mockup - no actual changes made)');
    };

    const handleSubmitToInsurance = () => {
        alert('Claim submitted to insurance! (This is a mockup - no actual changes made)');
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;

        try {
            await addDoc(collection(db, 'comments'), {
                claimId: id,
                userId: user.uid,
                text: comment,
                createdAt: Timestamp.now(),
            });
            setComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/claims')}
                    className="btn btn-secondary flex items-center gap-2"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-100">{claim.title}</h1>
                    <p className="text-gray-500 mt-1">{claim.claimNumber}</p>
                </div>
                <ClaimStatusBadge status={claim.status} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Claim Details */}
                    <div className="card">
                        <h2 className="text-xl font-semibold text-gray-100 mb-4">Claim Details</h2>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-500/20 p-2 rounded-lg">
                                    <DollarSign className="text-blue-400" size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Amount</p>
                                    <p className="font-semibold text-gray-100">${claim.amount.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="bg-purple-500/20 p-2 rounded-lg">
                                    <User className="text-purple-400" size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Team</p>
                                    <p className="font-semibold text-gray-100">{team?.name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="bg-green-500/20 p-2 rounded-lg">
                                    <Calendar className="text-green-400" size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Submitted</p>
                                    <p className="font-semibold text-gray-100">
                                        {new Date(claim.submittedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="bg-orange-500/20 p-2 rounded-lg">
                                    <MapPin className="text-orange-400" size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Property Type</p>
                                    <p className="font-semibold text-gray-100">{claim.propertyType}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-100 mb-2">Description</h3>
                            <p className="text-gray-300 leading-relaxed">{claim.description}</p>
                        </div>

                        {claim.metadata?.rejectionReason && (
                            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                                <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
                                <p className="text-sm text-red-400">{claim.metadata.rejectionReason}</p>
                            </div>
                        )}
                    </div>

                    {/* Damage Assessment & Estimate */}
                    {(claim.aiAnalysis || claim.lineItems?.length > 0) && (
                        <div className="card space-y-6">
                            <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                                <ClipboardList size={20} />
                                Damage Assessment & Estimate
                            </h2>

                            {/* AI Analysis */}
                            {claim.aiAnalysis && (
                                <div className="bg-slate-800/50 rounded-lg p-4 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <h3 className="font-medium text-gray-100 flex items-center gap-2">
                                            <FileText size={18} className="text-blue-400" />
                                            AI Restoration Analysis
                                        </h3>
                                        <div className="flex items-center gap-1 text-sm bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                                            <span>Confidence:</span>
                                            <span className="font-semibold">{Math.round(claim.aiAnalysis.confidenceScore * 100)}%</span>
                                        </div>
                                    </div>

                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        {claim.aiAnalysis.summary}
                                    </p>

                                    {claim.aiAnalysis.restorationInstructions?.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-400">Suggested Actions:</p>
                                            <ul className="space-y-1">
                                                {claim.aiAnalysis.restorationInstructions.map((instruction, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                                                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                                                        {instruction}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Line Items Table */}
                            {claim.lineItems?.length > 0 && (
                                <div>
                                    <h3 className="font-medium text-gray-100 mb-4 flex items-center gap-2">
                                        <DollarSign size={18} className="text-green-400" />
                                        Estimate Line Items
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-800 text-gray-400 uppercase text-xs">
                                                <tr>
                                                    <th className="px-4 py-3 rounded-tl-lg">Category</th>
                                                    <th className="px-4 py-3">Description & Context</th>
                                                    <th className="px-4 py-3">Evidence</th>
                                                    <th className="px-4 py-3 text-right">Qty</th>
                                                    <th className="px-4 py-3 text-right">Unit Price</th>
                                                    <th className="px-4 py-3 text-right rounded-tr-lg">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700">
                                                {claim.lineItems.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-800/30">
                                                        <td className="px-4 py-3 text-gray-400 align-top">{item.category}</td>
                                                        <td className="px-4 py-3 align-top">
                                                            <div className="text-gray-200 font-medium">{item.description}</div>

                                                            {/* AI Reasoning */}
                                                            {item.aiReasoning && (
                                                                <div className="text-xs text-blue-300 mt-1.5 flex items-start gap-1.5">
                                                                    <div className="mt-0.5">✨</div>
                                                                    <span>{item.aiReasoning}</span>
                                                                </div>
                                                            )}

                                                            {/* Reference Standard */}
                                                            {item.referenceSource && (
                                                                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-700/50 border border-slate-600">
                                                                    <BookOpen size={12} className="text-slate-400" />
                                                                    <span className="text-xs text-slate-300 font-medium">{item.referenceSource.code}</span>
                                                                    <span className="text-xs text-slate-500 border-l border-slate-600 pl-1.5">{item.referenceSource.description}</span>
                                                                </div>
                                                            )}

                                                            {/* Clarification Note */}
                                                            {item.userFullfilled && item.clarificationNote && (
                                                                <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-400 bg-amber-400/10 p-2 rounded border border-amber-400/20">
                                                                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                                                    <div>
                                                                        <span className="font-semibold block">User Verified:</span>
                                                                        {item.clarificationNote}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 align-top">
                                                            {/* Linked Photos */}
                                                            {item.linkedPhotoIds?.length > 0 && (
                                                                <div className="flex -space-x-2 overflow-hidden">
                                                                    {item.linkedPhotoIds.map(photoId => {
                                                                        const photo = claim.attachments.find(a => (a.id || a) === photoId || a.id === photoId);
                                                                        const url = typeof photo === 'string' ? photo : photo?.url;
                                                                        if (!url) return null;

                                                                        return (
                                                                            <div
                                                                                key={photoId}
                                                                                className="relative w-10 h-10 rounded-lg border-2 border-slate-900 cursor-pointer hover:scale-110 transition-transform z-0 hover:z-10"
                                                                                onClick={() => setSelectedImage(photo)}
                                                                                title="View Evidence Match"
                                                                            >
                                                                                <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-gray-300 align-top">
                                                            {item.quantity} {item.unit}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-gray-300 align-top">
                                                            ${item.unitPrice.toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-medium text-gray-200 align-top">
                                                            ${item.total.toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-slate-800/80 font-semibold text-gray-100">
                                                    <td colSpan="5" className="px-4 py-3 text-right">Grand Total</td>
                                                    <td className="px-4 py-3 text-right text-lg">
                                                        ${claim.lineItems.reduce((acc, item) => acc + item.total, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="card">
                        <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                            <ImageIcon size={20} />
                            Attachments ({claim.attachments.length})
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {claim.attachments.map((attachment, index) => (
                                <div
                                    key={index}
                                    className="relative group cursor-pointer"
                                    onClick={() => setSelectedImage(attachment)}
                                >
                                    <img
                                        src={typeof attachment === 'string' ? attachment : attachment.url}
                                        alt={`Attachment ${index + 1}`}
                                        className="w-full h-48 object-cover rounded-lg"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                                        <p className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                                            View Image
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Comments */}
                    <div className="card">
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
                                            {new Date(comment.createdAt).toLocaleDateString()}
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
                            />
                            <button type="submit" className="btn btn-primary flex items-center gap-2">
                                <Send size={18} />
                                Add Comment
                            </button>
                        </form>
                    </div>
                </div>

                {/* Approval Panel */}
                {canApprove && (
                    <div className="lg:col-span-1">
                        <div className="card sticky top-24">
                            <h2 className="text-xl font-semibold text-gray-100 mb-4">Approval Actions</h2>

                            {claim.status === 'pending_review' || claim.status === 'under_review' ? (
                                <div className="space-y-3">
                                    <button
                                        onClick={handleApprove}
                                        className="btn btn-success w-full flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={20} />
                                        Approve Claim
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        className="btn btn-danger w-full flex items-center justify-center gap-2"
                                    >
                                        <XCircle size={20} />
                                        Reject Claim
                                    </button>
                                </div>
                            ) : claim.status === 'approved' ? (
                                <div className="space-y-3">
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                                        <CheckCircle className="text-green-400 mx-auto mb-2" size={24} />
                                        <p className="text-sm font-medium text-green-800">Claim Approved</p>
                                    </div>
                                    <button
                                        onClick={handleSubmitToInsurance}
                                        className="btn btn-primary w-full flex items-center justify-center gap-2"
                                    >
                                        <Send size={20} />
                                        Submit to Insurance
                                    </button>
                                </div>
                            ) : claim.status === 'sent_to_insurance' ? (
                                <div className="p-3 bg-indigo-500/10 border border-indigo-500/50 rounded-lg text-center">
                                    <Send className="text-indigo-600 mx-auto mb-2" size={24} />
                                    <p className="text-sm font-medium text-indigo-300">Submitted</p>
                                    <p className="text-xs text-indigo-600 mt-1">
                                        {new Date(claim.insuranceSubmittedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ) : claim.status === 'rejected' ? (
                                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-center">
                                    <XCircle className="text-red-600 mx-auto mb-2" size={24} />
                                    <p className="text-sm font-medium text-red-800">Claim Rejected</p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                )}
            </div>

            {/* Image Lightbox */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="max-w-4xl w-full">
                        <img
                            src={typeof selectedImage === 'string' ? selectedImage : selectedImage.url}
                            alt="Claim attachment"
                            className="w-full h-auto rounded-lg"
                        />
                        <p className="text-white text-center mt-4">Claim Attachment</p>
                    </div>
                </div>
            )}
        </div>
    );
}
