import Faculty from '../models/Faculty.js';

const isPlainObject = (value) => {
  if (!value || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

export const mapToObject = (value, seen = new WeakSet()) => {
  if (value == null) return value;
  if (typeof value !== 'object') return value;

  if (seen.has(value)) return {};
  seen.add(value);

  if (value instanceof Map) {
    const out = {};
    for (const [key, nested] of value.entries()) {
      out[key] = mapToObject(nested, seen);
    }
    return out;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const out = {};
  for (const [key, nested] of Object.entries(value)) {
    out[key] = mapToObject(nested, seen);
  }
  return out;
};

export const getFacultyScope = async (req) => {
  if (req.user?.role !== 'faculty') return null;

  const faculty = await Faculty.findOne({ userId: req.user.id }).select(
    '_id userId departmentId employeeNo designation joiningDate routing'
  );

  if (!faculty) {
    const error = new Error('Faculty profile not found for authenticated user');
    error.status = 403;
    throw error;
  }

  return faculty;
};

export const extractFacultyAssignments = (routing) => {
  const routingObj = mapToObject(routing) || {};
  const assignments = [];

  Object.entries(routingObj).forEach(([day, lectureMap]) => {
    if (!lectureMap || typeof lectureMap !== 'object') return;

    Object.entries(lectureMap).forEach(([lectureNo, lecture]) => {
      if (!lecture || typeof lecture !== 'object' || !lecture.classId) return;

      assignments.push({
        day,
        lectureNo,
        classId: String(lecture.classId),
        subjectId: lecture.subjectId ? String(lecture.subjectId) : null
      });
    });
  });

  return assignments;
};

export const getFacultyAssignedClassIds = (facultyScope) => {
  return [...new Set(extractFacultyAssignments(facultyScope?.routing).map((item) => item.classId))];
};

export const getFacultyAssignedSubjectIds = (facultyScope, classId = null) => {
  return [
    ...new Set(
      extractFacultyAssignments(facultyScope?.routing)
        .filter((item) => !classId || item.classId === String(classId))
        .map((item) => item.subjectId)
        .filter(Boolean)
    )
  ];
};

export const isFacultyAssignedToClassSubject = (facultyScope, classId, subjectId = null) => {
  return extractFacultyAssignments(facultyScope?.routing).some((item) => {
    if (item.classId !== String(classId)) return false;
    if (!subjectId) return true;
    return item.subjectId === String(subjectId);
  });
};
