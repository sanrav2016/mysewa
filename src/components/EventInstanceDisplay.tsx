import React from 'react';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { formatLocalDate } from '../utils/dateUtils';

interface EventInstanceDisplayProps {
  instance: {
    startDate?: string;
    endDate?: string;
    location?: string;
    hours?: number;
  };
  showTime?: boolean;
  showLocation?: boolean;
  showHours?: boolean;
  className?: string;
}

export default function EventInstanceDisplay({
  instance,
  showTime = true,
  showLocation = true,
  showHours = true,
  className = ""
}: EventInstanceDisplayProps) {
  const hasDateTime = instance.startDate && instance.endDate;
  const hasLocation = instance.location;
  const hasHours = instance.hours;

  return (
    <div className={`flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400 min-w-0 ${className}`}>
      {showTime && hasDateTime && (
        <span className="truncate">{formatLocalDate(instance.startDate, 'MMM d, h:mm a')}</span>
      )}

      {showHours && (
        <span className="truncate">{instance.hours || 0}h</span>
      )}

      {showLocation && hasLocation && (
        <span className="truncate">{instance.location}</span>
      )}

      {showTime && !hasDateTime && (
        <span className="truncate">Date TBD</span>
      )}
    </div>
  );
} 