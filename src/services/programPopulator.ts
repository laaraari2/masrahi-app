import { db } from '../db/database';
import { LESSON_PLANS } from '../data/lessonPlans';

const TARGET_LEVEL = 'الأولى إعدادي (1APIC)';
const PROGRAM_VERSION = '2026/2027-30-lessons-v1';

const formatObjectives = (items: string[]) => items.map(item => `• ${item}`).join('\n');

const formatActivities = (plan: typeof LESSON_PLANS[number]) => [
  `1) الإحماء — 5 د: ${plan.warmup}`,
  ...plan.steps.map((step, index) => `${index + 2}) ${step.title} — ${step.duration} د\n${step.instructions}\nملاحظة الأستاذ: ${step.teacherObserves}${step.adaptation ? `\nالتكييف: ${step.adaptation}` : ''}`),
].join('\n\n');

/**
 * يعبئ الجذاذات التفصيلية لحصص 1APIC فقط.
 * overwrite=false يحافظ على أي تسجيل يدوي سابق، بينما overwrite=true مخصص للترقية الأولى للبرنامج.
 */
export async function populateProgram(overwrite = false): Promise<{ updated: number; skipped: number }> {
  const classes = await db.classes.toArray();
  const targetClasses = classes.filter(cls => cls.level === TARGET_LEVEL || cls.name === '1APIC');
  let updated = 0;
  let skipped = 0;

  for (const cls of targetClasses) {
    for (const plan of LESSON_PLANS) {
      const session = await db.sessions
        .where('[classId+date]')
        .equals([cls.id!, plan.date])
        .first();

      if (!session || session.isHoliday) {
        skipped++;
        continue;
      }

      const shouldUpdate = overwrite || !session.topic || !session.lessonPlanId;
      if (!shouldUpdate) {
        skipped++;
        continue;
      }

      await db.sessions.update(session.id!, {
        topic: plan.title,
        objectives: formatObjectives(plan.objectives),
        activities: formatActivities(plan),
        techniques: plan.techniques,
        lessonPlanId: plan.id,
      });
      updated++;
    }
  }

  return { updated, skipped };
}

export async function initializeWorkshopProgram(): Promise<void> {
  const settings = await db.settings.toCollection().first();
  const currentVersion = settings?.programVersion;
  const needsUpgrade = currentVersion !== PROGRAM_VERSION;

  if (needsUpgrade) {
    const targetClasses = (await db.classes.toArray()).filter(
      cls => cls.level === TARGET_LEVEL || cls.name === '1APIC'
    );
    for (const cls of targetClasses) {
      const outOfScope = await db.sessions
        .where('classId').equals(cls.id!)
        .filter(s => !s.isHoliday && (s.date < '2026-09-29' || s.date > '2027-05-25'))
        .toArray();
      const ids = outOfScope.map(s => s.id!).filter(Boolean);
      if (ids.length) await db.sessions.bulkDelete(ids);
    }
  }

  await populateProgram(needsUpgrade);

  if (settings?.id) {
    await db.settings.update(settings.id, { programVersion: PROGRAM_VERSION });
  }
}
