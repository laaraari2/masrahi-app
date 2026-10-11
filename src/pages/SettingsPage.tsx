import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { exportData, importData, resetDatabase } from '../db/backup';
import { seedDatabase } from '../db/seeds';
import { changePassword } from '../services/authService';
import { populateProgram } from '../services/programPopulator';
import Header from '../components/layout/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Save, Download, Upload, RefreshCw, Info, Lock, BookOpen } from 'lucide-react';

export default function SettingsPage() {
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const [teacherName, setTeacherName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [saved, setSaved] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Password change state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Program population state
  const [progLoading, setProgLoading] = useState(false);
  const [progMsg, setProgMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync from DB
  if (settings && !initialized) {
    setTeacherName(settings.teacherName || '');
    setSchoolName(settings.schoolName || '');
    setInitialized(true);
  }

  const handleSaveInfo = async () => {
    if (settings?.id) {
      await db.settings.update(settings.id, { teacherName, schoolName });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleExport = async () => {
    const json = await exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `masrahi-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      if (confirm('سيتم استبدال جميع البيانات الحالية. هل تريد المتابعة؟')) {
        await importData(text);
        window.location.reload();
      }
    };
    input.click();
  };

  const handleReset = async () => {
    if (!confirm('هل تريد حذف جميع البيانات وإعادة التعيين؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    await resetDatabase();
    await seedDatabase();
    window.location.reload();
  };

  const handleChangePassword = async () => {
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: 'error', text: 'كلمتا المرور الجديدة غير متطابقتين' });
      return;
    }
    setPwdLoading(true);
    const result = await changePassword(currentPwd, newPwd);
    setPwdLoading(false);
    if (result.success) {
      setPwdMsg({ type: 'success', text: '✅ تم تغيير كلمة المرور بنجاح' });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setTimeout(() => setPwdMsg(null), 3000);
    } else {
      setPwdMsg({ type: 'error', text: result.error || 'حدث خطأ' });
    }
  };

  const handlePopulateProgram = async () => {
    if (!confirm('سيتم تعبئة مواضيع وأهداف وأنشطة الحصص من أكتوبر 2026 إلى يناير 2027 حسب البرنامج المعد. هل تريد المتابعة؟')) return;
    setProgLoading(true);
    try {
      const result = await populateProgram(true);
      setProgMsg({ type: 'success', text: `✅ تم تعبئة ${result.updated} حصة بنجاح (${result.skipped} تم تخطيها)` });
      setTimeout(() => setProgMsg(null), 5000);
    } catch (e) {
      setProgMsg({ type: 'error', text: 'حدث خطأ أثناء تحديث الجذاذات' });
    }
    setProgLoading(false);
  };

  return (
    <div>
      <Header title="الإعدادات" />

      {/* Teacher info */}
      <Card className="mb-6">
        <h2 className="text-lg font-bold mb-4">👤 معلومات الأستاذ</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">اسم الأستاذ</label>
            <input type="text" value={teacherName} onChange={e => setTeacherName(e.target.value)}
              placeholder="أدخل اسمك الكامل"
              className="w-full rounded-lg border border-border p-3 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">اسم المؤسسة</label>
            <input type="text" value={schoolName} onChange={e => setSchoolName(e.target.value)}
              placeholder="اسم المدرسة"
              className="w-full rounded-lg border border-border p-3 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
          </div>
          <Button onClick={handleSaveInfo} icon={<Save size={18} />}>
            {saved ? '✅ تم الحفظ' : 'حفظ المعلومات'}
          </Button>
        </div>
      </Card>

      {/* Change Password */}
      <Card className="mb-6">
        <h2 className="text-lg font-bold mb-4"><Lock size={18} className="inline ml-1" />︎ كلمة المرور</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-text mb-1">كلمة المرور الحالية</label>
            <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-border p-3 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">كلمة المرور الجديدة</label>
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
              placeholder="6 أحرف على الأقل"
              className="w-full rounded-lg border border-border p-3 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">تأكيد كلمة المرور</label>
            <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
              placeholder="أعد كتابة كلمة المرور الجديدة"
              className="w-full rounded-lg border border-border p-3 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
          </div>
          {pwdMsg && (
            <p className={`text-sm px-3 py-2 rounded-lg ${
              pwdMsg.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>{pwdMsg.text}</p>
          )}
          <Button
            onClick={handleChangePassword}
            icon={<Lock size={16} />}
            disabled={pwdLoading || !currentPwd || !newPwd || !confirmPwd}
          >
            {pwdLoading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
          </Button>
        </div>
      </Card>

      {/* Program Population */}
      <Card className="mb-6">
        <h2 className="text-lg font-bold mb-4"><BookOpen size={18} className="inline ml-1" /> إدارة الجذاذات</h2>
        <p className="text-sm text-text-muted mb-4">تعبئة الجذاذات التفصيلية المقترحة لحصص 1APIC، من 29 شتنبر 2026 إلى 25 ماي 2027، مع إحماء 5 دقائق فقط في كل حصة.</p>
        {progMsg && (
          <p className={`text-sm px-3 py-2 rounded-lg mb-3 ${
            progMsg.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>{progMsg.text}</p>
        )}
        <Button
          onClick={handlePopulateProgram}
          icon={<BookOpen size={18} />}
          disabled={progLoading}
        >
          {progLoading ? 'جاري التحديث...' : 'تحديث الجذاذات'}
        </Button>
      </Card>

      {/* Data management */}
      <Card className="mb-6">
        <h2 className="text-lg font-bold mb-4">💾 إدارة البيانات</h2>
        <div className="space-y-3">
          <Button variant="secondary" onClick={handleExport} icon={<Download size={18} />} className="w-full sm:w-auto">
            تصدير البيانات (JSON)
          </Button>
          <Button variant="ghost" onClick={handleImport} icon={<Upload size={18} />} className="w-full sm:w-auto">
            استيراد البيانات (JSON)
          </Button>
          <div className="pt-4 border-t border-border">
            <Button variant="danger" onClick={handleReset} icon={<RefreshCw size={18} />} className="w-full sm:w-auto">
              إعادة تعيين جميع البيانات
            </Button>
            <p className="text-xs text-text-muted mt-2">⚠️ سيتم حذف جميع البيانات وإعادة التطبيق إلى حالته الأولية</p>
          </div>
        </div>
      </Card>

      {/* About */}
      <Card>
        <h2 className="text-lg font-bold mb-3">ℹ️ حول التطبيق</h2>
        <div className="space-y-2 text-sm text-text-muted">
          <p><strong className="text-text">مسرحي</strong> — الإصدار 1.0.0</p>
          <p>تطبيق لتدبير ورشة المسرح في التعليم الابتدائي بالمغرب</p>
          <p>دفتر يومي رقمي لتتبع الحصص المسرحية وتدبير النصوص والتخطيط السنوي</p>
          <p className="pt-2 text-xs">السنة الدراسية 2026/2027 🇲🇦</p>
        </div>
      </Card>
    </div>
  );
}
