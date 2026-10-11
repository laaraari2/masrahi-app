import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { seedDatabase, seedScripts } from './db/seeds';
import { initAdminAuth } from './services/authService';
import { initializeWorkshopProgram } from './services/programPopulator';

import AppLayout from './components/layout/AppLayout';
import VisitorLayout from './components/layout/VisitorLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import SchedulePage from './pages/SchedulePage';
import TrainingPage from './pages/TrainingPage';
import TrainingFormPage from './pages/TrainingFormPage';
import TrainingLogPage from './pages/TrainingLogPage';
import ScriptsPage from './pages/ScriptsPage';
import ScriptFormPage from './pages/ScriptFormPage';
import ProgramPage from './pages/ProgramPage';
import ReportsPage from './pages/ReportsPage';
import HolidaysPage from './pages/HolidaysPage';
import SettingsPage from './pages/SettingsPage';
import VisitorSite from './pages/VisitorSite';
import TheatricalScriptsPage from './pages/TheatricalScriptsPage';
import WeeklyReportsPage from './pages/WeeklyReportsPage';

import { db } from './db/database';

export default function App() {
  useEffect(() => {
    const initDB = async () => {
      // Initialize admin auth first
      await initAdminAuth();

      const classCount = await db.classes.count();
      // Re-seed if old defaults detected (4 old classes or 8 classes with wrong labels)
      if (classCount > 0 && classCount <= 8) {
        const allClasses = await db.classes.toArray();
        const settings = await db.settings.toCollection().first();
        const hasOldLabels = allClasses.some(c => c.level.includes('المستوى')) || 
                             allClasses.some(c => c.level === 'الأول ما قبل التمدرس (CP)');
        const hasOldName = settings?.teacherName === 'أستاذ المسرح' || !settings?.teacherName;
        if (hasOldLabels || classCount === 4 || hasOldName) {
          await db.classes.clear();
          await db.sessions.clear();
          await db.settings.clear();
        }
      }
      await seedDatabase();
      await seedScripts();
      await initializeWorkshopProgram();
    };
    
    initDB().catch(console.error);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* موقع الزوار */}
        <Route element={<VisitorLayout />}>
          <Route index element={<VisitorSite />} />
          <Route path="scripts" element={<TheatricalScriptsPage />} />
          <Route path="weekly-reports" element={<WeeklyReportsPage />} />
        </Route>

        {/* صفحة تسجيل الدخول */}
        <Route path="/login" element={<LoginPage />} />

        {/* لوحة التحكم — محمية */}
        <Route element={<ProtectedRoute />}>
          <Route path="admin" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="training" element={<TrainingPage />} />
            <Route path="training/:id" element={<TrainingFormPage />} />
            <Route path="training-log" element={<TrainingLogPage />} />
            <Route path="scripts" element={<ScriptsPage />} />
            <Route path="scripts/new" element={<ScriptFormPage />} />
            <Route path="scripts/:id" element={<ScriptFormPage />} />
            <Route path="program" element={<ProgramPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="holidays" element={<HolidaysPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

