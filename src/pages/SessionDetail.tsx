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

function ConfirmationModal({
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
                            className={`flex-1 px-4 py-2 text-white rounded-xl font-medium transition-colors border-2 border-dashed ${confirmColor}`}
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

function ParticipantManagementModal({ isOpen, onClose, sessionData, sessionSignups, defaultHours }: ParticipantManagementModalProps) {
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

    const addUser = () => {
        alert('Add user functionality would open a user selection modal');
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
                        <button
                            onClick={addUser}
                            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors border-2 border-dashed border-blue-400"
                        >
                            <UserPlus className="w-4 h-4" />
                            Add User
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

export default function SessionDetail() {
    const { sessionId } = useParams();
    const { user } = useAuth();
    const { addNotification } = useNotification();
    const navigate = useNavigate();

    const [cancelReason, setCancelReason] = useState('');
    const [showManageModal, setShowManageModal] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [parentSearch, setParentSearch] = useState('');
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        type: 'signup' | 'waitlist' | 'cancel' | 'drop';
        title: string;
        children: any;
        confirmText: string;
        confirmColor: string;
    }>({
        isOpen: false,
        type: 'signup',
        title: '',
        children: <></>,
        confirmText: '',
        confirmColor: ''
    });

    // Find the session and related data
    const sessionData = mockEvents
        .flatMap(event =>
            event.instances.map(instance => ({
                ...instance,
                eventTitle: event.title,
                eventDescription: event.description,
                category: event.category,
                tags: event.tags,
                eventId: event.id,
                createdBy: event.createdBy
            }))
        )
        .find(session => session.id === sessionId);

    if (!sessionData) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-600 dark:text-slate-300">Session not found</p>
                <Link to="/events" className="text-orange-600 dark:text-orange-400 hover:underline">
                    Back to Events
                </Link>
            </div>
        );
    }

    const creator = mockUsers.find(u => u.id === sessionData.createdBy);
    const userSignup = mockSignups.find(signup =>
        signup.userId === user?.id &&
        signup.instanceId === sessionData.id
    );

    // Get all signups for this session
    const sessionSignups = mockSignups.filter(signup => signup.instanceId === sessionData.id);

    const confirmedStudentSignups = sessionSignups.filter(s => s.status === 'confirmed' && mockUsers.find(u => u.id === s.userId)?.role === 'student');
    const confirmedParentSignups = sessionSignups.filter(s => s.status === 'confirmed' && mockUsers.find(u => u.id === s.userId)?.role === 'parent');
    const waitlistStudentSignups = sessionSignups.filter(s => s.status === 'waitlist' && mockUsers.find(u => u.id === s.userId)?.role === 'student');
    const waitlistParentSignups = sessionSignups.filter(s => s.status === 'waitlist' && mockUsers.find(u => u.id === s.userId)?.role === 'parent');

    const isPast = new Date(sessionData.startDate) < new Date();
    const userRole = user?.role;
    const isSignedUp = !!userSignup && userSignup.status === 'confirmed';
    const isOnWaitlist = !!userSignup && userSignup.status === 'waitlist';
    const isCancelled = !!userSignup && userSignup.status === 'cancelled';

    const hasOpenSpots = () => {
        if (userRole === 'student') {
            return confirmedStudentSignups.length < sessionData.studentCapacity;
        } else if (userRole === 'parent') {
            return confirmedParentSignups.length < sessionData.parentCapacity;
        }
        return false;
    };

    const openModal = (type: typeof modalState.type) => {
        let title = '';
        let children: any = '';
        let confirmText = '';
        let confirmColor = '';

        switch (type) {
            case 'signup':
                title = 'Confirm Signup';
                children = (
                    <div className="space-y-2 text-sm font-medium">
                        <div>
                            By signing up for this event, you agree to:
                        </div>
                        <ol className="space-y-2 ml-4 list-disc">
                            <li>Arrive at the event on time wearing your Sewa t-shirt/hoodie.</li>
                            <li>Receive volunteer hours after admin verification of attendance.</li>
                            <li>Coordinate cancellations with any parent volunteers or admins for this event.</li>
                        </ol>
                    </div>
                );
                confirmText = 'Sign Up';
                confirmColor = 'bg-green-500 hover:bg-green-600 border-green-400';
                break;
            case 'waitlist':
                title = 'Join Waitlist';
                children = `Looks like this session is full. Would you like to join the waitlist? If spots open up, you will automatically be registered for the session.`;
                confirmText = 'Join Waitlist';
                confirmColor = 'bg-yellow-500 hover:bg-yellow-600 border-yellow-400';
                break;
            case 'cancel':
                title = 'Cancel Signup';
                children = (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Please choose a reason for cancellation:
                            </p>
                            <select required
                                className="mt-2 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                onChange={(e) => setCancelReason(e.target.value)}
                            >
                                <option value="">Select a reason</option>
                                <option value="scheduling_conflict">Scheduling conflict</option>
                                <option value="not_feeling_well">Not feeling well</option>
                                <option value="transportation_issues">Can't get a ride</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="text-sm font-medium">
                            Cancelling your signup will be reflected in your user history and will relinquish your spot to anyone currently on the session waitlist. Cancelling 24 hours before the event is discouraged.
                        </div>
                    </div>
                );
                confirmText = 'Cancel Signup';
                confirmColor = 'bg-red-500 hover:bg-red-600 border-red-400';
                break;
            case 'drop':
                title = 'Drop from Waitlist';
                children = `Are you sure you want to remove yourself from the waitlist?`;
                confirmText = 'Drop from Waitlist';
                confirmColor = 'bg-red-500 hover:bg-red-600 border-red-400';
                break;
        }

        setModalState({
            isOpen: true,
            type,
            title,
            children,
            confirmText,
            confirmColor
        });
    };

    const handleConfirm = () => {
        // Mock action based on type
        switch (modalState.type) {
            case 'signup':
                addNotification({
                    type: 'signup',
                    title: 'Successfully signed up!',
                    message: `You have been confirmed for ${sessionData.eventTitle}`,
                    eventTitle: sessionData.eventTitle,
                    eventId: sessionData.eventId,
                    sessionId: sessionData.id
                });
                break;
            case 'waitlist':
                addNotification({
                    type: 'waitlist_moved',
                    title: 'Added to waitlist',
                    message: `You have been added to the waitlist for ${sessionData.eventTitle}`,
                    eventTitle: sessionData.eventTitle,
                    eventId: sessionData.eventId,
                    sessionId: sessionData.id
                });
                break;
            case 'cancel':
                addNotification({
                    type: 'event_cancelled',
                    title: 'Signup cancelled',
                    message: `Your signup for ${sessionData.eventTitle} was cancelled.`,
                    eventTitle: sessionData.eventTitle,
                    eventId: sessionData.eventId,
                    sessionId: sessionData.id
                });
                break;
            case 'drop':
                addNotification({
                    type: 'event_updated',
                    title: 'Removed from waitlist',
                    message: `You have been removed from the waitlist for ${sessionData.eventTitle}`,
                    eventTitle: sessionData.eventTitle,
                    eventId: sessionData.eventId,
                    sessionId: sessionData.id
                });
                break;
        }
        setModalState({ ...modalState, isOpen: false });
    };

    const renderParticipantCard = (signup: any, isWaitlist: boolean = false) => {
        const participant = mockUsers.find(u => u.id === signup.userId);
        if (!participant) return null;

        const isStudent = participant.role === 'student';
        const attendanceStatus = signup.attendance;

        return (
            <Link
                key={signup.id}
                to={`/profile/${participant.id}`}
                className={`block p-3 rounded-lg border-2 border-dashed transition-colors ${isWaitlist
                    ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-500 opacity-60 hover:bg-slate-200 dark:hover:bg-slate-600'
                    : isStudent
                        ? 'bg-green-50 dark:bg-slate-700 border-green-200 dark:border-slate-500 hover:bg-green-100 dark:hover:bg-slate-600'
                        : 'bg-blue-50 dark:bg-slate-700 border-blue-200 dark:border-slate-500 hover:bg-blue-100 dark:hover:bg-slate-600'
                    }`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${isStudent ? 'bg-green-500' : 'bg-blue-500'
                            }`}>
                            {participant.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-medium text-slate-800 dark:text-white">{participant.name}</p>
                                {isWaitlist && (
                                    <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded text-xs font-medium">
                                        Waitlist
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{participant.email}</p>
                            {attendanceStatus && (
                                <div className="flex items-center gap-1 mt-1">
                                    {attendanceStatus === 'present' ? (
                                        <>
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            <span className="text-xs text-green-600 font-medium">Present</span>
                                        </>
                                    ) : attendanceStatus === 'absent' ? (
                                        <>
                                            <XCircle className="w-4 h-4 text-red-600" />
                                            <span className="text-xs text-red-600 font-medium">Absent</span>
                                        </>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        );
    };

    const renderActionButton = () => {
        // Hide signup buttons for admins
        if (user?.role === 'admin') {
            return null;
        }

        if (isPast) {
            return (
                <div className="bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400 px-6 py-3 rounded-lg font-medium text-center">
                    Past Session
                </div>
            );
        }

        if (isSignedUp) {
            return (
                <button
                    onClick={() => openModal('cancel')}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium border-2 border-dashed border-red-400 justify-center transition-all hover:scale-105 hover:rotate-1"
                >
                    <UserMinus className="w-4 h-4" />
                    Cancel Signup
                </button>
            );
        }

        if (isOnWaitlist) {
            return (
                <button
                    onClick={() => openModal('drop')}
                    className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium border-2 border-dashed border-yellow-400 justify-center transition-all hover:scale-105 hover:rotate-1"
                >
                    <UserMinus className="w-4 h-4" />
                    Drop from Waitlist
                </button>
            );
        }

        if (isCancelled) {
            if (hasOpenSpots()) {
                return (
                    <button
                        onClick={() => openModal('signup')}
                        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium border-2 border-dashed border-green-400 justify-center transition-all hover:scale-105 hover:rotate-1"
                    >
                        <UserPlus className="w-4 h-4" />
                        Sign Up Again
                    </button>
                );
            } else {
                return (
                    <button
                        onClick={() => openModal('waitlist')}
                        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium border-2 border-dashed border-yellow-400 justify-center transition-all hover:scale-105 hover:rotate-1"
                    >
                        <UserPlus className="w-4 h-4" />
                        Join Waitlist
                    </button>
                );
            }
        }

        if (hasOpenSpots()) {
            return (
                <button
                    onClick={() => openModal('signup')}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium border-2 border-dashed border-green-400 justify-center transition-all hover:scale-105 hover:rotate-1"
                >
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                </button>
            );
        } else {
            return (
                <button
                    onClick={() => openModal('waitlist')}
                    className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium border-2 border-dashed border-yellow-400 justify-center transition-all hover:scale-105 hover:rotate-1"
                >
                    <UserPlus className="w-4 h-4" />
                    Join Waitlist
                </button>
            );
        }
    };

    const filteredStudents = [...confirmedStudentSignups].filter(signup => {
        const participant = mockUsers.find(u => u.id === signup.userId);
        return participant && (
            participant.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
            participant.email.toLowerCase().includes(studentSearch.toLowerCase())
        );
    });

    const filteredParents = [...confirmedParentSignups].filter(signup => {
        const participant = mockUsers.find(u => u.id === signup.userId);
        return participant && (
            participant.name.toLowerCase().includes(parentSearch.toLowerCase()) ||
            participant.email.toLowerCase().includes(parentSearch.toLowerCase())
        );
    });

    return (
        <>
            <div className="space-y-6 p-4 lg:p-8">
                <Link
                    to={`/events/${sessionData.eventId}`}
                    className="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Event
                </Link>

                {/* Session Header */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-lg shadow-lg border-2 border-dashed border-orange-200 dark:border-slate-600">
                    <div className="flex items-start justify-between mb-6 flex-col md:flex-row gap-4 md:flex-1">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 font-caveat">
                                {sessionData.eventTitle}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-lg font-medium">
                                    {sessionData.category}
                                </span>
                                {sessionData.tags.map(tag => (
                                    <span key={tag} className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-sm">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-wrap md:flex-col justify-center md:justify-end gap-3 w-full md:w-auto">
                            {renderActionButton()}
                            {user?.role === 'admin' && (
                                <Link
                                    to={`/edit-session/${sessionData.id}`}
                                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors border-2 border-dashed border-blue-400 justify-center"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit Session
                                </Link>
                            )}
                            {/* Manage Participants Button */}
                            {(user?.role === 'parent' || user?.role === 'admin') && (
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => setShowManageModal(true)}
                                        className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors border-2 border-dashed border-purple-400"
                                    >
                                        <Users className="w-5 h-5" />
                                        Manage Participants
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Session Details */}
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 gap-x-16 p-4 bg-orange-50 dark:bg-slate-700 rounded-lg border-2 border-dashed border-orange-200 dark:border-slate-500">
                        <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                            <Calendar className="w-5 h-5 mt-1" />
                            <div>
                                <p className="font-medium">{format(new Date(sessionData.startDate), 'EEEE, MMM d')}</p>
                                <p className="text-sm">{format(new Date(sessionData.startDate), 'yyyy')}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                            <Clock className="w-5 h-5 mt-1" />
                            <div>
                                <p className="font-medium">
                                    {format(new Date(sessionData.startDate), 'h:mm a')} – {format(new Date(sessionData.endDate), 'h:mm a')}
                                </p>
                                <p className="text-sm">3 volunteer hours</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                            <Users className="w-5 h-5 mt-1" />
                            <div>
                                <p className="font-medium">
                                    {confirmedStudentSignups.length + confirmedParentSignups.length} / {sessionData.studentCapacity + sessionData.parentCapacity} signed up
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                            <MapPin className="w-5 h-5 mt-1" />
                            <div>
                                <p className="font-medium">{sessionData.location}</p>
                            </div>
                        </div>
                    </div>

                    {sessionData.description && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-slate-700 rounded-lg border-2 border-dashed border-blue-200 dark:border-slate-500">
                            <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Session Notes:</h3>
                            <p className="text-slate-600 dark:text-slate-300">{sessionData.description}</p>
                        </div>
                    )}

                    {creator && (
                        <div className="mt-4 p-4 bg-purple-50 dark:bg-slate-700 rounded-lg border-2 border-dashed border-purple-200 dark:border-slate-500">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-white">Created by: {creator.name}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">{creator.email}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Participants */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Students */}
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-lg shadow-lg border-2 border-dashed border-orange-200 dark:border-slate-600">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white font-caveat">
                                Students ({confirmedStudentSignups.length}/{sessionData.studentCapacity})
                            </h2>
                        </div>

                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search students..."
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 max-h-72 overflow-y-auto">
                            {filteredStudents.map(signup =>
                                renderParticipantCard(signup, signup.status === 'waitlist')
                            )}
                            {filteredStudents.length === 0 && (
                                <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                                    {studentSearch ? 'No students match your search' : 'No students signed up'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Parents */}
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-lg shadow-lg border-2 border-dashed border-orange-200 dark:border-slate-600">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white font-caveat">
                                Parents ({confirmedParentSignups.length}/{sessionData.parentCapacity})
                            </h2>
                        </div>

                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search parents..."
                                    value={parentSearch}
                                    onChange={(e) => setParentSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 max-h-72 overflow-y-auto">
                            {filteredParents.map(signup =>
                                renderParticipantCard(signup, signup.status === 'waitlist')
                            )}
                            {filteredParents.length === 0 && (
                                <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                                    {parentSearch ? 'No parents match your search' : 'No parents signed up'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ ...modalState, isOpen: false })}
                onConfirm={handleConfirm}
                title={modalState.title}
                children={modalState.children}
                confirmText={modalState.confirmText}
                confirmColor={modalState.confirmColor}
            />

            <ParticipantManagementModal
                isOpen={showManageModal}
                onClose={() => setShowManageModal(false)}
                sessionData={sessionData}
                sessionSignups={sessionSignups}
                defaultHours={3}
            />
        </>
    );
}