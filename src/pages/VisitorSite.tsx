import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../db/database';
import { DAY_NAMES } from '../types';
import type { ClassSection } from '../types';
import { DEFAULT_PROGRAM_PHASES } from '../constants/program';
import { LESSON_PLANS } from '../data/lessonPlans';
import {
  COLORS_KINGDOM_SCRIPT,
  TIME_ACTIVITY_SCRIPT,
  NATURE_COURT_SCRIPT,
  WALL_OF_SILENCE_SCRIPT,
  MEN_IN_THE_SUN_SCRIPT,
} from '../data/scripts';
import { Calendar, Clock, BookOpen, Users, Star, ChevronLeft, MapPin, Phone, Mail, ExternalLink, Printer, X } from 'lucide-react';


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


// The 5 official theatrical scripts matching TheatricalScriptsPage exactly
const OFFICIAL_SCRIPTS = [
  {
    title: 'مَسْرَحِيَّةُ «مَمْلَكَةُ الأَلْوَانِ»',
    level: 'المستوى الثاني ابتدائي (CE1)',
    duration: '20–25 دقيقة',
    characterCount: 9,
    theme: 'الوحدة والتكامل والتنوع',
    icon: '🎨',
    gradient: 'from-amber-600 to-amber-700',
  },
  {
    title: 'مَسْرَحِيَّةُ «سَاعَةُ النَّشَاطِ وَالْوَقْتُ الثَّمِينُ»',
    level: 'المستوى الثالث ابتدائي (CE2)',
    duration: '15–20 دقيقة',
    characterCount: 8,
    theme: 'تنظيم الوقت وأهميته في النجاح',
    icon: '⏰',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'مَسْرَحِيَّةُ «مَحْكَمَةُ الطَّبِيعَةِ»',
    level: 'المستوى الرابع ابتدائي (CM1)',
    duration: '20–25 دقيقة',
    characterCount: 7,
    theme: 'حماية البيئة ومسؤولية الإنسان',
    icon: '🌿',
    gradient: 'from-emerald-600 to-emerald-700',
  },
  {
    title: 'مَسْرَحِيَّةُ «جِدَارُ الصَّمْتِ»',
    level: 'المستوى الخامس ابتدائي (CM2)',
    duration: '18–22 دقيقة',
    characterCount: 6,
    theme: 'مناهضة التنمر وبناء الثقة بالنفس',
    icon: '🧱',
    gradient: 'from-purple-600 to-purple-700',
  },
  {
    title: 'مَسْرَحِيَّةُ «رِجَالٌ فِي الشَّمْسِ»',
    level: 'الأولى والثانية إعدادي (1APIC / 2APIC)',
    duration: '40–50 دقيقة',
    characterCount: 11,
    theme: 'عن رواية غسان كنفاني — الأمل والتضحية والوعي',
    icon: '☀️',
    gradient: 'from-rose-600 to-rose-700',
  },
];


