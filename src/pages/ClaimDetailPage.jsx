import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useFirestoreComments } from '../hooks/useFirestore';
import ClaimStatusBadge from '../components/ClaimStatusBadge';
import LineItemRow from '../components/LineItemRow';
import ApprovalActions from '../components/ApprovalActions';
import CommentsSection from '../components/CommentsSection';
import { ArrowLeft, DollarSign, Calendar, Building2, User, MapPin, ImageIcon, MessageSquare, Send, CheckCircle, XCircle, ClipboardList, FileText, CheckCircle2, AlertTriangle, Eye, Plus, X } from 'lucide-react';


import { performAdminAction, checkHealth } from '../services/api';
// import { X } from 'lucide-react'; // Ensure X is imported if used (it seems used in image lightbox)

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

    const [groupBy, setGroupBy] = useState('category'); // 'category' (standard) or 'room'

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

    const [editingItemIndex, setEditingItemIndex] = useState(null);
    const [editedItemData, setEditedItemData] = useState(null);

    // ... existing handlers ...

    const handleEditItem = (index) => {
        setEditingItemIndex(index);
        setEditedItemData({ ...claim.lineItems[index] });
    };

    const handleCancelEdit = () => {
        setEditingItemIndex(null);
        setEditedItemData(null);
    };

    const handleSaveItem = async (index) => {
        try {
            const updatedLineItems = [...claim.lineItems];

            // Recalculate total
            const quantity = parseFloat(editedItemData.quantity) || 0;
            const unitPrice = parseFloat(editedItemData.unitPrice) || 0;
            const total = quantity * unitPrice;

            updatedLineItems[index] = {
                ...editedItemData,
                quantity,
                unitPrice,
                total
            };

            const claimRef = doc(db, 'claims', id);
            await updateDoc(claimRef, {
                lineItems: updatedLineItems,
                amount: updatedLineItems.reduce((acc, item) => acc + item.total, 0)
            });

            setClaim(prev => ({
                ...prev,
                lineItems: updatedLineItems,
                amount: updatedLineItems.reduce((acc, item) => acc + item.total, 0)
            }));

            setEditingItemIndex(null);
            setEditedItemData(null);
        } catch (error) {
            console.error("Error updating line item:", error);
            alert("Failed to save changes.");
        }
    };

    const handleDeleteItem = async (index) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;

        try {
            const updatedLineItems = claim.lineItems.filter((_, i) => i !== index);

            const claimRef = doc(db, 'claims', id);
            await updateDoc(claimRef, {
                lineItems: updatedLineItems,
                amount: updatedLineItems.reduce((acc, item) => acc + item.total, 0)
            });

            setClaim(prev => ({
                ...prev,
                lineItems: updatedLineItems,
                amount: updatedLineItems.reduce((acc, item) => acc + item.total, 0)
            }));
        } catch (error) {
            console.error("Error deleting line item:", error);
            alert("Failed to delete item.");
        }
    };

    const handleAddItem = async () => {
        const newItem = {
            category: 'General',
            description: 'New Item',
            quantity: 1,
            unit: 'EA',
            unitPrice: 0.00,
            total: 0.00,
            adjusterNotes: ''
        };

        try {
            const updatedLineItems = [...(claim.lineItems || []), newItem];

            const claimRef = doc(db, 'claims', id);
            await updateDoc(claimRef, {
                lineItems: updatedLineItems
            });

            setClaim(prev => ({
                ...prev,
                lineItems: updatedLineItems
            }));

            // Automatically enter edit mode for the new item
            setEditingItemIndex(updatedLineItems.length - 1);
            setEditedItemData(newItem);
        } catch (error) {
            console.error("Error adding line item:", error);
            alert("Failed to add new item.");
        }
    };

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
                <button
                    onClick={async () => {
                        try {
                            const res = await performAdminAction();
                            alert("Admin Action Success: " + JSON.stringify(res));
                        } catch (e) {
                            alert("Admin Action Failed: " + e.message);
                        }
                    }}
                    className="btn btn-sm btn-outline-danger"
                >
                    Test Admin Action (Backend)
                </button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-100">{claim.title}</h1>
                    <p className="text-gray-500 mt-1">{claim.claimNumber}</p>
                </div>
                <ClaimStatusBadge status={claim.status} />
            </div>

            {/* Top Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Claim Details (Top Left) */}
                <div className="lg:col-span-2">
                    <div className="card h-full">
                        <h2 className="text-xl font-semibold text-gray-100 mb-4">Claim Details</h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                            <div className={`mt-4 p-4 rounded-lg border ${claim.status === 'revision_requested'
                                ? 'bg-yellow-500/10 border-yellow-500/50'
                                : 'bg-red-500/10 border-red-500/50'
                                }`}>
                                <p className={`text-sm font-medium mb-1 ${claim.status === 'revision_requested' ? 'text-yellow-400' : 'text-red-400'
                                    }`}>
                                    {claim.status === 'revision_requested' ? 'Revision Instructions:' : 'Rejection Reason:'}
                                </p>
                                <p className={`text-sm ${claim.status === 'revision_requested' ? 'text-yellow-200' : 'text-red-300'
                                    }`}>{claim.metadata.rejectionReason}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Approval Actions (Top Right) */}
                <div className="lg:col-span-1">
                    {canApprove && (
                        <ApprovalActions
                            claim={claim}
                            id={id}
                            user={user}
                            onStatusUpdate={(updates) => setClaim(prev => ({ ...prev, ...updates }))}
                        />
                    )}
                </div>

                {/* Comments (Bottom Left) */}
                <div className="lg:col-span-2">
                    <CommentsSection
                        claimId={id}
                        comments={comments}
                        user={user}
                    />
                </div>

                {/* Attachments (Bottom Right) */}
                <div className="lg:col-span-1">
                    <div className="card h-full">
                        <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                            <ImageIcon size={20} />
                            Attachments ({claim.attachments.length})
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {claim.attachments.slice(0, 4).map((attachment, index) => (
                                <div
                                    key={index}
                                    className="relative group cursor-pointer aspect-square"
                                    onClick={() => setSelectedImage(attachment)}
                                >
                                    <img
                                        src={typeof attachment === 'string' ? attachment : attachment.url}
                                        alt={`Attachment ${index + 1}`}
                                        className="w-full h-full object-cover rounded-lg"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                                        <Eye className="text-white opacity-0 group-hover:opacity-100" size={24} />
                                    </div>
                                </div>
                            ))}
                            {claim.attachments.length > 4 && (
                                <button
                                    className="col-span-2 text-sm text-blue-400 hover:text-blue-300 mt-2 hover:underline"
                                    onClick={() => setSelectedImage(claim.attachments[0])}
                                >
                                    View all {claim.attachments.length} attachments
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Full Width Estimate Table */}
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
                            <div className="font-medium text-gray-100 mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <DollarSign size={18} className="text-green-400" />
                                    Estimate Line Items
                                </div>
                                <button
                                    onClick={handleAddItem}
                                    className="btn btn-sm btn-primary flex items-center gap-1 text-xs"
                                >
                                    <Plus size={14} />
                                    Add Item
                                </button>
                            </div>

                            {/* Grouping Toggle */}
                            <div className="flex items-center gap-2 mb-4 bg-slate-800/50 p-1 rounded-lg w-fit">
                                <button
                                    onClick={() => setGroupBy('category')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${groupBy === 'category'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-slate-700'
                                        }`}
                                >
                                    Standard View
                                </button>
                                <button
                                    onClick={() => setGroupBy('room')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${groupBy === 'room'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-slate-700'
                                        }`}
                                >
                                    By Room
                                </button>
                            </div>

                            {(() => {
                                // Prepare items with their original index
                                const itemsWithIndex = claim.lineItems.map((item, index) => ({ ...item, originalIndex: index }));

                                if (groupBy === 'room') {
                                    // Group items
                                    const groups = itemsWithIndex.reduce((acc, item) => {
                                        const room = item.room || 'Unassigned';
                                        if (!acc[room]) acc[room] = [];
                                        acc[room].push(item);
                                        return acc;
                                    }, {});

                                    const sortedRooms = Object.keys(groups).sort((a, b) => {
                                        if (a === 'Unassigned') return 1;
                                        if (b === 'Unassigned') return -1;
                                        return a.localeCompare(b);
                                    });

                                    return (
                                        <div className="space-y-8">
                                            {sortedRooms.map(room => {
                                                const items = groups[room];
                                                const roomTotal = items.reduce((acc, item) => acc + item.total, 0);

                                                return (
                                                    <div key={room} className="bg-slate-800/30 rounded-xl overflow-hidden border border-slate-700/50">
                                                        <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
                                                            <h4 className="font-semibold text-gray-100 flex items-center gap-2 uppercase tracking-wide text-xs">
                                                                <MapPin size={14} className="text-blue-400" />
                                                                {room}
                                                            </h4>
                                                            <div className="text-sm font-medium text-gray-300">
                                                                Subtotal: <span className="text-green-400 ml-1">${roomTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                            </div>
                                                        </div>
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-sm text-left">
                                                                <thead className="bg-slate-900/50 text-gray-400 uppercase text-xs">
                                                                    <tr>
                                                                        <th className="px-4 py-3 whitespace-nowrap">Category</th>
                                                                        <th className="px-4 py-3 w-1/2 min-w-[300px]">Description & Context</th>
                                                                        <th className="px-4 py-3 whitespace-nowrap">Evidence</th>
                                                                        <th className="px-4 py-3 text-right whitespace-nowrap">Qty</th>
                                                                        <th className="px-4 py-3 text-right whitespace-nowrap">Unit Price</th>
                                                                        <th className="px-4 py-3 text-right whitespace-nowrap">Total</th>
                                                                        <th className="px-4 py-3 text-center whitespace-nowrap w-24">Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-700/50">
                                                                    {items.map(item => (
                                                                        <LineItemRow
                                                                            key={item.originalIndex}
                                                                            item={item}
                                                                            idx={item.originalIndex}
                                                                            editingItemIndex={editingItemIndex}
                                                                            editedItemData={editedItemData}
                                                                            setEditedItemData={setEditedItemData}
                                                                            handleEditItem={handleEditItem}
                                                                            handleDeleteItem={handleDeleteItem}
                                                                            handleSaveItem={handleSaveItem}
                                                                            handleCancelEdit={handleCancelEdit}
                                                                            setSelectedImage={setSelectedImage}
                                                                            claim={claim}
                                                                            groupBy={groupBy}
                                                                        />
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Grand Total Footer for Room View */}
                                            <div className="flex justify-end items-center gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                                                <span className="text-gray-400 text-sm uppercase tracking-wider font-semibold">Grand Total</span>
                                                <span className="text-2xl font-bold text-green-400">
                                                    ${claim.lineItems.reduce((acc, item) => acc + item.total, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    // STANDARD VIEW
                                    return (
                                        <div className="overflow-x-auto bg-slate-800/30 rounded-xl border border-slate-700/50">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-800 text-gray-400 uppercase text-xs">
                                                    <tr>
                                                        <th className="px-4 py-3 rounded-tl-lg whitespace-nowrap">Category</th>
                                                        <th className="px-4 py-3 w-1/2 min-w-[300px]">Description & Context</th>
                                                        <th className="px-4 py-3 whitespace-nowrap">Evidence</th>
                                                        <th className="px-4 py-3 text-right whitespace-nowrap">Qty</th>
                                                        <th className="px-4 py-3 text-right whitespace-nowrap">Unit Price</th>
                                                        <th className="px-4 py-3 text-right whitespace-nowrap">Total</th>
                                                        <th className="px-4 py-3 rounded-tr-lg text-center whitespace-nowrap w-24">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-700">
                                                    {itemsWithIndex.map(item => (
                                                        <LineItemRow
                                                            key={item.originalIndex}
                                                            item={item}
                                                            idx={item.originalIndex}
                                                            editingItemIndex={editingItemIndex}
                                                            editedItemData={editedItemData}
                                                            setEditedItemData={setEditedItemData}
                                                            handleEditItem={handleEditItem}
                                                            handleDeleteItem={handleDeleteItem}
                                                            handleSaveItem={handleSaveItem}
                                                            handleCancelEdit={handleCancelEdit}
                                                            setSelectedImage={setSelectedImage}
                                                            claim={claim}
                                                            groupBy={groupBy}
                                                        />
                                                    ))}
                                                    <tr className="bg-slate-800/80 font-semibold text-gray-100">
                                                        <td colSpan="6" className="px-4 py-3 text-right">Grand Total</td>
                                                        <td className="px-4 py-3 text-right text-lg">
                                                            ${claim.lineItems.reduce((acc, item) => acc + item.total, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                }
                            })()}
                        </div>
                    )}
                </div>
            )}



            {/* Image Lightbox */}
            {/* Image Lightbox with Navigation */}
            {
                selectedImage && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <button
                            className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 p-2"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X size={32} />
                        </button>

                        <div
                            className="max-w-6xl w-full h-full flex items-center justify-center relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Prev Button */}
                            <button
                                className="absolute left-0 p-4 text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const currentIndex = claim.attachments.findIndex(a => (a.id || a) === (selectedImage.id || selectedImage));
                                    if (currentIndex > 0) setSelectedImage(claim.attachments[currentIndex - 1]);
                                }}
                                disabled={!claim.attachments || claim.attachments.indexOf(selectedImage) === 0}
                            >
                                <ArrowLeft size={32} />
                            </button>

                            <div className="max-h-[85vh] max-w-[85%] flex flex-col items-center">
                                <img
                                    src={typeof selectedImage === 'string' ? selectedImage : selectedImage.url}
                                    alt="Claim attachment"
                                    className="max-h-[80vh] w-auto object-contain rounded-lg shadow-2xl"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://via.placeholder.com/800x600?text=Image+Load+Error';
                                    }}
                                />
                                <p className="text-gray-300 text-center mt-4 font-medium flex items-center gap-2">
                                    <ImageIcon size={16} />
                                    {claim.attachments.findIndex(a => (a.id || a) === (selectedImage.id || selectedImage)) + 1} of {claim.attachments.length}
                                </p>
                            </div>

                            {/* Next Button */}
                            <button
                                className="absolute right-0 p-4 text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const currentIndex = claim.attachments.findIndex(a => (a.id || a) === (selectedImage.id || selectedImage));
                                    if (currentIndex < claim.attachments.length - 1) setSelectedImage(claim.attachments[currentIndex + 1]);
                                }}
                                disabled={!claim.attachments || claim.attachments.indexOf(selectedImage) === claim.attachments.length - 1}
                            >
                                {/* Re-using ArrowLeft flipped for consistency as ArrowRight import might be missing, checking imports... ArrowRight is NOT imported. Using inline SVG or just ArrowLeft with rotate. */}
                                <ArrowLeft size={32} className="rotate-180" />
                            </button>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
