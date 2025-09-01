import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Trash, Repeat, FileText, Copy, Archive, Calendar, MapPin, Users, Clock, Edit, ChevronDown, Ruler as Schedule, Eye, CalendarOff, Power, PowerOff, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { eventsAPI, usersAPI } from '../services/api';
import { formatLocalDate, localDateTimeToUTC, formatForDateTimeLocal } from '../utils/dateUtils';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import LoadingSpinner from '../components/LoadingSpinner';

import DescriptionEditor from '../components/DescriptionEditor';

interface EventInstance {
    id?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    hours: number;
    studentCapacity: number;
    parentCapacity: number;
    description?: string;
    enabled?: boolean;
    waitlistEnabled?: boolean;
    status?: 'ACTIVE' | 'CANCELLED' | 'COMPLETED' | 'POSTPONED';
    cancelledAt?: string;
    restrictions?: {
        prerequisiteEvents?: any[];
        minAge?: number;
        maxAge?: number;
        minHours?: number;
        maxHours?: number;
    };
}

interface BulkCreateOptions {
    startDate: string;
    endDate: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek: number[];
    location: string;
    hours: number;
    studentCapacity: number;
    parentCapacity: number;
    description: string;
}

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText: string;
    confirmColor: string;
    isLoading?: boolean;
}

