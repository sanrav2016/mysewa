import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, ArrowLeft, UserPlus, UserMinus, CheckCircle, XCircle, User, Shield, UserCheck, Search, Edit, Save, Undo2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { usersAPI, signupsAPI } from '../services/api';
import { format } from 'date-fns';
import LoadingSpinner from './LoadingSpinner';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: any;
    confirmText: string;
    confirmColor: string;
    cancelReason?: string;
    setCancelReason?: (val: string) => void;
    isLoading?: boolean;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    children,
    confirmText,
    confirmColor,
    isLoading = false
}: ConfirmationModalProps) {
    return (
        <div
            className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
        >
            <div
                className={`bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-xl max-w-lg w-full max-h-[90vh] border border-slate-200 dark:border-slate-700/50 transform transition-all ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                    }`}
            >
                <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!isLoading) {
                        onConfirm();
                    }
                }}>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                        {title}
                    </h3>
                    <div className="text-slate-600 dark:text-slate-300 mb-4 text-sm overflow-y-auto max-h-[calc(90vh-200px)]">
                        {children}
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className={`flex-1 px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`flex-1 px-3 py-2 text-white rounded-lg font-medium transition-all hover:scale-105 whitespace-nowrap text-sm ${confirmColor} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Processing...
                                </div>
                            ) : (
                                confirmText
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface ParticipantManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    sessionData: any;
    sessionSignups: any[];
    defaultHours: number;
    onDataUpdate?: () => void;
    userRole?: string;
}

