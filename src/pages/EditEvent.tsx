import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Plus, Trash2, Save, Copy, Repeat, ArrowLeft, Edit, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { mockEvents } from '../data/mockData';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MDEditor from '@uiw/react-md-editor';
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

export default function EditEvent() {
    const { eventId, sessionId } = useParams();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const navigate = useNavigate();

    const isEditing = !!eventId;
    const isEditingSession = !!sessionId;

    const [eventData, setEventData] = useState({
        title: '',
        description: '',
        category: '',
        tags: '',
        isRecurring: false
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
    const [isPreviewMode, setIsPreviewMode] = useState(false);

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
                    isRecurring: event.isRecurring
                });
                setInstances(event.instances.map(instance => (
                    {
                        ...instance,
                        startDate: instance.startDate.slice(0, 16), // Format for datetime-local
                        endDate: instance.endDate.slice(0, 16)
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
                        isRecurring: parentEvent.isRecurring
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
                    description: bulkOptions.description
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
                        description: bulkOptions.description
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
                    description: bulkOptions.description
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
            description: ''
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

    const updateInstance = (index: number, field: keyof EventInstance, value: string | number) => {
        const updated = instances.map((instance, i) =>
            i === index ? { ...instance, [field]: value } : instance
        );
        setInstances(updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!eventData.title || !eventData.description || !eventData.category) {
            alert('Please fill in all required fields');
            return;
        }

        if (instances.some(instance => !instance.startDate || !instance.endDate || !instance.location)) {
            alert('Please complete all event instances');
            return;
        }

        // Mock save logic
        const action = isEditing ? 'updated' : 'created';
        console.log(`${action} event:`, { eventData, instances });
        alert(`Event ${action} successfully!`);

        // Navigate back
        if (isEditingSession) {
            navigate(`/sessions/${sessionId}`);
        } else if (isEditing) {
            navigate(`/events/${eventId}`);
        } else {
            navigate('/events');
        }
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
            alert('Event deleted successfully!');
            navigate('/events');
        }
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
            <div className="space-y-6">
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
                        {isEditing && !isEditingSession && (
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors border-2 border-dashed border-red-400"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Event
                            </button>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors border-2 border-dashed border-green-400"
                        >
                            <Save className="w-5 h-5" />
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${showBulkCreate ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
            >
                <div
                    className={`bg-white dark:bg-slate-800 p-6 rounded-2xl max-w-md w-full border-4 border-dashed border-orange-200 dark:border-slate-600 transform transition-all duration-300 ${showBulkCreate ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                        }`}
                >
                    <h4 className="text-lg font-semibold mb-4 font-caveat text-slate-800 dark:text-white">Bulk Create Sessions</h4>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Start Date</label>
                            <input
                                type="date"
                                value={bulkOptions.startDate}
                                onChange={(e) => setBulkOptions({ ...bulkOptions, startDate: e.target.value })}
                                className="w-full px-3 py-2 border-2 border-dashed border-orange-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 text-slate-800 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">End Date</label>
                            <input
                                type="date"
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
                                <div className="grid grid-cols-7 gap-1">
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
                                            className={`p-2 text-xs rounded border-2 border-dashed transition-colors ${bulkOptions.daysOfWeek.includes(index)
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

                    <div className="flex gap-2 mt-6">
                        <button
                            type="button"
                            onClick={generateBulkInstances}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg transition-colors border-2 border-dashed border-orange-400"
                        >
                            Create Sessions
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowBulkCreate(false)}
                            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors border-2 border-dashed border-gray-400"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}