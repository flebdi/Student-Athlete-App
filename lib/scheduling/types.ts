
// lib/scheduling/types.ts

// ----------------------
// Core Time Types
// ----------------------
export type ISODateString = string; // e.g., "2024-10-01T10:00:00Z"

// ----------------------
// Input Entities
// ----------------------

export type EventType = 
  | 'CLASS' 
  | 'PRACTICE' 
  | 'GAME' 
  | 'MEAL' 
  | 'SLEEP' 
  | 'TRAVEL' 
  | 'STUDY' 
  | 'RECOVERY' 
  | 'OTHER';

export interface CalendarEvent {
  id: string;
  title: string;
  start: ISODateString;
  end: ISODateString;
  type: EventType;
  isLocked: boolean; // If true, generator cannot move this
  location?: string;
  meta?: {
    courseId?: string;
    assignmentId?: string;
    originalTemplateId?: string;
  };
}

export interface AssignmentTask {
  id: string;
  title: string;
  dueDate: ISODateString; // Hard deadline
  estimatedDurationMinutes: number; // Total work needed
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  minBlockDuration?: number; // Minimum time chunk (default 30)
}

export interface UserConstraints {
  workDayStart: string; // "06:00" - Earliest allowed event
  workDayEnd: string;   // "22:00" - Latest allowed event
  minBufferMinutes: number; // e.g. 15
  maxDailyStudyMinutes: number; // Prevent burnout
  preferredStudyTimes?: { start: string; end: string }[]; // Optional hints
}

// ----------------------
// Engine DTOs
// ----------------------

export interface SchedulingRequest {
  rangeStart: ISODateString;
  rangeEnd: ISODateString;
  fixedEvents: CalendarEvent[];
  assignments: AssignmentTask[];
  constraints: UserConstraints;
  timezone: string; // e.g. "America/New_York"
}

export interface SchedulingResult {
  plannedEvents: CalendarEvent[]; // The full schedule (fixed + generated)
  unassignedTasks: AssignmentTask[]; // Things that didn't fit
  metrics: {
    allocatedStudyMinutes: number;
    tasksCompleted: number;
    scheduleUtilization: number; // 0-1 score
  };
  errors?: string[];
}
