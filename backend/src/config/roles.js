/**
 * Role-Based Access Control (RBAC) Configuration
 * ================================================
 * Centralized access matrix for all routes.
 *
 * Roles (highest → lowest privilege):
 *   admin   – Full system access
 *   hod     – Department management & faculty oversight
 *   faculty – Teaching & attendance duties
 *   student – Read-only / self-service
 *
 * Usage in routes:
 *   import { ROLES, ACCESS } from '../config/roles.js';
 *   router.get('/', verifyToken, checkRole(ACCESS.DEPARTMENT.READ), handler);
 */

// ──────────────────────────────────────────────
//  Role constants
// ──────────────────────────────────────────────
export const ROLES = Object.freeze({
  ADMIN: 'admin',
  HOD: 'hod',
  FACULTY: 'faculty',
  STUDENT: 'student',
});

/** All authenticated roles (convenience shortcut) */
export const ALL_ROLES = [ROLES.ADMIN, ROLES.HOD, ROLES.FACULTY, ROLES.STUDENT];

/** Authenticated roles excluding HOD */
const NON_HOD_ROLES = [ROLES.ADMIN, ROLES.FACULTY, ROLES.STUDENT];

/** Staff roles – admin, hod & faculty */
const STAFF = [ROLES.ADMIN, ROLES.HOD, ROLES.FACULTY];

/** Management roles – admin & hod */
const MANAGEMENT = [ROLES.ADMIN, ROLES.HOD];

/** Admin only */
const ADMIN_ONLY = [ROLES.ADMIN];

// ──────────────────────────────────────────────
//  Route Access Matrix
// ──────────────────────────────────────────────
export const ACCESS = Object.freeze({
  // ─── Auth ─────────────────────────────────
  AUTH: {
    REGISTER: ADMIN_ONLY,       // Only admins can create new users
    PROFILE: ALL_ROLES,         // Any logged-in user can view own profile
    LOGOUT: ALL_ROLES,
  },

  // ─── Departments ──────────────────────────
  DEPARTMENT: {
    READ: ALL_ROLES,            // Everyone can view departments
    CREATE: ADMIN_ONLY,         // Only admin creates departments
    UPDATE: ADMIN_ONLY,         // Only admin updates department details
    DELETE: ADMIN_ONLY,         // Only admin deletes
    ASSIGN_HOD: ADMIN_ONLY,     // Only admin can assign/reassign HOD
  },

  // ─── Faculty ──────────────────────────────
  FACULTY: {
    READ: ALL_ROLES,            // Everyone can view faculty list
    CREATE: MANAGEMENT,         // Admin & HOD can add faculty to their department
    UPDATE: STAFF,              // Admin, HOD & faculty (own profile)
    DELETE: ADMIN_ONLY,         // Only admin removes faculty
  },

  // ─── Students ─────────────────────────────
  STUDENT: {
    READ: ALL_ROLES,            // Everyone can view students
    CREATE: STAFF,              // Admin, HOD & faculty can register students
    UPDATE: STAFF,              // Admin, HOD & faculty can update student records
    DELETE: ADMIN_ONLY,         // Only admin deletes
  },

  // ─── Courses ──────────────────────────────
  COURSE: {
    READ: NON_HOD_ROLES,
    CREATE: ADMIN_ONLY,         // Only admin designs curriculum
    UPDATE: ADMIN_ONLY,
    DELETE: ADMIN_ONLY,
  },

  // ─── Subjects ─────────────────────────────
  SUBJECT: {
    READ: ALL_ROLES,
    CREATE: MANAGEMENT,
    UPDATE: MANAGEMENT,
    DELETE: MANAGEMENT,
  },

  // ─── Classes ──────────────────────────────
  CLASS: {
    READ: ALL_ROLES,
    CREATE: MANAGEMENT,
    UPDATE: MANAGEMENT,         // Admin & HOD can manage classes in their department
    DELETE: MANAGEMENT,
  },

  // ─── Attendance ───────────────────────────
  ATTENDANCE: {
    READ: ALL_ROLES,            // Students can view own attendance
    CREATE: STAFF,              // Admin, HOD & faculty mark attendance
    UPDATE: STAFF,              // Admin, HOD & faculty can correct attendance
    DELETE: ADMIN_ONLY,         // Only admin can purge records
  },

  // ─── Academic Years ───────────────────────
  ACADEMIC_YEAR: {
    READ: NON_HOD_ROLES,
    CREATE: ADMIN_ONLY,         // Only admin manages academic calendar
    UPDATE: ADMIN_ONLY,
    DELETE: ADMIN_ONLY,
  },

  // ─── Notices ──────────────────────────────
  NOTICE: {
    READ: ALL_ROLES,            // Everyone reads notices
    CREATE: STAFF,              // Admin, HOD & faculty can post notices
    UPDATE: STAFF,              // Author or admin can edit
    DELETE: STAFF,              // Creator can delete own notice (admin can delete any)
  },
});
