import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { THEATER_TECHNIQUES, TECHNIQUE_LABELS } from '../constants/techniques';
import {
  CalendarDays,
  CheckSquare,
  Printer,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  Plus,
  X,
  List,
  Users,
  Lock,
  RefreshCw,
  Cloud,
} from 'lucide-react';

import Button from '../components/ui/Button';
import TextArea from '../components/ui/TextArea';
import MultiSelect from '../components/ui/MultiSelect';
import type { TrainingSession } from '../types';
import { syncService } from '../services/syncService';

import { MOROCCAN_MONTHS } from '../utils/dateUtils';
import { ACADEMIC_YEAR } from '../constants/holidays';

export default function WeeklyReportsPage() {
  const navigate = useNavigate();
  const classes = useLiveQuery(async () => {
    const list = await db.classes.toArray();
    return list.sort((a, b) => (a.order || 0) - (b.order || 0));
  }) ?? [];

  const settings = useLiveQuery(() => db.settings.toCollection().first());


  const todayStr = new Date().toISOString().split('T')[0];

  // ── Tabs ──
  const [activeTab, setActiveTab] = useState<'all-reports' | 'all-sessions'>('all-reports');


  // ── Tab 1: Daily log ──
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<TrainingSession>>({});
  const [savedSessionId, setSavedSessionId] = useState<number | null>(null);

  // Manual add form (tab 1)
  const [showAddForm, setShowAddForm] = useState(false);
  const [addClassId, setAddClassId] = useState<string>('');
  const [addDate, setAddDate] = useState<string>(todayStr);
  const [addTime, setAddTime] = useState<string>('08:00');
  const [addForm, setAddForm] = useState<Partial<TrainingSession>>({
    topic: '', objectives: '', activities: '', techniques: [], teacherNotes: '',
  });
  const [addSaving, setAddSaving] = useState(false);
  const [addSaved, setAddSaved] = useState(false);

  // Cloud Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState<string | null>(null);

  // Pull latest updates from Supabase automatically on page load
  useEffect(() => {
    syncService.pullAllFromCloud().catch(err => console.warn('Auto-pull failed:', err));
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatusText(null);
    const res = await syncService.pullAllFromCloud();
    setIsSyncing(false);
    if (res.success) {
      setSyncStatusText('تم التحديث ✅');
      setTimeout(() => setSyncStatusText(null), 2500);
    } else {
      setSyncStatusText('تعذر الاتصال ⚠️');
      setTimeout(() => setSyncStatusText(null), 2500);
    }
  };


  // ── Tab 2: All sessions by class ──
  const [pickedClassId, setPickedClassId] = useState<string>('');
  const [reportingSessionId, setReportingSessionId] = useState<number | null>(null);
  const [reportStatus, setReportStatus] = useState<'completed' | 'postponed' | 'cancelled'>('completed');
  const [reportReason, setReportReason] = useState<string>('');
  const [reportForm, setReportForm] = useState<Partial<TrainingSession>>({
    topic: '', objectives: '', activities: '', techniques: [], teacherNotes: '',
  });
  const [reportSaving, setReportSaving] = useState(false);
  const [reportSaved, setReportSaved] = useState<number | null>(null);


  // Month navigator for Tab 2 — starts at current month, ends at May 2027
  const academicStart = new Date(ACADEMIC_YEAR.start + 'T00:00:00');
  const academicEnd   = new Date('2027-05-31T00:00:00');
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [currentYear,  setCurrentYear]  = useState<number>(new Date().getFullYear());

  // Build list of all months from academic start → May 2027
  const allMonths = useMemo(() => {
    const months: { month: number; year: number; label: string }[] = [];
    const cur = new Date(academicStart.getFullYear(), academicStart.getMonth(), 1);
    while (cur <= academicEnd) {
      months.push({ month: cur.getMonth(), year: cur.getFullYear(), label: `${MOROCCAN_MONTHS[cur.getMonth()]} ${cur.getFullYear()}` });
      cur.setMonth(cur.getMonth() + 1);
    }
    return months;
  }, []);

  const currentMonthIdx = allMonths.findIndex(m => m.month === currentMonth && m.year === currentYear);
  const canPrev = currentMonthIdx > 0;
  const canNext = currentMonthIdx < allMonths.length - 1;

  const goToPrevMonth = () => {
    if (!canPrev) return;
    const prev = allMonths[currentMonthIdx - 1];
    setCurrentMonth(prev.month);
    setCurrentYear(prev.year);
    setReportingSessionId(null);
  };
  const goToNextMonth = () => {
    if (!canNext) return;
    const next = allMonths[currentMonthIdx + 1];
    setCurrentMonth(next.month);
    setCurrentYear(next.year);
    setReportingSessionId(null);
  };

  // Month prefix for filtering: e.g. "2026-10"
  const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;


  // ── Tab 3: Completed reports ──
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all'); // 'all' or 'YYYY-MM'
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);

  // ── Live queries ──
  const dailySessions = useLiveQuery(
    () => db.sessions.where('date').equals(selectedDate).toArray(),
    [selectedDate]
  ) ?? [];

  const classSessions = useLiveQuery<TrainingSession[]>(
    () => pickedClassId
      ? db.sessions.where('classId').equals(Number(pickedClassId)).filter(s => !s.isHoliday).sortBy('date')
      : Promise.resolve([] as TrainingSession[]),
    [pickedClassId]
  ) ?? [];

  const allCompletedSessions = useLiveQuery(
    () => db.sessions
      .filter(s => !s.isHoliday && (s.status === 'completed' || s.status === 'postponed' || s.status === 'cancelled'))
      .toArray()
      .then(arr => arr.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)))
  ) ?? [];



  const getClassName = (classId: number) =>
    classes.find(c => c.id === classId)?.name || 'قسم غير معروف';

  const getClassLevel = (classId: number) =>
    classes.find(c => c.id === classId)?.level || '';

  const filteredCompletedSessions = allCompletedSessions.filter(s => {
    if (selectedClassId !== 'all' && s.classId !== Number(selectedClassId)) return false;
    if (filterMonth !== 'all' && !s.date.startsWith(filterMonth)) return false;
    return true;
  });


  const toggleExpand = (id: number) =>
    setExpandedSessionId(prev => (prev === id ? null : id));

  // ── Tab 1 handlers ──
  const handleStartEdit = (session: TrainingSession) => {
    if (editingSessionId === session.id) {
      setEditingSessionId(null);
    } else {
      setEditingSessionId(session.id!);
      setForm({
        topic: session.topic || '',
        objectives: session.objectives || '',
        activities: session.activities || '',
        techniques: session.techniques || [],
        teacherNotes: session.teacherNotes || '',
      });
    }
  };

  const handleSaveDailySession = async (sessionId: number) => {
    await db.sessions.update(sessionId, { ...form, status: 'completed' });
    await syncService.syncSession(sessionId);
    setSavedSessionId(sessionId);
    setTimeout(() => { setSavedSessionId(null); setEditingSessionId(null); }, 1500);
  };

  const handleSaveManualReport = async () => {
    if (!addClassId) return;
    setAddSaving(true);
    try {
      const classInfo = classes.find(c => c.id === Number(addClassId));
      const newId = await db.sessions.add({
        classId: Number(addClassId),
        date: addDate,
        startTime: addTime,
        duration: classInfo?.duration ?? 60,
        topic: addForm.topic || '',
        objectives: addForm.objectives || '',
        activities: addForm.activities || '',
        techniques: (addForm.techniques as string[]) || [],
        teacherNotes: addForm.teacherNotes || '',
        difficulties: '',
        studentsNeedingSupport: '',
        nextSessionPlan: '',
        sceneInfo: '',
        status: 'completed',
        sessionNumber: 0,
      });
      await syncService.syncSession(Number(newId));
      setAddSaved(true);
      setTimeout(() => {
        setAddSaved(false);
        setShowAddForm(false);
        setAddForm({ topic: '', objectives: '', activities: '', techniques: [], teacherNotes: '' });
        setAddClassId('');
        setAddTime('08:00');
        setAddDate(selectedDate);
      }, 1200);
    } finally {
      setAddSaving(false);
    }
  };

  // ── Tab 2 handlers ──
  const openReportForm = (session: TrainingSession) => {
    if (session.status === 'completed') return;
    if (reportingSessionId === session.id) {
      setReportingSessionId(null);
      return;
    }
    setReportingSessionId(session.id!);
    setReportStatus('completed');
    setReportReason('');
    setReportForm({
      topic: session.topic || '',
      objectives: session.objectives || '',
      activities: session.activities || '',
      techniques: session.techniques || [],
      teacherNotes: session.teacherNotes || '',
    });
  };

  const handleSaveReport = async (sessionId: number) => {
    setReportSaving(true);
    try {
      if (reportStatus === 'completed') {
        await db.sessions.update(sessionId, { ...reportForm, status: 'completed' });
      } else {
        // postponed or cancelled — save reason in teacherNotes, clear report fields
        await db.sessions.update(sessionId, {
          status: reportStatus,
          teacherNotes: reportReason,
          topic: reportForm.topic || '',
          objectives: '',
          activities: '',
          techniques: [],
          difficulties: reportReason,
        });
      }
      await syncService.syncSession(sessionId);
      setReportSaved(sessionId);
      setTimeout(() => {
        setReportSaved(null);
        setReportingSessionId(null);
        setReportStatus('completed');
        setReportReason('');
      }, 1500);
    } finally {
      setReportSaving(false);
    }
  };




  // Format date nicely
  const formatDate = (d: string) => {
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('ar-MA', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="min-h-screen bg-bg pb-16 print:p-0 print:bg-white">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40 no-print">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl text-gray-500 hover:text-primary hover:bg-primary/5 transition-colors"
              title="العودة للرئيسية"
            >
              <ArrowRight size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">📋</span>
                <h1 className="text-xl md:text-2xl font-black text-text">تقارير الحصص الأسبوعية</h1>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                سجل إنجازات وتتبع ورشات المسرح المدرسي — {settings?.schoolName || 'مؤسسة العمران'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className={`inline-flex items-center gap-1.5 border px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all ${
                syncStatusText
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
              title="تحديث ومزامنة البيانات من السحابة"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin text-primary' : 'text-gray-500'} />
              <span>{syncStatusText || (isSyncing ? 'جاري المزامنة...' : 'مزامنة سحابية ☁️')}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <Printer size={16} />
              <span>طباعة</span>
            </button>
          </div>
        </div>


        {/* Tabs */}
        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 flex border-t border-gray-100 overflow-x-auto">
          {/* Tab 1: سجل التقارير (الافتراضي) */}
          <button
            onClick={() => setActiveTab('all-reports')}
            className={`flex items-center gap-2 px-6 py-3.5 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'all-reports'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <CheckSquare size={17} />
            <span>سِجِلُّ التَّقَارِيرِ</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              {allCompletedSessions.length}
            </span>
          </button>

          {/* Tab 2: جميع الحصص (تعبئة التقارير) */}
          <button
            onClick={() => setActiveTab('all-sessions')}
            className={`flex items-center gap-2 px-6 py-3.5 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'all-sessions'
                ? 'border-violet-600 text-violet-700 bg-violet-50/60'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <List size={17} />
            <span>جَمِيعُ الحِصَصِ</span>
            {pickedClassId && (
              <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">
                {classSessions.length}
              </span>
            )}
          </button>
        </div>

      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-6">

        {/* Print header */}
        <div className="hidden print:block text-center border-b pb-4 mb-6">
          <h2 className="text-2xl font-black">المملكة المغربية — ورشة المسرح المدرسي</h2>
          <p className="text-sm text-gray-600 mt-1">
            سجل تقارير ويوميات الحصص الأسبوعية | {settings?.schoolName || 'مؤسسة العمران'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            الأستاذ المشرف: {settings?.teacherName || 'مصطفى لعرعري'} — الموسم الدراسي 2026/2027
          </p>
        </div>



        {/* ══════════════════════════════════════════
            TAB 2 — ALL SESSIONS BY CLASS
        ══════════════════════════════════════════ */}
        {activeTab === 'all-sessions' && (
          <div className="space-y-5">

            {/* Class picker */}
            <div className="bg-white rounded-2xl border border-violet-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="font-black text-text text-base">اختر القسم</h3>
                  <p className="text-xs text-text-muted">ستظهر حصص الشهر المختار لهذا القسم</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {classes.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setPickedClassId(String(c.id)); setReportingSessionId(null); }}
                    className={`rounded-xl px-4 py-3 text-sm font-bold transition-all border-2 ${
                      pickedClassId === String(c.id)
                        ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                        : 'bg-gray-50 text-text border-gray-200 hover:border-violet-400 hover:bg-violet-50'
                    }`}
                  >
                    <div className="text-base">{c.name}</div>
                    <div className={`text-[10px] mt-0.5 ${pickedClassId === String(c.id) ? 'text-violet-200' : 'text-text-muted'}`}>
                      {c.level}
                    </div>
                  </button>
                ))}
                {classes.length === 0 && (
                  <div className="col-span-full py-6 text-center space-y-3">
                    <p className="text-sm text-text-muted">
                      لم يتم العثور على الأقسام محلياً بعد.
                    </p>
                    <button
                      onClick={handleManualSync}
                      disabled={isSyncing}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-violet-700 transition-all"
                    >
                      <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                      <span>{isSyncing ? 'جاري جلب الأقسام من السحابة...' : '🔄 جلب الأقسام من السحابة الآن'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>


            {/* ── Month navigator (always visible once class picked or not) ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Nav bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gradient-to-l from-violet-50/60 to-transparent">
                <button
                  onClick={goToPrevMonth}
                  disabled={!canPrev}
                  className="p-2 rounded-xl hover:bg-violet-100 text-violet-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="الشهر السابق"
                >
                  <ChevronRight size={20} />
                </button>

                <div className="text-center">
                  <h2 className="text-lg font-black text-violet-700">
                    {MOROCCAN_MONTHS[currentMonth]} {currentYear}
                  </h2>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {allMonths[currentMonthIdx]?.label} — الموسم الدراسي {ACADEMIC_YEAR.label}
                  </p>
                </div>

                <button
                  onClick={goToNextMonth}
                  disabled={!canNext}
                  className="p-2 rounded-xl hover:bg-violet-100 text-violet-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="الشهر التالي"
                >
                  <ChevronLeft size={20} />
                </button>
              </div>

              {/* Quick month pills */}
              <div className="flex gap-1.5 px-5 py-3 overflow-x-auto">
                {allMonths.map(m => (
                  <button
                    key={`${m.year}-${m.month}`}
                    onClick={() => { setCurrentMonth(m.month); setCurrentYear(m.year); setReportingSessionId(null); }}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      m.month === currentMonth && m.year === currentYear
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-violet-100 hover:text-violet-700'
                    }`}
                  >
                    {MOROCCAN_MONTHS[m.month]}
                    <span className="text-[9px] mr-1 opacity-70">{String(m.year).slice(2)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sessions list */}
            {pickedClassId && (
              <>
                {/* Legend */}
                <div className="flex items-center gap-4 text-xs text-text-muted no-print px-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
                    منجزة (مغلقة)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
                    مبرمجة — اضغط لكتابة التقرير
                  </span>
                </div>

                {(() => {
                  const monthSessions = classSessions.filter(s => s.date.startsWith(monthPrefix));
                  const completedCount = monthSessions.filter(s => s.status === 'completed').length;
                  const totalCount = monthSessions.length;

                  return monthSessions.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
                      <span className="text-5xl block mb-3">📭</span>
                      <h3 className="font-bold text-text">
                        لا توجد حصص في {MOROCCAN_MONTHS[currentMonth]} {currentYear}
                      </h3>
                      <p className="text-xs text-text-muted mt-1">
                        غيّر الشهر أعلاه أو تحقق من جدول هذا القسم
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Progress summary */}
                      <div className="bg-violet-50 rounded-xl px-4 py-3 flex items-center justify-between text-xs">
                        <span className="font-bold text-violet-700">
                          📊 {MOROCCAN_MONTHS[currentMonth]}: {completedCount} منجزة من أصل {totalCount} حصة
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-violet-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
                            />
                          </div>
                          <span className="text-violet-600 font-bold">
                            {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
                          </span>
                        </div>
                      </div>

                    {monthSessions.map((session, idx) => {
                      const isCompleted = session.status === 'completed';
                      const isOpen = reportingSessionId === session.id;

                      return (
                        <div
                          key={session.id}
                          className={`rounded-2xl border overflow-hidden transition-all ${
                            isCompleted
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : isOpen
                              ? 'bg-white border-violet-400 shadow-lg ring-1 ring-violet-200'
                              : 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-violet-200'
                          }`}
                        >
                          {/* Row header */}
                          <div
                            onClick={() => !isCompleted && openReportForm(session)}
                            className={`p-4 flex items-center justify-between gap-4 ${!isCompleted ? 'cursor-pointer' : 'cursor-default'}`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Session number badge */}
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                                isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-violet-100 text-violet-700'
                              }`}>
                                {idx + 1}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Date */}
                                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                    <Calendar size={12} className="text-primary" />
                                    {formatDate(session.date)}
                                  </span>
                                  {/* Time */}
                                  <span className="text-xs text-text-muted flex items-center gap-1">
                                    <Clock size={11} />
                                    {session.startTime}
                                  </span>
                                </div>

                                {/* Topic preview */}
                                {session.topic && (
                                  <p className="text-xs text-text-muted mt-0.5 truncate">{session.topic}</p>
                                )}
                              </div>
                            </div>

                            {/* Status badge + action */}
                            <div className="flex items-center gap-2 shrink-0">
                              {session.status === 'completed' ? (
                                <span className="inline-flex items-center gap-1.5 text-[11px] bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl font-bold">
                                  <CheckCircle2 size={13} />
                                  أُنجز التقريرُ
                                </span>
                              ) : session.status === 'postponed' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] bg-amber-100 text-amber-700 px-3 py-1.5 rounded-xl font-bold">
                                  <Clock size={12} />
                                  مؤجلة
                                </span>
                              ) : session.status === 'cancelled' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] bg-red-100 text-red-700 px-3 py-1.5 rounded-xl font-bold">
                                  <X size={12} />
                                  ملغاة
                                </span>
                              ) : (
                                <span className={`inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-xl font-bold transition-colors ${
                                  isOpen
                                    ? 'bg-violet-600 text-white'
                                    : 'bg-amber-100 text-amber-700 hover:bg-violet-100 hover:text-violet-700'
                                }`}>
                                  {isOpen ? <><ChevronUp size={12} />إغلاق</> : <><Plus size={12} />كتابة التقرير</>}
                                </span>
                              )}
                            </div>

                          </div>

                          {/* Report form — only for non-completed */}
                          {isOpen && !isCompleted && (
                            <div className="p-5 border-t border-violet-100 bg-violet-50/30 space-y-4">
                              <div className="text-xs font-black text-violet-700 flex items-center gap-2">
                                ✍️ حصة {idx + 1} — {formatDate(session.date)}
                              </div>

                              {/* ── Status selector ── */}
                              <div>
                                <p className="text-xs font-bold text-text mb-2">حالة الحصة:</p>
                                <div className="flex gap-2 flex-wrap">
                                  {[
                                    { value: 'completed',  label: '✅ منجزة',  cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                                    { value: 'postponed',  label: '⏳ مؤجلة',  cls: 'bg-amber-100 text-amber-800 border-amber-300' },
                                    { value: 'cancelled',  label: '❌ ملغاة',  cls: 'bg-red-100 text-red-800 border-red-300' },
                                  ].map(opt => (
                                    <button
                                      key={opt.value}
                                      onClick={() => setReportStatus(opt.value as typeof reportStatus)}
                                      className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                                        reportStatus === opt.value
                                          ? opt.cls + ' shadow-sm scale-[1.03]'
                                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                                      }`}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* ── If postponed or cancelled: show only reason ── */}
                              {(reportStatus === 'postponed' || reportStatus === 'cancelled') && (
                                <div className={`rounded-xl p-4 space-y-2 ${reportStatus === 'postponed' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
                                  <p className="text-xs font-bold text-gray-700">
                                    {reportStatus === 'postponed' ? '⏳ سبب التأجيل:' : '❌ سبب الإلغاء:'}
                                  </p>
                                  <textarea
                                    value={reportReason}
                                    onChange={e => setReportReason(e.target.value)}
                                    rows={2}
                                    placeholder={reportStatus === 'postponed' ? 'مثال: غياب التلاميذ، تغيير المبرمج...' : 'مثال: عطلة غير رسمية، نشاط المؤسسة...'}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-none focus:border-primary resize-none"
                                  />
                                </div>
                              )}

                              {/* ── If completed: show full report form ── */}
                              {reportStatus === 'completed' && (
                                <div className="space-y-3">
                                  <TextArea label="موضوع الحصة" value={reportForm.topic || ''} onChange={v => setReportForm({ ...reportForm, topic: v })} rows={1} placeholder="مثال: التعبير الجسدي، الإلقاء المسرحي..." />
                                  <TextArea label="أهداف الحصة" value={reportForm.objectives || ''} onChange={v => setReportForm({ ...reportForm, objectives: v })} rows={2} placeholder="الأهداف التربوية والفنية المرجوة..." />
                                  <TextArea label="سير الحصة والأنشطة المطبقة" value={reportForm.activities || ''} onChange={v => setReportForm({ ...reportForm, activities: v })} rows={3} placeholder="التمارين والإلقاء وسير الأنشطة..." />
                                  <MultiSelect
                                    label="التقنيات المسرحية الموظفة"
                                    options={THEATER_TECHNIQUES.map(t => ({ value: t.id, label: t.label, icon: t.icon }))}
                                    selectedValues={(reportForm.techniques as string[]) || []}
                                    onChange={v => setReportForm({ ...reportForm, techniques: v })}
                                  />
                                  <TextArea label="ملاحظات الأستاذ وتطور الأداء" value={reportForm.teacherNotes || ''} onChange={v => setReportForm({ ...reportForm, teacherNotes: v })} rows={2} placeholder="تجاوب التلاميذ، التحديات، توصيات للحصة القادمة..." />
                                </div>
                              )}

                              {/* ── Actions ── */}
                              <div className="flex justify-end gap-2 pt-1">
                                <button onClick={() => setReportingSessionId(null)}
                                  className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
                                  إلغاء
                                </button>
                                <button
                                  onClick={() => handleSaveReport(session.id!)}
                                  disabled={reportSaving || ((reportStatus === 'postponed' || reportStatus === 'cancelled') && !reportReason.trim())}
                                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all ${
                                    reportSaved === session.id ? 'bg-emerald-500 text-white'
                                    : reportStatus === 'postponed' ? 'bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40'
                                    : reportStatus === 'cancelled' ? 'bg-red-500 text-white hover:bg-red-600 disabled:opacity-40'
                                    : 'bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40'
                                  }`}
                                >
                                  {reportSaved === session.id
                                    ? <><Check size={17} />تم الحفظ! ✅</>
                                    : reportStatus === 'postponed'
                                    ? <><Save size={17} />{reportSaving ? '...' : 'تسجيل كمؤجلة'}</>
                                    : reportStatus === 'cancelled'
                                    ? <><Save size={17} />{reportSaving ? '...' : 'تسجيل كملغاة'}</>
                                    : <><Save size={17} />{reportSaving ? 'جاري الحفظ...' : 'حفظ التقرير'}</>
                                  }
                                </button>
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })}</div>
                  );
                })()}
              </>
            )}

            {!pickedClassId && (
              <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-violet-200">
                <span className="text-5xl block mb-3">👆</span>
                <h3 className="font-bold text-text text-lg mb-1">اختر قسماً أعلاه</h3>
                <p className="text-xs text-text-muted max-w-xs mx-auto">
                  بعد اختيار القسم اختر الشهر لعرض حصصه وكتابة تقاريرها مباشرة
                </p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB 3 — COMPLETED REPORTS ARCHIVE
        ══════════════════════════════════════════ */}
        {activeTab === 'all-reports' && (
          <div className="space-y-5">
            {/* Filters */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 no-print space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                  <Filter size={16} className="text-emerald-600" />
                  <span>تصفية السجل:</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-text-muted font-medium">القسم:</span>
                  <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-text focus:outline-none focus:border-primary">
                    <option value="all">جميع الأقسام ({allCompletedSessions.length})</option>
                    {classes.map(c => (
                      <option key={c.id} value={String(c.id)}>{c.name} ({c.level})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Month Pills matching Tab 2 style */}
              <div>
                <p className="text-[11px] font-bold text-text-muted mb-2">الشهر الدراسي:</p>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  <button
                    onClick={() => setFilterMonth('all')}
                    className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      filterMonth === 'all'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    🌟 جميع الشهور
                  </button>
                  {allMonths.map(m => {
                    const mKey = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
                    const countInMonth = allCompletedSessions.filter(s =>
                      s.date.startsWith(mKey) && (selectedClassId === 'all' || s.classId === Number(selectedClassId))
                    ).length;

                    return (
                      <button
                        key={mKey}
                        onClick={() => setFilterMonth(mKey)}
                        className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                          filterMonth === mKey
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                      >
                        <span>{MOROCCAN_MONTHS[m.month]}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          filterMonth === mKey ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {countInMonth}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {filteredCompletedSessions.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                <span className="text-5xl block mb-3">📭</span>
                <h3 className="font-bold text-text text-lg mb-1">لا توجد تقارير مسجلة بعد</h3>
                <p className="text-xs text-text-muted max-w-sm mx-auto">
                  اذهب لتبويب «جميع الحصص» واختر قسماً لكتابة التقارير.
                </p>
              </div>
            ) : (
              <>
                {/* ── Desktop Table ── */}
                <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" dir="rtl">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-right px-4 py-3 font-bold text-text-muted text-xs whitespace-nowrap">📅 التاريخ</th>
                          <th className="text-right px-4 py-3 font-bold text-text-muted text-xs whitespace-nowrap">🕐 التوقيت</th>
                          <th className="text-right px-4 py-3 font-bold text-text-muted text-xs whitespace-nowrap">📚 القسم</th>
                          <th className="text-right px-4 py-3 font-bold text-text-muted text-xs whitespace-nowrap">📝 موضوع الحصة</th>
                          <th className="text-right px-4 py-3 font-bold text-text-muted text-xs whitespace-nowrap">🎭 التقرير / السبب</th>
                          <th className="text-right px-4 py-3 font-bold text-text-muted text-xs whitespace-nowrap">💬 ملاحظات</th>
                          <th className="text-right px-4 py-3 font-bold text-text-muted text-xs whitespace-nowrap">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCompletedSessions.map((session, i) => {
                          const isCompleted = session.status === 'completed';
                          const isPostponed = session.status === 'postponed';

                          const rowBg = i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50';
                          const statusBadge = isCompleted
                            ? <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-bold whitespace-nowrap"><CheckCircle2 size={10} />أُنجز التقريرُ</span>
                            : isPostponed
                            ? <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-bold whitespace-nowrap"><Clock size={10} />مؤجلة</span>
                            : <span className="inline-flex items-center gap-1 text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-lg font-bold whitespace-nowrap"><X size={10} />ملغاة</span>;

                          // Report content: objectives + activities summary (or reason for postponed/cancelled)
                          const reportContent = isCompleted
                            ? [session.objectives, session.activities].filter(Boolean).join(' — ').slice(0, 120) || '—'
                            : session.teacherNotes || session.difficulties || '—';

                          return (
                            <tr key={session.id} className={`border-b border-gray-100 hover:bg-primary/5 transition-colors ${rowBg}`}>
                              <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">
                                {session.date}
                              </td>
                              <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                                {session.startTime}
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-block text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-lg">
                                  {getClassName(session.classId)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-text max-w-[180px]">
                                <span className="line-clamp-2">{session.topic || '—'}</span>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-600 max-w-[240px]">
                                <span className={`line-clamp-3 leading-relaxed ${!isCompleted ? (isPostponed ? 'text-amber-700' : 'text-red-700') : ''}`}>
                                  {reportContent}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500 max-w-[180px]">
                                <span className="line-clamp-2 italic">
                                  {isCompleted ? (session.teacherNotes || '—') : '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {statusBadge}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-text-muted bg-gray-50/50 flex justify-between items-center">
                    <span>إجمالي السجلات: <strong>{filteredCompletedSessions.length}</strong></span>
                    <span className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>منجزة: {filteredCompletedSessions.filter(s => s.status === 'completed').length}</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>مؤجلة: {filteredCompletedSessions.filter(s => s.status === 'postponed').length}</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span>ملغاة: {filteredCompletedSessions.filter(s => s.status === 'cancelled').length}</span>
                    </span>
                  </div>
                </div>

                {/* ── Mobile Cards ── */}
                <div className="md:hidden space-y-3">
                  {filteredCompletedSessions.map(session => {
                    const isCompleted = session.status === 'completed';
                    const isPostponed = session.status === 'postponed';
                    const isCancelled = session.status === 'cancelled';
                    const isExpanded = expandedSessionId === session.id;

                    const cardBorder = isCompleted ? 'border-gray-100' : isPostponed ? 'border-amber-200' : 'border-red-200';
                    const statusBadge = isCompleted
                      ? <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-bold"><CheckCircle2 size={10} />أُنجز التقريرُ</span>
                      : isPostponed
                      ? <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-bold"><Clock size={10} />مؤجلة</span>
                      : <span className="inline-flex items-center gap-1 text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-lg font-bold"><X size={10} />ملغاة</span>;

                    return (
                      <div key={session.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${cardBorder}`}>
                        {/* Card header */}
                        <div onClick={() => toggleExpand(session.id!)} className="p-4 flex items-center justify-between gap-3 cursor-pointer">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-xs font-bold text-primary">{getClassName(session.classId)}</span>
                              <span className="text-[10px] text-text-muted">{session.date} | {session.startTime}</span>
                              {statusBadge}
                            </div>
                            <p className="text-sm font-semibold text-text truncate">
                              {session.topic || (isCompleted ? 'حصة تدريبية' : isPostponed ? 'حصة مؤجلة' : 'حصة ملغاة')}
                            </p>
                          </div>
                          <div className="text-gray-400 shrink-0">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-3 text-xs">
                            {(isPostponed || isCancelled) && (
                              <div className={`rounded-xl p-3 ${isPostponed ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-800'}`}>
                                <strong>{isPostponed ? '⏳ سبب التأجيل:' : '❌ سبب الإلغاء:'}</strong>
                                <p className="mt-1">{session.teacherNotes || session.difficulties || '—'}</p>
                              </div>
                            )}
                            {isCompleted && (
                              <>
                                {session.objectives && <div><strong className="text-primary">🎯 الأهداف:</strong><p className="mt-0.5 text-gray-600 leading-relaxed">{session.objectives}</p></div>}
                                {session.activities && <div><strong className="text-primary">🎭 سير الحصة:</strong><p className="mt-0.5 text-gray-600 leading-relaxed">{session.activities}</p></div>}
                                {session.techniques && session.techniques.length > 0 && (
                                  <div>
                                    <strong className="text-primary">✨ التقنيات:</strong>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {session.techniques.map(t => <span key={t} className="bg-secondary/15 text-secondary-dark px-2 py-0.5 rounded-lg">{TECHNIQUE_LABELS[t] || t}</span>)}
                                    </div>
                                  </div>
                                )}
                                {session.teacherNotes && <div><strong className="text-primary">📝 الملاحظات:</strong><p className="mt-0.5 text-gray-500 italic">{session.teacherNotes}</p></div>}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
