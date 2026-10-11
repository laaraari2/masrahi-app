import type { ClassSection, TrainingSession, Holiday } from '../types';
import { getWeekDatesInRange, toISODate } from '../utils/dateUtils';
import { isDateHoliday } from './holidayChecker';
import { db } from '../db/database';
import { WORKSHOP } from '../constants/holidays';

export function generateSessionsForClass(
  cls: ClassSection,
  holidays: Holiday[],
  yearStart: string,
  yearEnd: string
): Omit<TrainingSession, 'id'>[] {
  const isTargetWorkshop = cls.level === 'الأولى إعدادي (1APIC)' || cls.name === WORKSHOP.targetLevel;
  const effectiveStart = isTargetWorkshop && WORKSHOP.start > yearStart ? WORKSHOP.start : yearStart;
  const effectiveEnd = isTargetWorkshop && WORKSHOP.end < yearEnd ? WORKSHOP.end : yearEnd;
  const dates = effectiveStart <= effectiveEnd
    ? getWeekDatesInRange(cls.dayOfWeek, effectiveStart, effectiveEnd)
    : [];
  const sessions: Omit<TrainingSession, 'id'>[] = [];
  let sessionNumber = 0;

  for (const date of dates) {
    const check = isDateHoliday(date, holidays);
    if (check.isHoliday) {
      sessions.push({
        classId: cls.id!,
        date,
        startTime: cls.startTime,
        duration: cls.duration,
        topic: '',
        objectives: '',
        activities: '',
        techniques: [],
        teacherNotes: '',
        difficulties: '',
        studentsNeedingSupport: '',
        nextSessionPlan: '',
        sceneInfo: '',
        status: 'cancelled',
        sessionNumber: 0,
        isHoliday: true,
        holidayName: check.holidayName,
      });
    } else {
      sessionNumber++;
      sessions.push({
        classId: cls.id!,
        date,
        startTime: cls.startTime,
        duration: cls.duration,
        topic: '',
        objectives: '',
        activities: '',
        techniques: [],
        teacherNotes: '',
        difficulties: '',
        studentsNeedingSupport: '',
        nextSessionPlan: '',
        sceneInfo: '',
        status: 'scheduled',
        sessionNumber,
        isHoliday: false,
      });
    }
  }
  return sessions;
}

export async function regenerateFutureSessions(classId: number): Promise<void> {
  const cls = await db.classes.get(classId);
  if (!cls) return;

  const holidays = await db.holidays.toArray();
  const settings = await db.settings.toCollection().first();
  const yearStart = settings?.academicYearStart || '2026-09-07';
  const yearEnd = settings?.academicYearEnd || '2027-07-03';
  const today = toISODate(new Date());
  const isTargetWorkshop = cls.level === 'الأولى إعدادي (1APIC)' || cls.name === WORKSHOP.targetLevel;
  const regenerationStart = isTargetWorkshop && today < WORKSHOP.start ? WORKSHOP.start : today;
  const regenerationEnd = isTargetWorkshop ? WORKSHOP.end : yearEnd;

  // حذف الحصص المستقبلية غير المنجزة فقط
  const futureSessions = await db.sessions
    .where('classId').equals(classId)
    .filter(s => s.date >= today && s.status === 'scheduled')
    .toArray();

  const idsToDelete = futureSessions.map(s => s.id!).filter(Boolean);
  if (idsToDelete.length > 0) {
    await db.sessions.bulkDelete(idsToDelete);
  }

  // Also delete future holiday placeholders
  const futureHolidaySessions = await db.sessions
    .where('classId').equals(classId)
    .filter(s => s.date >= today && s.isHoliday === true)
    .toArray();
  const holidayIds = futureHolidaySessions.map(s => s.id!).filter(Boolean);
  if (holidayIds.length > 0) {
    await db.sessions.bulkDelete(holidayIds);
  }

  // إيجاد آخر رقم حصة
  const lastCompleted = await db.sessions
    .where('classId').equals(classId)
    .filter(s => s.status === 'completed' || s.status === 'postponed')
    .toArray();
  const maxSessionNum = lastCompleted.reduce((max, s) => Math.max(max, s.sessionNumber), 0);

  // توليد الحصص الجديدة من اليوم
  const dates = regenerationStart <= regenerationEnd
    ? getWeekDatesInRange(cls.dayOfWeek, regenerationStart, regenerationEnd)
    : [];
  const newSessions: Omit<TrainingSession, 'id'>[] = [];
  let num = maxSessionNum;

  for (const date of dates) {
    // Check if a session already exists for this date
    const existing = await db.sessions
      .where('[classId+date]')
      .equals([classId, date])
      .first();
    if (existing) continue;

    const check = isDateHoliday(date, holidays);
    if (check.isHoliday) {
      newSessions.push({
        classId, date, startTime: cls.startTime, duration: cls.duration,
        topic: '', objectives: '', activities: '', techniques: [],
        teacherNotes: '', difficulties: '', studentsNeedingSupport: '',
        nextSessionPlan: '', sceneInfo: '', status: 'cancelled',
        sessionNumber: 0, isHoliday: true, holidayName: check.holidayName,
      });
    } else {
      num++;
      newSessions.push({
        classId, date, startTime: cls.startTime, duration: cls.duration,
        topic: '', objectives: '', activities: '', techniques: [],
        teacherNotes: '', difficulties: '', studentsNeedingSupport: '',
        nextSessionPlan: '', sceneInfo: '', status: 'scheduled',
        sessionNumber: num, isHoliday: false,
      });
    }
  }

  if (newSessions.length > 0) {
    await db.sessions.bulkAdd(newSessions);
  }
}

export async function regenerateAllSessions(): Promise<void> {
  const classes = await db.classes.toArray();
  for (const cls of classes) {
    await regenerateFutureSessions(cls.id!);
  }
}
