import React from 'react';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { formatLocalDate } from '../utils/dateUtils';

interface EventInstanceDisplayProps {
  instance: {
    startDate?: string;
    endDate?: string;
    location?: string;
    hours?: number;
    status?: string;
    cancelledAt?: string;
    description?: string;
  };
  showTime?: boolean;
  showLocation?: boolean;
  showHours?: boolean;
  showStatus?: boolean;
  showDescription?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showIcons?: boolean;
}

export default function EventInstanceDisplay({
  instance,
  showTime = true,
  showLocation = true,
  showHours = true,
  showStatus = true,
  showDescription = false,
  className = "",
  size = 'small',
  showIcons = false
}: EventInstanceDisplayProps) {
  const hasDateTime = instance.startDate && instance.endDate;
  const hasLocation = instance.location;
  const hasHours = instance.hours;
  const hasDescription = instance.description;

  const sizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  const iconSizes = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-5 h-5'
  };

  const spacingClasses = {
    small: 'space-y-1',
    medium: 'space-y-2',
    large: 'space-y-2'
  };

  return (
    <div className={`flex flex-col ${spacingClasses[size]} text-slate-500 dark:text-slate-400 min-w-0 ${sizeClasses[size]} ${className}`}>
      {/* Date, Time, Location, Hours - will wrap naturally */}
      <div className="flex flex-wrap items-center gap-2">
        {showTime && hasDateTime && (
          <div className="flex items-center gap-1">
            {showIcons && <Calendar className={iconSizes[size]} />}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {formatLocalDate(instance.startDate, 'EEE, MMM d')} • {formatLocalDate(instance.startDate, 'h:mm a')} - {formatLocalDate(instance.endDate, 'h:mm a')}
            </span>
          </div>
        )}

        {showHours && (
          <div className="flex items-center gap-1">
            {showIcons && <Clock className={iconSizes[size]} />}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {instance.hours || 0}h
            </span>
          </div>
        )}

        {showLocation && hasLocation && (
          <div className="flex items-center gap-1">
            {showIcons && <MapPin className={iconSizes[size]} />}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {instance.location}
            </span>
          </div>
        )}

        {showStatus && instance.status && instance.status !== 'ACTIVE' && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            instance.status === 'CANCELLED' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' :
            instance.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
            instance.status === 'POSTPONED' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
            'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}>
            {instance.status.charAt(0) + instance.status.slice(1).toLowerCase()}
          </span>
        )}

        {showTime && !hasDateTime && (
          <div className="flex items-center gap-1">
            {showIcons && <Calendar className={iconSizes[size]} />}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Date TBD
            </span>
          </div>
        )}
      </div>

      {/* Description row - appears below date/location/hours */}
      {showDescription && hasDescription && (
        <div className="w-full mt-1">
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 italic">
            {instance.description}
          </p>
        </div>
      )}
    </div>
  );
} 