export function ParticipantManagementModal({ isOpen, onClose, sessionData, sessionSignups, defaultHours, onDataUpdate, userRole }: ParticipantManagementModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { addNotification } = useNotification();
    const isAdmin = userRole === 'ADMIN';
    const isParent = userRole === 'PARENT';

    useEffect(() => {
        const loadParticipants = async () => {
            if (!isOpen) return;

            setLoading(true);
            try {
                const response = await usersAPI.getAll();
                const users = response.users || [];
                const participantData = sessionSignups.map(signup => {
                    const user = users.find((u: any) => u.id === signup.userId);
                    return {
                        ...signup,
                        user,
                        tempHours: signup.hoursEarned || defaultHours,
                        tempAttendance: signup.attendance || 'NOT_MARKED'
                    };
                }).filter(p => p.user);
                setParticipants(participantData);
            } catch (error) {
                console.error('Failed to load participants:', error);
            } finally {
                setLoading(false);
            }
        };

        loadParticipants();
    }, [isOpen, sessionSignups, defaultHours]);

    // Reload participants when sessionSignups changes
    useEffect(() => {
        if (isOpen && sessionSignups.length > 0) {
            const loadParticipants = async () => {
                setLoading(true);
                try {
                    const response = await usersAPI.getAll();
                    const users = response.users || [];
                    const participantData = sessionSignups.map(signup => {
                        const user = users.find((u: any) => u.id === signup.userId);
                        return {
                            ...signup,
                            user,
                            tempHours: signup.hoursEarned || defaultHours,
                            tempAttendance: signup.attendance || 'NOT_MARKED'
                        };
                    }).filter(p => p.user);
                    setParticipants(participantData);
                } catch (error) {
                    console.error('Failed to reload participants:', error);
                } finally {
                    setLoading(false);
                }
            };
            loadParticipants();
        }
    }, [sessionSignups, isOpen, defaultHours]);

    const filteredParticipants = participants.filter(p =>
        p.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const updateParticipant = (userId: string, field: string, value: any) => {
        setParticipants(prev => prev.map(p => {
            if (p.userId === userId) {
                const updatedParticipant = { ...p, [field]: value };
                
                // Auto-set hours to 0 when marked absent
                if (field === 'tempAttendance' && value === 'ABSENT') {
                    updatedParticipant.tempHours = 0;
                }
                
                return updatedParticipant;
            }
            return p;
        }));
    };

    const markAllPresent = () => {
        setParticipants(prev => prev.map(p =>
            p.markedForRemoval ? p : { ...p, tempAttendance: 'present' }
        ));
    };

    const saveAllChanges = async () => {
        try {
            setLoading(true);

            // Process removals first (only for admins)
            const participantsToRemove = participants.filter(p => p.markedForRemoval);
            const remainingParticipants = participants.filter(p => !p.markedForRemoval);

            let result;
            let message = '';

            if (isAdmin) {
                // Admins can remove and update
                result = await signupsAPI.bulkUpdateWithRemovals({
                    removals: participantsToRemove.map(p => p.id),
                    updates: remainingParticipants.map(participant => ({
                        id: participant.id,
                        attendance: participant.tempAttendance,
                        hoursEarned: participant.tempHours
                    }))
                });

                const removedCount = participantsToRemove.length;
                const updatedCount = remainingParticipants.length;

                if (removedCount > 0 && updatedCount > 0) {
                    message = `${updatedCount} participants updated and ${removedCount} participants removed successfully!`;
                } else if (removedCount > 0) {
                    message = `${removedCount} participants removed successfully!`;
                } else {
                    message = `${updatedCount} participants updated successfully!`;
                }
            } else if (isParent) {
                // Parents can only update attendance and hours
                result = await signupsAPI.parentBulkUpdate(
                    sessionData.id,
                    remainingParticipants.map(participant => ({
                        id: participant.id,
                        attendance: participant.tempAttendance,
                        hoursEarned: participant.tempHours
                    }))
                );

                message = `${remainingParticipants.length} participants updated successfully!`;
            }

            addNotification('success', 'Changes Saved', message);

            // Trigger parent update if callback provided
            if (onDataUpdate) {
                onDataUpdate();
            }
            onClose();
        } catch (error: any) {
            console.error('Failed to save participant changes:', error);
            addNotification('error', 'Save Failed', error.toString() || 'Failed to save changes. Please try again.', false);
        } finally {
            setLoading(false);
        }
    };

    const removeUser = (userId: string) => {
        // Mark user for removal locally - will be processed when "Save Changes" is clicked
        setParticipants(prev => prev.map(p =>
            p.userId === userId ? { ...p, markedForRemoval: true } : p
        ));
    };

    const undoRemoveUser = (userId: string) => {
        // Unmark user for removal
        setParticipants(prev => prev.map(p =>
            p.userId === userId ? { ...p, markedForRemoval: false } : p
        ));
    };

    return (
        <div
            className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
        >
            <div
                className={`bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700/50 transform transition-all ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4 relative'
                    }`}
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                            Manage Participants
                        </h3>
                        {isParent && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                You can mark attendance and update hours. Only admins can remove participants.
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search participants..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={markAllPresent}
                            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:shadow-md text-white px-3 py-2 rounded-lg font-medium transition-all hover:scale-105 text-sm"
                        >
                            <UserCheck className="w-4 h-4" />
                            Mark All Present
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto max-h-72 mb-6">
                    {loading ? (
                        <div className="text-center w-full text-slate-400 dark:text-slate-600 p-8">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : (
                    <div className="space-y-3">
                        {!loading && filteredParticipants.length === 0 && (
                            <div className="text-center w-full text-slate-400 dark:text-slate-600 p-8">No participants signed up for this session</div>
                        )}
                        {filteredParticipants.map((participant) => (
                            <div
                                key={participant.userId}
                                className={`p-3 rounded-lg border transition-all hover:shadow-sm ${participant.markedForRemoval
                                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 opacity-75'
                                    : (participant.status === 'WAITLIST' || participant.status === 'WAITLIST_PENDING' || participant.status === 'CANCELLED')
                                        ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-500 opacity-60'
                                        : participant.user.role === 'STUDENT'
                                            ? 'bg-green-50 dark:bg-slate-700 border-green-200 dark:border-slate-500 hover:border-green-300'
                                            : 'bg-blue-50 dark:bg-slate-700 border-blue-200 dark:border-slate-500 hover:border-blue-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    {/* Left side - User info */}
                                    <div className="flex items-center gap-3 flex-1">
                                        {/* Avatar */}
                                        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${participant.user.role === 'STUDENT' ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'
                                            }`}>
                                            {participant.user.name.charAt(0)}
                                        </div>

                                        {/* User details */}
                                        <div className="flex-1 min-w-0">
                                            {/* Name and status badges */}
                                            <div className="flex items-center gap-2 mb-1">
                                                <Link
                                                    to={`/profile/${participant.user.id}`}
                                                    className="font-semibold text-slate-800 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                >
                                                    {participant.user.name}
                                                </Link>

                                                {/* Status badges */}
                                                <div className="flex items-center gap-1">
                                                    {participant.status === 'CONFIRMED' && (
                                                        <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-0.5 rounded-full text-xs font-medium border border-green-200 dark:border-green-700">
                                                            Confirmed
                                                        </span>
                                                    )}
                                                    {participant.status === 'WAITLIST' && (
                                                        <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-full text-xs font-medium border border-yellow-200 dark:border-yellow-700">
                                                            Waitlist
                                                        </span>
                                                    )}
                                                    {participant.status === 'WAITLIST_PENDING' && (
                                                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-700">
                                                            Pending Response
                                                        </span>
                                                    )}
                                                    {participant.status === 'CANCELLED' && (
                                                        <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-0.5 rounded-full text-xs font-medium border border-red-200 dark:border-red-700">
                                                            Cancelled
                                                        </span>
                                                    )}
                                                    {participant.markedForRemoval && (
                                                        <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-0.5 rounded-full text-xs font-medium border border-red-200 dark:border-red-700">
                                                            Will be removed
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Contact and role info */}
                                            <div className="flex items-center gap-4 mb-1">
                                                <p className="text-sm text-slate-600 dark:text-slate-300">{participant.user.email}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize font-medium">{participant.user.role.toLowerCase()}</p>
                                            </div>

                                            {/* Timeline info */}
                                            <div className="flex items-center gap-4">
                                                {participant.signupDate && (
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400" title={new Date(participant.signupDate).toLocaleString()}>
                                                            Signed up: {new Date(participant.signupDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                )}
                                                {participant.cancelledAt && participant.status === 'CANCELLED' && (
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                                                        <p className="text-xs text-red-600 dark:text-red-400 font-medium" title={new Date(participant.cancelledAt).toLocaleString()}>
                                                            Cancelled: {new Date(participant.cancelledAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right side - Controls */}
                                    <div className="flex items-center gap-3 ml-4">
                                        {/* Attendance and Hours Controls */}
                                        <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-600">
                                            {/* Attendance */}
                                            <div className="flex items-center gap-1">
                                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                    Attendance:
                                                </label>
                                                <select
                                                    value={participant.tempAttendance}
                                                    onChange={(e) => updateParticipant(participant.userId, 'tempAttendance', e.target.value)}
                                                    disabled={participant.markedForRemoval}
                                                    className={`px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-xs focus:ring-1 focus:ring-indigo-400 dark:focus:ring-indigo-500 focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors ${participant.markedForRemoval ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-400 dark:hover:border-slate-500'}`}
                                                >
                                                    <option value="NOT_MARKED">Not Marked</option>
                                                    <option value="PRESENT">Present</option>
                                                    <option value="ABSENT">Absent</option>
                                                </select>
                                            </div>

                                            {/* Hours */}
                                            <div className="flex items-center gap-1">
                                                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                    Hours:
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="24"
                                                    step="0.5"
                                                    value={participant.tempHours}
                                                    onChange={(e) => updateParticipant(participant.userId, 'tempHours', parseFloat(e.target.value) || 0)}
                                                    disabled={participant.markedForRemoval}
                                                    className={`w-12 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-xs focus:ring-1 focus:ring-indigo-400 dark:focus:ring-indigo-500 focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors text-center font-semibold ${participant.markedForRemoval ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-400 dark:hover:border-slate-500'}`}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>

                                        {/* Remove/Undo button - Admin only */}
                                        {isAdmin && (
                                            <button
                                                onClick={() => participant.markedForRemoval ? undoRemoveUser(participant.userId) : removeUser(participant.userId)}
                                                className={`p-1.5 rounded transition-all hover:scale-105 ${participant.markedForRemoval
                                                        ? "text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30"
                                                        : "text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
                                                    }`}
                                                title={participant.markedForRemoval ? "Undo Remove" : "Remove from Session"}
                                            >
                                                {participant.markedForRemoval ? (
                                                    <Undo2 className="w-4 h-4" />
                                                ) : (
                                                    <UserMinus className="w-4 h-4" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>)}
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className={`px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={saveAllChanges}
                        disabled={loading}
                        className={`flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:shadow-md text-white px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save All Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}