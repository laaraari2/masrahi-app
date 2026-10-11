import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import {
  COLORS_KINGDOM_SCRIPT,
  TIME_ACTIVITY_SCRIPT,
  NATURE_COURT_SCRIPT,
  WALL_OF_SILENCE_SCRIPT,
  MEN_IN_THE_SUN_SCRIPT,
  ScriptItem
} from '../data/scripts';
import { LEVELS } from '../types';
import { TECHNIQUE_LABELS } from '../constants/techniques';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import {
  BookOpen,
  Users,
  Clock,
  Printer,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Sparkles,
  ArrowRight,
  Eye,
  Plus,
  Trash2,
  Edit,
  FolderKanban,
  Film,
  Compass,
  Palette,
  Volume2,
  Lightbulb,
  Layers,
  ChevronLeft
} from 'lucide-react';

interface Props {
  isAdmin?: boolean;
}

export default function TheatricalScriptsPage({ isAdmin = false }: Props) {
  const navigate = useNavigate();

  // Active top tab: 'colors-kingdom' | 'time-activity' | 'nature-court' | 'wall-of-silence' | 'men-in-sun' | 'all-scripts'
  const [activeTab, setActiveTab] = useState<'colors-kingdom' | 'time-activity' | 'nature-court' | 'wall-of-silence' | 'men-in-sun' | 'all-scripts'>('colors-kingdom');

  // Active sub-section within the play: text | characters | scenes | direction
  const [activeSection, setActiveSection] = useState<'text' | 'characters' | 'scenes' | 'direction'>('text');

  // Text size for script reading
  const [fontSize, setFontSize] = useState<number>(16);

  // Copy feedback
  const [copied, setCopied] = useState(false);

  // Database scripts for the management tab
  const dbScripts = useLiveQuery(() => db.scripts.toArray()) ?? [];
  const [activeLevel, setActiveLevel] = useState('');
  const [search, setSearch] = useState('');

  let filteredDbScripts = dbScripts;
  if (activeLevel) filteredDbScripts = filteredDbScripts.filter(s => s.level === activeLevel);
  if (search) {
    const q = search.toLowerCase();
    filteredDbScripts = filteredDbScripts.filter(
      s => s.title.toLowerCase().includes(q) || s.characters.toLowerCase().includes(q)
    );
  }

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('هل تريد حذف هذا النص المسرحي؟')) return;
    await db.scripts.delete(id);
  };

  const currentScript: ScriptItem =
    activeTab === 'colors-kingdom'
      ? COLORS_KINGDOM_SCRIPT
      : activeTab === 'time-activity'
      ? TIME_ACTIVITY_SCRIPT
      : activeTab === 'nature-court'
      ? NATURE_COURT_SCRIPT
      : activeTab === 'wall-of-silence'
      ? WALL_OF_SILENCE_SCRIPT
      : MEN_IN_THE_SUN_SCRIPT;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentScript.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const changeFontSize = (delta: number) => {
    setFontSize(prev => Math.min(Math.max(prev + delta, 13), 24));
  };

  // Find if current script has an entry in DB to allow direct editing
  const currentDbScript = dbScripts.find(s => s.title.includes(currentScript.title.replace('مسرحية: ', '')));

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 print:p-0 print:m-0">
      {/* Top Bar / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(isAdmin ? '/admin' : '/')}
            className="p-2 rounded-xl text-gray-500 hover:text-primary hover:bg-primary/5 transition-colors"
            title="رجوع"
          >
            <ArrowRight size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎭</span>
              <h1 className="text-xl md:text-2xl font-black text-text">
                صفحة النصوص المسرحية
              </h1>
            </div>
            <p className="text-xs md:text-sm text-text-muted mt-0.5">
              ورشة المسرح المدرسي — قراءة تحليلية ونصوص كاملة للتداريب والعروض
            </p>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin ? (
            <>
              <Button
                onClick={() => navigate('/admin/scripts/new')}
                icon={<Plus size={16} />}
                size="sm"
              >
                إضافة نص جديد
              </Button>
              <Link
                to="/scripts"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-accent bg-accent/10 hover:bg-accent/20 px-3 py-2 rounded-xl font-medium transition-colors"
              >
                <Eye size={14} />
                <span>معاينة الزوار</span>
              </Link>
            </>
          ) : (
            <Link
              to="/admin/scripts"
              className="inline-flex items-center gap-1.5 text-xs text-primary bg-primary/10 hover:bg-primary/20 px-3 py-2 rounded-xl font-medium transition-colors"
            >
              <Film size={14} />
              <span>إدارة النصوص (لوحة التحكم)</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Tabs Selector */}
      <div className="bg-gradient-to-r from-gray-900 via-primary-dark to-primary p-2 md:p-3 rounded-2xl shadow-md no-print">
        <div className={`grid grid-cols-1 ${isAdmin ? 'sm:grid-cols-2 lg:grid-cols-6' : 'sm:grid-cols-2 lg:grid-cols-5'} gap-2`}>
          {/* Tab 1: المستوى الثاني ابتدائي - مملكة الألوان */}
          <button
            onClick={() => {
              setActiveTab('colors-kingdom');
              setActiveSection('text');
            }}
            className={`flex items-center gap-3 p-3 rounded-xl text-right transition-all duration-200 ${
              activeTab === 'colors-kingdom'
                ? 'bg-white text-gray-900 shadow-lg scale-[1.01]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                activeTab === 'colors-kingdom' ? 'bg-amber-100 text-amber-700' : 'bg-white/10'
              }`}
            >
              🎨
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="font-black text-xs md:text-sm leading-snug truncate">
                  مَمْلَكَةُ الأَلْوَانِ
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                    activeTab === 'colors-kingdom'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  2 ابتدائي
                </span>
              </div>
              <p
                className={`text-[11px] mt-0.5 truncate ${
                  activeTab === 'colors-kingdom' ? 'text-gray-500' : 'text-white/70'
                }`}
              >
                التعاون وقبول الاختلاف
              </p>
            </div>
          </button>

          {/* Tab 2: المستوى الثالث ابتدائي - ساعة النشاط والوقت الثمين */}
          <button
            onClick={() => {
              setActiveTab('time-activity');
              setActiveSection('text');
            }}
            className={`flex items-center gap-3 p-3 rounded-xl text-right transition-all duration-200 ${
              activeTab === 'time-activity'
                ? 'bg-white text-gray-900 shadow-lg scale-[1.01]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                activeTab === 'time-activity' ? 'bg-cyan-100 text-cyan-700' : 'bg-white/10'
              }`}
            >
              ⏰
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="font-black text-xs md:text-sm leading-snug truncate">
                  سَاعَةُ النَّشَاطِ
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                    activeTab === 'time-activity'
                      ? 'bg-cyan-100 text-cyan-800'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  3 ابتدائي
                </span>
              </div>
              <p
                className={`text-[11px] mt-0.5 truncate ${
                  activeTab === 'time-activity' ? 'text-gray-500' : 'text-white/70'
                }`}
              >
                الوقت وتنظيم اليوم
              </p>
            </div>
          </button>

          {/* Tab 3: المستوى الرابع والخامس ابتدائي - محكمة الطبيعة */}
          <button
            onClick={() => {
              setActiveTab('nature-court');
              setActiveSection('text');
            }}
            className={`flex items-center gap-3 p-3 rounded-xl text-right transition-all duration-200 ${
              activeTab === 'nature-court'
                ? 'bg-white text-gray-900 shadow-lg scale-[1.01]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                activeTab === 'nature-court' ? 'bg-emerald-100 text-emerald-700' : 'bg-white/10'
              }`}
            >
              ⚖️
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="font-black text-xs md:text-sm leading-snug truncate">
                  مَحْكَمَةُ الطَّبِيعَةِ
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                    activeTab === 'nature-court'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  4/5 ابتدائي
                </span>
              </div>
              <p
                className={`text-[11px] mt-0.5 truncate ${
                  activeTab === 'nature-court' ? 'text-gray-500' : 'text-white/70'
                }`}
              >
                البيئة والتنمية المستدامة
              </p>
            </div>
          </button>

          {/* Tab 3: جدار الصمت في ساحة المدرسة */}
          <button
            onClick={() => {
              setActiveTab('wall-of-silence');
              setActiveSection('text');
            }}
            className={`flex items-center gap-3 p-3 rounded-xl text-right transition-all duration-200 ${
              activeTab === 'wall-of-silence'
                ? 'bg-white text-gray-900 shadow-lg scale-[1.01]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                activeTab === 'wall-of-silence' ? 'bg-blue-100 text-blue-700' : 'bg-white/10'
              }`}
            >
              🏫
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="font-black text-xs md:text-sm leading-snug truncate">
                  جِدَارُ الصَّمْتِ
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                    activeTab === 'wall-of-silence'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  4/5 ابتدائي
                </span>
              </div>
              <p
                className={`text-[11px] mt-0.5 truncate ${
                  activeTab === 'wall-of-silence' ? 'text-gray-500' : 'text-white/70'
                }`}
              >
                مناهضة التنمر في الساحة
              </p>
            </div>
          </button>

          {/* Tab 3: مسرحية: رجال في الشمس */}
          <button
            onClick={() => {
              setActiveTab('men-in-sun');
              setActiveSection('text');
            }}
            className={`flex items-center gap-3 p-3 rounded-xl text-right transition-all duration-200 ${
              activeTab === 'men-in-sun'
                ? 'bg-white text-gray-900 shadow-lg scale-[1.01]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                activeTab === 'men-in-sun' ? 'bg-amber-100 text-amber-700' : 'bg-white/10'
              }`}
            >
              ☀️
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="font-black text-xs md:text-sm leading-snug truncate">
                  رِجَالٌ فِي الشَّمْسِ
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                    activeTab === 'men-in-sun'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  الإعدادي
                </span>
              </div>
              <p
                className={`text-[11px] mt-0.5 truncate ${
                  activeTab === 'men-in-sun' ? 'text-gray-500' : 'text-white/70'
                }`}
              >
                غسان كنفاني — الصرخة
              </p>
            </div>
          </button>

          {/* Tab 4: خزانة وإدارة النصوص (Admin only) */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('all-scripts')}
              className={`flex items-center gap-3 p-3 rounded-xl text-right transition-all duration-200 ${
                activeTab === 'all-scripts'
                  ? 'bg-white text-gray-900 shadow-lg scale-[1.01]'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                  activeTab === 'all-scripts' ? 'bg-purple-100 text-purple-700' : 'bg-white/10'
                }`}
              >
                📚
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-black text-xs md:text-sm leading-snug truncate">
                    إدارة باقي النصوص
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                      activeTab === 'all-scripts'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-white/20 text-white'
                    }`}
                  >
                    {dbScripts.length} نص
                  </span>
                </div>
                <p
                  className={`text-[11px] mt-0.5 truncate ${
                    activeTab === 'all-scripts' ? 'text-gray-500' : 'text-white/70'
                  }`}
                >
                  إضافة وتعديل وحذف
                </p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* VIEW A: FEATURED PLAYS TABS */}
      {activeTab !== 'all-scripts' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Banner header */}
          <div
            className={`p-6 md:p-8 text-white ${
              activeTab === 'colors-kingdom'
                ? 'bg-gradient-to-l from-amber-600 via-rose-700 to-indigo-800'
                : activeTab === 'time-activity'
                ? 'bg-gradient-to-l from-cyan-700 via-teal-800 to-blue-900'
                : activeTab === 'nature-court'
                ? 'bg-gradient-to-l from-emerald-700 via-teal-800 to-emerald-900'
                : activeTab === 'wall-of-silence'
                ? 'bg-gradient-to-l from-blue-700 via-indigo-800 to-blue-900'
                : 'bg-gradient-to-l from-amber-700 via-orange-800 to-amber-900'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold mb-3">
                  <Sparkles size={13} className="text-secondary" />
                  <span>نص مسرحي معتمد للورشة</span>
                </div>
                <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
                  {currentScript.title}
                </h2>
                {currentScript.subtitle && (
                  <p className="text-white/80 text-sm md:text-base mt-1.5 font-normal">
                    {currentScript.subtitle}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-start bg-white/10 backdrop-blur-sm p-1.5 rounded-xl border border-white/15 no-print flex-wrap">
                {isAdmin && currentDbScript && (
                  <button
                    onClick={() => navigate(`/admin/scripts/${currentDbScript.id}`)}
                    className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg font-medium transition-all"
                    title="تعديل في قاعدة البيانات"
                  >
                    <Edit size={14} />
                    <span>تعديل</span>
                  </button>
                )}
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 text-xs bg-white text-gray-800 hover:bg-gray-100 px-3 py-1.5 rounded-lg font-bold shadow-sm transition-all"
                  title="طباعة النص المسرحي"
                >
                  <Printer size={15} />
                  <span>طباعة</span>
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg font-medium transition-all"
                  title="نسخ النص الكامل"
                >
                  {copied ? <Check size={15} className="text-emerald-300" /> : <Copy size={15} />}
                  <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
                </button>
              </div>
            </div>

            {/* Quick Specs grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-xs text-white/70 flex items-center justify-center gap-1 mb-1">
                  <BookOpen size={13} />
                  <span>المستوى</span>
                </div>
                <div className="font-bold text-xs md:text-sm">{currentScript.level}</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-xs text-white/70 flex items-center justify-center gap-1 mb-1">
                  <Clock size={13} />
                  <span>المدة التقريبية</span>
                </div>
                <div className="font-bold text-xs md:text-sm">{currentScript.duration}</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-xs text-white/70 flex items-center justify-center gap-1 mb-1">
                  <Users size={13} />
                  <span>الشخصيات</span>
                </div>
                <div className="font-bold text-xs md:text-sm">
                  {currentScript.characterCount} شخصيات + كورال
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-xs text-white/70 flex items-center justify-center gap-1 mb-1">
                  <Layers size={13} />
                  <span>المشاهد</span>
                </div>
                <div className="font-bold text-xs md:text-sm">
                  {currentScript.sceneList?.length || 6} مشاهد درامية
                </div>
              </div>
            </div>
          </div>

          {/* Synopsis callout */}
          {currentScript.synopsis && (
            <div className="p-5 md:p-6 bg-amber-50/60 border-b border-amber-100 flex items-start gap-3">
              <span className="text-2xl shrink-0 mt-0.5">💡</span>
              <div>
                <h3 className="font-bold text-amber-900 text-sm mb-1">
                  الملخص والفكرة الجوهرية (Synopsis):
                </h3>
                <p className="text-xs md:text-sm text-amber-950/80 leading-relaxed">
                  {currentScript.synopsis}
                </p>
                {currentScript.theme && (
                  <div className="mt-2 text-xs text-amber-800">
                    <span className="font-bold">🎯 القضايا المعالجة: </span>
                    {currentScript.theme}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-tabs navigation */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 md:px-6 py-2 bg-gray-50/70 overflow-x-auto no-print">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSection('text')}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                  activeSection === 'text'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                📜 النص المسرحي الكامل
              </button>
              <button
                onClick={() => setActiveSection('characters')}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                  activeSection === 'characters'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                👥 بطاقة الشخصيات
              </button>
              <button
                onClick={() => setActiveSection('scenes')}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                  activeSection === 'scenes'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                🎬 المشاهد وتقسيم الأحداث
              </button>
              <button
                onClick={() => setActiveSection('direction')}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                  activeSection === 'direction'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                🎭 الملف التقني والإخراجي
              </button>
            </div>

            {/* Text size controls */}
            {activeSection === 'text' && (
              <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500 bg-white px-2 py-1 rounded-lg border border-gray-200">
                <span className="text-[11px] me-1">حجم الخط:</span>
                <button
                  onClick={() => changeFontSize(-1)}
                  className="p-1 hover:text-primary rounded hover:bg-gray-100"
                  title="تصغير الخط"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="font-mono text-gray-700 w-6 text-center">{fontSize}</span>
                <button
                  onClick={() => changeFontSize(1)}
                  className="p-1 hover:text-primary rounded hover:bg-gray-100"
                  title="تكبير الخط"
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Tab Body Content */}
          <div className="p-5 md:p-8">
            {/* SECTION 1: FULL DRAMATIC TEXT */}
            {activeSection === 'text' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between no-print">
                  <div className="text-xs text-gray-400">
                    💡 إرشادات الإخراج والملاحظات الحركية تظهر بين قوسين، وحوارات الشخصيات مبرزة بوضوح.
                  </div>
                  <div className="sm:hidden flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                    <button onClick={() => changeFontSize(-1)} className="p-1">
                      <ZoomOut size={13} />
                    </button>
                    <span className="font-mono">{fontSize}</span>
                    <button onClick={() => changeFontSize(1)} className="p-1">
                      <ZoomIn size={13} />
                    </button>
                  </div>
                </div>

                {/* Printable / Formatted script container */}
                <div
                  style={{ fontSize: `${fontSize}px` }}
                  className="bg-[#faf8f5] text-gray-800 p-6 md:p-10 rounded-2xl border border-amber-200/60 shadow-inner font-serif leading-loose whitespace-pre-wrap select-text print:bg-white print:border-none print:p-0 print:text-black"
                >
                  {currentScript.fullText}
                </div>

                {/* End of text banner */}
                <div className="text-center py-6 border-t border-gray-100 no-print">
                  <div className="text-2xl mb-2">🎭</div>
                  <div className="font-bold text-gray-800 text-sm">نهاية النص المسرحي</div>
                  <p className="text-xs text-gray-500 mt-1">
                    يمكنكم مراجعة الملف الإخراجي والشخصيات من التبويبات أعلاه لإعداد التداريب الصفية
                  </p>
                </div>
              </div>
            )}

            {/* SECTION 2: CHARACTERS */}
            {activeSection === 'characters' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-black text-lg text-text mb-1">بطاقة توزيع الشخصيات والأدوار</h3>
                  <p className="text-xs text-text-muted">
                    توزيع الشخصيات ومواصفاتها السيكولوجية والدرامية لتسهيل الكاستينغ (Casting) وتوزيع الأدوار على التلاميذ
                  </p>
                </div>

                {currentScript.characterList && currentScript.characterList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentScript.characterList.map((char, index) => (
                      <div
                        key={index}
                        className="bg-bg rounded-xl p-5 border border-gray-100 hover:border-primary/30 transition-all flex items-start gap-4"
                      >
                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-text text-base">{char.name}</h4>
                            <span className="text-[11px] bg-secondary/15 text-secondary-dark px-2.5 py-0.5 rounded-full font-semibold">
                              {char.role}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted mt-2 leading-relaxed">
                            {char.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-bg p-5 rounded-xl border border-gray-100 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {currentScript.characters}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 3: SCENES */}
            {activeSection === 'scenes' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-black text-lg text-text mb-1">تسلسل المشاهد والبناء الدرامي</h3>
                  <p className="text-xs text-text-muted">
                    تفكيك المسرحية إلى محطات ومشاهد متتابعة لتنظيم حصص التداريب وتتبع تقدم الإنجاز
                  </p>
                </div>

                {currentScript.sceneList && currentScript.sceneList.length > 0 ? (
                  <div className="space-y-4">
                    {currentScript.sceneList.map(scene => (
                      <div
                        key={scene.number}
                        className="bg-bg rounded-xl p-5 border border-gray-100 flex items-start gap-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="w-10 h-10 rounded-full bg-secondary text-primary-dark font-black flex items-center justify-center shrink-0 text-sm shadow-sm">
                          {scene.number}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-text text-base">{scene.title}</h4>
                          <p className="text-xs md:text-sm text-text-muted mt-1 leading-relaxed">
                            {scene.summary}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-bg p-5 rounded-xl border border-gray-100 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {currentScript.scenes}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 4: DIRECTORIAL DOSSIER */}
            {activeSection === 'direction' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-black text-lg text-text mb-1">الملف الإخراجي والتقني</h3>
                  <p className="text-xs text-text-muted">
                    كافة المعطيات الفنية لإنجاح الفرجة المسرحية: السينوغرافيا، الإضاءة، الصوت، والحركة
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Directorial notes */}
                  <div className="bg-bg rounded-xl p-5 border border-gray-100 space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <Compass size={17} />
                      <span>تعليمات الإخراج المسرحي</span>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed whitespace-pre-wrap">
                      {currentScript.directionNotes}
                    </p>
                  </div>

                  {/* Staging / Space */}
                  <div className="bg-bg rounded-xl p-5 border border-gray-100 space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <Layers size={17} />
                      <span>الحركة فوق الخشبة والفضاء المسرحي</span>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed whitespace-pre-wrap">
                      {currentScript.stagingNotes}
                    </p>
                  </div>

                  {/* Sound & Music */}
                  <div className="bg-bg rounded-xl p-5 border border-gray-100 space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <Volume2 size={17} />
                      <span>المؤثرات الصوتية والموسيقى</span>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed">
                      <span className="font-semibold text-gray-700">المؤثرات: </span>
                      {currentScript.soundEffects}
                    </p>
                    <p className="text-xs text-text-muted leading-relaxed">
                      <span className="font-semibold text-gray-700">الموسيقى: </span>
                      {currentScript.music}
                    </p>
                  </div>

                  {/* Lighting */}
                  <div className="bg-bg rounded-xl p-5 border border-gray-100 space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <Lightbulb size={17} />
                      <span>تصميم الإضاءة المسرحية</span>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed whitespace-pre-wrap">
                      {currentScript.lighting}
                    </p>
                  </div>

                  {/* Scenography & Accessories */}
                  <div className="bg-bg rounded-xl p-5 border border-gray-100 space-y-2 md:col-span-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <Palette size={17} />
                      <span>السينوغرافيا والديكور والإكسسوارات</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div>
                        <span className="font-semibold text-xs text-gray-700 block mb-1">
                          🎨 السينوغرافيا والديكور:
                        </span>
                        <p className="text-xs text-text-muted leading-relaxed">
                          {currentScript.scenography}
                        </p>
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-gray-700 block mb-1">
                          🎒 الإكسسوارات والأزياء:
                        </span>
                        <p className="text-xs text-text-muted leading-relaxed">
                          {currentScript.accessories}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Theater techniques badges */}
                {currentScript.techniques && currentScript.techniques.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-700 mb-2.5">
                      🎭 التقنيات المسرحية الموظفة في هذا العرض:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {currentScript.techniques.map(techId => (
                        <span
                          key={techId}
                          className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full font-medium"
                        >
                          {TECHNIQUE_LABELS[techId] || techId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW B: ALL DATABASE SCRIPTS (MANAGEMENT / CRUD) */}
      {isAdmin && activeTab === 'all-scripts' && (
        <div className="space-y-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-text text-lg">قاعدة النصوص المسرحية</h3>
              <p className="text-xs text-text-muted">إدارة النصوص المخزنة، إضافة نص جديد، والتعديل والحذف</p>
            </div>
            <Button onClick={() => navigate('/admin/scripts/new')} icon={<Plus size={16} />}>
              إضافة نص جديد
            </Button>
          </div>

          {/* Level tabs filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveLevel('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                !activeLevel
                  ? 'bg-primary text-white'
                  : 'bg-white border border-border text-text-muted hover:bg-gray-50'
              }`}
            >
              الكل ({dbScripts.length})
            </button>
            {LEVELS.map(l => (
              <button
                key={l}
                onClick={() => setActiveLevel(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  activeLevel === l
                    ? 'bg-primary text-white'
                    : 'bg-white border border-border text-text-muted hover:bg-gray-50'
                }`}
              >
                {l.replace(' ابتدائي', '').replace(' إعدادي', '')}
              </button>
            ))}
          </div>

          <div>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="بحث في العنوان أو الشخصيات..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDbScripts.map(s => (
              <Card key={s.id} onClick={() => navigate(`/admin/scripts/${s.id}`)} hoverable>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-text truncate">{s.title}</h4>
                    <p className="text-xs text-text-muted mt-0.5">{s.level}</p>
                  </div>
                  <button
                    onClick={e => handleDelete(s.id!, e)}
                    className="p-1.5 rounded-lg hover:bg-red-50 shrink-0 text-danger"
                    title="حذف"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-text-muted">
                  <span>⏱️ {s.duration}</span>
                  <span>👥 {s.characterCount} شخصية</span>
                </div>
                {s.techniques && s.techniques.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {s.techniques.slice(0, 3).map(t => (
                      <span
                        key={t}
                        className="text-[10px] bg-secondary/10 text-secondary-light rounded-full px-2 py-0.5"
                      >
                        {TECHNIQUE_LABELS[t] || t}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {filteredDbScripts.length === 0 && (
            <div className="text-center py-12 text-text-muted">
              <p className="text-4xl mb-3">🎬</p>
              <p className="font-semibold text-sm">لا توجد نصوص مسرحية مطابقة</p>
            </div>
          )}
        </div>
      )}

      {/* Footer Navigation Switcher */}
      {activeTab !== 'all-scripts' && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
          <div className="text-xs text-text-muted text-center sm:text-right">
            تتنقل حالياً في: <span className="font-bold text-primary">{currentScript.title}</span>
          </div>

          <button
            onClick={() => {
              setActiveTab(activeTab === 'men-in-sun' ? 'wall-of-silence' : 'men-in-sun');
              setActiveSection('text');
              window.scrollTo({ top: 120, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 text-xs bg-bg hover:bg-gray-100 text-gray-800 px-4 py-2.5 rounded-xl border border-gray-200 font-bold transition-colors"
          >
            <span>
              الانتقال إلى:{' '}
              {activeTab === 'men-in-sun'
                ? 'جِدَارُ الصَّمْتِ فِي سَاحَةِ الْمَدْرَسَةِ'
                : 'مسرحية: رجال في الشمس'}
            </span>
            <ChevronLeft size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
