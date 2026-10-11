import { supabase } from '../lib/supabase';
import { db } from '../db/database';
import type { TrainingSession, ClassSection, AppSettings, TheaterScript } from '../types';

/**
 * خدمة المزامنة السحابية مع Supabase
 */
export const syncService = {
  /**
   * رفع كافة البيانات المحلية (الأقسام، الحصص، التقارير، النصوص، الإعدادات) إلى Supabase
   */
  async pushAllToCloud(): Promise<{ success: boolean; error?: string }> {
    try {
      const localClasses = await db.classes.toArray();
      const localSessions = await db.sessions.toArray();
      const localScripts = await db.scripts.toArray();
      const localSettings = await db.settings.toCollection().first();

      // 1. رفع الأقسام
      if (localClasses.length > 0) {
        const classesPayload = localClasses.map(c => ({
          id: c.id,
          name: c.name,
          level: c.level,
          day_of_week: c.dayOfWeek,
          start_time: c.startTime,
          duration: c.duration,
          order_num: c.order || 0,
        }));
        await supabase.from('classes').upsert(classesPayload, { onConflict: 'id' });
      }

      // 2. رفع الحصص والتقارير
      if (localSessions.length > 0) {
        const sessionsPayload = localSessions.map(s => ({
          id: s.id,
          class_id: s.classId,
          session_number: s.sessionNumber || 1,
          date: s.date,
          start_time: s.startTime,
          duration: s.duration,
          topic: s.topic || '',
          objectives: s.objectives || '',
          activities: s.activities || '',
          techniques: s.techniques || [],
          teacher_notes: s.teacherNotes || '',
          difficulties: s.difficulties || '',
          students_needing_support: s.studentsNeedingSupport || '',
          next_session_plan: s.nextSessionPlan || '',
          script_id: s.scriptId || null,
          lesson_plan_id: s.lessonPlanId || null,
          scene_info: s.sceneInfo || '',
          status: s.status || 'scheduled',
          is_holiday: s.isHoliday || false,
          holiday_name: s.holidayName || null,
        }));

        // Batch upload in chunks of 50
        for (let i = 0; i < sessionsPayload.length; i += 50) {
          const chunk = sessionsPayload.slice(i, i + 50);
          await supabase.from('sessions').upsert(chunk, { onConflict: 'id' });
        }
      }

      // 3. رفع النصوص المسرحية
      if (localScripts.length > 0) {
        const scriptsPayload = localScripts.map(sc => ({
          id: sc.id,
          title: sc.title,
          level: sc.level,
          duration: sc.duration,
          character_count: sc.characterCount || 0,
          characters: sc.characters || '',
          full_text: sc.fullText || '',
          scenes: sc.scenes || '',
          direction_notes: sc.directionNotes || '',
          staging_notes: sc.stagingNotes || '',
          sound_effects: sc.soundEffects || '',
          music: sc.music || '',
          lighting: sc.lighting || '',
          scenography: sc.scenography || '',
          accessories: sc.accessories || '',
          techniques: sc.techniques || [],
        }));

        for (let i = 0; i < scriptsPayload.length; i += 20) {
          const chunk = scriptsPayload.slice(i, i + 20);
          await supabase.from('scripts').upsert(chunk, { onConflict: 'id' });
        }
      }

      // 4. رفع الإعدادات
      if (localSettings) {
        await supabase.from('settings').upsert({
          id: localSettings.id || 1,
          teacher_name: localSettings.teacherName,
          school_name: localSettings.schoolName,
          academic_year_start: localSettings.academicYearStart,
          academic_year_end: localSettings.academicYearEnd,
        }, { onConflict: 'id' });
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error pushing to cloud:', err);
      return { success: false, error: err.message || 'فشل رفع البيانات إلى السحابة' };
    }
  },

  /**
   * جلب البيانات السحابية وحفظها محلياً
   */
  async pullAllFromCloud(): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const { data: cloudSessions, error: sErr } = await supabase.from('sessions').select('*');
      if (sErr) throw sErr;

      const { data: cloudClasses, error: cErr } = await supabase.from('classes').select('*');
      if (cErr) throw cErr;

      const { data: cloudScripts } = await supabase.from('scripts').select('*');
      const { data: cloudSettings } = await supabase.from('settings').select('*').limit(1);

      if (cloudClasses && cloudClasses.length > 0) {
        const formattedClasses: ClassSection[] = cloudClasses.map(c => ({
          id: c.id,
          name: c.name,
          level: c.level,
          dayOfWeek: c.day_of_week,
          startTime: c.start_time,
          duration: c.duration,
          order: c.order_num || 0,
        }));
        await db.classes.bulkPut(formattedClasses);
      }

      if (cloudSessions && cloudSessions.length > 0) {
        const formattedSessions: TrainingSession[] = cloudSessions.map(s => ({
          id: s.id,
          classId: s.class_id,
          sessionNumber: s.session_number,
          date: s.date,
          startTime: s.start_time,
          duration: s.duration,
          topic: s.topic || '',
          objectives: s.objectives || '',
          activities: s.activities || '',
          techniques: s.techniques || [],
          teacherNotes: s.teacher_notes || '',
          difficulties: s.difficulties || '',
          studentsNeedingSupport: s.students_needing_support || '',
          nextSessionPlan: s.next_session_plan || '',
          scriptId: s.script_id,
          lessonPlanId: s.lesson_plan_id,
          sceneInfo: s.scene_info || '',
          status: s.status || 'scheduled',
          isHoliday: s.is_holiday,
          holidayName: s.holiday_name,
        }));
        await db.sessions.bulkPut(formattedSessions);
      }

      if (cloudScripts && cloudScripts.length > 0) {
        const formattedScripts: TheaterScript[] = cloudScripts.map(sc => ({
          id: sc.id,
          title: sc.title,
          level: sc.level,
          duration: sc.duration || '45 دقيقة',
          characterCount: sc.character_count || 0,
          characters: sc.characters || '',
          fullText: sc.full_text || '',
          scenes: sc.scenes || '',
          directionNotes: sc.direction_notes || '',
          stagingNotes: sc.staging_notes || '',
          soundEffects: sc.sound_effects || '',
          music: sc.music || '',
          lighting: sc.lighting || '',
          scenography: sc.scenography || '',
          accessories: sc.accessories || '',
          techniques: sc.techniques || [],
          createdAt: sc.created_at || new Date().toISOString(),
          updatedAt: sc.updated_at || new Date().toISOString(),
        }));
        await db.scripts.bulkPut(formattedScripts);
      }

      if (cloudSettings && cloudSettings.length > 0) {
        const cs = cloudSettings[0];
        const newSettings: AppSettings = {
          id: cs.id,
          teacherName: cs.teacher_name || '',
          schoolName: cs.school_name || '',
          academicYearStart: cs.academic_year_start || '2026-09-07',
          academicYearEnd: cs.academic_year_end || '2027-07-03',
        };
        await db.settings.put(newSettings);
      }

      return { success: true, count: cloudSessions?.length || 0 };
    } catch (err: any) {
      console.error('Error pulling from cloud:', err);
      return { success: false, error: err.message || 'فشل جلب البيانات من السحابة' };
    }
  },

  /**
   * رفع حصة أو تقرير محدد إلى السحابة مباشرة عند الحفظ
   */
  async syncSession(sessionId: number): Promise<void> {
    try {
      const s = await db.sessions.get(sessionId);
      if (!s) return;

      await supabase.from('sessions').upsert({
        id: s.id,
        class_id: s.classId,
        session_number: s.sessionNumber || 1,
        date: s.date,
        start_time: s.startTime,
        duration: s.duration,
        topic: s.topic || '',
        objectives: s.objectives || '',
        activities: s.activities || '',
        techniques: s.techniques || [],
        teacher_notes: s.teacherNotes || '',
        difficulties: s.difficulties || '',
        students_needing_support: s.studentsNeedingSupport || '',
        next_session_plan: s.nextSessionPlan || '',
        script_id: s.scriptId || null,
        lesson_plan_id: s.lessonPlanId || null,
        scene_info: s.sceneInfo || '',
        status: s.status || 'scheduled',
        is_holiday: s.isHoliday || false,
        holiday_name: s.holidayName || null,
      }, { onConflict: 'id' });
    } catch (err) {
      console.warn('Sync session to cloud failed (will sync later):', err);
    }
  }
};
