import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { ProgramPhase } from '../types';
import { DEFAULT_PROGRAM_PHASES } from '../constants/program';
import { LESSON_PLANS } from '../data/lessonPlans';
import { formatDateArabic } from '../utils/dateUtils';
import Header from '../components/layout/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import TextArea from '../components/ui/TextArea';
import { Edit, Save, ChevronDown, ChevronUp, Plus, Trash2, ClipboardList, CalendarDays, ArrowLeft } from 'lucide-react';

export default function ProgramPage() {
  const navigate = useNavigate();
  const program = useLiveQuery(() => db.programs.toCollection().first());
  const classes = useLiveQuery(() => db.classes.toArray()) ?? [];
  const sessions = useLiveQuery(() => db.sessions.toArray()) ?? [];

  const rawPhases = program?.phases;
  const hasOldMoliere = rawPhases?.some(p => p.title.includes('موليير') || p.description.includes('موليير'));
  const phases = (!rawPhases || hasOldMoliere) ? DEFAULT_PROGRAM_PHASES : rawPhases;

  // Auto-upgrade database if old phases exist
  React.useEffect(() => {
    if (program?.id && hasOldMoliere) {
      db.programs.update(program.id, { phases: DEFAULT_PROGRAM_PHASES });
    }
  }, [program?.id, hasOldMoliere]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editPhase, setEditPhase] = useState<ProgramPhase | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<'overview' | 'lessons'>('overview');
  const [unitFilter, setUnitFilter] = useState('all');


  const targetClass = classes.find(c => c.name === '1APIC' || c.level === 'الأولى إعدادي (1APIC)');
  const targetSessions = useMemo(() => sessions.filter(s => targetClass?.id && s.classId === targetClass.id), [sessions, targetClass?.id]);
  const sessionByDate = useMemo(() => new Map(targetSessions.map(s => [s.date, s])), [targetSessions]);

  const filteredLessons = useMemo(
    () => LESSON_PLANS.filter(plan => unitFilter === 'all' || plan.unitId === unitFilter),
    [unitFilter]
  );

  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id);
  const openEdit = (p: ProgramPhase) => { setEditPhase({ ...p }); setShowModal(true); };

  const openAdd = () => {
    setEditPhase({
      id: `unit-${Date.now()}`, title: '', description: '', objectives: [''], activities: [''], order: phases.length + 1,
    });
    setShowModal(true);
  };

  const savePhase = async () => {
    if (!editPhase) return;
    const existing = phases.find(p => p.id === editPhase.id);
    const updated = existing ? phases.map(p => p.id === editPhase.id ? editPhase : p) : [...phases, editPhase];
    if (program?.id) await db.programs.update(program.id, { phases: updated });
    else await db.programs.add({ year: '2026/2027', phases: updated });
    setShowModal(false);
  };

  const deletePhase = async (id: string) => {
    if (!confirm('هل تريد حذف هذه المرحلة؟')) return;
    const updated = phases.filter(p => p.id !== id);
    if (program?.id) await db.programs.update(program.id, { phases: updated });
  };

  const updateList = (arr: string[], idx: number, val: string) => {
    const copy = [...arr];
    copy[idx] = val;
    return copy;
  };

  return (
    <div>
      <Header
        title="البرنامج السنوي"
        subtitle="المسار السنوي لورشة المسرح — مع الجذاذات المفصلة لـ 1APIC"
        actions={<Button onClick={openAdd} icon={<Plus size={18} />} size="sm">إضافة وحدة</Button>}
      />

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab('overview')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === 'overview' ? 'bg-primary text-white' : 'bg-white border border-border text-text-muted'}`}
        >
          البرنامج العام
        </button>
        <button
          onClick={() => setTab('lessons')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${tab === 'lessons' ? 'bg-primary text-white' : 'bg-white border border-border text-text-muted'}`}
        >
          <ClipboardList size={16} /> الجذاذات ({LESSON_PLANS.length})
        </button>
      </div>

      {tab === 'overview' ? (
        <div className="space-y-4">
          <Card className="bg-gradient-to-l from-primary/5 to-secondary/5 border-primary/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div><div className="text-2xl font-black text-primary">30</div><div className="text-xs text-text-muted">حصة مخططة لـ 1APIC</div></div>
              <div><div className="text-2xl font-black text-primary">6</div><div className="text-xs text-text-muted">وحدات تكوينية</div></div>
              <div><div className="text-2xl font-black text-primary">5 د</div><div className="text-xs text-text-muted">الإحماء</div></div>
              <div><div className="text-2xl font-black text-primary">60 د</div><div className="text-xs text-text-muted">مدة الحصة</div></div>
            </div>
          </Card>

          {phases.sort((a, b) => a.order - b.order).map((phase, i) => (
            <Card key={phase.id}>
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle(phase.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">{i + 1}</div>
                  <div>
                    <h3 className="font-bold text-text">{phase.title}</h3>
                    <p className="text-sm text-text-muted">{phase.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={e => { e.stopPropagation(); openEdit(phase); }} className="p-1.5 rounded-lg hover:bg-gray-100" title="تعديل">
                    <Edit size={14} className="text-text-muted" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); deletePhase(phase.id); }} className="p-1.5 rounded-lg hover:bg-red-50" title="حذف">
                    <Trash2 size={14} className="text-danger" />
                  </button>
                  {expandedId === phase.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>
              {expandedId === phase.id && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-text mb-2">🎯 الأهداف</h4>
                      <ul className="space-y-1">
                        {phase.objectives.map((o, j) => <li key={j} className="text-sm text-text-muted flex items-start gap-2"><span className="text-primary mt-1">•</span>{o}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-text mb-2">📝 الأنشطة</h4>
                      <ul className="space-y-1">
                        {phase.activities.map((a, j) => <li key={j} className="text-sm text-text-muted flex items-start gap-2"><span className="text-secondary mt-1">•</span>{a}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="font-bold text-lg">الجذاذات التفصيلية</h2>
                <p className="text-sm text-text-muted">30 حصة أسبوعية، ابتداءً من 29 شتنبر 2026، مع إحماء 5 دقائق فقط.</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <CalendarDays size={16} />
                <span>1APIC</span>
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setUnitFilter('all')} className={`px-3 py-1.5 rounded-full text-xs ${unitFilter === 'all' ? 'bg-primary text-white' : 'bg-white border border-border text-text-muted'}`}>الكل</button>
            {DEFAULT_PROGRAM_PHASES.map(unit => (
              <button key={unit.id} onClick={() => setUnitFilter(unit.id)} className={`px-3 py-1.5 rounded-full text-xs ${unitFilter === unit.id ? 'bg-primary text-white' : 'bg-white border border-border text-text-muted'}`}>
                {unit.order}. {unit.title.replace(/^الوحدة [^:]+: /, '')}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredLessons.map(plan => {
              const dbSession = sessionByDate.get(plan.date);
              return (
                <Card key={plan.id} className="border-s-4 border-s-primary/30">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="flex gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black shrink-0">{plan.sessionNumber}</div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-text">{plan.title}</h3>
                          <span className="text-[10px] rounded-full bg-secondary/15 text-secondary px-2 py-0.5">{formatDateArabic(plan.date)}</span>
                        </div>
                        <p className="text-xs text-text-muted mb-2">{plan.competency}</p>
                        <div className="flex flex-wrap gap-1">
                          {plan.techniques.map(t => <span key={t} className="text-[10px] bg-primary/5 text-primary px-2 py-0.5 rounded-full">{t}</span>)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<ArrowLeft size={15} />}
                        disabled={!dbSession}
                        onClick={() => dbSession && navigate(`/admin/training/${dbSession.id}`)}
                      >
                        بطاقة الحصة
                      </Button>
                    </div>
                  </div>

                  <details className="mt-4 border-t border-border pt-3">
                    <summary className="cursor-pointer text-sm font-semibold text-primary">فتح الجذاذة</summary>
                    <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-semibold mb-2">🎯 الأهداف</h4>
                        <ul className="space-y-1 text-sm text-text-muted">
                          {plan.objectives.map((objective, index) => <li key={index}>• {objective}</li>)}
                        </ul>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-semibold mb-2">🔥 الإحماء — 5 د</h4>
                        <p className="text-sm text-text-muted whitespace-pre-line">{plan.warmup}</p>
                      </div>
                      <div className="lg:col-span-2 space-y-2">
                        {plan.steps.map((step, index) => (
                          <div key={`${plan.id}-${step.title}`} className="rounded-xl border border-border p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{index + 1}</div>
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <h4 className="font-semibold text-sm">{step.title}</h4>
                                  <span className="text-xs text-text-muted">{step.duration} د</span>
                                </div>
                                <p className="text-sm text-text-muted mt-1 whitespace-pre-line">{step.instructions}</p>
                                <p className="text-xs mt-2"><strong>ما يلاحظ الأستاذ:</strong> <span className="text-text-muted">{step.teacherObserves}</span></p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-amber-50 rounded-xl p-4 lg:col-span-2">
                        <h4 className="font-semibold mb-2">✅ التقويم</h4>
                        <ul className="space-y-1 text-sm text-amber-900">{plan.assessment.map((item, index) => <li key={index}>• {item}</li>)}</ul>
                        <p className="text-xs text-amber-800 mt-3"><strong>الحصة المقبلة:</strong> {plan.nextStep}</p>
                      </div>
                    </div>
                  </details>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editPhase?.title ? 'تعديل الوحدة' : 'إضافة وحدة'} size="lg">
        {editPhase && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">العنوان</label>
              <input type="text" value={editPhase.title} onChange={e => setEditPhase({ ...editPhase, title: e.target.value })}
                className="w-full rounded-lg border border-border p-3 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
            </div>
            <TextArea label="الوصف" value={editPhase.description} onChange={v => setEditPhase({ ...editPhase, description: v })} rows={2} />
            <div>
              <label className="block text-sm font-medium mb-2">الأهداف</label>
              {editPhase.objectives.map((o, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input type="text" value={o} onChange={e => setEditPhase({ ...editPhase, objectives: updateList(editPhase.objectives, i, e.target.value) })}
                    className="flex-1 rounded-lg border border-border p-2 text-sm focus:ring-2 focus:ring-primary/30 outline-none" />
                  <button onClick={() => setEditPhase({ ...editPhase, objectives: editPhase.objectives.filter((_, j) => j !== i) })} className="text-danger text-sm">✕</button>
                </div>
              ))}
              <button onClick={() => setEditPhase({ ...editPhase, objectives: [...editPhase.objectives, ''] })} className="text-sm text-primary">+ إضافة هدف</button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">الأنشطة</label>
              {editPhase.activities.map((a, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input type="text" value={a} onChange={e => setEditPhase({ ...editPhase, activities: updateList(editPhase.activities, i, e.target.value) })}
                    className="flex-1 rounded-lg border border-border p-2 text-sm focus:ring-2 focus:ring-primary/30 outline-none" />
                  <button onClick={() => setEditPhase({ ...editPhase, activities: editPhase.activities.filter((_, j) => j !== i) })} className="text-danger text-sm">✕</button>
                </div>
              ))}
              <button onClick={() => setEditPhase({ ...editPhase, activities: [...editPhase.activities, ''] })} className="text-sm text-primary">+ إضافة نشاط</button>
            </div>
            <Button onClick={savePhase} className="w-full" icon={<Save size={18} />}>حفظ</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
