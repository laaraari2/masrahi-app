import type { Holiday } from '../types';

/**
 * الفترات البينية والعطل الثابتة الخاصة بالسنة الدراسية 2026/2027.
 * تواريخ الأعياد الدينية المتحركة لا تُثبت هنا مسبقاً لأنها رهينة بالتأكيد الرسمي.
 */
export const DEFAULT_HOLIDAYS: Omit<Holiday, 'id'>[] = [
  { name: 'الفترة البينية الأولى', startDate: '2026-10-18', endDate: '2026-10-25', type: 'vacation' },
  { name: 'عيد الوحدة', startDate: '2026-10-31', endDate: '2026-10-31', type: 'national' },
  { name: 'ذكرى المسيرة الخضراء', startDate: '2026-11-06', endDate: '2026-11-06', type: 'national' },
  { name: 'عيد الاستقلال', startDate: '2026-11-18', endDate: '2026-11-18', type: 'national' },
  { name: 'الفترة البينية الثانية', startDate: '2026-12-06', endDate: '2026-12-13', type: 'vacation' },
  { name: 'فاتح السنة الميلادية', startDate: '2027-01-01', endDate: '2027-01-01', type: 'national' },
  { name: 'ذكرى تقديم وثيقة الاستقلال', startDate: '2027-01-11', endDate: '2027-01-11', type: 'national' },
  { name: 'فاتح السنة الأمازيغية', startDate: '2027-01-14', endDate: '2027-01-14', type: 'national' },
  { name: 'عطلة منتصف السنة الدراسية', startDate: '2027-01-24', endDate: '2027-01-31', type: 'vacation' },
  { name: 'الفترة البينية الثالثة', startDate: '2027-03-21', endDate: '2027-03-28', type: 'vacation' },
  { name: 'عيد الشغل', startDate: '2027-05-01', endDate: '2027-05-01', type: 'national' },
  { name: 'الفترة البينية الرابعة', startDate: '2027-05-09', endDate: '2027-05-16', type: 'vacation' },
];

export const ACADEMIC_YEAR = {
  start: '2026-09-07',
  end: '2027-07-03',
  label: '2026/2027',
};

export const WORKSHOP = {
  start: '2026-09-29',
  end: '2027-05-25',
  weekday: 2,
  targetLevel: '1APIC',
  sessionCount: 30,
};
