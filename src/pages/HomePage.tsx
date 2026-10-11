import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import { formatDateArabic, formatTime } from '../utils/dateUtils';
import { Calendar, GraduationCap, BookOpen, Clapperboard, Users, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const classes = useLiveQuery(() => db.classes.toArray()) ?? [];
  const sessions = useLiveQuery(() => db.sessions.filter(s => !s.isHoliday).toArray()) ?? [];
  const settings = useLiveQuery(() => db.settings.toCollection().first());

  const today = new Date().toISOString().split('T')[0];
  const scheduled = sessions.filter(s => s.status === 'scheduled');
  const completed = sessions.filter(s => s.status === 'completed');
  const lastCompleted = [...completed].sort((a, b) => b.date.localeCompare(a.date))[0];
  const nextScheduled = scheduled.filter(s => s.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];

  const getClassName = (classId: number) => classes.find(c => c.id === classId)?.name || '';

  const navCards = [
    { icon: '🎬', label: 'النصوص المسرحية', desc: 'إدارة النصوص والمسرحيات', to: '/admin/scripts', color: 'bg-purple-50 border-purple-200' },
    { icon: '🗓️', label: 'جدول الحصص', desc: 'مواعيد الحصص الأسبوعية', to: '/admin/schedule', color: 'bg-blue-50 border-blue-200' },
    { icon: '🎭', label: 'جدول التداريب', desc: 'دفتر التتبع اليومي', to: '/admin/training', color: 'bg-red-50 border-red-200' },
    { icon: '📚', label: 'البرنامج السنوي', desc: 'التخطيط السنوي للورشة', to: '/admin/program', color: 'bg-green-50 border-green-200' },
  ];

  return (
    <div>
      {/* Welcome */}
      <div className="bg-gradient-to-l from-primary to-primary-light rounded-2xl p-6 md:p-8 mb-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">🎭</span>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">مسرحي</h1>
            <p className="text-white/80 text-sm mt-1">
              دفتر {settings?.teacherName ? `الأستاذ ${settings.teacherName}` : 'أستاذ المسرح'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard title="عدد الأقسام" value={classes.length} icon={<Users size={22} />} />
        <StatCard title="الحصص المبرمجة" value={scheduled.length} icon={<Clock size={22} />} color="text-info" />
        <StatCard title="الحصص المنجزة" value={completed.length} icon={<CheckCircle2 size={22} />} color="text-success" />
        <StatCard title="المؤجلة" value={sessions.filter(s => s.status === 'postponed').length} icon={<AlertTriangle size={22} />} color="text-warning" />
      </div>

      {/* Last & Next session */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="border-s-4 border-s-success">
          <div className="text-xs text-text-muted mb-1">✅ آخر حصة منجزة</div>
          {lastCompleted ? (
            <>
              <div className="font-semibold text-text">{getClassName(lastCompleted.classId)}</div>
              <div className="text-sm text-text-muted">{formatDateArabic(lastCompleted.date)} — {formatTime(lastCompleted.startTime)}</div>
              {lastCompleted.topic && <div className="text-sm text-text mt-1">{lastCompleted.topic}</div>}
            </>
          ) : <div className="text-sm text-text-muted">لا توجد حصص منجزة بعد</div>}
        </Card>
        <Card className="border-s-4 border-s-info">
          <div className="text-xs text-text-muted mb-1">⏭️ الحصة القادمة</div>
          {nextScheduled ? (
            <>
              <div className="font-semibold text-text">{getClassName(nextScheduled.classId)}</div>
              <div className="text-sm text-text-muted">{formatDateArabic(nextScheduled.date)} — {formatTime(nextScheduled.startTime)}</div>
            </>
          ) : <div className="text-sm text-text-muted">لا توجد حصص مبرمجة</div>}
        </Card>
      </div>

      {/* Navigation cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {navCards.map(c => (
          <Card key={c.to} onClick={() => navigate(c.to)} hoverable className={`${c.color} text-center`}>
            <div className="text-4xl mb-3">{c.icon}</div>
            <div className="font-semibold text-text text-sm">{c.label}</div>
            <div className="text-xs text-text-muted mt-1">{c.desc}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
