import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../db/database';
import { DAY_NAMES } from '../types';
import type { ClassSection } from '../types';
import { DEFAULT_PROGRAM_PHASES } from '../constants/program';
import { LESSON_PLANS } from '../data/lessonPlans';
import { Calendar, Clock, BookOpen, Users, Star, ChevronLeft, MapPin, Phone, Mail, ExternalLink, Printer } from 'lucide-react';

// French day names
const FRENCH_DAY_NAMES: Record<number, string> = {
  0: 'Dimanche', 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi',
  4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi',
};

const getEndTime = (start: string, duration: number): string => {
  const [h, m] = start.split(':').map(Number);
  const total = h * 60 + m + duration;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

// Fixed time slots matching the official schedule
interface TimeSlot { start: string; end: string; duration: number; period: 'morning' | 'afternoon'; }
const FIXED_TIME_SLOTS: TimeSlot[] = [
  { start: '10:00', end: '10:30', duration: 30, period: 'morning' },
  { start: '10:30', end: '11:00', duration: 30, period: 'morning' },
  { start: '11:00', end: '11:30', duration: 30, period: 'morning' },
  { start: '11:30', end: '12:00', duration: 30, period: 'morning' },
  { start: '14:30', end: '15:30', duration: 60, period: 'afternoon' },
  { start: '15:30', end: '16:30', duration: 60, period: 'afternoon' },
  { start: '16:30', end: '17:30', duration: 60, period: 'afternoon' },
];
const SCHEDULE_DAYS = [1, 2, 4];

export default function VisitorSite() {
  const classes = useLiveQuery(() => db.classes.orderBy('order').toArray()) ?? [];
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const scripts = useLiveQuery(() => db.scripts.toArray()) ?? [];

  const morningSlots = FIXED_TIME_SLOTS.filter(s => s.period === 'morning');
  const afternoonSlots = FIXED_TIME_SLOTS.filter(s => s.period === 'afternoon');

  const getClassInSlot = (day: number, slot: TimeSlot): ClassSection | undefined =>
    classes.find(c => c.dayOfWeek === day && c.startTime === slot.start);

  return (
    <div className="min-h-screen">
      {/* ========== NAVBAR ========== */}
      <nav className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100 no-print">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎭</span>
            <div>
              <div className="font-bold text-primary text-lg leading-tight">ورشة المسرح المدرسي</div>
              <div className="text-xs text-gray-500">{settings?.schoolName || 'مؤسسة العمران'}</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#home" className="hover:text-primary transition-colors">الرئيسية</a>
            <a href="#about" className="hover:text-primary transition-colors">عن الورشة</a>
            <a href="#schedule" className="hover:text-primary transition-colors">استعمال الزمن</a>
            <a href="#program" className="hover:text-primary transition-colors">البرنامج</a>
            <Link to="/scripts" className="hover:text-primary transition-colors font-bold text-primary flex items-center gap-1">
              <span>🎭 النصوص المسرحية</span>
            </Link>
            <Link to="/weekly-reports" className="hover:text-primary transition-colors font-bold text-gray-700 hover:text-primary flex items-center gap-1">
              <span>📋 تقارير الحصص</span>
            </Link>
            <Link to="/admin" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-1 text-xs">
              <ExternalLink size={14} />
              لوحة التحكم
            </Link>
          </div>
        </div>
      </nav>

      {/* ========== HERO ========== */}
      <section id="home" className="relative overflow-hidden bg-gradient-to-bl from-primary via-primary-dark to-[#4a0e0e] no-print">
        {/* Decorative patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 text-[200px] leading-none">🎭</div>
          <div className="absolute bottom-10 left-10 text-[120px] leading-none rotate-12">🎬</div>
          <div className="absolute top-1/2 left-1/3 text-[80px] leading-none -rotate-12">⭐</div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-32 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6">
            <Star size={16} className="text-secondary" />
            <span>السنة الدراسية 2026/2027</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            ورشة المسرح المدرسي
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-2 font-light">
            {settings?.schoolName || 'مجموعة مدارس العمران'}
          </p>
          <p className="text-white/60 text-base md:text-lg mb-10 max-w-2xl mx-auto">
            فضاء للإبداع والتعبير الفني — نُنمّي مواهب التلاميذ من خلال فن المسرح والتشخيص والإلقاء
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-3xl font-black text-secondary">{classes.length}</div>
              <div className="text-sm text-white/70 mt-1">أقسام مستفيدة</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-3xl font-black text-secondary">3</div>
              <div className="text-sm text-white/70 mt-1">أيام في الأسبوع</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-3xl font-black text-secondary">{scripts.length}</div>
              <div className="text-sm text-white/70 mt-1">نص مسرحي</div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" className="w-full h-auto" preserveAspectRatio="none">
            <path fill="var(--color-bg)" d="M0,60 C360,100 720,20 1080,60 C1260,80 1380,40 1440,50 L1440,100 L0,100 Z" />
          </svg>
        </div>
      </section>

      {/* ========== ABOUT ========== */}
      <section id="about" className="py-16 md:py-24 no-print">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-text mb-3">عن ورشة المسرح</h2>
            <div className="w-20 h-1 bg-secondary mx-auto rounded-full mb-4"></div>
            <p className="text-text-muted max-w-2xl mx-auto">
              ورشة المسرح المدرسي هي فضاء تربوي يهدف إلى تنمية شخصية التلميذ وتطوير مهاراته التواصلية والإبداعية من خلال فنون الأداء المسرحي
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎭</span>
              </div>
              <h3 className="font-bold text-text text-lg mb-2">التشخيص والتعبير</h3>
              <p className="text-sm text-text-muted">تمارين متنوعة في التعبير الجسدي والصوتي لبناء شخصية فنية متكاملة</p>
            </div>

            <Link
              to="/scripts"
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-lg hover:border-secondary/50 hover:-translate-y-1 transition-all group block relative overflow-hidden"
            >
              <div className="absolute top-2 left-2 bg-secondary/10 text-secondary-dark text-[10px] font-bold px-2 py-0.5 rounded-full">
                اضغط للتصفح 👈
              </div>
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-secondary/20 transition-all">
                <span className="text-3xl">📖</span>
              </div>
              <h3 className="font-bold text-text text-lg mb-2 group-hover:text-primary transition-colors">النصوص المسرحية</h3>
              <p className="text-sm text-text-muted mb-3">اشتغال على نصوص مسرحية مناسبة للأعمار: رجال في الشمس، جدار الصمت...</p>
              <div className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:text-secondary-dark transition-colors">
                <span>تصفح التبويبات وقراءة النصوص</span>
                <ChevronLeft size={14} />
              </div>
            </Link>

            <Link
              to="/weekly-reports"
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-lg hover:border-primary/50 hover:-translate-y-1 transition-all group block relative overflow-hidden"
            >
              <div className="absolute top-2 left-2 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                جديد الحصص 👈
              </div>
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                <span className="text-3xl">📋</span>
              </div>
              <h3 className="font-bold text-text text-lg mb-2 group-hover:text-primary transition-colors">تقارير الحصص الأسبوعية</h3>
              <p className="text-sm text-text-muted mb-3">سجل أسبوعي يوثق إنجازات الورشات، موضوع الحصة، والتقنيات المسرحية المطبقة</p>
              <div className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:text-primary-dark transition-colors">
                <span>استعراض التقارير والطباعة</span>
                <ChevronLeft size={14} />
              </div>
            </Link>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🌟</span>
              </div>
              <h3 className="font-bold text-text text-lg mb-2">العرض النهائي</h3>
              <p className="text-sm text-text-muted">تتويج السنة الدراسية بعروض مسرحية أمام الجمهور والأسر</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CLASSES ========== */}
      <section className="py-16 bg-white no-print">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-text mb-3">الأقسام المستفيدة</h2>
            <div className="w-20 h-1 bg-secondary mx-auto rounded-full mb-4"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {classes.map(cls => (
              <div key={cls.id} className="bg-bg rounded-xl p-5 text-center border border-gray-100 hover:border-primary/30 transition-colors">
                <div className="text-2xl font-black text-primary mb-1">{cls.name}</div>
                <div className="text-sm text-text-muted mb-3">{cls.level}</div>
                <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                  <Calendar size={13} />
                  <span>{FRENCH_DAY_NAMES[cls.dayOfWeek]}</span>
                  <span className="mx-1">•</span>
                  <Clock size={13} />
                  <span>{cls.startTime.replace(':', 'h')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SCHEDULE TABLE ========== */}
      <section id="schedule" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12 print:mb-6">
            <h2 className="text-3xl md:text-4xl font-black text-text mb-3">استعمال الزمن</h2>
            <div className="w-20 h-1 bg-secondary mx-auto rounded-full mb-4 no-print"></div>
            <p className="text-text-muted">EMPLOI DU TEMPS — THEATRE 2026/2027</p>
            <button 
              onClick={() => window.print()}
              className="mt-6 mx-auto bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 no-print"
            >
              <Printer size={18} />
              <span>طباعة الجدول</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-x-auto print:shadow-none print:border-none">
            <table className="w-full border-collapse min-w-[850px] print:min-w-full">
              <thead>
                <tr>
                  <th className="border-2 border-gray-300 p-3 bg-gray-50 text-center w-28 relative h-14">
                    <div className="text-[10px] text-gray-400 italic absolute top-1 right-2">Horaire</div>
                    <div className="text-[10px] text-gray-400 italic absolute bottom-1 left-2">Jour</div>
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                      <line x1="0" y1="0" x2="100%" y2="100%" stroke="#D1D5DB" strokeWidth="1" />
                    </svg>
                  </th>
                  {morningSlots.map((slot, i) => (
                    <th key={slot.start} className={`border-2 border-gray-300 px-2 py-3 bg-gray-50 text-center ${i === morningSlots.length - 1 ? 'border-l-4 border-l-gray-400' : ''}`}>
                      <div className="text-sm font-bold text-gray-700">{slot.start.replace(':', '.')}</div>
                      <div className="text-xs text-gray-400">{slot.end.replace(':', '.')}</div>
                    </th>
                  ))}
                  {afternoonSlots.map(slot => (
                    <th key={slot.start} className="border-2 border-gray-300 px-2 py-3 bg-gray-50 text-center">
                      <div className="text-sm font-bold text-gray-700">{slot.start.replace(':', '.')}</div>
                      <div className="text-xs text-gray-400">{slot.end.replace(':', '.')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCHEDULE_DAYS.map(day => (
                  <tr key={day}>
                    <td className="border-2 border-gray-300 p-3 bg-gray-50 text-center font-bold">
                      <div className="text-sm text-gray-800">{FRENCH_DAY_NAMES[day]}</div>
                      <div className="text-[10px] text-gray-400">{DAY_NAMES[day]}</div>
                    </td>
                    {morningSlots.map((slot, i) => {
                      const cls = getClassInSlot(day, slot);
                      return (
                        <td key={slot.start} className={`border-2 border-gray-300 text-center h-16 ${i === morningSlots.length - 1 ? 'border-l-4 border-l-gray-400' : ''} ${cls ? 'bg-white' : 'bg-gray-100'}`}>
                          {cls && <div className="font-bold text-primary text-base">{cls.name}</div>}
                        </td>
                      );
                    })}
                    {afternoonSlots.map(slot => {
                      const cls = getClassInSlot(day, slot);
                      return (
                        <td key={slot.start} className={`border-2 border-gray-300 text-center h-16 ${cls ? 'bg-white' : 'bg-gray-100'}`}>
                          {cls && <div className="font-bold text-primary text-base">{cls.name}</div>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========== PROGRAM PHASES ========== */}
      <section id="program" className="py-16 md:py-24 bg-white no-print">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-text mb-3">البرنامج السنوي</h2>
            <div className="w-20 h-1 bg-secondary mx-auto rounded-full mb-4"></div>
            <p className="text-text-muted">6 وحدات تكوينية ومسار من 30 حصة لـ 1APIC نحو العرض النهائي في ماي</p>
          </div>

          <div className="bg-bg rounded-2xl p-5 border border-gray-100 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div><div className="text-2xl font-black text-primary">30</div><div className="text-xs text-text-muted">حصة لـ 1APIC</div></div>
              <div><div className="text-2xl font-black text-primary">5 د</div><div className="text-xs text-text-muted">الإحماء</div></div>
              <div><div className="text-2xl font-black text-primary">60 د</div><div className="text-xs text-text-muted">مدة الحصة</div></div>
              <div><div className="text-2xl font-black text-primary">{LESSON_PLANS.filter(p => p.unitId.startsWith('unit-')).length}</div><div className="text-xs text-text-muted">جذاذات مفصلة</div></div>
            </div>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="hidden md:block absolute right-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-accent"></div>

            <div className="space-y-8 md:space-y-12">
              {DEFAULT_PROGRAM_PHASES.map((phase, i) => (
                <div key={phase.id} className={`md:flex md:items-start ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Content */}
                  <div className={`md:w-1/2 ${i % 2 === 0 ? 'md:pl-8' : 'md:pr-8'}`}>
                    <div className="bg-bg rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-black text-lg shrink-0">
                          {phase.order}
                        </div>
                        <h3 className="font-bold text-text">{phase.title}</h3>
                      </div>
                      <p className="text-sm text-text-muted mb-4">{phase.description}</p>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-xs font-bold text-primary mb-1.5">🎯 الأهداف</h4>
                          <ul className="space-y-1">
                            {phase.objectives.map((obj, j) => (
                              <li key={j} className="text-xs text-text-muted flex items-start gap-1.5">
                                <span className="text-secondary mt-0.5">●</span>
                                {obj}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Spacer for timeline */}
                  <div className="hidden md:block md:w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== PLAYS / SCRIPTS ========== */}
      {scripts.length > 0 && (
        <section id="plays" className="py-16 md:py-24 no-print">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-black text-text mb-3">النصوص المسرحية</h2>
              <div className="w-20 h-1 bg-secondary mx-auto rounded-full mb-4"></div>
              <p className="text-text-muted mb-6">مجموعة من النصوص المسرحية المعتمدة في الورشة</p>
              
              <Link
                to="/scripts"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-light text-white font-bold px-6 py-3 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all text-sm"
              >
                <span>🎭 فتح صفحة النصوص المسرحية (تبويبات: رجال في الشمس & جدار الصمت)</span>
                <ChevronLeft size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scripts.slice(0, 6).map(script => (
                <div key={script.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                  {/* Card header */}
                  <div className="bg-gradient-to-l from-primary/90 to-primary p-5 text-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg leading-tight">{script.title}</h3>
                        <p className="text-white/70 text-sm mt-1">{script.level}</p>
                      </div>
                      <span className="text-3xl opacity-30 group-hover:opacity-50 transition-opacity">🎬</span>
                    </div>
                  </div>
                  {/* Card body */}
                  <div className="p-5">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-text-muted">
                        <Clock size={14} />
                        <span>{script.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-text-muted">
                        <Users size={14} />
                        <span>{script.characterCount} شخصيات</span>
                      </div>
                    </div>
                    {script.techniques && script.techniques.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {script.techniques.slice(0, 3).map((tech, i) => (
                          <span key={i} className="text-[10px] bg-primary/5 text-primary px-2 py-0.5 rounded-full">{tech}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========== FOOTER ========== */}
      <footer className="bg-gradient-to-bl from-[#1a1a2e] to-[#16213e] text-white py-12 no-print">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* About */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🎭</span>
                <div>
                  <div className="font-bold text-lg">ورشة المسرح المدرسي</div>
                  <div className="text-sm text-gray-400">{settings?.schoolName || 'مؤسسة العمران'}</div>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                ورشة المسرح المدرسي بمؤسسة العمران — فضاء للإبداع والتعبير الفني لتلاميذ التعليم الأولي والابتدائي والإعدادي.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold mb-4">روابط سريعة</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#home" className="hover:text-white transition-colors">الرئيسية</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">عن الورشة</a></li>
                <li><a href="#schedule" className="hover:text-white transition-colors">استعمال الزمن</a></li>
                <li><a href="#program" className="hover:text-white transition-colors">البرنامج السنوي</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-bold mb-4">معلومات التواصل</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <MapPin size={16} className="text-secondary shrink-0" />
                  <span>مجموعة مدارس العمران — AL OUMRANE</span>
                </li>
                <li className="flex items-center gap-2">
                  <Users size={16} className="text-secondary shrink-0" />
                  <span>تأطير: الأستاذ {settings?.teacherName || 'مصطفى لعرعري'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <BookOpen size={16} className="text-secondary shrink-0" />
                  <span>السنة الدراسية 2026/2027</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 text-center text-xs text-gray-500">
            <p>© 2026/2027 ورشة المسرح المدرسي — {settings?.schoolName || 'مؤسسة العمران'}. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
