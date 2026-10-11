import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { TrainingSession, SessionStatus } from '../types';
import { SESSION_STATUS_LABELS } from '../types';
import { THEATER_TECHNIQUES } from '../constants/techniques';
import { LESSON_PLANS_BY_DATE } from '../data/lessonPlans';
import { formatDateFull, formatTime } from '../utils/dateUtils';
import Header from '../components/layout/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import TextArea from '../components/ui/TextArea';
import Select from '../components/ui/Select';
import MultiSelect from '../components/ui/MultiSelect';
import StatusBadge from '../components/shared/StatusBadge';
import { Save, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

export default function TrainingFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sessionId = Number(id);

  const session = useLiveQuery(() => db.sessions.get(sessionId), [sessionId]);
  const classes = useLiveQuery(() => db.classes.toArray()) ?? [];
  const scripts = useLiveQuery(() => db.scripts.toArray()) ?? [];

  const [form, setForm] = useState<Partial<TrainingSession>>({});
  const [saved, setSaved] = useState(false);

  const classId = session?.classId;
  const classSessions = useLiveQuery(
    () => classId ? db.sessions.where('classId').equals(classId).filter(s => !s.isHoliday).sortBy('date') : [],
    [classId]
  ) ?? [];

  useEffect(() => {
    if (session) {
      setForm({
        topic: session.topic,
        objectives: session.objectives,
        activities: session.activities,
        techniques: session.techniques || [],
        teacherNotes: session.teacherNotes,
        difficulties: session.difficulties,
        studentsNeedingSupport: session.studentsNeedingSupport,
        nextSessionPlan: session.nextSessionPlan,
        scriptId: session.scriptId,
        sceneInfo: session.sceneInfo,
        status: session.status,
      });
    }
  }, [session]);

  if (!session) return <div className="text-center py-16 text-text-muted">جاري التحميل...</div>;

  const cls = classes.find(c => c.id === session.classId);
  const levelScripts = scripts.filter(s => s.level === cls?.level);

  const currentIdx = classSessions.findIndex(s => s.id === sessionId);
  const prevSession = currentIdx > 0 ? classSessions[currentIdx - 1] : null;
  const nextSession = currentIdx < classSessions.length - 1 ? classSessions[currentIdx + 1] : null;

  const handleSave = async () => {
    await db.sessions.update(sessionId, form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const set = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  if (session.isHoliday) {
    return (
      <div>
        <Header title="🏖️ عطلة" actions={<Button variant="ghost" onClick={() => navigate(-1)} icon={<ArrowRight size={18} />}>رجوع</Button>} />
        <Card className="text-center py-12">
          <span className="text-5xl block mb-4">🏖️</span>
          <h2 className="text-xl font-bold text-text mb-2">{session.holidayName}</h2>
          <p className="text-text-muted">{formatDateFull(session.date)}</p>
          <p className="text-sm text-text-muted mt-2">لا توجد حصة في هذا اليوم</p>
        </Card>
      </div>
    );
  }

  const linkedScript = form.scriptId ? scripts.find(s => s.id === form.scriptId) : null;
  const lessonPlan = form.lessonPlanId
    ? Object.values(LESSON_PLANS_BY_DATE).find(plan => plan.id === form.lessonPlanId)
    : LESSON_PLANS_BY_DATE[session.date];

  const applyLessonPlan = () => {
    if (!lessonPlan) return;
    const activities = [
      `1) الإحماء — 5 د: ${lessonPlan.warmup}`,
      ...lessonPlan.steps.map((step, index) => `${index + 2}) ${step.title} — ${step.duration} د\n${step.instructions}`),
    ].join('\n\n');
    setForm(prev => ({
      ...prev,
      lessonPlanId: lessonPlan.id,
      topic: lessonPlan.title,
      objectives: lessonPlan.objectives.map(item => `• ${item}`).join('\n'),
      activities,
      techniques: lessonPlan.techniques,
    }));
  };

  return (
    <div>
      <Header
        title="بطاقة التدريب"
        actions={<Button variant="ghost" onClick={() => navigate(-1)} icon={<ArrowRight size={18} />}>رجوع</Button>}
      />

      {/* Session info banner */}
      <Card className="mb-4 bg-gradient-to-l from-primary/5 to-transparent border-s-4 border-s-primary">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><span className="text-text-muted">📅 التاريخ:</span><div className="font-semibold">{formatDateFull(session.date)}</div></div>
          <div><span className="text-text-muted">📚 القسم:</span><div className="font-semibold">{cls?.name}</div></div>
          <div><span className="text-text-muted">🕐 الساعة:</span><div className="font-semibold">{formatTime(session.startTime)}</div></div>
          <div><span className="text-text-muted">⏱️ المدة:</span><div className="font-semibold">{session.duration} دقيقة</div></div>
        </div>
        {session.sessionNumber > 0 && (
          <div className="mt-2 text-sm">
            <span className="text-text-muted">🎭 الحصة رقم:</span>
            <span className="font-bold text-primary ms-1">{session.sessionNumber}</span>
          </div>
        )}
        {linkedScript && (
          <div className="mt-1 text-sm">
            <span className="text-text-muted">📖 المسرحية:</span>
            <span className="font-semibold ms-1">{linkedScript.title}</span>
          </div>
        )}
      </Card>

      {lessonPlan && cls?.name === '1APIC' && (
        <Card className="mb-4 border-primary/20 bg-gradient-to-l from-primary/5 to-transparent">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="text-xs text-primary font-semibold mb-1">📋 الجذاذة الجاهزة للحصة</div>
              <h2 className="font-bold text-lg">{lessonPlan.sessionNumber}. {lessonPlan.title}</h2>
              <p className="text-sm text-text-muted mt-1">{lessonPlan.competency}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={applyLessonPlan} icon={<Save size={16} />}>
              اعتماد الجذاذة في البطاقة
            </Button>
          </div>

          <details className="mt-4 pt-3 border-t border-border">
            <summary className="cursor-pointer text-sm font-semibold text-primary">عرض سير الجذاذة</summary>
            <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/70 p-3">
                <h3 className="font-semibold text-sm mb-2">🎯 الأهداف</h3>
                <ul className="text-sm text-text-muted space-y-1">
                  {lessonPlan.objectives.map((item, index) => <li key={index}>• {item}</li>)}
                </ul>
              </div>
              <div className="rounded-xl bg-white/70 p-3">
                <h3 className="font-semibold text-sm mb-2">🔥 الإحماء — 5 د</h3>
                <p className="text-sm text-text-muted">{lessonPlan.warmup}</p>
              </div>
              <div className="lg:col-span-2 space-y-2">
                {lessonPlan.steps.map((step, index) => (
                  <div key={`${lessonPlan.id}-${index}`} className="rounded-xl bg-white/70 border border-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-sm">{index + 1}. {step.title}</h3>
                      <span className="text-xs text-text-muted">{step.duration} د</span>
                    </div>
                    <p className="text-sm text-text-muted mt-1 whitespace-pre-line">{step.instructions}</p>
                    <p className="text-xs mt-2"><strong>ما يلاحظ الأستاذ:</strong> <span className="text-text-muted">{step.teacherObserves}</span></p>
                  </div>
                ))}
              </div>
            </div>
          </details>
        </Card>
      )}

      {/* Form */}
      <div className="space-y-1">
        <TextArea label="موضوع الحصة" value={form.topic || ''} onChange={v => set('topic', v)} rows={2} placeholder="مثلاً: تمارين الإحماء والتعبير الجسدي" />
        <TextArea label="أهداف الحصة" value={form.objectives || ''} onChange={v => set('objectives', v)} rows={3} placeholder="ما الأهداف المراد تحقيقها؟" />
        <TextArea label="الأنشطة التي أنجزناها" value={form.activities || ''} onChange={v => set('activities', v)} rows={4} placeholder="تمارين الإحماء الجسدي، تمارين التنفس، تدريب على الوقفة المسرحية..." />

        <MultiSelect
          label="التقنيات المسرحية الموظفة"
          options={THEATER_TECHNIQUES.map(t => ({ value: t.id, label: t.label, icon: t.icon }))}
          selectedValues={form.techniques || []}
          onChange={v => set('techniques', v)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="المسرحية المرتبطة" value={String(form.scriptId || '')}
            onChange={v => set('scriptId', v ? Number(v) : undefined)}
            options={levelScripts.map(s => ({ value: String(s.id), label: s.title }))}
            placeholder="— بدون مسرحية —" />
          <div className="mb-4">
            <label className="block text-sm font-medium text-text mb-1">المشهد</label>
            <input type="text" value={form.sceneInfo || ''} onChange={e => set('sceneInfo', e.target.value)}
              placeholder="مثلاً: المشهد الثاني"
              className="w-full rounded-lg border border-border p-3 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
          </div>
        </div>

        <TextArea label="ملاحظات الأستاذ" value={form.teacherNotes || ''} onChange={v => set('teacherNotes', v)} rows={3} />
        <TextArea label="صعوبات واجهت التلاميذ" value={form.difficulties || ''} onChange={v => set('difficulties', v)} rows={3} />
        <TextArea label="التلاميذ الذين يحتاجون إلى مواكبة" value={form.studentsNeedingSupport || ''} onChange={v => set('studentsNeedingSupport', v)} rows={2} />
        <TextArea label="ما سيتم إنجازه في الحصة القادمة" value={form.nextSessionPlan || ''} onChange={v => set('nextSessionPlan', v)} rows={3} />

        <Select label="حالة الحصة" value={form.status || 'scheduled'}
          onChange={v => set('status', v as SessionStatus)}
          options={Object.entries(SESSION_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))} />

        {/* Save button */}
        <div className="sticky bottom-20 md:bottom-4 pt-4">
          <Button onClick={handleSave} size="lg" className="w-full" icon={<Save size={20} />}>
            {saved ? '✅ تم الحفظ بنجاح' : '💾 حفظ الحصة'}
          </Button>
        </div>

        {/* Navigation between sessions */}
        <div className="flex items-center justify-between pt-4 pb-2">
          {prevSession ? (
            <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/training/${prevSession.id}`)} icon={<ChevronRight size={16} />}>
              الحصة السابقة
            </Button>
          ) : <div />}
          {nextSession ? (
            <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/training/${nextSession.id}`)} icon={<ChevronLeft size={16} />}>
              الحصة التالية
            </Button>
          ) : <div />}
        </div>
      </div>
    </div>
  );
}
