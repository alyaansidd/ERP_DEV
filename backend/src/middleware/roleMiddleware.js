import { ROLES, ALL_ROLES } from '../config/roles.js';
// Roles: admin, faculty, student (no HOD/parent)

/**
 * Middleware: Allow access only to the listed roles.
 *
 * Usage:
 *   authorize('admin', 'HOD')          // positional args
 *   authorize(ACCESS.DEPARTMENT.CREATE) // from access matrix (array)
 *
 * @param  {...(string|string[])} roles
 */
export const authorize = (...roles) => {
  // Flatten so callers can pass either individual strings or an array
  const allowed = roles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: insufficient permissions.',
        requiredRoles: allowed,
        yourRole: req.user.role,
      });
    }

    next();
  };
};

/**
 * Middleware: Deny access for the listed roles (blacklist approach).
 */
export const denyRoles = (...roles) => {
  const denied = roles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (denied.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: your role is not permitted for this action.',
      });
    }

    next();
  };
};

/**
 * Re-export role constants for convenience
 */
export { ROLES, ALL_ROLES };
