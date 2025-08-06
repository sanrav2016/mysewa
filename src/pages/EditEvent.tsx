import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Trash, Repeat, FileText, Copy, Archive, Calendar, MapPin, Users, Clock, Edit, ChevronDown, Ruler as Schedule, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { mockEvents, chapters, cities } from '../data/mockData';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

import DescriptionEditor from '../components/DescriptionEditor';

interface EventInstance {
    id?: string;
    startDate: string;
    endDate: string;
    location: string;
    studentCapacity: number;
    parentCapacity: number;
    description?: string;
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
}

function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText, confirmColor }: ConfirmationModalProps) {
    return (
        <div
            className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150] p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
        >
            <div
                className={`bg-white dark:bg-slate-800 p-6 rounded-2xl max-w-md w-full border-4 border-dashed border-orange-200 dark:border-slate-600 transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                    }`}
            >
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 font-caveat">
                    {title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                    {message}
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors border-2 border-dashed border-slate-300 dark:border-slate-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2 text-white rounded-xl font-medium transition-colors border-2 border-dashed ${confirmColor}`}
                    >
                        {confirmText}
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
        window.addEventListener('scroll', () => {
            setStickyControls(window.scrollY > document.getElementById("controls")!.offsetHeight);
        })

        window.addEventListener('click', () => {
            setShowPublishMenu(false);
        })
    }, [])

    const isEditing = !!eventId;
    const isEditingSession = !!sessionId;

    const [eventData, setEventData] = useState({
        title: '',
        description: '',
        category: '',
        tags: '',
        isRecurring: false,
        status: 'draft' as 'draft' | 'published' | 'archived' | 'scheduled',
        chapters: [] as string[],
        cities: [] as string[],
        scheduledPublishDate: null
    });

    const [instances, setInstances] = useState<EventInstance[]>([
        {
            startDate: '',
            endDate: '',
            location: '',
            studentCapacity: 10,
            parentCapacity: 5,
            description: ''
        }
    ]);

    const [showBulkCreate, setShowBulkCreate] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleDateTime, setScheduleDateTime] = useState('');
    const [bulkOptions, setBulkOptions] = useState<BulkCreateOptions>({
        startDate: '',
        endDate: '',
        frequency: 'weekly',
        daysOfWeek: [],
        location: '',
        studentCapacity: 10,
        parentCapacity: 5,
        description: ''
    });
    const [searchTerm, setSearchTerm] = useState('');

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

    // Load existing event data if editing
    useEffect(() => {
        if (isEditing) {
            const event = mockEvents.find(e => e.id === eventId);
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
                    scheduledPublishDate: null
                });
                setInstances(event.instances.map(instance => (
                    {
                        ...instance,
                        startDate: instance.startDate.slice(0, 16), // Format for datetime-local
                        endDate: instance.endDate.slice(0, 16),
                        restrictions: instance.restrictions || {}
                    }
                )));
            }
        } else if (isEditingSession) {
            // Find session and its parent event
            const sessionData = mockEvents
                .flatMap(event =>
                    event.instances.map(instance => ({
                        ...instance,
                        eventTitle: event.title,
                        eventDescription: event.description,
                        category: event.category,
                        tags: event.tags,
                        eventId: event.id
                    }))
                )
                .find(session => session.id === sessionId);

            if (sessionData) {
                const parentEvent = mockEvents.find(e => e.id === sessionData.eventId);
                if (parentEvent) {
                    setEventData({
                        title: parentEvent.title,
                        description: parentEvent.description,
                        category: parentEvent.category,
                        tags: parentEvent.tags.join(', '),
                        isRecurring: parentEvent.isRecurring,
                        status: parentEvent.status,
                        chapters: parentEvent.chapters,
                        cities: parentEvent.cities,
                        scheduledPublishDate: null
                    });
                    setInstances([{
                        id: sessionData.id,
                        startDate: sessionData.startDate.slice(0, 16),
                        endDate: sessionData.endDate.slice(0, 16),
                        location: sessionData.location,
                        studentCapacity: sessionData.studentCapacity,
                        parentCapacity: sessionData.parentCapacity,
                        description: sessionData.description || ''
                    }]);
                }
            }
        }
    }, [eventId, sessionId, isEditing, isEditingSession]);

    const generateBulkInstances = () => {
        const newInstances: EventInstance[] = [];
        const start = new Date(bulkOptions.startDate);
        const end = new Date(bulkOptions.endDate);

        let current = new Date(start);

        while (current <= end) {
            if (bulkOptions.frequency === 'daily') {
                newInstances.push({
                    startDate: current.toISOString().slice(0, 16),
                    endDate: current.toISOString().slice(0, 16),
                    location: bulkOptions.location,
                    studentCapacity: bulkOptions.studentCapacity,
                    parentCapacity: bulkOptions.parentCapacity,
                    description: bulkOptions.description,
                    restrictions: {}
                });
                current.setDate(current.getDate() + 1);
            } else if (bulkOptions.frequency === 'weekly') {
                if (bulkOptions.daysOfWeek.includes(current.getDay())) {
                    newInstances.push({
                        startDate: current.toISOString().slice(0, 16),
                        endDate: current.toISOString().slice(0, 16),
                        location: bulkOptions.location,
                        studentCapacity: bulkOptions.studentCapacity,
                        parentCapacity: bulkOptions.parentCapacity,
                        description: bulkOptions.description,
                        restrictions: {}
                    });
                }
                current.setDate(current.getDate() + 1);
            } else if (bulkOptions.frequency === 'monthly') {
                newInstances.push({
                    startDate: current.toISOString().slice(0, 16),
                    endDate: current.toISOString().slice(0, 16),
                    location: bulkOptions.location,
                    studentCapacity: bulkOptions.studentCapacity,
                    parentCapacity: bulkOptions.parentCapacity,
                    description: bulkOptions.description,
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
            studentCapacity: 10,
            parentCapacity: 5,
            description: ''
        });
    };

    const filteredInstances = instances.filter(instance =>
        instance.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instance.startDate.includes(searchTerm) ||
        instance.endDate.includes(searchTerm)
    );

    const addInstance = () => {
        setInstances([...instances, {
            startDate: '',
            endDate: '',
            location: '',
            studentCapacity: 10,
            parentCapacity: 5,
            description: '',
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
            setInstances(instances.filter((_, i) => i !== index));
        }
    };

    const updateInstance = (index: number, field: keyof EventInstance, value: string | number | any) => {
        const updated = instances.map((instance, i) =>
            i === index ? { ...instance, [field]: value } : instance
        );
        setInstances(updated);
    };

    const handlePublishNow = () => {
        const updatedEvent = { ...eventData, status: 'published' as any };
        setEventData(updatedEvent);
        console.log('Publishing event now:', updatedEvent);
        addNotification('success', 'Event Published', 'Your event has been published successfully!');
        setShowPublishMenu(false);
    };

    const handleSchedulePublish = () => {
        if (!scheduleDateTime) {
            addNotification('error', 'Missing Information', 'Please select both date and time for scheduling.');
            return;
        }

        const scheduledDateTime = new Date(`${scheduleDateTime}`);
        const updatedEvent = {
            ...eventData,
            status: 'scheduled' as any,
            scheduledPublishDate: scheduledDateTime.toISOString() as any
        };
        setEventData(updatedEvent);
        console.log('Scheduling event for:', scheduledDateTime);
        addNotification('success', 'Event Scheduled', `Your event will be published on ${scheduledDateTime.toLocaleDateString()} at ${scheduledDateTime.toLocaleTimeString()}`);
        setShowScheduleModal(false);
        setShowPublishMenu(false);
    };

    const handleArchive = () => {
        if (confirm('Are you sure you want to archive this event? It will no longer be visible to users.')) {
            const updatedEvent = { ...eventData, status: 'archived' as any };
            setEventData(updatedEvent);
            console.log('Archiving event:', updatedEvent);
            addNotification('info', 'Event Archived', 'Your event has been archived successfully.');
        }
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
            console.log('Deleting event:', eventData);
            addNotification('success', 'Event Deleted', 'Your event has been deleted successfully.');
            navigate('/events');
        }
    };

    const handleSubmit = (e: React.FormEvent, action: 'publish' | 'draft' | 'archive') => {
        e.preventDefault();

        // Validation
        if (!eventData.title || !eventData.description || !eventData.category) {
            addNotification('error', 'Missing Information', 'Please fill in all required fields');
            return;
        }

        if (instances.some(instance => !instance.startDate || !instance.endDate || !instance.location)) {
            addNotification('error', 'No Sessions', 'Please complete all event instances');
            return;
        }

        if (eventData.chapters.length === 0) {
            alert('Please select at least one chapter');
            return;
        }

        if (eventData.cities.length === 0) {
            alert('Please select at least one city');
            return;
        }
        // Mock save logic
        const verb = isEditing ? 'updated' : 'created';
        const statusText = action === 'publish' ? 'published' : action === 'draft' ? 'saved as draft' : 'archived';
        console.log(`${verb} event:`, { eventData: { ...eventData, status: action }, instances });
        alert(`Event ${verb} and ${statusText} successfully!`);

        // Navigate back
        if (isEditingSession) {
            navigate(`/sessions/${sessionId}`);
        } else if (isEditing) {
            navigate(`/events/${eventId}`);
        } else {
            navigate('/events');
        }
    };

    const handleSave = () => {
        if (!eventData.title || !eventData.description || !eventData.category) {
            addNotification('error', 'Missing Information', 'Please fill in all required fields');
            return;
        }

        if (instances.length === 0) {
            addNotification('error', 'No Sessions', 'Please add at least one session');
            return;
        }

        console.log('Saving event:', eventData);
        addNotification('success', 'Event Saved', 'Your event has been saved as a draft.');
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
    if (user?.role !== 'admin') {
        return (
            <div className="text-center py-12">
                <p className="text-slate-600 dark:text-slate-300 text-lg">
                    Access denied. Only administrators can edit events.
                </p>
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
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-lg shadow-lg border-2 border-dashed border-orange-200 dark:border-slate-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 font-caveat">
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
                    <div id="controls" className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border-orange-200 dark:border-slate-600 sticky top-0 z-50 border-dashed transition-all ${stickyControls ? "rounded-none border-0 border-b-2 -mx-4 lg:-mx-8 w-[calc(100%_+_32px)] lg:w-[calc(100%_+_4rem)] px-4 lg:px-8 py-4" : "p-6 border-2"}`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                <span>Status:</span>
                                <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium capitalize ${eventData.status === 'published'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                    : eventData.status === 'draft'
                                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300'
                                    }`}>
                                    {eventData.status}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-3 relative">
                                {/* Save Draft Button */}
                                {eventData.status !== 'published' && (
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-xl font-medium transition-colors border-2 border-dashed border-slate-400"
                                    >
                                        <Save className="w-4 h-4" />
                                        Save Draft
                                    </button>
                                )}

                                {/* Publish Dropdown */}
                                <div className="relative">
                                    {showPublishMenu && (
                                        <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-xl shadow-lg z-50 min-w-48">
                                            <button
                                                onClick={handlePublishNow}
                                                className="w-full text-left px-4 py-3 hover:bg-green-50 dark:hover:bg-green-900/20 text-slate-800 dark:text-white flex items-center gap-2 rounded-t-xl"
                                            >
                                                <Eye className="w-4 h-4 text-green-600" />
                                                Publish Now
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowScheduleModal(true);
                                                    setShowPublishMenu(false);
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-800 dark:text-white flex items-center gap-2 border-t border-dashed border-slate-200 dark:border-slate-600 rounded-b-xl"
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
                                        className="flex items-center gap-2 bg-gradient-to-r from-green-400 to-green-600 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 border-dashed border-green-300"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Publish
                                        <ChevronDown className={`w-4 h-4 transition-transform ${showPublishMenu ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>

                                {/* Archive Button */}
                                <button
                                    onClick={handleArchive}
                                    className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl font-medium transition-colors border-2 border-dashed border-yellow-400"
                                >
                                    <Archive className="w-4 h-4" />
                                    Archive
                                </button>

                                {/* Delete Button */}
                                <button
                                    onClick={() => { setShowDeleteModal(true) }}
                                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-medium transition-colors border-2 border-dashed border-red-400"
                                >
                                    <Trash className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Basic Event Info */}
                    {!isEditingSession && (
                        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-lg shadow-lg border-2 border-dashed border-orange-200 dark:border-slate-600">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 font-caveat">
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
                                        className="w-full px-4 py-3 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-colors"
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
                                        className="w-full px-4 py-3 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-colors"
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
                                        className="w-full px-4 py-3 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-colors"
                                        placeholder="e.g., outdoor, physical, teamwork"
                                    />
                                </div>

                                <DescriptionEditor eventData={eventData} setEventData={setEventData} />

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Chapters *
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50">
                                        {chapters.map(chapter => (
                                            <label key={chapter} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={eventData.chapters.includes(chapter)}
                                                    onChange={() => toggleChapter(chapter)}
                                                    className="w-4 h-4 text-orange-500 bg-white dark:bg-slate-700 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded focus:ring-orange-400 dark:focus:ring-orange-500"
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
                                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50">
                                        {cities.map(city => (
                                            <label key={city} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={eventData.cities.includes(city)}
                                                    onChange={() => toggleCity(city)}
                                                    className="w-4 h-4 text-orange-500 bg-white dark:bg-slate-700 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded focus:ring-orange-400 dark:focus:ring-orange-500"
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
                                            className="w-5 h-5 text-orange-500 bg-white dark:bg-slate-700 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded focus:ring-orange-400 dark:focus:ring-orange-500"
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
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-lg shadow-lg border-2 border-dashed border-orange-200 dark:border-slate-600">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-caveat">
                                {isEditingSession ? 'Session Details' : 'Event Sessions'}
                            </h2>
                            {!isEditingSession && (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowBulkCreate(true)}
                                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors border-2 border-dashed border-blue-400"
                                    >
                                        <Repeat className="w-4 h-4" />
                                        Bulk Create
                                    </button>
                                    <button
                                        type="button"
                                        onClick={addInstance}
                                        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors border-2 border-dashed border-green-400"
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
                                    className="w-full px-4 py-2 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-colors"
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
                                    className="p-6 bg-orange-50 dark:bg-slate-700 rounded-lg border-2 border-dashed border-orange-200 dark:border-slate-500"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white font-caveat">
                                            {isEditingSession ? 'Session Details' : `Session ${index + 1}`}
                                        </h3>
                                        {!isEditingSession && (
                                            <div className="flex gap-2">
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
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Start Date & Time *
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={instance.startDate}
                                                onChange={(e) => updateInstance(index, 'startDate', e.target.value)}
                                                className="w-full px-4 py-3 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-colors"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                End Date & Time *
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={instance.endDate}
                                                onChange={(e) => updateInstance(index, 'endDate', e.target.value)}
                                                className="w-full px-4 py-3 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-colors"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Location *
                                            </label>
                                            <input
                                                type="text"
                                                value={instance.location}
                                                onChange={(e) => updateInstance(index, 'location', e.target.value)}
                                                className="w-full px-4 py-3 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-colors"
                                                placeholder="Event location"
                                                required
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
                                                className="w-full px-4 py-3 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-colors"
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
                                                className="w-full px-4 py-3 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-colors"
                                            />
                                        </div>

                                        <div className="md:col-span-2 lg:col-span-1">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Session Notes
                                            </label>
                                            <input
                                                type="text"
                                                value={instance.description}
                                                onChange={(e) => updateInstance(index, 'description', e.target.value)}
                                                className="w-full px-4 py-3 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white transition-colors"
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
            />

            {/* Schedule Publish Modal */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150] p-4 transition-opacity duration-300 ${showScheduleModal ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
            >
                <div
                    className={`bg-white dark:bg-slate-800 p-6 rounded-2xl max-w-md w-full border-4 border-dashed border-orange-200 dark:border-slate-600 transform transition-all duration-300 ${showScheduleModal ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                        }`}
                >
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 font-caveat">
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
                                className="w-full px-4 py-2 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg focus:border-orange-400 dark:focus:border-orange-400 focus:outline-none bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={() => setShowScheduleModal(false)}
                            className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors border-2 border-dashed border-slate-300 dark:border-slate-600"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSchedulePublish}
                            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors border-2 border-dashed border-green-400"
                        >
                            Schedule
                        </button>
                    </div>
                </div>
            </div>

            <div
                className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150] p-4 transition-opacity duration-300 ${showBulkCreate ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
            >
                <div
                    className={`bg-white dark:bg-slate-800 p-6 rounded-2xl max-w-3xl w-full max-h-full border-4 border-dashed border-orange-200 dark:border-slate-600 transform transition-all duration-300 overflow-y-auto ${showBulkCreate ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                        }`}
                >
                    <h4 className="text-lg font-semibold mb-4 font-caveat text-slate-800 dark:text-white">Bulk Create Sessions</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Start Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={bulkOptions.startDate}
                                    onChange={(e) => setBulkOptions({ ...bulkOptions, startDate: e.target.value })}
                                    className="w-full px-3 py-2 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">End Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={bulkOptions.endDate}
                                    onChange={(e) => setBulkOptions({ ...bulkOptions, endDate: e.target.value })}
                                    className="w-full px-3 py-2 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Frequency</label>
                                <select
                                    value={bulkOptions.frequency}
                                    onChange={(e) => setBulkOptions({ ...bulkOptions, frequency: e.target.value as any })}
                                    className="w-full px-3 py-2 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
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
                                                className={`py-2 px-1 flex-1 text-xs rounded border-2 border-dashed transition-colors dark:text-white ${bulkOptions.daysOfWeek.includes(index)
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
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Location</label>
                                <input
                                    type="text"
                                    value={bulkOptions.location}
                                    onChange={(e) => setBulkOptions({ ...bulkOptions, location: e.target.value })}
                                    className="w-full px-3 py-2 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
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
                                        className="w-full px-3 py-2 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Parent Capacity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={bulkOptions.parentCapacity}
                                        onChange={(e) => setBulkOptions({ ...bulkOptions, parentCapacity: parseInt(e.target.value) || 5 })}
                                        className="w-full px-3 py-2 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Session Notes (Optional)</label>
                                <textarea
                                    value={bulkOptions.description}
                                    onChange={(e) => setBulkOptions({ ...bulkOptions, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                                    placeholder="Optional notes for all sessions"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:max-w-72 flex gap-2 mt-6 float-right">
                        <button
                            type="button"
                            onClick={() => setShowBulkCreate(false)}
                            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors border-2 border-dashed border-gray-400"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={generateBulkInstances}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg transition-colors border-2 border-dashed border-orange-400"
                        >
                            Create
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}