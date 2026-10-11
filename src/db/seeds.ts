import { db } from './database';
import { DEFAULT_HOLIDAYS, ACADEMIC_YEAR } from '../constants/holidays';
import { DEFAULT_PROGRAM_PHASES } from '../constants/program';
import { generateSessionsForClass } from '../services/sessionGenerator';
import { defaultScriptsData } from '../data/scripts';

export async function seedDatabase(): Promise<void> {
  const classCount = await db.classes.count();
  if (classCount > 0) return;

  const defaultClasses = [
    { name: 'CP', level: 'الأول ابتدائي (CP)', dayOfWeek: 1, startTime: '10:30', duration: 30, order: 1 },
    { name: 'CE2', level: 'الثالث ابتدائي (CE2)', dayOfWeek: 1, startTime: '11:00', duration: 30, order: 2 },
    { name: 'CM2', level: 'الخامس ابتدائي (CM2)', dayOfWeek: 1, startTime: '11:30', duration: 30, order: 3 },
    { name: '2APIC', level: 'الثانية إعدادي (2APIC)', dayOfWeek: 2, startTime: '14:30', duration: 60, order: 4 },
    { name: '1APIC', level: 'الأولى إعدادي (1APIC)', dayOfWeek: 2, startTime: '15:30', duration: 60, order: 5 },
    { name: 'MS/GS', level: 'التعليم الأولي (MS/GS)', dayOfWeek: 4, startTime: '10:00', duration: 30, order: 6 },
    { name: 'CE1', level: 'الثاني ابتدائي (CE1)', dayOfWeek: 4, startTime: '11:00', duration: 30, order: 7 },
    { name: 'CM1', level: 'الرابع ابتدائي (CM1)', dayOfWeek: 4, startTime: '11:30', duration: 30, order: 8 },
  ];

  const classIds = await db.classes.bulkAdd(defaultClasses, { allKeys: true });

  // 2. إنشاء العطل
  await db.holidays.bulkAdd(DEFAULT_HOLIDAYS.map(h => ({ ...h })));

  // 3. البرنامج السنوي
  await db.programs.add({ year: ACADEMIC_YEAR.label, phases: DEFAULT_PROGRAM_PHASES });

  // 4. الإعدادات
  await db.settings.add({
    teacherName: 'مصطفى لعرعري',
    schoolName: 'مؤسسة العمران (AL OUMRANE)',
    academicYearStart: ACADEMIC_YEAR.start,
    academicYearEnd: ACADEMIC_YEAR.end,
    programVersion: undefined,
  });

  // 5. توليد الحصص لكل قسم
  const holidays = await db.holidays.toArray();
  for (let i = 0; i < classIds.length; i++) {
    const cls = { ...defaultClasses[i], id: classIds[i] as number };
    const sessions = generateSessionsForClass(cls, holidays, ACADEMIC_YEAR.start, ACADEMIC_YEAR.end);
    await db.sessions.bulkAdd(sessions);
  }
}

export async function seedScripts(): Promise<void> {
  const existingScripts = await db.scripts.toArray();
  const existingTitles = new Set(existingScripts.map(s => s.title));
  const now = new Date().toISOString();

  const missingScripts = defaultScriptsData
    .filter(s => !existingTitles.has(s.title))
    .map(s => ({
      title: s.title,
      level: s.level,
      duration: s.duration,
      characterCount: s.characterCount,
      characters: s.characters,
      fullText: s.fullText,
      scenes: s.scenes,
      directionNotes: s.directionNotes,
      stagingNotes: s.stagingNotes,
      soundEffects: s.soundEffects,
      music: s.music,
      lighting: s.lighting,
      scenography: s.scenography,
      accessories: s.accessories,
      techniques: s.techniques,
      createdAt: now,
      updatedAt: now,
    }));

  if (missingScripts.length > 0) {
    await db.scripts.bulkAdd(missingScripts as any);
  }
}
