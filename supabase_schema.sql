-- مخطط قاعدة بيانات تطبيق المسرح المدرسي في Supabase
-- قم بنسخ هذا الكود وتشغيله في Supabase -> SQL Editor -> New query -> Run

-- 1. جدول الأقسام
CREATE TABLE IF NOT EXISTS classes (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  day_of_week INT NOT NULL,
  start_time TEXT NOT NULL,
  duration INT NOT NULL,
  room TEXT,
  order_num INT DEFAULT 0
);

-- 2. جدول الحصص والتقارير
CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  class_id BIGINT,
  session_number INT DEFAULT 1,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  duration INT NOT NULL,
  topic TEXT,
  objectives TEXT,
  activities TEXT,
  techniques TEXT[] DEFAULT '{}',
  teacher_notes TEXT,
  difficulties TEXT,
  students_needing_support TEXT,
  next_session_plan TEXT,
  script_id BIGINT,
  lesson_plan_id TEXT,
  scene_info TEXT,
  status TEXT DEFAULT 'scheduled',
  is_holiday BOOLEAN DEFAULT FALSE,
  holiday_name TEXT
);

-- 3. جدول النصوص المسرحية
CREATE TABLE IF NOT EXISTS scripts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  level TEXT NOT NULL,
  topic TEXT NOT NULL,
  characters TEXT[] DEFAULT '{}',
  synopsis TEXT NOT NULL,
  content TEXT NOT NULL,
  objectives TEXT[] DEFAULT '{}',
  techniques TEXT[] DEFAULT '{}',
  pdf_url TEXT,
  is_custom BOOLEAN DEFAULT FALSE
);

-- 4. جدول العطل
CREATE TABLE IF NOT EXISTS holidays (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  type TEXT NOT NULL
);

-- 5. جدول الإعدادات
CREATE TABLE IF NOT EXISTS settings (
  id BIGSERIAL PRIMARY KEY,
  teacher_name TEXT,
  school_name TEXT,
  academic_year TEXT,
  theme TEXT
);

-- تفعيل سياسات الأمان للقراءة والكتابة العامة للمشروع (Public Access)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access on classes" ON classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on scripts" ON scripts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on holidays" ON holidays FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on settings" ON settings FOR ALL USING (true) WITH CHECK (true);
