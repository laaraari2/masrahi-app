// ====== أنواع البيانات الرئيسية ======

export interface ClassSection {
  id?: number;
  name: string;
  level: string;
  dayOfWeek: number; // 0=أحد, 1=اثنين, 2=ثلاثاء, 3=أربعاء, 4=خميس, 5=جمعة, 6=سبت
  startTime: string; // "HH:mm"
  duration: number; // بالدقائق
  order: number;
}

export interface TrainingSession {
  id?: number;
  classId: number;
  date: string; // "YYYY-MM-DD"
  startTime: string;
  duration: number;
  topic: string;
  objectives: string;
  activities: string;
  techniques: string[];
  teacherNotes: string;
  difficulties: string;
  studentsNeedingSupport: string;
  nextSessionPlan: string;
  scriptId?: number;
  lessonPlanId?: string;
  sceneInfo: string;
  status: SessionStatus;
  sessionNumber: number;
  isHoliday?: boolean;
  holidayName?: string;
}

export type SessionStatus = 'scheduled' | 'completed' | 'postponed' | 'cancelled';

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: 'مبرمجة',
  completed: 'منجزة',
  postponed: 'مؤجلة',
  cancelled: 'ملغاة',
};

export const SESSION_STATUS_COLORS: Record<SessionStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  postponed: 'bg-amber-100 text-amber-800',
  cancelled: 'bg-red-100 text-red-800',
};

export interface TheaterScript {
  id?: number;
  title: string;
  level: string;
  duration: string;
  characterCount: number;
  characters: string;
  fullText: string;
  scenes: string;
  directionNotes: string;
  stagingNotes: string;
  soundEffects: string;
  music: string;
  lighting: string;
  scenography: string;
  accessories: string;
  techniques: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Holiday {
  id?: number;
  name: string;
  startDate: string;
  endDate: string;
  type: 'vacation' | 'national' | 'custom';
}

export interface LessonPlanStep {
  title: string;
  duration: number;
  instructions: string;
  teacherObserves: string;
  adaptation?: string;
}

export interface LessonPlan {
  id: string;
  sessionNumber: number;
  date: string;
  unitId: string;
  title: string;
  competency: string;
  objectives: string[];
  warmup: string;
  steps: LessonPlanStep[];
  assessment: string[];
  nextStep: string;
  techniques: string[];
}

export interface ProgramPhase {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  activities: string[];
  order: number;
}

export interface AnnualProgram {
  id?: number;
  year: string;
  phases: ProgramPhase[];
}

export interface AppSettings {
  id?: number;
  teacherName: string;
  schoolName: string;
  academicYearStart: string;
  academicYearEnd: string;
  programVersion?: string;
}

export interface AdminAuth {
  id?: number;
  passwordHash: string; // SHA-256 hash
  createdAt: string;
  updatedAt: string;
}

export const LEVELS = [
  'التعليم الأولي (MS/GS)',
  'الأول ابتدائي (CP)',
  'الثاني ابتدائي (CE1)',
  'الثالث ابتدائي (CE2)',
  'الرابع ابتدائي (CM1)',
  'الخامس ابتدائي (CM2)',
  'السادس ابتدائي (6AEP)',
  'الأولى إعدادي (1APIC)',
  'الثانية إعدادي (2APIC)',
  'الثالثة إعدادي (3APIC)',
];

export const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