export default function VisitorSite() {
  const [showBioModal, setShowBioModal] = useState(false);
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
          <button
            onClick={() => setShowBioModal(true)}
            className="flex items-center gap-3 text-right hover:opacity-95 transition-all group cursor-pointer p-1 -m-1 rounded-2xl hover:bg-primary/5"
            title="انقر هنا للتعرف على المؤطر الأستاذ مصطفى لعرعري"
          >
            <div className="relative">
              <img
                src="/laaraari (2).jpeg"
                alt="الأستاذ مصطفى لعرعري"
                className="w-11 h-11 rounded-full object-cover border-2 border-primary/40 shadow-sm group-hover:border-primary group-hover:scale-105 transition-all"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" title="مؤطر معتمد" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-primary text-base md:text-lg leading-tight group-hover:text-primary-dark transition-colors">
                  ورشة المسرح المدرسي
                </span>
                <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded-full hidden sm:inline-block">
                  بطاقة المؤطر 🎭
                </span>
              </div>
              <div className="text-xs text-gray-500 font-medium">
                الأستاذ مصطفى لعرعري • {settings?.schoolName || 'مؤسسة العمران'}
              </div>
            </div>
          </button>
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
              <div className="text-3xl font-black text-secondary">{OFFICIAL_SCRIPTS.length}</div>
              <div className="text-sm text-white/70 mt-1">نصوص مسرحية رسمية</div>
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
              <p className="text-sm text-text-muted mb-3">5 مسرحيات كاملة: مملكة الألوان، نشاط الوقت، محكمة الطبيعة، جدار الصمت، رجال في الشمس</p>
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
            <h2 className="text-3xl md:text-4xl font-black text-text mb-3">البرنامج السنوي للورشة</h2>
            <div className="w-20 h-1 bg-secondary mx-auto rounded-full mb-4"></div>
            <p className="text-text-muted max-w-2xl mx-auto">
              مسار تكويني متكامل من 6 وحدات يمتد من شتنبر إلى يناير 2027، ويتوج بأسبوع العروض المسرحية الرسمية في نهاية الأسدس الأول قبيل عطلة منتصف السنة (24 يناير 2027)
            </p>
          </div>

          <div className="bg-bg rounded-2xl p-5 border border-gray-100 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div><div className="text-2xl font-black text-primary">6</div><div className="text-xs text-text-muted">وحدات تكوينية</div></div>
              <div><div className="text-2xl font-black text-primary">5</div><div className="text-xs text-text-muted">مسرحيات رسمية</div></div>
              <div><div className="text-2xl font-black text-primary">8</div><div className="text-xs text-text-muted">أقسام مستفيدة</div></div>
              <div><div className="text-2xl font-black text-primary">يناير 2027</div><div className="text-xs text-text-muted">أسبوع العروض الختامية</div></div>
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
      <section id="plays" className="py-16 md:py-24 no-print">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-text mb-3">النصوص المسرحية الرسمية</h2>
            <div className="w-20 h-1 bg-secondary mx-auto rounded-full mb-4"></div>
            <p className="text-text-muted mb-6 max-w-xl mx-auto">
              5 نصوص مسرحية كاملة ومشكولة مع الدفتر المسرحي وبطاقات الشخصيات وإرشادات الإخراج
            </p>
            
            <Link
              to="/scripts"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-light text-white font-bold px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all text-sm"
            >
              <span>🎭 تصفح وقراءة النصوص المسرحية الكاملة في التبويبات</span>
              <ChevronLeft size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {OFFICIAL_SCRIPTS.map((script, idx) => (
              <Link
                key={idx}
                to="/scripts"
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between"
              >
                <div>
                  {/* Card header */}
                  <div className={`bg-gradient-to-l ${script.gradient} p-5 text-white`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-lg leading-snug">{script.title}</h3>
                        <p className="text-white/80 text-xs mt-1.5 font-medium">{script.level}</p>
                      </div>
                      <span className="text-3xl shrink-0 p-2 bg-white/10 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                        {script.icon}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-5 space-y-3">
                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                      🎯 <strong>الموضوع:</strong> {script.theme}
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                        <Clock size={13} className="text-primary" />
                        <span>{script.duration}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                        <Users size={13} className="text-primary" />
                        <span>{script.characterCount} شخصيات</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card footer CTA */}
                <div className="px-5 pb-5 pt-0">
                  <div className="w-full py-2 px-3 rounded-xl bg-gray-50 group-hover:bg-primary group-hover:text-white text-primary text-xs font-bold text-center transition-colors flex items-center justify-center gap-1">
                    <span>قراءة النص المسرحي ودراسته</span>
                    <ChevronLeft size={13} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>


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

      {/* ========== MODAL: بطاقة المؤطر مصطفى لعرعري ========== */}
      {showBioModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowBioModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Banner */}
            <div className="relative h-28 bg-gradient-to-r from-primary via-primary-dark to-[#4a0e0e] flex items-end px-6">
              <button
                onClick={() => setShowBioModal(false)}
                className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                title="إغلاق النافذة"
              >
                <X size={20} />
              </button>
              <div className="absolute top-4 right-5 text-amber-200/90 text-xs font-bold flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full backdrop-blur-xs">
                <span>🎭</span> بطاقة المؤطر المشرف
              </div>
            </div>

            {/* Avatar and Main Info */}
            <div className="px-6 pt-0 pb-6 relative">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-14 mb-4 text-center sm:text-right">
                <img
                  src="/laaraari (2).jpeg"
                  alt="الأستاذ مصطفى لعرعري"
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-xl bg-white shrink-0"
                />
                <div className="flex-1 pb-1">
                  <h3 className="text-xl font-black text-gray-900 leading-tight">
                    الأستاذ مصطفى لعرعري
                  </h3>
                  <p className="text-sm font-bold text-primary mt-0.5">
                    مؤطر ورشة المسرح المدرسي ومنشط تربوي
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {settings?.schoolName || 'مؤسسة العمران للتعليم الخصوصي'}
                  </p>
                </div>
              </div>

              {/* Bio Paragraph */}
              <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-4 text-sm leading-relaxed text-gray-700 text-justify relative shadow-xs">
                <div className="text-amber-900 font-bold text-xs mb-1.5 flex items-center gap-1.5">
                  <span>✨</span> كلمة ورسالة المؤطر:
                </div>
                «نؤمن بأن المسرح المدرسي ليس مجرد خشبة وأداء، بل هو فضاء تربوي متكامل ومشتل لبناء الشخصية المتوازنة وصقل المواهب الواعدة. نسعى من خلال هذه الورشة إلى تمكين المتعلمين والمتعلمات من كسر حاجز الخوف، وتنمية مهارات التعبير الجسدي والصوتي، وترسيخ قيم التعاون والتسامح والعمل الجماعي في بيئة محفزة تجمع بين التعلم والمتعة.»
              </div>

              {/* Skills / Badges */}
              <div className="mt-4">
                <div className="text-xs font-bold text-gray-500 mb-2">مجالات التأطير والاشتغال:</div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-lg">
                    🎭 التعبير المسرحي والإلقاء
                  </span>
                  <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-lg">
                    🤝 التنشيط التربوي والثقة بالنفس
                  </span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg">
                    🎬 الإخراج والعروض المدرسية
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded-lg">
                    🌟 صقل المواهب والعمل الجماعي
                  </span>
                </div>
              </div>

              {/* Contact Links */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  <a
                    href="mailto:laaraari2@gmail.com"
                    className="inline-flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-primary hover:text-white text-gray-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all"
                  >
                    <Mail size={15} />
                    <span>laaraari2@gmail.com</span>
                  </a>
                  <a
                    href="https://www.facebook.com/people/Laaraari-Abo-Ilyass/pfbid02Ycwc4wqnmSoEWaWLDDPT6jR5s5veJN87Hhrq7yj5kP9vn1X3dnucS8hdP6SZDRJFl/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 bg-[#1877F2]/10 hover:bg-[#1877F2] text-[#1877F2] hover:text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>فيسبوك</span>
                  </a>
                </div>
                <button
                  onClick={() => setShowBioModal(false)}
                  className="w-full sm:w-auto text-xs font-bold text-gray-500 hover:text-gray-800 px-3 py-2 cursor-pointer transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
