import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, ArrowLeft, UserPlus, UserMinus, CheckCircle, XCircle, User, Shield, UserCheck, Search, Edit, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { mockEvents, mockSignups, mockUsers } from '../data/mockData';
import { format } from 'date-fns';
import { ConfirmationModal, ParticipantManagementModal } from "../components/SessionDetailComponents";

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
                addNotification(
                    'success',
                    'Successfully signed up!',
                    `You have been confirmed for ${sessionData.eventTitle}`
                );
                break;
            case 'waitlist':
                addNotification(
                    'success',
                    'Added to waitlist',
                    `You have been added to the waitlist for ${sessionData.eventTitle}`
                );
                break;
            case 'cancel':
                addNotification(
                    'success',
                    'Signup cancelled',
                    `Your signup for ${sessionData.eventTitle} was cancelled.`
                );
                break;
            case 'drop':
                addNotification(
                    'success',
                    'Removed from waitlist',
                    `You have been removed from the waitlist for ${sessionData.eventTitle}`
                );
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
                    } `}
            >
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3 w-full">
                        <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-sm ${isStudent ? 'bg-green-500' : 'bg-blue-500'
                            }`}>
                            {participant.name.charAt(0)}
                        </div>
                        <div className="w-full">
                            <div className="flex items-center gap-2 justify-between w-full">
                                <div className="font-medium text-slate-800 dark:text-white">{participant.name}</div>
                                {isWaitlist && (
                                    <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded text-xs font-medium">
                                        Waitlist
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{participant.email}</p>
                        </div>
                        <div>
                            {attendanceStatus && (
                                <div className="flex items-center gap-1">
                                    {attendanceStatus === 'present' ? (
                                        <>
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            <span className="text-xs text-green-600 font-medium">Present</span>
                                        </>
                                    ) : attendanceStatus === 'absent' ? (
                                        <>
                                            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                            <span className="text-xs text-red-600 font-medium dark:text-red-400">Absent</span>
                                        </>
                                    ) : null}
                                </div>
                            )}
                            {
                                signup.hoursEarned &&
                                <div className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded text-xs text-center mt-1 px-2 py-1">
                                    {signup.hoursEarned}h
                                </div>
                            }
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

                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <MapPin className="w-5 h-5 mt-1" />
                            <div>
                               {sessionData.location}
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