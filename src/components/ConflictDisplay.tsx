import React from 'react';
import { Calendar, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface Conflict {
  id: string;
  eventTitle: string;
  eventCategory: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
}

interface ConflictDisplayProps {
  conflicts: Conflict[];
  targetEvent: {
    title: string;
    category: string;
    startDate: string;
    endDate: string;
    location: string;
  };
}

export default function ConflictDisplay({ conflicts, targetEvent }: ConflictDisplayProps) {
  if (conflicts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        <div>
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
            Scheduling Conflict Detected
          </h4>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            You have {conflicts.length} event{conflicts.length !== 1 ? 's' : ''} that overlap{conflicts.length === 1 ? 's' : ''} with this time slot.
          </p>
        </div>
      </div>

    

      <div>
        <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">
          Conflicting Events:
        </h5>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {conflicts.map((conflict) => (
            <div
              key={conflict.id}
              className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="font-medium text-red-900 dark:text-red-100">
                    {conflict.eventTitle}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    conflict.status === 'CONFIRMED'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  }`}>
                    {conflict.status === 'CONFIRMED' ? 'Confirmed' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-red-700 dark:text-red-300">
                    {format(new Date(conflict.startDate), 'MMM d, yyyy h:mm a')} - {format(new Date(conflict.endDate), 'h:mm a')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          <strong>Note:</strong> You can still proceed with the signup, but please ensure you can attend all events or consider cancelling one of the conflicting events.
        </p>
      </div>
    </div>
  );
} 