function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText, confirmColor, isLoading = false }: ConfirmationModalProps) {
    return (
        <div
            className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150] p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
        >
            <div
                className={`bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 rounded-xl max-w-md w-full border border-slate-200 dark:border-slate-700/50 transform transition-all ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                    }`}
            >
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                    {title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
                    {message}
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className={`flex-1 px-3 py-2 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 px-3 py-2 text-sm text-white rounded-lg font-medium transition-all hover:scale-105 text-sm ${confirmColor} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            </div>
        </div>
    );
}
export default function EditEvent() {
    const { eventId, sessionId } = useParams();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const { addNotification } = useNotification();
    const [stickyControls, setStickyControls] = useState(false);
    const [showPublishMenu, setShowPublishMenu] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
          const controlsElement = document.getElementById("controls");
          if (controlsElement) {
            const rect = controlsElement.getBoundingClientRect();
            setStickyControls(rect.top <= 0);
          }
        };
    
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
      }, []);

    const isEditing = !!eventId;
    const isEditingSession = !!sessionId;

    const [eventData, setEventData] = useState({
        title: '',
        description: '',
        category: '',
        tags: '',
        isRecurring: false,
        status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED',
        chapters: [] as string[],
        cities: [] as string[],
        scheduledPublishDate: null as string | null
    });

    const [instances, setInstances] = useState<EventInstance[]>([
        {
            startDate: '',
            endDate: '',
            location: '',
            hours: 2,
            studentCapacity: 10,
            parentCapacity: 5,
            description: ''
        }
    ]);

    const [showBulkCreate, setShowBulkCreate] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showSessionDeleteModal, setShowSessionDeleteModal] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);
    const [showCancelSessionModal, setShowCancelSessionModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [scheduleDateTime, setScheduleDateTime] = useState('');
    const [sessionEventId, setSessionEventId] = useState<string>('');
    const [bulkOptions, setBulkOptions] = useState<BulkCreateOptions>({
        startDate: '',
        endDate: '',
        frequency: 'weekly',
        daysOfWeek: [],
        location: '',
        hours: 2,
        studentCapacity: 10,
        parentCapacity: 5,
        description: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [chapters, setChapters] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);

    const categories = [
        'Community Service',
        'Environment',
        'Senior Care',
        'Education',
        'Health & Wellness',
        'Arts & Culture',
        'Animal Welfare',
        'Food & Hunger',
        'Youth Development',
        'Other'
    ];

    // Load chapters and cities from users
    useEffect(() => {
        const loadChaptersAndCities = async () => {
            try {
                const response = await usersAPI.getAll();
                const users = response.users || [];
                const uniqueChapters = [...new Set(users.map((user: any) => user.chapter).filter(Boolean))] as string[];
                const uniqueCities = [...new Set(users.map((user: any) => user.city).filter(Boolean))] as string[];
                setChapters(uniqueChapters);
                setCities(uniqueCities);
            } catch (error) {
                console.error('Failed to load chapters and cities:', error);
            }
        };
        loadChaptersAndCities();
    }, []);

    // Load existing event data if editing
    useEffect(() => {
        const loadEventData = async () => {
            if (!isEditing && !isEditingSession) return;

            setLoading(true);
            try {
                if (isEditing) {
                    const response = await eventsAPI.getById(eventId!);
                    const event = response.event;
                    if (event) {
                        setEventData({
                            title: event.title,
                            description: event.description,
                            category: event.category,
                            tags: event.tags.join(', '),
                            isRecurring: event.isRecurring,
                            status: event.status,
                            chapters: event.chapters,
                            cities: event.cities,
                            scheduledPublishDate: event.scheduledPublishDate
                        });
                        setInstances(event.instances.map((instance: any) => (
                            {
                                id: instance.id, // Preserve the instance ID
                                startDate: instance.startDate ? formatForDateTimeLocal(instance.startDate) : undefined, // Convert UTC to local time for datetime-local input
                                endDate: instance.endDate ? formatForDateTimeLocal(instance.endDate) : undefined,
                                location: instance.location,
                                hours: instance.hours,
                                studentCapacity: instance.studentCapacity,
                                parentCapacity: instance.parentCapacity,
                                description: instance.description,
                                enabled: instance.enabled !== undefined ? instance.enabled : true,
                                waitlistEnabled: instance.waitlistEnabled !== undefined ? instance.waitlistEnabled : true,
                                status: instance.status || 'ACTIVE',
                                cancelledAt: instance.cancelledAt,
                                restrictions: instance.restrictions || {}
                            }
                        )));
                    }
                } else if (isEditingSession) {
                    // Get all events to find the session
                    const response = await eventsAPI.getAll();
                    const events = response.events || [];
                    const sessionData = events
                        .flatMap((event: any) =>
                            event.instances.map((instance: any) => ({
                                ...instance,
                                eventTitle: event.title,
                                eventDescription: event.description,
                                category: event.category,
                                tags: event.tags,
                                eventId: event.id
                            }))
                        )
                        .find((session: any) => session.id === sessionId);

                    if (sessionData) {
                        const parentEvent = events.find((e: any) => e.id === sessionData.eventId);
                        if (parentEvent) {
                            setSessionEventId(sessionData.eventId);
                            setEventData({
                                title: parentEvent.title,
                                description: parentEvent.description,
                                category: parentEvent.category,
                                tags: parentEvent.tags.join(', '),
                                isRecurring: parentEvent.isRecurring,
                                status: parentEvent.status,
                                chapters: parentEvent.chapters,
                                cities: parentEvent.cities,
                                scheduledPublishDate: parentEvent.scheduledPublishDate
                            });
                            setInstances([{
                                id: sessionData.id, // Preserve the instance ID
                                startDate: sessionData.startDate ? formatForDateTimeLocal(sessionData.startDate) : undefined,
                                endDate: sessionData.endDate ? formatForDateTimeLocal(sessionData.endDate) : undefined,
                                location: sessionData.location,
                                hours: sessionData.hours || 0,
                                studentCapacity: sessionData.studentCapacity,
                                parentCapacity: sessionData.parentCapacity,
                                description: sessionData.description || '',
                                enabled: sessionData.enabled !== undefined ? sessionData.enabled : true,
                                waitlistEnabled: sessionData.waitlistEnabled !== undefined ? sessionData.waitlistEnabled : true,
                                status: sessionData.status || 'ACTIVE',
                                cancelledAt: sessionData.cancelledAt
                            }]);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load event data:', error);
                addNotification('error', 'Failed to load event data', 'Please try again later.', false);
            } finally {
                setLoading(false);
            }
        };

        loadEventData();
    }, [eventId, sessionId, isEditing, isEditingSession, addNotification]);

    const generateBulkInstances = () => {
        const newInstances: EventInstance[] = [];
        const start = new Date(bulkOptions.startDate);
        const end = new Date(bulkOptions.endDate);

        let current = new Date(start);

        while (current <= end) {
            if (bulkOptions.frequency === 'daily') {
                newInstances.push({
                    ...(bulkOptions.startDate && { startDate: current.toISOString().slice(0, 16) }),
                    ...(bulkOptions.endDate && { endDate: current.toISOString().slice(0, 16) }),
                    ...(bulkOptions.location && { location: bulkOptions.location }),
                    hours: bulkOptions.hours,
                    studentCapacity: bulkOptions.studentCapacity,
                    parentCapacity: bulkOptions.parentCapacity,
                    ...(bulkOptions.description && { description: bulkOptions.description }),
                    restrictions: {}
                });
                current.setDate(current.getDate() + 1);
            } else if (bulkOptions.frequency === 'weekly') {
                if (bulkOptions.daysOfWeek.includes(current.getDay())) {
                    newInstances.push({
                        ...(bulkOptions.startDate && { startDate: current.toISOString().slice(0, 16) }),
                        ...(bulkOptions.endDate && { endDate: current.toISOString().slice(0, 16) }),
                        ...(bulkOptions.location && { location: bulkOptions.location }),
                        hours: bulkOptions.hours,
                        studentCapacity: bulkOptions.studentCapacity,
                        parentCapacity: bulkOptions.parentCapacity,
                        ...(bulkOptions.description && { description: bulkOptions.description }),
                        restrictions: {}
                    });
                }
                current.setDate(current.getDate() + 1);
            } else if (bulkOptions.frequency === 'monthly') {
                newInstances.push({
                    ...(bulkOptions.startDate && { startDate: current.toISOString().slice(0, 16) }),
                    ...(bulkOptions.endDate && { endDate: current.toISOString().slice(0, 16) }),
                    ...(bulkOptions.location && { location: bulkOptions.location }),
                    hours: bulkOptions.hours,
                    studentCapacity: bulkOptions.studentCapacity,
                    parentCapacity: bulkOptions.parentCapacity,
                    ...(bulkOptions.description && { description: bulkOptions.description }),
                    restrictions: {
                        prerequisiteEvents: [],
                    }
                });
                current.setMonth(current.getMonth() + 1);
            }
        }

        setInstances([...instances, ...newInstances]);
        setShowBulkCreate(false);
        setBulkOptions({
            startDate: '',
            endDate: '',
            frequency: 'weekly',
            daysOfWeek: [],
            location: '',
            hours: 2,
            studentCapacity: 10,
            parentCapacity: 5,
            description: ''
        });
    };

    const filteredInstances = instances.filter(instance =>
        (instance.location?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (instance.startDate?.includes(searchTerm) || false) ||
        (instance.endDate?.includes(searchTerm) || false) ||
        (instance.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (instance.hours?.toString().includes(searchTerm) || false)
    );

    const addInstance = () => {
        setInstances([...instances, {
            startDate: '',
            endDate: '',
            location: '',
            hours: 2,
            studentCapacity: 10,
            parentCapacity: 5,
            description: '',
            enabled: true,
            waitlistEnabled: true,
            restrictions: {}
        }]);
    };

    const duplicateInstance = (instance: EventInstance) => {
        const newInstance = {
            ...instance,
            id: undefined // Remove ID so it's treated as new
        };
        setInstances([...instances, newInstance]);
    };

    const removeInstance = (index: number) => {
        if (instances.length > 1 || isEditingSession) {
            setSessionToDelete(index);
            setShowSessionDeleteModal(true);
        }
    };

    const handleSessionDelete = () => {
        if (sessionToDelete !== null) {
            setInstances(instances.filter((_, i) => i !== sessionToDelete));
            setSessionToDelete(null);
            setShowSessionDeleteModal(false);
        }
    };

    const handleCancelSession = async () => {
        if (!sessionId) return;
        
        try {
            setLoading(true);
            await eventsAPI.updateSessionStatus(sessionId, { status: 'CANCELLED', reason: cancelReason });
            addNotification(
                'success',
                'Session cancelled!',
                'The session has been cancelled successfully. All signed-up participants have been notified.'
            );
            navigate(`/sessions/${sessionId}`);
        } catch (error: any) {
            console.error('Failed to cancel session:', error);
            addNotification(
                'error',
                'Failed to cancel session',
                error.response?.data?.message || 'An error occurred while cancelling the session.',
                false
            );
        } finally {
            setLoading(false);
            setShowCancelSessionModal(false);
            setCancelReason('');
        }
    };

    const updateInstance = (index: number, field: keyof EventInstance, value: string | number | any) => {
        const updated = instances.map((instance, i) =>
            i === index ? { ...instance, [field]: value } : instance
        );
        setInstances(updated);
    };

    const handlePublishNow = async () => {
        // Validation
        if (!eventData.title || !eventData.description || !eventData.category) {
            addNotification('error', 'Missing Information', 'Please fill in all required fields', false);
            return;
        }

        if (instances.some(instance => !instance.hours || instance.hours <= 0)) {
            addNotification('error', 'No Sessions', 'Please set hours for all event instances', false);
            return;
        }

        if (eventData.chapters.length === 0) {
            addNotification('error', 'Missing Information', 'Please select at least one chapter', false);
            return;
        }

        if (eventData.cities.length === 0) {
            addNotification('error', 'Missing Information', 'Please select at least one city', false);
            return;
        }

        try {
            setLoading(true);
            
            // Store the original status before updating
            const originalStatus = eventData.status;
            const updatedEvent = { ...eventData, status: 'PUBLISHED' as any };
            setEventData(updatedEvent);

            const eventPayload = {
                ...eventData,
                status: 'PUBLISHED',
                tags: eventData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
                instances: instances.map(instance => ({
                    ...(instance.id && { id: instance.id }), // Include ID for existing instances
                    ...(instance.startDate && { startDate: localDateTimeToUTC(instance.startDate) }),
                    ...(instance.endDate && { endDate: localDateTimeToUTC(instance.endDate) }),
                    ...(instance.location && { location: instance.location }),
                    hours: instance.hours,
                    studentCapacity: instance.studentCapacity,
                    parentCapacity: instance.parentCapacity,
                    ...(instance.description && { description: instance.description }),
                    enabled: instance.enabled !== undefined ? instance.enabled : true,
                    waitlistEnabled: instance.waitlistEnabled !== undefined ? instance.waitlistEnabled : true
                }))
            };

            // Remove scheduledPublishDate if it's null to avoid validation issues
            if (eventPayload.scheduledPublishDate === null) {
                delete (eventPayload as any).scheduledPublishDate;
            }

            if (isEditingSession) {
                // Update individual session
                const instance = instances[0]; // When editing session, there's only one instance
                const instancePayload = {
                    startDate: instance.startDate ? new Date(instance.startDate).toISOString() : null,
                    endDate: instance.endDate ? new Date(instance.endDate).toISOString() : null,
                    location: instance.location || null,
                    hours: instance.hours,
                    studentCapacity: instance.studentCapacity,
                    parentCapacity: instance.parentCapacity,
                    description: instance.description || null,
                    enabled: instance.enabled !== undefined ? instance.enabled : true,
                    waitlistEnabled: instance.waitlistEnabled !== undefined ? instance.waitlistEnabled : true
                };

                await eventsAPI.updateInstance(sessionId!, instancePayload);
                addNotification('success', 'Session Updated', 'Session has been updated successfully!');
                navigate(`/sessions/${sessionId}`);
            } else if (isEditing) {
                await eventsAPI.update(eventId!, eventPayload);
                // Check if this is actually a publish (status change from DRAFT to PUBLISHED) or just an update
                const isActualPublish = originalStatus !== 'PUBLISHED';
                if (isActualPublish) {
                    addNotification('success', 'Event Published', `"${eventData.title}" has been published successfully!`);
                } else {
                    addNotification('success', 'Event Updated', `"${eventData.title}" has been updated successfully!`);
                }
            } else {
                const response = await eventsAPI.create(eventPayload);
                addNotification('success', 'Event Published', `"${eventData.title}" has been published successfully!`);
                // Navigate to the created event
                navigate(`/events/${response.event.id}`);
            }

            setShowPublishMenu(false);
        } catch (error: any) {
            console.error('Failed to publish event:', error);
            addNotification('error', 'Publish Failed', error.toString(), false);
        } finally {
            setLoading(false);
        }
    };

    const handleSchedulePublish = async () => {
        if (!scheduleDateTime) {
            addNotification('error', 'Missing Information', 'Please select both date and time for scheduling.', false);
            return;
        }

        // Validation
        if (!eventData.title || !eventData.description || !eventData.category) {
            addNotification('error', 'Missing Information', 'Please fill in all required fields', false);
            return;
        }

        if (instances.some(instance => !instance.hours || instance.hours <= 0)) {
            addNotification('error', 'No Sessions', 'Please set hours for all event instances', false);
            return;
        }

        if (eventData.chapters.length === 0) {
            addNotification('error', 'Missing Information', 'Please select at least one chapter', false);
            return;
        }

        if (eventData.cities.length === 0) {
            addNotification('error', 'Missing Information', 'Please select at least one city', false);
            return;
        }

        try {
            setLoading(true);
            const scheduledDateTime = new Date(`${scheduleDateTime}`);

            const eventPayload = {
                ...eventData,
                status: 'SCHEDULED',
                scheduledPublishDate: scheduledDateTime.toISOString(),
                tags: eventData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
                instances: instances.map(instance => ({
                    ...(instance.id && { id: instance.id }), // Include ID for existing instances
                    ...(instance.startDate && { startDate: localDateTimeToUTC(instance.startDate) }),
                    ...(instance.endDate && { endDate: localDateTimeToUTC(instance.endDate) }),
                    ...(instance.location && { location: instance.location }),
                    hours: instance.hours,
                    studentCapacity: instance.studentCapacity,
                    parentCapacity: instance.parentCapacity,
                    ...(instance.description && { description: instance.description }),
                    enabled: instance.enabled !== undefined ? instance.enabled : true,
                    waitlistEnabled: instance.waitlistEnabled !== undefined ? instance.waitlistEnabled : true
                }))
            };

            if (isEditingSession) {
                // Update individual session
                const instance = instances[0]; // When editing session, there's only one instance
                const instancePayload = {
                    startDate: instance.startDate ? localDateTimeToUTC(instance.startDate) : null,
                    endDate: instance.endDate ? localDateTimeToUTC(instance.endDate) : null,
                    location: instance.location || null,
                    hours: instance.hours,
                    studentCapacity: instance.studentCapacity,
                    parentCapacity: instance.parentCapacity,
                    description: instance.description || null,
                    enabled: instance.enabled !== undefined ? instance.enabled : true,
                    waitlistEnabled: instance.waitlistEnabled !== undefined ? instance.waitlistEnabled : true
                };

                await eventsAPI.updateInstance(sessionId!, instancePayload);
                addNotification('success', 'Session Updated', 'Session has been updated successfully!');
                navigate(`/sessions/${sessionId}`);
            } else if (isEditing) {
                await eventsAPI.update(eventId!, eventPayload);
                setEventData(prev => ({
                    ...prev,
                    status: 'SCHEDULED',
                    scheduledPublishDate: scheduledDateTime.toISOString()
                }));
                addNotification('success', 'Event Scheduled', `"${eventData.title}" will be published on ${formatLocalDate(scheduledDateTime, 'MMM d, yyyy')} at ${formatLocalDate(scheduledDateTime, 'h:mm a')}`);
            } else {
                const response = await eventsAPI.create(eventPayload);
                addNotification('success', 'Event Scheduled', `"${eventData.title}" will be published on ${formatLocalDate(scheduledDateTime, 'MMM d, yyyy')} at ${formatLocalDate(scheduledDateTime, 'h:mm a')}`);
                // Navigate to the created event
                navigate(`/events/${response.event.id}`);
            }

            setShowScheduleModal(false);
            setShowPublishMenu(false);
        } catch (error: any) {
            console.error('Failed to schedule event:', error);
            const errorMessage = error.response?.data?.details || error.response?.data?.message || 'Failed to schedule event. Please try again.';
            addNotification('error', 'Schedule Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async () => {
        // Validation
        if (!eventData.title || !eventData.description || !eventData.category) {
            addNotification('error', 'Missing Information', 'Please fill in all required fields', false);
            return;
        }

        if (instances.some(instance => !instance.hours || instance.hours <= 0)) {
            addNotification('error', 'No Sessions', 'Please set hours for all event instances', false);
            return;
        }

        if (eventData.chapters.length === 0) {
            addNotification('error', 'Missing Information', 'Please select at least one chapter', false);
            return;
        }

        if (eventData.cities.length === 0) {
            addNotification('error', 'Missing Information', 'Please select at least one city', false);
            return;
        }

        try {
            setLoading(true);
            const updatedEvent = { ...eventData, status: 'ARCHIVED' as any };
            setEventData(updatedEvent);

            const eventPayload = {
                ...eventData,
                status: 'ARCHIVED',
                tags: eventData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
                instances: instances.map(instance => ({
                    ...(instance.id && { id: instance.id }), // Include ID for existing instances
                    ...(instance.startDate && { startDate: localDateTimeToUTC(instance.startDate) }),
                    ...(instance.endDate && { endDate: localDateTimeToUTC(instance.endDate) }),
                    ...(instance.location && { location: instance.location }),
                    hours: instance.hours,
                    studentCapacity: instance.studentCapacity,
                    parentCapacity: instance.parentCapacity,
                    ...(instance.description && { description: instance.description }),
                    enabled: instance.enabled !== undefined ? instance.enabled : true,
                    waitlistEnabled: instance.waitlistEnabled !== undefined ? instance.waitlistEnabled : true
                }))
            };

            // Remove scheduledPublishDate if it's null to avoid validation issues
            if (eventPayload.scheduledPublishDate === null) {
                delete (eventPayload as any).scheduledPublishDate;
            }

            if (isEditingSession) {
                // Update individual session
                const instance = instances[0]; // When editing session, there's only one instance
                const instancePayload = {
                    startDate: instance.startDate ? localDateTimeToUTC(instance.startDate) : null,
                    endDate: instance.endDate ? localDateTimeToUTC(instance.endDate) : null,
                    location: instance.location || null,
                    hours: instance.hours,
                    studentCapacity: instance.studentCapacity,
                    parentCapacity: instance.parentCapacity,
                    description: instance.description || null,
                    enabled: instance.enabled !== undefined ? instance.enabled : true,
                    waitlistEnabled: instance.waitlistEnabled !== undefined ? instance.waitlistEnabled : true
                };

                await eventsAPI.updateInstance(sessionId!, instancePayload);
                addNotification('success', 'Session Updated', 'Session has been updated successfully!');
                navigate(`/sessions/${sessionId}`);
            } else if (isEditing) {
                await eventsAPI.update(eventId!, eventPayload);
                addNotification('info', 'Event Archived', 'Your event has been archived successfully.');
            } else {
                const response = await eventsAPI.create(eventPayload);
                addNotification('info', 'Event Archived', 'Your event has been archived successfully.');
                // Navigate to the created event
                navigate(`/events/${response.event.id}`);
            }

            // Close the modal after successful archive
            setShowArchiveModal(false);
        } catch (error) {
            console.error('Failed to archive event:', error);
            addNotification('error', 'Archive Failed', 'Failed to archive event. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setLoading(true);
            if (isEditingSession) {
                // Delete the specific session
                await eventsAPI.deleteInstance(sessionId!);
                addNotification('success', 'Session Deleted', 'Your session has been deleted successfully.');
                navigate(`/events/${sessionEventId}`);
            } else if (isEditing) {
                await eventsAPI.delete(eventId!);
                addNotification('success', 'Event Deleted', 'Your event has been deleted successfully.');
                navigate('/events');
            }
        } catch (error) {
            console.error('Failed to delete event:', error);
            addNotification('error', 'Delete Failed', 'Failed to delete event. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent, action: 'publish' | 'draft' | 'archive') => {
        e.preventDefault();

        // Validation
        if (!eventData.title || !eventData.description || !eventData.category) {
            addNotification('error', 'Missing Information', 'Please fill in all required fields', false);
            return;
        }

        if (instances.some(instance => !instance.hours || instance.hours <= 0)) {
            addNotification('error', 'No Sessions', 'Please set hours for all event instances', false);
            return;
        }

        if (eventData.chapters.length === 0) {
            addNotification('error', 'Missing Information', 'Please select at least one chapter', false);
            return;
        }

        if (eventData.cities.length === 0) {
            addNotification('error', 'Missing Information', 'Please select at least one city', false);
            return;
        }

        try {
            setLoading(true);

            const eventPayload = {
                ...eventData,
                status: action.toUpperCase(),
                tags: eventData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
                instances: instances.map(instance => ({
                    ...(instance.id && { id: instance.id }), // Include ID for existing instances
                    ...(instance.startDate && { startDate: localDateTimeToUTC(instance.startDate) }),
                    ...(instance.endDate && { endDate: localDateTimeToUTC(instance.endDate) }),
                    ...(instance.location && { location: instance.location }),
                    hours: instance.hours,
                    studentCapacity: instance.studentCapacity,
                    parentCapacity: instance.parentCapacity,
                    ...(instance.description && { description: instance.description }),
                    enabled: instance.enabled !== undefined ? instance.enabled : true,
                    waitlistEnabled: instance.waitlistEnabled !== undefined ? instance.waitlistEnabled : true
                }))
            };

            // Remove scheduledPublishDate if it's null to avoid validation issues
            if (eventPayload.scheduledPublishDate === null) {
                delete (eventPayload as any).scheduledPublishDate;
            }

            console.log('Sending event payload:', eventPayload);

            if (isEditingSession) {
                // Update individual session
                const instance = instances[0]; // When editing session, there's only one instance
                const instancePayload = {
                    startDate: instance.startDate ? localDateTimeToUTC(instance.startDate) : null,
                    endDate: instance.endDate ? localDateTimeToUTC(instance.endDate) : null,
                    location: instance.location || null,
                    hours: instance.hours,
                    studentCapacity: instance.studentCapacity,
                    parentCapacity: instance.parentCapacity,
                    description: instance.description || null,
                    enabled: instance.enabled !== undefined ? instance.enabled : true,
                    waitlistEnabled: instance.waitlistEnabled !== undefined ? instance.waitlistEnabled : true
                };

                await eventsAPI.updateInstance(sessionId!, instancePayload);
                addNotification('success', 'Session Updated', 'Session has been updated successfully!');
                navigate(`/sessions/${sessionId}`);
            } else if (isEditing) {
                await eventsAPI.update(eventId!, eventPayload);
                addNotification('success', 'Event Updated', 'Event has been updated successfully!');
                navigate(`/events/${eventId}`);
            } else {
                const response = await eventsAPI.create(eventPayload);
                addNotification('success', 'Event Created', 'Event has been created successfully!');
                // Navigate to the created event
                navigate(`/events/${response.event.id}`);
            }
        } catch (error: any) {
            console.error('Failed to save event:', error);
            const errorMessage = error.response?.data?.details || error.response?.data?.message || 'Failed to save event. Please try again.';
            addNotification('error', 'Save Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!eventData.title || !eventData.description || !eventData.category) {
            addNotification('error', 'Missing Information', 'Please fill in all required fields', false);
            return;
        }

        if (instances.length === 0) {
            addNotification('error', 'No Sessions', 'Please add at least one session', false);
            return;
        }

        if (eventData.chapters.length === 0) {
            addNotification('error', 'Missing Information', 'Please select at least one chapter', false);
            return;
        }

        if (eventData.cities.length === 0) {
            addNotification('error', 'Missing Information', 'Please select at least one city', false);
            return;
        }

        try {
            setLoading(true);

            const eventPayload = {
                ...eventData,
                status: 'DRAFT',
                tags: eventData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
                instances: instances.map(instance => ({
                    ...(instance.id && { id: instance.id }), // Include ID for existing instances
                    ...(instance.startDate && { startDate: localDateTimeToUTC(instance.startDate) }),
                    ...(instance.endDate && { endDate: localDateTimeToUTC(instance.endDate) }),
                    ...(instance.location && { location: instance.location }),
                    hours: instance.hours,
                    studentCapacity: instance.studentCapacity,
                    parentCapacity: instance.parentCapacity,
                    ...(instance.description && { description: instance.description }),
                    enabled: instance.enabled !== undefined ? instance.enabled : true,
                    waitlistEnabled: instance.waitlistEnabled !== undefined ? instance.waitlistEnabled : true
                }))
            };

            // Remove scheduledPublishDate if it's null to avoid validation issues
            if (eventPayload.scheduledPublishDate === null) {
                delete (eventPayload as any).scheduledPublishDate;
            }

            if (isEditingSession) {
                // Update individual session
                const instance = instances[0]; // When editing session, there's only one instance
                const instancePayload = {
                    startDate: instance.startDate ? localDateTimeToUTC(instance.startDate) : null,
                    endDate: instance.endDate ? localDateTimeToUTC(instance.endDate) : null,
                    location: instance.location || null,
                    hours: instance.hours,
                    studentCapacity: instance.studentCapacity,
                    parentCapacity: instance.parentCapacity,
                    description: instance.description || null,
                    enabled: instance.enabled !== undefined ? instance.enabled : true,
                    waitlistEnabled: instance.waitlistEnabled !== undefined ? instance.waitlistEnabled : true
                };

                await eventsAPI.updateInstance(sessionId!, instancePayload);
                addNotification('success', 'Session Saved', 'Session has been saved successfully!');
                // Navigate back to the session detail page
                navigate(`/sessions/${sessionId}`);
            } else if (isEditing) {
                await eventsAPI.update(eventId!, eventPayload);
                addNotification('success', 'Event Saved', 'Event has been saved as draft!');
            } else {
                const response = await eventsAPI.create(eventPayload);
                addNotification('success', 'Event Saved', 'Event has been saved as draft!');
                // Navigate to the created event
                navigate(`/events/${response.event.id}`);
            }
        } catch (error: any) {
            console.error('Failed to save event:', error);
            const errorMessage = error.response?.data?.details || error.response?.data?.message || 'Failed to save event. Please try again.';
            addNotification('error', 'Save Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const toggleChapter = (chapter: string) => {
        setEventData(prev => ({
            ...prev,
            chapters: prev.chapters.includes(chapter)
                ? prev.chapters.filter(c => c !== chapter)
                : [...prev.chapters, chapter]
        }));
    };

    const toggleCity = (city: string) => {
        setEventData(prev => ({
            ...prev,
            cities: prev.cities.includes(city)
                ? prev.cities.filter(c => c !== city)
                : [...prev.cities, city]
        }));
    };
    if (user?.role !== 'ADMIN') {
        return (
            <div className="text-center py-12">
                <p className="text-slate-600 dark:text-slate-300 text-lg">
                    Access denied. Only administrators can edit events.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="text-center flex w-full h-screen items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const pageTitle = isEditingSession ? 'Edit Session' : isEditing ? 'Edit Event' : 'Create New Event';
    const backLink = isEditingSession ? `/sessions/${sessionId}` : isEditing ? `/events/${eventId}` : '/events';

    return (
        <>
            <div className="space-y-6 p-4 lg:p-8 relative">
                {(eventId || sessionId) &&
                    <Link
                        to={backLink}
                        className="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Link>
                }

                {/* Header */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2 ">
                                {pageTitle}
                            </h1>
                            <p className="text-slate-600 dark:text-slate-300">
                                {isEditingSession
                                    ? 'Edit this volunteer session'
                                    : isEditing
                                        ? 'Update your volunteer opportunity'
                                        : 'Set up a new volunteer opportunity for your chapter'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                    {/* Action Buttons */}
                    <div id="controls" className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border-orange-200 dark:border-slate-600 sticky top-0 z-50  transition-all ${stickyControls ? "rounded-none border-0 border-b-2 -mx-4 lg:-mx-8 w-[calc(100%_+_2rem)] lg:w-[calc(100%_+_4rem)] px-4 lg:px-8 py-4" : "p-6 border-2"}`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                <span>Status:</span>
                                <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium capitalize ${eventData.status === 'PUBLISHED'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                    : eventData.status === 'DRAFT'
                                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                        : eventData.status === 'SCHEDULED'
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300'
                                    }`}>
                                    {eventData.status.toLowerCase()}
                                </span>
                                {eventData.status === 'SCHEDULED' && eventData.scheduledPublishDate && (
                                    <span className="text-xs text-blue-600 dark:text-blue-400">
                                        (Publishes: {new Date(eventData.scheduledPublishDate).toLocaleDateString()} {new Date(eventData.scheduledPublishDate).toLocaleTimeString()})
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-3 relative">
                                {/* Save Draft Button - Show for DRAFT, SCHEDULED, or new events (but not when editing sessions) */}
                                {(eventData.status === 'DRAFT' || eventData.status === 'SCHEDULED' || (!isEditing && !isEditingSession)) && (
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 border border-slate-400 shadow-lg"
                                    >
                                        <Save className="w-4 h-4" />
                                        <span className="hidden sm:inline">Save as Draft</span>
                                    </button>
                                )}

                                {/* Update Button - Show for published events or when editing sessions */}
                                {(eventData.status === 'PUBLISHED' || isEditingSession) && (
                                    <button
                                        onClick={handlePublishNow}
                                        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 border border-blue-400 shadow-lg"
                                    >
                                        <Save className="w-4 h-4" />
                                        <span className="hidden sm:inline">{isEditingSession ? 'Update Session' : 'Save Changes'}</span>
                                    </button>
                                )}

                                {/* Publish Dropdown - Only show for DRAFT, SCHEDULED, or new events (but not when editing sessions) */}
                                {(eventData.status === 'DRAFT' || eventData.status === 'SCHEDULED' || (!isEditing && !isEditingSession)) && (
                                    <div className="relative">
                                        {showPublishMenu && (
                                            <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg z-50 min-w-48">
                                                <button
                                                    onClick={handlePublishNow}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-green-50 dark:hover:bg-green-900/20 text-slate-800 dark:text-white flex items-center gap-2 rounded-t-xl"
                                                >
                                                    <Eye className="w-4 h-4 text-green-600" />
                                                    Publish Now
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowScheduleModal(true);
                                                        setShowPublishMenu(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-800 dark:text-white flex items-center gap-2 border-t  border-slate-200 dark:border-slate-600 rounded-b-xl"
                                                >
                                                    <Clock className="w-4 h-4 text-blue-600" />
                                                    Schedule Publish
                                                </button>
                                            </div>
                                        )}

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setShowPublishMenu(!showPublishMenu)
                                            }}
                                            type="button"
                                            className="flex items-center gap-2 bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-200 hover:scale-105 border border-green-300 shadow-lg"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span className="hidden sm:inline">Publish</span>
                                            <ChevronDown className={`w-4 h-4 transition-transform ${showPublishMenu ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                )}

                                {/* Republish Button - Show for archived events */}
                                {eventData.status === 'ARCHIVED' && (
                                    <button
                                        onClick={handlePublishNow}
                                        className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 border border-purple-400 shadow-lg"
                                    >
                                        <Eye className="w-4 h-4" />
                                        <span className="hidden sm:inline">Republish</span>
                                    </button>
                                )}

                                {/* Archive Button - Only show for published events */}
                                {eventData.status === 'PUBLISHED' && !isEditingSession && (
                                    <button
                                        onClick={() => setShowArchiveModal(true)}
                                        className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 border border-yellow-400 shadow-lg"
                                    >
                                        <Archive className="w-4 h-4" />
                                        <span className="hidden sm:inline">Archive</span>
                                    </button>
                                )}

                                {/* Delete Button - Show for events, but for sessions show a different delete button */}
                                {!isEditingSession && (
                                    <button
                                        onClick={() => { setShowDeleteModal(true) }}
                                        className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 border border-red-400 shadow-lg"
                                    >
                                        <Trash className="w-4 h-4" />
                                        <span className="hidden sm:inline">Delete</span>
                                    </button>
                                )}

                                {/* Delete Session Button - Only show when editing a session */}
                                {isEditingSession && (
                                    <button
                                        onClick={() => { setShowDeleteModal(true) }}
                                        className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 border border-red-400 shadow-lg"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="hidden sm:inline">Delete Session</span>
                                    </button>
                                )}

                                {/* Cancel Session Button - Only show when editing a session that is not already cancelled */}
                                {isEditingSession && instances[0]?.status !== 'CANCELLED' && (
                                    <button
                                        onClick={() => { setShowCancelSessionModal(true) }}
                                        className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 border border-orange-400 shadow-lg"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        <span className="hidden sm:inline">Cancel Session</span>
                                    </button>
                                )}

                                {/* Session Status Indicator - Show when editing a cancelled session */}
                                {isEditingSession && instances[0]?.status === 'CANCELLED' && (
                                    <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-4 py-2 rounded-xl border border-red-200 dark:border-red-700/50">
                                        <XCircle className="w-4 h-4" />
                                        <span className="font-medium">Session Cancelled</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Basic Event Info */}
                    {!isEditingSession && (
                        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 ">
                                Event Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Event Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={eventData.title}
                                        onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                                        className="w-full px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-colors"
                                        placeholder="Enter event title"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Category *
                                    </label>
                                    <select
                                        value={eventData.category}
                                        onChange={(e) => setEventData({ ...eventData, category: e.target.value })}
                                        className="w-full px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-colors"
                                        required
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map(category => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Tags (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={eventData.tags}
                                        onChange={(e) => setEventData({ ...eventData, tags: e.target.value })}
                                        className="w-full px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-colors"
                                        placeholder="e.g., outdoor, physical, teamwork"
                                    />
                                </div>

                                <DescriptionEditor eventData={eventData} setEventData={setEventData} />

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Chapters *
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50">
                                        {chapters.map(chapter => (
                                            <label key={chapter} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={eventData.chapters.includes(chapter)}
                                                    onChange={() => toggleChapter(chapter)}
                                                    className="w-4 h-4 text-indigo-500 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded focus:ring-indigo-400 dark:focus:ring-indigo-500"
                                                />
                                                <span className="text-sm text-slate-700 dark:text-slate-300">{chapter}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Cities *
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50">
                                        {cities.map(city => (
                                            <label key={city} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={eventData.cities.includes(city)}
                                                    onChange={() => toggleCity(city)}
                                                    className="w-4 h-4 text-indigo-500 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded focus:ring-indigo-400 dark:focus:ring-indigo-500"
                                                />
                                                <span className="text-sm text-slate-700 dark:text-slate-300">{city}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={eventData.isRecurring}
                                            onChange={(e) => setEventData({ ...eventData, isRecurring: e.target.checked })}
                                            className="w-5 h-5 text-indigo-500 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded focus:ring-indigo-400 dark:focus:ring-indigo-500"
                                        />
                                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                                            This is a recurring event
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Event Instances */}
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50">
                        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-2">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white  w-full text-left">
                                {isEditingSession ? 'Session Details' : 'Event Sessions'}
                            </h2>
                            {!isEditingSession && (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowBulkCreate(true)}
                                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-blue-400 whitespace-nowrap"
                                    >
                                        <Repeat className="w-4 h-4" />
                                        Bulk Create
                                    </button>
                                    <button
                                        type="button"
                                        onClick={addInstance}
                                        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-green-400 whitespace-nowrap"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Session
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Search and filter */}
                        {instances.length > 1 && (
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Search sessions by location or date..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-colors"
                                />
                            </div>
                        )}

                        <div className="space-y-6">
                            {filteredInstances.length === 0 && instances.length > 0 && (
                                <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                                    No sessions match your search.
                                </p>
                            )}

                            {filteredInstances.length === 0 && instances.length === 0 && (
                                <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                                    No sessions created yet. Add your first session above.
                                </p>
                            )}

                            {filteredInstances.map((instance, index) => (
                                <div
                                    key={index}
                                    className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 shadow-lg hover:shadow-xl transition-alltion-200"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white ">
                                            {isEditingSession ? 'Session Details' : `Session ${index + 1}`}
                                        </h3>
                                        <div className="flex gap-2">
                                            <div className="md:col-span-2 self-center">
                                                <button
                                                    type="button"
                                                    onClick={(e) => updateInstance(index, 'enabled', !instance.enabled)}
                                                    className={`inline-flex items-center gap-2 p-2 font-medium duration-200 hover:scale-105 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors`}
                                                    title={instance.enabled ? 'Close session' : 'Open session'}
                                                >
                                                    <span className="text-sm">
                                                        {instance.enabled ? <Power className='w-4 h-4' /> : <PowerOff className='w-4 h-4' />}
                                                    </span>
                                                </button>
                                            </div>
                                            <div className="md:col-span-2 self-center">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (instance.startDate !== undefined) {
                                                            updateInstance(index, 'startDate', undefined);
                                                        } else {
                                                            updateInstance(index, 'startDate', '');
                                                        }
                                                    }}
                                                    className={`inline-flex items-center gap-2 p-2 font-medium duration-200 hover:scale-105 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors`}
                                                    title={instance.startDate !== undefined ? 'Disable date/time' : 'Enable date/time'}
                                                >
                                                    <span className="text-sm">
                                                        {instance.startDate !== undefined ? <CalendarOff className='w-4 h-4' /> : <Calendar className='w-4 h-4' />}
                                                    </span>
                                                </button>
                                            </div>
                                            <div className="md:col-span-2 flex items-center gap-1 self-center bg-slate-200 dark:bg-slate-700 rounded-xl py-0.5 pl-2 pr-1">
                                                <span className="text-xs font-thin text-slate-700 dark:text-slate-200">
                                                    Waitlist
                                                </span>
                                                <label className="relative inline-flex items-center cursor-pointer transition-transform hover:scale-110">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={instance.waitlistEnabled !== false}
                                                        onChange={(e) =>
                                                            updateInstance(index, 'waitlistEnabled', e.target.checked)
                                                        }
                                                    />
                                                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-400 dark:peer-focus:ring-indigo-800 rounded-full dark:bg-slate-600 peer-checked:bg-indigo-500 relative">
                                                        {/* Toggle knob */}
                                                    </div>
                                                    <span className="absolute top-0.5 left-0.5 h-4 w-4 bg-white border border-slate-300 rounded-full transition-transform duration-200 dark:border-slate-500 peer-checked:translate-x-5" />
                                                </label>
                                            </div>
                                            {!isEditingSession && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => duplicateInstance(instance)}
                                                        className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                        title="Duplicate session"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                    {(instances.length > 1 || isEditingSession) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeInstance(index)}
                                                            className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Hours *
                                            </label>
                                            <div>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.5"
                                                    value={instance.hours}
                                                    onChange={(e) => updateInstance(index, 'hours', parseFloat(e.target.value) || 0)}
                                                    className="w-full px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-colors text-center font-bold text-lg"
                                                    placeholder="2"
                                                    required
                                                />

                                            </div>
                                        </div>

                                        {instance.startDate !== undefined && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                        Start Date & Time
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        value={instance.startDate}
                                                        onChange={(e) => updateInstance(index, 'startDate', e.target.value)}
                                                        className="w-full px-4 py-2 text-sm border border-blue-200 dark:border-blue-600 rounded-lg focus:border-blue-400 dark:focus:border-blue-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-colors"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                        End Date & Time
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        value={instance.endDate || ''}
                                                        onChange={(e) => updateInstance(index, 'endDate', e.target.value)}
                                                        className="w-full px-4 py-2 text-sm border border-blue-200 dark:border-blue-600 rounded-lg focus:border-blue-400 dark:focus:border-blue-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-colors"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Location
                                            </label>
                                            <input
                                                type="text"
                                                value={instance.location || ''}
                                                onChange={(e) => updateInstance(index, 'location', e.target.value)}
                                                className="w-full px-4 py-2 text-sm border border-green-200 dark:border-green-600 rounded-lg focus:border-green-400 dark:focus:border-green-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-colors"
                                                placeholder="Event location"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Student Capacity
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={instance.studentCapacity}
                                                onChange={(e) => updateInstance(index, 'studentCapacity', parseInt(e.target.value))}
                                                className="w-full px-4 py-2 text-sm border border-purple-200 dark:border-purple-600 rounded-lg focus:border-purple-400 dark:focus:border-purple-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-colors"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Parent Capacity
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={instance.parentCapacity}
                                                onChange={(e) => updateInstance(index, 'parentCapacity', parseInt(e.target.value))}
                                                className="w-full px-4 py-2 text-sm border border-purple-200 dark:border-purple-600 rounded-lg focus:border-purple-400 dark:focus:border-purple-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-colors"
                                            />
                                        </div>

                                        <div className="md:col-span-2 lg:col-span-1">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Session Notes
                                            </label>
                                            <input
                                                type="text"
                                                value={instance.description || ''}
                                                onChange={(e) => updateInstance(index, 'description', e.target.value)}
                                                className="w-full px-4 py-2 text-sm border border-indigo-200 dark:border-indigo-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-colors"
                                                placeholder="Optional session-specific notes"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </form>
            </div>

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Event"
                message="Are you sure you want to delete this event? This action cannot be undone and will remove all associated sessions and signups."
                confirmText="Delete Event"
                confirmColor="bg-red-500 hover:bg-red-600 border-red-400"
                isLoading={loading}
            />

            <ConfirmationModal
                isOpen={showArchiveModal}
                onClose={() => setShowArchiveModal(false)}
                onConfirm={handleArchive}
                title="Archive Event"
                message="Are you sure you want to archive this event? It will no longer be visible to users but can be restored later."
                confirmText="Archive Event"
                confirmColor="bg-yellow-500 hover:bg-yellow-600 border-yellow-400"
                isLoading={loading}
            />

            <ConfirmationModal
                isOpen={showSessionDeleteModal}
                onClose={() => setShowSessionDeleteModal(false)}
                onConfirm={handleSessionDelete}
                title="Delete Session"
                message="Are you sure you want to delete this session? This action cannot be undone and will remove all associated signups."
                confirmText="Delete Session"
                confirmColor="bg-red-500 hover:bg-red-600 border-red-400"
                isLoading={loading}
            />

            {/* Cancel Session Modal */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150] p-4 transition-opacity duration-300 ${showCancelSessionModal ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
            >
                <div
                    className={`bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 rounded-xl max-w-md w-full max-h-full overflow-y-auto border border-slate-200 dark:border-slate-700/50 transform transition-all ${showCancelSessionModal ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                        }`}
                >
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                        Confirm Session Cancellation
                    </h3>
                    <div className="space-y-4">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Are you sure you want to cancel this session? This action cannot be undone.
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Cancelling this session will notify all signed-up participants and remove any waitlist positions.
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Please provide a reason for cancellation:
                        </p>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Enter cancellation reason..."
                            className="w-full px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white resize-none"
                            rows={3}
                            required
                        />
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={() => {
                                setShowCancelSessionModal(false);
                                setCancelReason('');
                            }}
                            disabled={loading}
                            className={`flex-1 px-3 py-2 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCancelSession}
                            disabled={loading || !cancelReason}
                            className={`flex-1 px-3 py-2 text-sm text-white rounded-lg font-medium transition-all hover:scale-105 bg-red-500 hover:bg-red-600 border-red-400 ${loading || !cancelReason ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Cancelling...
                                </div>
                            ) : (
                                'Cancel Session'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Schedule Publish Modal */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150] p-4 transition-opacity duration-300 ${showScheduleModal ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
            >
                <div
                    className={`bg-white dark:bg-slate-800 p-6 rounded-2xl max-w-md w-full border-4  border-orange-200 dark:border-slate-600 transform transition-all duration-300 ${showScheduleModal ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                        }`}
                >
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 ">
                        Schedule Publish
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Publish Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                value={scheduleDateTime}
                                onChange={(e) => setScheduleDateTime(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-400 dark:focus:border-indigo-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={() => setShowScheduleModal(false)}
                            disabled={loading}
                            className={`flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSchedulePublish}
                            disabled={loading}
                            className={`flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors border border-green-400 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Scheduling...
                                </div>
                            ) : (
                                'Schedule'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div
                className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150] p-4 transition-opacity duration-300 ${showBulkCreate ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
            >
                <div
                    className={`bg-white dark:bg-slate-800 p-6 rounded-2xl max-w-3xl w-full max-h-full border-4  border-orange-200 dark:border-slate-600 transform transition-all duration-300 overflow-y-auto ${showBulkCreate ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                        }`}
                >
                    <h4 className="text-lg font-semibold mb-4  text-slate-800 dark:text-white">Bulk Create Sessions</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-3">
                            {bulkOptions.startDate && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Start Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            value={bulkOptions.startDate}
                                            onChange={(e) => setBulkOptions({ ...bulkOptions, startDate: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">End Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            value={bulkOptions.endDate}
                                            onChange={(e) => setBulkOptions({ ...bulkOptions, endDate: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Frequency</label>
                                <select
                                    value={bulkOptions.frequency}
                                    onChange={(e) => setBulkOptions({ ...bulkOptions, frequency: e.target.value as any })}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>

                            {bulkOptions.frequency === 'weekly' && (
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Days of Week</label>
                                    <div className="flex flex-wrap gap-1">
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => {
                                                    const newDays = bulkOptions.daysOfWeek.includes(index)
                                                        ? bulkOptions.daysOfWeek.filter(d => d !== index)
                                                        : [...bulkOptions.daysOfWeek, index];
                                                    setBulkOptions({ ...bulkOptions, daysOfWeek: newDays });
                                                }}
                                                className={`py-2 px-1 flex-1 text-xs rounded border transition-colors dark:text-white ${bulkOptions.daysOfWeek.includes(index)
                                                    ? 'bg-orange-500 text-white border-orange-400'
                                                    : 'bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600'
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-600 dark:to-slate-500 p-3 rounded-lg border border-blue-200 dark:border-blue-600">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (bulkOptions.startDate) {
                                            setBulkOptions({ ...bulkOptions, startDate: '', endDate: '' });
                                        } else {
                                            setBulkOptions({ ...bulkOptions, startDate: formatForDateTimeLocal(new Date()), endDate: formatForDateTimeLocal(new Date()) });
                                        }
                                    }}
                                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 hover:scale-105 ${bulkOptions.startDate
                                        ? 'bg-blue-500 hover:bg-blue-600 text-white border border-blue-300'
                                        : 'bg-white/50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border border-blue-200 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                        }`}
                                >
                                    <span className="text-sm">
                                        {bulkOptions.startDate ? <Calendar className="w-4 h-4" /> : <CalendarOff className="w-4 h-4" />}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Hours *</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={bulkOptions.hours}
                                    onChange={(e) => setBulkOptions({ ...bulkOptions, hours: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white text-center font-bold"
                                    placeholder="2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Location</label>
                                <input
                                    type="text"
                                    value={bulkOptions.location}
                                    onChange={(e) => setBulkOptions({ ...bulkOptions, location: e.target.value })}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                                    placeholder="Session location"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Student Capacity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={bulkOptions.studentCapacity}
                                        onChange={(e) => setBulkOptions({ ...bulkOptions, studentCapacity: parseInt(e.target.value) || 10 })}
                                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Parent Capacity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={bulkOptions.parentCapacity}
                                        onChange={(e) => setBulkOptions({ ...bulkOptions, parentCapacity: parseInt(e.target.value) || 5 })}
                                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Session Notes (Optional)</label>
                                <textarea
                                    value={bulkOptions.description}
                                    onChange={(e) => setBulkOptions({ ...bulkOptions, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                                    placeholder="Optional notes for all sessions"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:max-w-72 flex gap-2 mt-6 float-right">
                        <button
                            type="button"
                            onClick={() => setShowBulkCreate(false)}
                            disabled={loading}
                            className={`flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors border border-gray-400 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={generateBulkInstances}
                            disabled={loading}
                            className={`flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-md hover:scale-105 text-white py-2 px-4 rounded-lg transition-colors border border-orange-400 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Creating...
                                </div>
                            ) : (
                                'Create'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}