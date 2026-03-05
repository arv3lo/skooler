-- ─────────────────────────────────────────────────────────────
-- Row-Level Security setup for tenant-scoped tables
-- Run this after initial Prisma migration
-- ─────────────────────────────────────────────────────────────

-- Create a low-privilege app role for RLS enforcement
DO $$ BEGIN
  CREATE ROLE app_user NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Helper function to read the current tenant ID from session config
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

-- ─────────────────────────────────────────────────────────────
-- Enable RLS and create policies for each tenant-scoped table
-- ─────────────────────────────────────────────────────────────

-- students
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE students FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON students
  USING (tenant_id = current_tenant_id());

-- academic_years
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON academic_years
  USING (tenant_id = current_tenant_id());

-- terms
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON terms
  USING (tenant_id = current_tenant_id());

-- rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON rooms
  USING (tenant_id = current_tenant_id());

-- classes
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON classes
  USING (tenant_id = current_tenant_id());

-- class_enrollments
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON class_enrollments
  USING (tenant_id = current_tenant_id());

-- staff_profiles
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON staff_profiles
  USING (tenant_id = current_tenant_id());

-- transfer_requests
ALTER TABLE transfer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_requests FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON transfer_requests
  USING (tenant_id = current_tenant_id());

-- school_announcements
ALTER TABLE school_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_announcements FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON school_announcements
  USING (tenant_id = current_tenant_id());
