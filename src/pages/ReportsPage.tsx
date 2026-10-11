import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { generateClassReport, type ClassReport } from '../services/reportGenerator';
import { printReport } from '../services/pdfExporter';
import type { TrainingSession } from '../types';
import { THEATER_TECHNIQUES } from '../constants/techniques';
import Header from '../components/layout/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import TextArea from '../components/ui/TextArea';
import MultiSelect from '../components/ui/MultiSelect';
import StatCard from '../components/ui/StatCard';
import { BarChart3, Printer, CheckCircle2, Clock, AlertTriangle, XCircle, ChevronDown, ChevronUp, Save, CalendarDays, FileBarChart, CheckSquare } from 'lucide-react';

export function DailyReportTab() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const sessions = useLiveQuery(() => db.sessions.where('date').equals(selectedDate).toArray(), [selectedDate]) ?? [];
  const classes = useLiveQuery(() => db.classes.toArray()) ?? [];
  
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<TrainingSession>>({});
  const [saved, setSaved] = useState<number | null>(null);

  const handleExpand = (session: TrainingSession) => {
    if (expandedSessionId === session.id) {
      setExpandedSessionId(null);
    } else {
      setExpandedSessionId(session.id!);
      setForm({
        topic: session.topic || '',
        objectives: session.objectives || '',
        activities: session.activities || '',
        techniques: session.techniques || [],
        teacherNotes: session.teacherNotes || '',
      });
    }
  };

  const handleSave = async (sessionId: number) => {
    await db.sessions.update(sessionId, {
      ...form,
      status: 'completed'
    });
    setSaved(sessionId);
    setTimeout(() => setSaved(null), 2000);
  };

  const getClassName = (classId: number) => classes.find(c => c.id === classId)?.name || 'قسم غير معروف';

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-4">
          <label className="font-semibold text-sm whitespace-nowrap">تاريخ اليوم:</label>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="border border-border rounded-lg p-2 flex-1 max-w-[200px] focus:ring-2 focus:ring-primary/30 outline-none text-sm"
          />
        </div>
      </Card>

      {sessions.length === 0 ? (
        <Card className="text-center py-12 text-text-muted">
          لا توجد حصص مبرمجة في هذا اليوم.
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => {
            const isExpanded = expandedSessionId === session.id;
            const isCompleted = session.status === 'completed';
            return (
              <Card key={session.id} className={`transition-all ${isExpanded ? 'border-primary shadow-md' : 'hover:border-primary/50'}`}>
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => handleExpand(session)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isCompleted ? 'bg-success' : 'bg-warning'}`}></div>
                    <h3 className="font-bold text-lg">{getClassName(session.classId)}</h3>
                    <span className="text-sm text-text-muted">({session.startTime})</span>
                  </div>
                  {isExpanded ? <ChevronUp size={20} className="text-text-muted" /> : <ChevronDown size={20} className="text-text-muted" />}
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3 animate-in fade-in slide-in-from-top-2">
                    <TextArea 
                      label="موضوع الحصة" 
                      value={form.topic || ''} 
                      onChange={v => setForm({...form, topic: v})} 
                      rows={1}
                    />
                    <TextArea 
                      label="أهداف الحصة" 
                      value={form.objectives || ''} 
                      onChange={v => setForm({...form, objectives: v})} 
                      rows={2}
                    />
                    <TextArea 
                      label="سير الحصة" 
                      value={form.activities || ''} 
                      onChange={v => setForm({...form, activities: v})} 
                      rows={3}
                    />
                    <MultiSelect
                      label="التقنيات المسرحية الموظفة"
                      options={THEATER_TECHNIQUES.map(t => ({ value: t.id, label: t.label, icon: t.icon }))}
                      selectedValues={(form.techniques as string[]) || []}
                      onChange={v => setForm({...form, techniques: v})}
                    />
                    <TextArea 
                      label="الملاحظات" 
                      value={form.teacherNotes || ''} 
                      onChange={v => setForm({...form, teacherNotes: v})} 
                      rows={2}
                    />
                    <div className="flex justify-end pt-2">
                      <Button 
                        onClick={() => handleSave(session.id!)} 
                        icon={<Save size={18} />}
                      >
                        {saved === session.id ? 'تم الحفظ بنجاح' : 'إنشاء'}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CompletedReportsTab() {
  const sessions = useLiveQuery(() => db.sessions.where('status').equals('completed').reverse().sortBy('date')) ?? [];
  const classes = useLiveQuery(() => db.classes.toArray()) ?? [];

  const getClassName = (classId: number) => classes.find(c => c.id === classId)?.name || 'قسم غير معروف';

  return (
    <div className="space-y-4">
      {sessions.length === 0 ? (
        <Card className="text-center py-12 text-text-muted">
          لا توجد تقارير منجزة بعد.
        </Card>
      ) : (
        sessions.map(session => (
          <Card key={session.id} className="space-y-3 border-s-4 border-s-success">
            <div className="flex justify-between items-start border-b border-border pb-2 mb-2">
              <div>
                <h3 className="font-bold text-lg text-text">{getClassName(session.classId)}</h3>
                <span className="text-sm text-text-muted">{session.date} — {session.startTime}</span>
              </div>
              <div className="bg-success/10 text-success px-2 py-1 rounded text-xs font-semibold">
                منجزة
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-bold text-primary block mb-1">موضوع الحصة:</span>
                <p className="text-sm text-text-muted bg-gray-50 p-2 rounded whitespace-pre-line">{session.topic || '—'}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-primary block mb-1">أهداف الحصة:</span>
                <p className="text-sm text-text-muted bg-gray-50 p-2 rounded whitespace-pre-line">{session.objectives || '—'}</p>
              </div>
              <div className="md:col-span-2">
                <span className="text-xs font-bold text-primary block mb-1">سير الحصة (الأنشطة):</span>
                <p className="text-sm text-text-muted bg-gray-50 p-2 rounded whitespace-pre-line">{session.activities || '—'}</p>
              </div>
              <div className="md:col-span-2">
                <span className="text-xs font-bold text-primary block mb-1">الملاحظات:</span>
                <p className="text-sm text-text-muted bg-gray-50 p-2 rounded whitespace-pre-line">{session.teacherNotes || '—'}</p>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

export function ClassReportsTab() {
  const classes = useLiveQuery(() => db.classes.orderBy('order').toArray()) ?? [];
  const [selectedClass, setSelectedClass] = useState('');
  const [report, setReport] = useState<ClassReport | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!selectedClass) return;
    setLoading(true);
    const r = await generateClassReport(Number(selectedClass));
    setReport(r);
    setLoading(false);
  };

  return (
    <div>
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <Select label="اختر القسم" value={selectedClass} onChange={setSelectedClass}
              options={classes.map(c => ({ value: String(c.id), label: c.name }))} placeholder="— اختر قسماً —" />
          </div>
          <Button onClick={handleGenerate} disabled={!selectedClass || loading} icon={<BarChart3 size={18} />}>
            {loading ? 'جاري المعاينة...' : 'معاينة التقرير'}
          </Button>
        </div>
      </Card>

      {report && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">📊 تقرير {report.className}</h2>
            <Button variant="secondary" size="sm" onClick={() => printReport(report)} icon={<Printer size={16} />}>طباعة / PDF</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard title="مبرمجة" value={report.totalScheduled} icon={<Clock size={20} />} color="text-info" />
            <StatCard title="منجزة" value={report.totalCompleted} icon={<CheckCircle2 size={20} />} color="text-success" />
            <StatCard title="مؤجلة" value={report.totalPostponed} icon={<AlertTriangle size={20} />} color="text-warning" />
            <StatCard title="ملغاة" value={report.totalCancelled} icon={<XCircle size={20} />} color="text-danger" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <h3 className="font-semibold mb-2">📖 المسرحية</h3>
              <p className="text-text-muted">{report.scriptTitle}</p>
            </Card>
            <Card>
              <h3 className="font-semibold mb-2">📅 معلومات</h3>
              {report.lastSession && <p className="text-sm text-text-muted">آخر حصة: {report.lastSession.date} — {report.lastSession.topic}</p>}
              {report.nextSession && <p className="text-sm text-text-muted mt-1">الحصة القادمة: {report.nextSession.date}</p>}
            </Card>
          </div>

          {report.techniquesUsed.length > 0 && (
            <Card className="mb-6">
              <h3 className="font-semibold mb-3">🎭 التقنيات المسرحية الموظفة</h3>
              <div className="space-y-2">
                {report.techniquesUsed.map(t => (
                  <div key={t.label} className="flex items-center gap-3">
                    <span className="text-sm flex-1">{t.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (t.count / Math.max(...report.techniquesUsed.map(x => x.count))) * 100)}%` }} />
                    </div>
                    <span className="text-sm text-text-muted w-8 text-center">{t.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {report.sessions.length > 0 && (
            <Card>
              <h3 className="font-semibold mb-3">📋 الحصص المنجزة</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-start p-2 text-text-muted">التاريخ</th>
                      <th className="text-start p-2 text-text-muted">الموضوع</th>
                      <th className="text-start p-2 text-text-muted">التقنيات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.sessions.map((s, i) => (
                      <tr key={i} className="border-b border-border">
                        <td className="p-2 whitespace-nowrap">{s.date}</td>
                        <td className="p-2">{s.topic}</td>
                        <td className="p-2 text-xs text-text-muted">{s.techniques.join('، ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'daily' | 'completed' | 'class'>('daily');

  return (
    <div>
      <Header title="التقارير" subtitle="إدارة تقارير الحصص والتقارير الشاملة" />
      
      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'daily' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <CalendarDays size={18} />
          <span>التقرير اليومي</span>
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'completed' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <CheckSquare size={18} />
          <span>التقارير المنجزة</span>
        </button>
        <button
          onClick={() => setActiveTab('class')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'class' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <FileBarChart size={18} />
          <span>تقارير الأقسام</span>
        </button>
      </div>

      {activeTab === 'daily' && <DailyReportTab />}
      {activeTab === 'completed' && <CompletedReportsTab />}
      {activeTab === 'class' && <ClassReportsTab />}
    </div>
  );
}

