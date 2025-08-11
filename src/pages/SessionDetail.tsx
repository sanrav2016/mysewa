import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, ArrowLeft, UserPlus, UserMinus, CheckCircle, XCircle, User, Shield, UserCheck, Search, Edit, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useWebSocket } from '../context/WebSocketContext';
import { eventsAPI, signupsAPI, usersAPI } from '../services/api';
import { format } from 'date-fns';
import { ConfirmationModal, ParticipantManagementModal } from "../components/SessionDetailComponents";
import LoadingSpinner from '../components/LoadingSpinner';
import EventInstanceDisplay from '../components/EventInstanceDisplay';
import ConflictDisplay from '../components/ConflictDisplay';

export default function SessionDetail() {
    const { sessionId } = useParams();
    const { user } = useAuth();
    const { addNotification } = useNotification();
    const { socket, joinSession, leaveSession, isConnected } = useWebSocket();
    const navigate = useNavigate();

    const [sessionData, setSessionData] = useState<any>(null);
    const [sessionSignups, setSessionSignups] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelReason, setCancelReason] = useState('');
    const [showManageModal, setShowManageModal] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [parentSearch, setParentSearch] = useState('');
    const [waitlistPosition, setWaitlistPosition] = useState<any>(null);
    const [dataVersion, setDataVersion] = useState(0); // Force re-renders when data changes
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        type: 'signup' | 'waitlist' | 'cancel' | 'drop' | 'accept-waitlist' | 'decline-waitlist';
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
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoadingConflicts, setIsLoadingConflicts] = useState(false);
    const [conflictData, setConflictData] = useState<{
        hasConflicts: boolean;
        conflicts: any[];
        targetEvent: any;
    } | null>(null);

    // Load session data
    const loadSessionData = async () => {
        if (!sessionId) return null;

        try {
            console.log("Loading session data");
            const [sessionResponse, usersData] = await Promise.all([
                eventsAPI.getInstanceById(sessionId),
                usersAPI.getAll()
            ]);

            const session = sessionResponse.instance;
            const allUsers = usersData.users || [];

            if (session) {
                // Transform the session data to match the expected format
                const transformedSession = {
                    ...session,
                    eventTitle: session.event.title,
                    eventDescription: session.event.description,
                    category: session.event.category,
                    tags: session.event.tags,
                    eventId: session.event.id,
                    createdBy: session.event.createdBy
                };

                setSessionData(transformedSession);
                setSessionSignups(session.signups || []);
                setUsers(allUsers);
                setDataVersion(prev => prev + 1); // Force re-render

                return { session: transformedSession, signups: session.signups || [], users: allUsers };
            }
        } catch (error) {
            console.error('Failed to load session data:', error);
        } finally {
            setLoading(false);
        }

        return null;
    };

    // Load waitlist position
    const loadWaitlistPosition = async () => {
        if (!sessionId || !user?.id) return;

        try {
            const position = await signupsAPI.getWaitlistPosition(sessionId);
            setWaitlistPosition(position);
            setDataVersion(prev => prev + 1); // Force re-render
        } catch (error) {
            console.error('Failed to load waitlist position:', error);
            setWaitlistPosition(null);
        }
    };

    useEffect(() => {
        loadSessionData().then((result) => {
            if (result) {
                // After session data is loaded, also reload waitlist position if needed
                const userSignup = result.signups.find((signup: any) => signup.userId === user?.id);
                if (userSignup && (userSignup.status === 'WAITLIST' || userSignup.status === 'WAITLIST_PENDING')) {
                    loadWaitlistPosition();
                }
            }
        });
    }, [sessionId]);

    // Load waitlist position when user is on waitlist or pending
    useEffect(() => {
        const userSignup = sessionSignups.find(s => s.userId === user?.id);
        if (userSignup && (userSignup.status === 'WAITLIST' || userSignup.status === 'WAITLIST_PENDING')) {
            loadWaitlistPosition();
        }
    }, [sessionSignups, user?.id, sessionId]);

    // Subscribe to real-time updates via WebSocket
    useEffect(() => {
        if (!sessionId || !socket) return;

        // Join the session room
        joinSession(sessionId);

        // Listen for signup updates
        const handleSignupUpdate = (data: any) => {
            console.log('📡 Received signup update:', data);

            // Reload session data to get the latest state
            loadSessionData().then((result) => {
                if (result) {
                    // After session data is loaded, also reload waitlist position if needed
                    const userSignup = result.signups.find((signup: any) => signup.userId === user?.id);
                    if (userSignup && (userSignup.status === 'WAITLIST' || userSignup.status === 'WAITLIST_PENDING')) {
                        loadWaitlistPosition();
                    }
                }
            });
        };

        socket.on('signup-updated', handleSignupUpdate);

        return () => {
            socket.off('signup-updated', handleSignupUpdate);
            leaveSession(sessionId);
        };
    }, [sessionId, socket, joinSession, leaveSession]);



    if (loading) {
        return (
            <div className="text-center flex w-full h-screen items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

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

    const creator = users.find(u => u.id === sessionData.createdBy);
    const userSignup = sessionSignups.find(signup =>
        signup.userId === user?.id
    );

    const confirmedStudentSignups = sessionSignups.filter(s => s.status === 'CONFIRMED' && users.find(u => u.id === s.userId)?.role === 'STUDENT');
    const confirmedParentSignups = sessionSignups.filter(s => s.status === 'CONFIRMED' && users.find(u => u.id === s.userId)?.role === 'PARENT');
    const waitlistStudentSignups = sessionSignups.filter(s => (s.status === 'WAITLIST' || s.status === 'WAITLIST_PENDING') && users.find(u => u.id === s.userId)?.role === 'STUDENT');
    const waitlistParentSignups = sessionSignups.filter(s => (s.status === 'WAITLIST' || s.status === 'WAITLIST_PENDING') && users.find(u => u.id === s.userId)?.role === 'PARENT');

    const hasStartDate = sessionData.startDate && sessionData.startDate !== '';
    const isPast = hasStartDate ? new Date(sessionData.startDate) < new Date() : false;
    const userRole = user?.role;
    const isSignedUp = !!userSignup && userSignup.status === 'CONFIRMED';
    const isOnWaitlist = !!userSignup && userSignup.status === 'WAITLIST';
    const isPendingWaitlist = !!userSignup && userSignup.status === 'WAITLIST_PENDING';
    const isCancelled = !!userSignup && userSignup.status === 'CANCELLED';

    // Debug logging
    console.log('🔍 User state:', {
        userId: user?.id,
        userRole,
        userSignup: userSignup ? { id: userSignup.id, status: userSignup.status } : null,
        isSignedUp,
        isOnWaitlist,
        isCancelled,
        confirmedCount: confirmedStudentSignups.length + confirmedParentSignups.length,
        waitlistCount: waitlistStudentSignups.length + waitlistParentSignups.length
    });

    const hasOpenSpots = () => {
        if (!sessionData.enabled || sessionData.enabled === false) return false;
        if (userRole === 'STUDENT') {
            // Count confirmed + waitlist_pending (reserved spots)
            const reservedSpots = sessionSignups.filter(s =>
                (s.status === 'CONFIRMED' || s.status === 'WAITLIST_PENDING') &&
                users.find(u => u.id === s.userId)?.role === 'STUDENT'
            ).length;
            return reservedSpots < sessionData.studentCapacity;
        } else if (userRole === 'PARENT') {
            // Count confirmed + waitlist_pending (reserved spots)
            const reservedSpots = sessionSignups.filter(s =>
                (s.status === 'CONFIRMED' || s.status === 'WAITLIST_PENDING') &&
                users.find(u => u.id === s.userId)?.role === 'PARENT'
            ).length;
            return reservedSpots < sessionData.parentCapacity;
        }
        return false;
    };



    const openModal = async (type: typeof modalState.type) => {
        if (isProcessing || isLoadingConflicts) return; // Prevent opening modal while processing or loading conflicts
        
        let conflictResponse = null;
        
        // Check for conflicts before opening signup or waitlist modals
        if ((type === 'signup' || type === 'waitlist') && sessionId) {
            try {
                setIsLoadingConflicts(true);
                const response = await signupsAPI.checkConflicts(sessionId);
                setConflictData(response);
                conflictResponse = response; // Store for immediate use
            } catch (error) {
                console.error('Failed to check conflicts:', error);
                const errorResponse = { hasConflicts: false, conflicts: [], targetEvent: null };
                setConflictData(errorResponse);
                conflictResponse = errorResponse;
            } finally {
                setIsLoadingConflicts(false);
            }
        }

        let title = '';
        let children: any = '';
        let confirmText = '';
        let confirmColor = '';

        switch (type) {
            case 'signup':
                title = 'Confirm Signup';
                children = (
                    <div>
                        {conflictResponse && conflictResponse.hasConflicts ? (
                            <div className="flex flex-col xl:flex-row gap-4">
                                <div>
                                    <ConflictDisplay 
                                        conflicts={conflictResponse.conflicts} 
                                        targetEvent={conflictResponse.targetEvent} 
                                    />
                                </div>
                                <div>
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
                                </div>
                            </div>
                        ) : (
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
                        )}
                    </div>
                );
                confirmText = 'Sign Up';
                confirmColor = 'bg-green-500 hover:bg-green-600 border-green-400';
                break;
            case 'waitlist':
                title = 'Join Waitlist';
                children = (
                    <div>
                        {conflictResponse && conflictResponse.hasConflicts ? (
                            <div className="flex flex-col xl:flex-row gap-4">
                                <div>
                                    <ConflictDisplay 
                                        conflicts={conflictResponse.conflicts} 
                                        targetEvent={conflictResponse.targetEvent} 
                                    />
                                </div>
                                <div>
                                    <div>
                                        Looks like this session is full. Would you like to join the waitlist? If spots open up, you will be notified.
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                Looks like this session is full. Would you like to join the waitlist? If spots open up, you will be notified.
                            </div>
                        )}
                    </div>
                );
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
            case 'accept-waitlist':
                title = 'Accept Waitlist Spot';
                children = `A spot has opened up for this session! Would you like to accept it and be confirmed for the event?`;
                confirmText = 'Accept Spot';
                confirmColor = 'bg-green-500 hover:bg-green-600 border-green-400';
                break;
            case 'decline-waitlist':
                title = 'Decline Waitlist Spot';
                children = `Are you sure you want to decline this waitlist spot? It may be offered to the next person on the waitlist.`;
                confirmText = 'Decline Spot';
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

    const handleConfirm = async () => {
        if (isProcessing) return; // Prevent multiple submissions

        try {
            setIsProcessing(true);
            switch (modalState.type) {
                case 'signup':
                    const signupResponse = await signupsAPI.create({
                        eventId: sessionData.eventId,
                        instanceId: sessionId!
                    });

                    // Check if the user was waitlisted instead of confirmed
                    if (signupResponse.status === 'WAITLIST') {
                        addNotification(
                            'warning',
                            'Added to waitlist',
                            signupResponse.message || `The session filled up before your request was processed. You have been added to the waitlist for ${sessionData.eventTitle}.`
                        );
                    } else {
                        addNotification(
                            'success',
                            'Successfully signed up!',
                            signupResponse.message || `You have been confirmed for ${sessionData.eventTitle}`
                        );
                    }
                    // Real-time update will be handled by WebSocket
                    break;
                case 'waitlist':
                    const waitlistResponse = await signupsAPI.create({
                        eventId: sessionData.eventId,
                        instanceId: sessionId!
                    });
                    addNotification(
                        'warning',
                        'Added to waitlist!',
                        waitlistResponse.message || `You have been added to the waitlist for ${sessionData.eventTitle}. You will be automatically registered if a spot opens up.`
                    );
                    // Real-time update will be handled by WebSocket
                    break;
                case 'cancel':
                case 'drop':
                    // Find the user's signup for this session
                    const userSignup = sessionSignups.find(signup => signup.userId === user?.id);
                    if (userSignup) {
                        await signupsAPI.update(userSignup.id, { status: 'CANCELLED' });
                        addNotification(
                            'success',
                            modalState.type === 'cancel' ? 'Signup cancelled' : 'Removed from waitlist',
                            modalState.type === 'cancel'
                                ? `Your signup for ${sessionData.eventTitle} was cancelled.`
                                : `You have been removed from the waitlist for ${sessionData.eventTitle}`
                        );
                        // Real-time update will be handled by WebSocket
                    }
                    break;
                case 'accept-waitlist':
                    await signupsAPI.acceptWaitlist(sessionId!);
                    // Notification will be sent by the backend via WebSocket
                    // Reload data to update the UI
                    await loadSessionData();
                    await loadWaitlistPosition();
                    break;
                case 'decline-waitlist':
                    await signupsAPI.declineWaitlist(sessionId!);
                    // Notification will be sent by the backend via WebSocket
                    // Reload data to update the UI
                    await loadSessionData();
                    break;
            }
        } catch (error: any) {
            console.error('Failed to perform action:', error);
            
            // Handle specific error for disabled waitlist
            const errorMessage = error.response?.data?.message || error.message || 'An error occurred while performing the action';
            
            if (errorMessage.includes('Session is full and waitlist is disabled')) {
                addNotification(
                    'error',
                    'Session Full',
                    'This session is full and waitlist is disabled. Please try another session.',
                    false
                );
            } else {
                addNotification(
                    'error',
                    'Action failed',
                    errorMessage,
                    false
                );
            }
        } finally {
            setIsProcessing(false);
            setModalState({ ...modalState, isOpen: false });
        }
    };

    const renderParticipantCard = (signup: any, isWaitlist: boolean = false, waitlistPosition?: number) => {
        const participant = users.find(u => u.id === signup.userId);
        if (!participant) return null;

        const isStudent = participant.role === 'STUDENT';
        const attendanceStatus = signup.attendance;

        return (
            <Link
                key={signup.id}
                to={`/profile/${participant.id}`}
                className={`block p-3 rounded-lg border-2  transition-colors ${isWaitlist
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
                                        {waitlistPosition ? `Waitlist #${waitlistPosition}` : 'Waitlist'}
                                    </div>
                                )}
                                {signup.status === 'WAITLIST_PENDING' && (
                                    <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded text-xs font-medium">
                                        Pending
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{participant.email}</p>
                        </div>
                        <div>
                            {attendanceStatus && (
                                <div className="flex items-center gap-1">
                                    {attendanceStatus === 'PRESENT' ? (
                                        <>
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            <span className="text-xs text-green-600 font-medium">Present</span>
                                        </>
                                    ) : attendanceStatus === 'ABSENT' ? (
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
        if (user?.role === 'ADMIN') {
            return null;
        }

        const isEnabled = sessionData.enabled !== false;

        if (!isEnabled) {
            return (
                <div className="bg-gradient-to-r from-slate-400 to-slate-500 text-white px-8 py-4 rounded-2xl font-semibold text-center shadow-lg opacity-75">
                    <div className="flex items-center justify-center gap-2">
                        <XCircle className="w-5 h-5" />
                        Session Closed
                    </div>
                </div>
            );
        }

        if (isPast) {
            return (
                <div className="bg-gradient-to-r from-slate-400 to-slate-500 text-white px-8 py-4 rounded-2xl font-semibold text-center shadow-lg opacity-75">
                    <div className="flex items-center justify-center gap-2">
                        <Clock className="w-5 h-5" />
                        Past Session
                    </div>
                </div>
            );
        }

        if (isSignedUp) {
            return (
                <button
                    onClick={async () => await openModal('cancel')}
                    disabled={isProcessing}
                    className={`group relative overflow-hidden bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <div className="flex items-center justify-center gap-3">
                        {isProcessing ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <UserMinus className="w-5 h-5 transition-transform group-hover:scale-110" />
                        )}
                        <span>{isProcessing ? 'Processing...' : 'Cancel Signup'}</span>
                    </div>
                    <div className="absolute inset-0 bg-white/50 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
            );
        }

        if (isOnWaitlist) {
            return (
                <button
                    onClick={async () => await openModal('drop')}
                    disabled={isProcessing}
                    className={`group relative overflow-hidden bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <div className="flex items-center justify-center gap-3">
                        {isProcessing ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <UserMinus className="w-5 h-5 transition-transform group-hover:scale-110" />
                        )}
                        <span>{isProcessing ? 'Processing...' : 'Drop from Waitlist'}</span>
                    </div>
                    <div className="absolute inset-0 bg-white/50 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
            );
        }

        if (isPendingWaitlist) {
            return (
                <div className="flex gap-3">
                    <button
                        onClick={async () => await openModal('accept-waitlist')}
                        disabled={isProcessing}
                        className={`group relative overflow-hidden bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            {isProcessing ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <UserPlus className="w-5 h-5 transition-transform group-hover:scale-110" />
                            )}
                            <span>{isProcessing ? 'Processing...' : 'Accept Spot'}</span>
                        </div>
                        <div className="absolute inset-0 bg-white/50 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </button>
                    <button
                        onClick={async () => await openModal('decline-waitlist')}
                        disabled={isProcessing}
                        className={`group relative overflow-hidden bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            {isProcessing ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <UserMinus className="w-5 h-5 transition-transform group-hover:scale-110" />
                            )}
                            <span>{isProcessing ? 'Processing...' : 'Decline Spot'}</span>
                        </div>
                        <div className="absolute inset-0 bg-white/50 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </button>
                </div>
            );
        }

        if (isCancelled) {
            if (hasOpenSpots()) {
                            return (
                <button
                    onClick={async () => await openModal('signup')}
                    disabled={isProcessing || isLoadingConflicts}
                    className={`group relative overflow-hidden bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl ${(isProcessing || isLoadingConflicts) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <div className="flex items-center justify-center gap-3">
                        {(isProcessing || isLoadingConflicts) ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <UserPlus className="w-5 h-5 transition-transform group-hover:scale-110" />
                        )}
                        <span>{(isProcessing || isLoadingConflicts) ? 'Working...' : 'Sign Up'}</span>
                    </div>
                    <div className="absolute inset-0 bg-white/50 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
            );
            } else {
                // Check if waitlist is enabled
                if (sessionData.waitlistEnabled !== false) {
                                                return (
                    <button
                        onClick={async () => await openModal('waitlist')}
                        disabled={isProcessing || isLoadingConflicts}
                        className={`group relative overflow-hidden bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl ${(isProcessing || isLoadingConflicts) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                    <div className="flex items-center justify-center gap-3">
                        {(isProcessing || isLoadingConflicts) ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <UserPlus className="w-5 h-5 transition-transform group-hover:scale-110" />
                        )}
                        <span>{(isProcessing || isLoadingConflicts) ? 'Working...' : 'Join Waitlist'}</span>
                    </div>
                    <div className="absolute inset-0 bg-white/50 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
            );
                } else {
                    return (
                        <div className="bg-gradient-to-r from-slate-400 to-slate-500 text-white px-8 py-4 rounded-2xl font-semibold text-center shadow-lg opacity-75">
                            <div className="flex items-center justify-center gap-2">
                                <XCircle className="w-5 h-5" />
                                Session Full
                            </div>
                        </div>
                    );
                }
            }
        }

        if (hasOpenSpots()) {
            return (
                <button
                    onClick={async () => await openModal('signup')}
                    disabled={isProcessing || isLoadingConflicts}
                    className={`group relative overflow-hidden bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl ${(isProcessing || isLoadingConflicts) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <div className="flex items-center justify-center gap-3">
                        {(isProcessing || isLoadingConflicts) ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <UserPlus className="w-5 h-5 transition-transform group-hover:scale-110" />
                        )}
                        <span>{(isProcessing || isLoadingConflicts) ? 'Working...' : 'Sign Up'}</span>
                    </div>
                    <div className="absolute inset-0 bg-white/50 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
            );
        } else {
            // Check if waitlist is enabled
            if (sessionData.waitlistEnabled !== false) {
                return (
                    <button
                        onClick={async () => await openModal('waitlist')}
                        disabled={isProcessing || isLoadingConflicts}
                        className={`group relative overflow-hidden bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl ${(isProcessing || isLoadingConflicts) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className="flex items-center justify-center gap-3">
                            {(isProcessing || isLoadingConflicts) ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <UserPlus className="w-5 h-5 transition-transform group-hover:scale-110" />
                            )}
                            <span>{(isProcessing || isLoadingConflicts) ? 'Working...' : 'Join Waitlist'}</span>
                        </div>
                        <div className="absolute inset-0 bg-white/50 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </button>
                );
            } else {
                return (
                    <div className="bg-gradient-to-r from-slate-400 to-slate-500 text-white px-8 py-4 rounded-2xl font-semibold text-center shadow-lg opacity-75">
                        <div className="flex items-center justify-center gap-2">
                            <XCircle className="w-5 h-5" />
                            Session Full
                        </div>
                    </div>
                );
            }
        }
    };

    // Combine confirmed and waitlisted students, sorted by status then signup date
    const allStudentSignups = [...confirmedStudentSignups, ...waitlistStudentSignups]
        .sort((a, b) => {
            // Confirmed first, then waitlisted, then by signup date
            if (a.status !== b.status) {
                const statusOrder: Record<string, number> = { 'CONFIRMED': 0, 'WAITLIST_PENDING': 1, 'WAITLIST': 2 };
                return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
            }
            return new Date(a.signupDate).getTime() - new Date(b.signupDate).getTime();
        });

    const filteredStudents = allStudentSignups.filter(signup => {
        const participant = users.find(u => u.id === signup.userId);
        return participant && (
            participant.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
            participant.email.toLowerCase().includes(studentSearch.toLowerCase())
        );
    });

    // Combine confirmed and waitlisted parents, sorted by status then signup date
    const allParentSignups = [...confirmedParentSignups, ...waitlistParentSignups]
        .sort((a, b) => {
            // Confirmed first, then waitlisted, then by signup date
            if (a.status !== b.status) {
                const statusOrder: Record<string, number> = { 'CONFIRMED': 0, 'WAITLIST_PENDING': 1, 'WAITLIST': 2 };
                return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
            }
            return new Date(a.signupDate).getTime() - new Date(b.signupDate).getTime();
        });

    const filteredParents = allParentSignups.filter(signup => {
        const participant = users.find(u => u.id === signup.userId);
        return participant && (
            participant.name.toLowerCase().includes(parentSearch.toLowerCase()) ||
            participant.email.toLowerCase().includes(parentSearch.toLowerCase())
        );
    });

    return (
        <>
            <div className="space-y-6 px-4 py-8 lg:px-8">
                <div className="flex items-center justify-between">
                    <Link
                        to={`/events/${sessionData.eventId}`}
                        className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Event
                    </Link>
                    <div className="flex items-center justify-end">
                        <div className={`flex items-center gap-2 rounded-full text-xs font-medium px-2 py-1 ${isConnected
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            }`}>
                            <div className="relative">
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                {isConnected && <div className={`absolute top-0 left-0 w-2 h-2 rounded-full animate-ping bg-green-500`}></div>}
                            </div>
                            {isConnected ? 'Live' : 'Disconnected'}
                        </div>
                    </div>
                </div>

                {/* Session Header */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">

                    <div className="flex items-start justify-between mb-6 flex-col md:flex-row gap-4 md:flex-1">
                        <div className="flex-1">
                            <h1 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                                {sessionData.eventTitle}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3">
                                {
                                    !sessionData.enabled && <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-3 py-1 rounded-full font-medium text-sm">Closed</span>
                                }
                                <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full font-medium text-sm">
                                    {sessionData.category}
                                </span>
                                {sessionData.tags.map((tag: any) => (
                                    <span key={tag} className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-full text-xs">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-wrap md:flex-col justify-center md:justify-end gap-3 w-full md:w-auto">
                            {renderActionButton()}
                            {user?.role === 'ADMIN' && (
                                <Link
                                    to={`/edit-session/${sessionData.id}`}
                                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-md text-white px-3 py-2 rounded-lg font-medium transition-all hover:scale-105 justify-center text-sm"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit Session
                                </Link>
                            )}
                            {/* Manage Participants Button */}
                            {(user?.role === 'ADMIN' || (user?.role === 'PARENT' && isSignedUp)) && (
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => setShowManageModal(true)}
                                        disabled={isProcessing}
                                        className={`flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-md text-white px-3 py-2 rounded-lg font-medium transition-all hover:scale-105 text-sm ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <Users className="w-5 h-5" />
                                        Manage Participants
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Session Details */}
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 gap-x-16 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                        <EventInstanceDisplay instance={sessionData} />

                        <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                            <Users className="w-5 h-5 mt-1" />
                            <div>
                                <p className="font-medium">
                                    {confirmedStudentSignups.length + confirmedParentSignups.length} / {sessionData.studentCapacity + sessionData.parentCapacity} signed up
                                </p>
                                {(isOnWaitlist || isPendingWaitlist) && waitlistPosition && (
                                    <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                                        {isPendingWaitlist ? (
                                            <span className="font-semibold">⏰ Waitlist spot available! Respond within 12 hours.</span>
                                        ) : (
                                            <>Position {waitlistPosition.position} of {waitlistPosition.totalWaitlisted} on waitlist ({waitlistPosition.role.toLowerCase()}s)</>
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {sessionData.description && (
                        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                            <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Session Notes:</h3>
                            <p className="text-slate-600 dark:text-slate-300">{sessionData.description}</p>
                        </div>
                    )}

                    {creator && (
                        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
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
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
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
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 max-h-72 overflow-y-auto">
                            {filteredStudents.map((signup, index) => {
                                const isWaitlist = signup.status === 'WAITLIST' || signup.status === 'WAITLIST_PENDING';
                                const waitlistPosition = isWaitlist ?
                                    allStudentSignups.filter(s => (s.status === 'WAITLIST' || s.status === 'WAITLIST_PENDING')).findIndex(s => s.id === signup.id) + 1
                                    : undefined;
                                return renderParticipantCard(signup, isWaitlist, waitlistPosition);
                            })}
                            {filteredStudents.length === 0 && (
                                <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                                    {studentSearch ? 'No students match your search' : 'No students signed up'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Parents */}
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
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
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 max-h-72 overflow-y-auto">
                            {filteredParents.map((signup, index) => {
                                const isWaitlist = signup.status === 'WAITLIST' || signup.status === 'WAITLIST_PENDING';
                                const waitlistPosition = isWaitlist ?
                                    allParentSignups.filter(s => (s.status === 'WAITLIST' || s.status === 'WAITLIST_PENDING')).findIndex(s => s.id === signup.id) + 1
                                    : undefined;
                                return renderParticipantCard(signup, isWaitlist, waitlistPosition);
                            })}
                            {filteredParents.length === 0 && (
                                <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                                    {parentSearch ? 'No parents match your search' : 'No parents signed up'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div >

            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ ...modalState, isOpen: false })}
                onConfirm={handleConfirm}
                title={modalState.title}
                children={modalState.children}
                confirmText={modalState.confirmText}
                confirmColor={modalState.confirmColor}
                isLoading={isProcessing}
            />

            <ParticipantManagementModal
                isOpen={showManageModal}
                onClose={() => setShowManageModal(false)}
                sessionData={sessionData}
                sessionSignups={sessionSignups}
                defaultHours={3}
                onDataUpdate={loadSessionData}
                userRole={user?.role}
            />
        </>
    );
}