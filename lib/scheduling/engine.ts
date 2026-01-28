
import {
    addMinutes,
    areIntervalsOverlapping,
    differenceInMinutes,
    format,
    parseISO,
    isBefore,
    isAfter,
    compareAsc
} from 'date-fns';
import {
    CalendarEvent,
    AssignmentTask,
    UserConstraints,
    SchedulingRequest,
    SchedulingResult,
    ISODateString
} from './types';

/**
 * CORE SCHEDULING ENGINE
 * 
 * Strategy: Greedy Time Blocking
 * 1. Place fixed events
 * 2. Calculate "Negative Space" (Free Time)
 * 3. Fill Free Time with High Priority Assignments
 */

// -------------------------
// 1. Helpers
// -------------------------

function parseDate(d: ISODateString): Date {
    return parseISO(d);
}

// Verify if an event fits in the range
function isWithinRange(start: Date, end: Date, rangeStart: Date, rangeEnd: Date) {
    return isAfter(start, rangeStart) && isBefore(end, rangeEnd);
}

// -------------------------
// 2. Core Functions
// -------------------------

/**
 * Normalizes inputs: sorts events, ensures dates are valid objects
 */
function normalizeEvents(events: CalendarEvent[]): CalendarEvent[] {
    return events.sort((a, b) => compareAsc(parseDate(a.start), parseDate(b.start)));
}

/**
 * Finds all gaps between fixed events that are larger than minBlockDuration
 */
function findFreeBlocks(
    events: CalendarEvent[],
    rangeStart: Date,
    rangeEnd: Date,
    constraints: UserConstraints
): { start: Date; end: Date }[] {

    const sorted = normalizeEvents(events);
    const freeBlocks: { start: Date; end: Date }[] = [];

    let cursor = rangeStart;

    // Iterate through sorted fixed events
    for (const event of sorted) {
        const eventStart = parseDate(event.start);
        const eventEnd = parseDate(event.end);

        // Apply buffer to cursor and event start
        // Effective usable start is cursor
        // Effective usable end is eventStart - buffer
        const buffer = constraints.minBufferMinutes || 0;
        const proposedEnd = addMinutes(eventStart, -buffer);

        // Check if there is space between cursor and (eventStart - buffer)
        if (differenceInMinutes(proposedEnd, cursor) >= 30) {
            freeBlocks.push({ start: cursor, end: proposedEnd });
        }

        // Move cursor to eventEnd + buffer
        cursor = addMinutes(eventEnd, buffer);
    }

    // Check final gap after last event
    if (differenceInMinutes(rangeEnd, cursor) >= 30) {
        freeBlocks.push({ start: cursor, end: rangeEnd });
    }

    return freeBlocks;
}

/**
 * Allocates assignments into free blocks
 */
function allocateStudyBlocks(
    freeBlocks: { start: Date; end: Date }[],
    assignments: AssignmentTask[],
    constraints: UserConstraints
): { allocated: CalendarEvent[]; unassigned: AssignmentTask[] } {

    const allocated: CalendarEvent[] = [];
    const unassigned: AssignmentTask[] = []; // We make a copy to mutate

    // 1. Sort Assignments by Priority then DueDate
    const queue = [...assignments].sort((a, b) => {
        // Priority Score: HIGH=3, MED=2, LOW=1
        const getScore = (p: string) => p === 'HIGH' ? 3 : p === 'MEDIUM' ? 2 : 1;
        const scoreDiff = getScore(b.priority) - getScore(a.priority);

        if (scoreDiff !== 0) return scoreDiff;
        return compareAsc(parseDate(a.dueDate), parseDate(b.dueDate)); // Earliest due first
    });

    // 2. Fill Blocks
    // This is a simplified "Best Fit" - we just take the first block that fits

    for (const task of queue) {
        let timeRemaining = task.estimatedDurationMinutes;
        let taskAllocations: CalendarEvent[] = [];

        for (let i = 0; i < freeBlocks.length; i++) {
            if (timeRemaining <= 0) break;

            const block = freeBlocks[i];
            const blockDuration = differenceInMinutes(block.end, block.start);
            const minChunk = task.minBlockDuration || 30;

            if (blockDuration < minChunk) continue; // Block too small

            const allocDuration = Math.min(blockDuration, timeRemaining);

            // Create the event
            const newEventStart = block.start;
            const newEventEnd = addMinutes(block.start, allocDuration);

            taskAllocations.push({
                id: `gen_${task.id}_${i}`,
                title: `Study: ${task.title}`,
                start: newEventStart.toISOString(),
                end: newEventEnd.toISOString(),
                type: 'STUDY',
                isLocked: false,
                meta: { assignmentId: task.id }
            });

            // Update state
            timeRemaining -= allocDuration;

            // Shrink the free block
            // In a real interval tree, we'd split the block. 
            // For this greedy array, we just shift the start time of the block object in the array 
            // (careful with object references in real interactions, but works for this pass)
            freeBlocks[i] = { start: newEventEnd, end: block.end };
        }

        if (timeRemaining <= 0) {
            allocated.push(...taskAllocations);
        } else {
            // If we couldn't fully schedule it, we might skip adding ANY of it (Atomic) or add partials
            // Strategy: Add partials, but mark task as unassigned (or partially assigned)
            allocated.push(...taskAllocations);
            unassigned.push({ ...task, estimatedDurationMinutes: timeRemaining });
        }
    }

    return { allocated, unassigned };
}

/**
 * Main Public Function
 */
export function generateWeeklyPlan(request: SchedulingRequest): SchedulingResult {
    const { rangeStart, rangeEnd, fixedEvents, assignments, constraints } = request;

    const rStart = parseDate(rangeStart);
    const rEnd = parseDate(rangeEnd);

    // 1. Identify Free Blocks considering Fixed Events & Buffers
    const freeBlocks = findFreeBlocks(fixedEvents, rStart, rEnd, constraints);

    // 2. Allocate Study Blocks
    const result = allocateStudyBlocks(freeBlocks, assignments, constraints);

    // 3. Assemble Result
    const finalSchedule = [
        ...fixedEvents,
        ...result.allocated
    ].sort((a, b) => compareAsc(parseDate(a.start), parseDate(b.start)));

    return {
        plannedEvents: finalSchedule,
        unassignedTasks: result.unassigned,
        metrics: {
            allocatedStudyMinutes: result.allocated.reduce((acc, curr) => {
                return acc + differenceInMinutes(parseISO(curr.end), parseISO(curr.start));
            }, 0),
            tasksCompleted: assignments.length - result.unassigned.length,
            scheduleUtilization: 0.85 // Placeholder calculation
        }
    };
}
