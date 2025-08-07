import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, ArrowLeft, UserPlus, UserMinus, CheckCircle, XCircle, User, Shield, UserCheck, Search, Edit, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { mockEvents, mockSignups, mockUsers } from '../data/mockData';
import { format } from 'date-fns';

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
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    children,
    confirmText,
    confirmColor
}: ConfirmationModalProps) {
    return (
        <div
            className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
        >
            <div
                className={`bg-white dark:bg-slate-800 p-6 rounded-2xl max-w-md w-full border-4 border-dashed border-orange-200 dark:border-slate-600 transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                    }`}
            >
                <form onSubmit={(e) => {
                    e.preventDefault();
                    onConfirm();
                }}>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 font-caveat">
                        {title}
                    </h3>
                    <div className="text-slate-600 dark:text-slate-300 mb-6">
                        {children}
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors border-2 border-dashed border-slate-300 dark:border-slate-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`flex-1 px-4 py-2 text-white rounded-xl font-medium transition-colors border-2 border-dashed whitespace-nowrap ${confirmColor}`}
                        >
                            {confirmText}
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
}

export function ParticipantManagementModal({ isOpen, onClose, sessionData, sessionSignups, defaultHours }: ParticipantManagementModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [participants, setParticipants] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            const participantData = sessionSignups.map(signup => {
                const user = mockUsers.find(u => u.id === signup.userId);
                return {
                    ...signup,
                    user,
                    tempHours: signup.hoursEarned || defaultHours,
                    tempAttendance: signup.attendance || 'not_marked'
                };
            }).filter(p => p.user);
            setParticipants(participantData);
        }
    }, [isOpen, sessionSignups, defaultHours]);

    const filteredParticipants = participants.filter(p =>
        p.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const updateParticipant = (userId: string, field: string, value: any) => {
        setParticipants(prev => prev.map(p =>
            p.userId === userId ? { ...p, [field]: value } : p
        ));
    };

    const markAllPresent = () => {
        setParticipants(prev => prev.map(p => ({ ...p, tempAttendance: 'present' })));
    };

    const saveAllChanges = () => {
        console.log('Saving all participant changes:', participants);
        alert('All changes saved successfully!');
        onClose();
    };

    const removeUser = (userId: string) => {
        if (confirm('Are you sure you want to remove this user from the session?')) {
            setParticipants(prev => prev.filter(p => p.userId !== userId));
        }
    };

    return (
        <div
            className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
        >
            <div
                className={`bg-white dark:bg-slate-800 p-6 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-4 border-dashed border-orange-200 dark:border-slate-600 transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4 relative'
                    }`}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white font-caveat">
                        Manage Participants
                    </h3>
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
                                className="w-full pl-10 pr-4 py-2 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={markAllPresent}
                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors border-2 border-dashed border-green-400"
                        >
                            <UserCheck className="w-4 h-4" />
                            Mark All Present
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto max-h-72 mb-6">
                    <div className="space-y-3">
                        {
                            filteredParticipants.length == 0 &&
                            <div className="text-center w-full text-slate-400 dark:text-slate-600 p-8">No participants signed up for this session</div>
                        }
                        {filteredParticipants.map((participant) => (
                            <div
                                key={participant.userId}
                                className={`p-4 rounded-lg border-2 border-dashed transition-colors ${(participant.status === 'waitlist' || participant.status === 'cancelled')
                                    ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-500 opacity-60'
                                    : participant.user.role === 'student'
                                        ? 'bg-green-50 dark:bg-slate-700 border-green-200 dark:border-slate-500'
                                        : 'bg-blue-50 dark:bg-slate-700 border-blue-200 dark:border-slate-500'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${participant.user.role === 'student' ? 'bg-green-500' : 'bg-blue-500'
                                            }`}>
                                            {participant.user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    to={`/profile/${participant.user.id}`}
                                                    className="font-medium text-slate-800 dark:text-white hover:text-orange-600 dark:hover:text-orange-400"
                                                >
                                                    {participant.user.name}
                                                </Link>
                                                {participant.status === 'waitlist' && (
                                                    <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded text-xs font-medium">
                                                        Waitlist
                                                    </span>
                                                )}
                                                {participant.status === 'cancelled' && (
                                                    <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded text-xs font-medium">
                                                        Cancelled
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-300">{participant.user.email}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{participant.user.role}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {/* Attendance */}
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Attendance:</label>
                                            <select
                                                value={participant.tempAttendance}
                                                onChange={(e) => updateParticipant(participant.userId, 'tempAttendance', e.target.value)}
                                                className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                                            >
                                                <option value="not_marked">Not Marked</option>
                                                <option value="present">Present</option>
                                                <option value="absent">Absent</option>
                                            </select>
                                        </div>

                                        {/* Hours */}
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Hours:</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="24"
                                                step="0.5"
                                                value={participant.tempHours}
                                                onChange={(e) => updateParticipant(participant.userId, 'tempHours', parseFloat(e.target.value) || 0)}
                                                className="w-16 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                                            />
                                        </div>

                                        {/* Remove User */}
                                        <button
                                            onClick={() => removeUser(participant.userId)}
                                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                            title="Remove from Session"
                                        >
                                            <UserMinus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors border-2 border-dashed border-slate-300 dark:border-slate-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={saveAllChanges}
                        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors border-2 border-dashed border-green-400"
                    >
                        <Save className="w-4 h-4" />
                        Save All Changes
                    </button>
                </div>
            </div>
        </div>
    );
}