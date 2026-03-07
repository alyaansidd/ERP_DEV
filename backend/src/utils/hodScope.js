import Faculty from '../models/Faculty.js';
import Department from '../models/Department.js';

const isHod = (req) => req.user?.role === 'hod';

const toIdString = (value) => (value ? String(value) : null);

const ensureHodScope = async (req) => {
  if (!isHod(req)) {
    return null;
  }

  if (req.hodScope) {
    return req.hodScope;
  }

  const faculty = await Faculty.findOne({ userId: req.user.id }).select('_id departmentId');

  if (!faculty || !faculty.departmentId) {
    const error = new Error('HOD profile is not linked to any department');
    error.status = 403;
    throw error;
  }

  const assignedDepartment = await Department.findOne({
    _id: faculty.departmentId,
    hod: faculty._id
  }).select('_id');

  if (!assignedDepartment) {
    const error = new Error('HOD is not assigned to manage any department');
    error.status = 403;
    throw error;
  }

  req.hodScope = {
    facultyId: toIdString(faculty._id),
    departmentId: toIdString(assignedDepartment._id)
  };

  return req.hodScope;
};

export const getScopedDepartmentId = async (req) => {
  const scope = await ensureHodScope(req);
  return scope ? scope.departmentId : null;
};

export const isDepartmentAllowedForHod = async (req, departmentId) => {
  if (!isHod(req)) {
    return true;
  }

  const scopedDepartmentId = await getScopedDepartmentId(req);
  return toIdString(departmentId) === scopedDepartmentId;
};

