import Attendance from '../models/Attendance.js';
import AttendanceSession from '../models/AttendanceSession.js';
import Class from '../models/Class.js';
import Faculty from '../models/Faculty.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import {
  extractFacultyAssignments,
  getFacultyScope,
  isFacultyAssignedToClassSubject
} from '../utils/facultyScope.js';
import { getScopedDepartmentId } from '../utils/hodScope.js';
import { emitAttendanceMarkedEvent, subscribeAttendanceEvents } from '../utils/attendanceRealtime.js';

const populateSession = (query) =>
  query
    .populate('classId', 'name roomNo departmentId')
    .populate('subjectId', 'subjectCode name credit')
    .populate({
      path: 'startedByFacultyId',
      select: 'employeeNo userId',
      populate: { path: 'userId', select: 'name email' }
    })
    .populate({
      path: 'markedStudents.studentId',
      select: 'rollNo userId classId',
      populate: { path: 'userId', select: 'name email' }
    });

const normalizeAttendanceDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const parseCoordinates = (location) => {
  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90) return null;
  if (longitude < -180 || longitude > 180) return null;

  return { latitude, longitude };
};

const toRadians = (value) => (value * Math.PI) / 180;

const distanceInMeters = (pointA, pointB) => {
  const earthRadius = 6371000;
  const dLat = toRadians(pointB.latitude - pointA.latitude);
  const dLng = toRadians(pointB.longitude - pointA.longitude);

  const lat1 = toRadians(pointA.latitude);
  const lat2 = toRadians(pointB.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

const getStudentProfile = async (userId) =>
  Student.findOne({ userId })
    .select('_id classId departmentId rollNo userId')
    .populate('userId', 'name');

const getFacultyProfile = async (userId) => Faculty.findOne({ userId }).select('_id departmentId routing');

const limitSessionForStudent = (sessionDoc, studentId) => {
  const markedStudents = Array.isArray(sessionDoc.markedStudents) ? sessionDoc.markedStudents : [];
  const ownMarks = markedStudents.filter(
    (entry) => String(entry.studentId?._id || entry.studentId) === String(studentId)
  );

  return {
    ...sessionDoc.toObject(),
    markedStudents: ownMarks,
    totalMarkedCount: markedStudents.length
  };
};

const syncSessionStatusByTime = async (sessionDoc) => {
  if (!sessionDoc) return sessionDoc;

  if (sessionDoc.status === 'active' && sessionDoc.endTime.getTime() <= Date.now()) {
    sessionDoc.status = 'expired';
    await sessionDoc.save();
  }

  return sessionDoc;
};

const ensureFacultyCanManageSession = async (req, classId, subjectId) => {
  if (req.user.role !== 'faculty') {
    return { allowed: false, status: 403, message: 'Only faculty can manage attendance sessions' };
  }

  const facultyScope = await getFacultyScope(req);
  if (!facultyScope) {
    return { allowed: false, status: 403, message: 'Faculty scope not found' };
  }

  if (!isFacultyAssignedToClassSubject(facultyScope, classId, subjectId)) {
    return {
      allowed: false,
      status: 403,
      message: 'Access denied. Faculty can only manage sessions for their assigned class and subject'
    };
  }

  return { allowed: true, facultyScope };
};

/**
 * Stream attendance session real-time updates
 * @route GET /api/attendance/sessions/stream/events
 */
export const streamAttendanceSessionEvents = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    let facultyScope = null;
    let scopedDepartmentId = null;

    if (req.user.role === 'faculty') {
      facultyScope = await getFacultyScope(req);
    } else if (req.user.role === 'hod') {
      scopedDepartmentId = await getScopedDepartmentId(req);
    }

    const unsubscribe = subscribeAttendanceEvents({
      res,
      canReceive: (payload) => {
        if (req.user.role === 'admin') return true;

        if (req.user.role === 'faculty') {
          if (!facultyScope) return false;
          return isFacultyAssignedToClassSubject(facultyScope, payload.classId, payload.subjectId);
        }

        if (req.user.role === 'hod') {
          return Boolean(scopedDepartmentId) && String(payload.departmentId) === String(scopedDepartmentId);
        }

        if (req.user.role === 'student') {
          return String(payload.studentUserId || '') === String(req.user.id);
        }

        return false;
      }
    });

    req.on('close', () => {
      unsubscribe();
      res.end();
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }

    console.error('Attendance session stream error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error opening attendance event stream'
    });
  }
};

/**
 * Start attendance session
 * @route POST /api/attendance/sessions/start
 */
export const startAttendanceSession = async (req, res) => {
  try {
    const {
      classId,
      subjectId,
      lectureNo,
      startTime,
      endTime,
      radiusMeters,
      facultyLocation
    } = req.body;

    if (!classId || !subjectId || !lectureNo || !endTime || !radiusMeters || !facultyLocation) {
      return res.status(400).json({
        success: false,
        message: 'Please provide classId, subjectId, lectureNo, endTime, radiusMeters, and facultyLocation'
      });
    }

    const parsedStartTime = startTime ? new Date(startTime) : new Date();
    const parsedEndTime = new Date(endTime);
    const parsedRadiusMeters = Number(radiusMeters);
    const parsedFacultyLocation = parseCoordinates(facultyLocation);

    if (Number.isNaN(parsedStartTime.getTime()) || Number.isNaN(parsedEndTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startTime or endTime'
      });
    }

    if (parsedEndTime <= parsedStartTime) {
      return res.status(400).json({
        success: false,
        message: 'endTime must be greater than startTime'
      });
    }

    if (parsedRadiusMeters <= 0) {
      return res.status(400).json({
        success: false,
        message: 'radiusMeters must be greater than 0'
      });
    }

    if (!parsedFacultyLocation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid facultyLocation coordinates'
      });
    }

    const facultyPermission = await ensureFacultyCanManageSession(req, classId, subjectId);
    if (!facultyPermission.allowed) {
      return res.status(facultyPermission.status).json({
        success: false,
        message: facultyPermission.message
      });
    }

    const faculty = await getFacultyProfile(req.user.id);
    if (!faculty) {
      return res.status(403).json({
        success: false,
        message: 'Faculty profile not found for authenticated user'
      });
    }

    const classDoc = await Class.findById(classId).select('_id departmentId');
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    const subjectDoc = await Subject.findById(subjectId).select('_id');
    if (!subjectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    if (String(classDoc.departmentId) !== String(faculty.departmentId)) {
      return res.status(403).json({
        success: false,
        message: 'Faculty can only start sessions for classes in their department'
      });
    }

    const existingSession = await AttendanceSession.findOne({
      classId,
      subjectId,
      lectureNo,
      status: 'active',
      endTime: { $gt: new Date() }
    }).select('_id');

    if (existingSession) {
      return res.status(409).json({
        success: false,
        message: 'An active attendance session already exists for this class, subject, and lecture'
      });
    }

    const sessionDate = normalizeAttendanceDate(parsedStartTime);

    const session = await AttendanceSession.create({
      classId,
      subjectId,
      lectureNo,
      date: sessionDate,
      startedByFacultyId: faculty._id,
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      facultyLocation: parsedFacultyLocation,
      radiusMeters: parsedRadiusMeters,
      status: 'active'
    });

    const populated = await populateSession(AttendanceSession.findById(session._id));

    return res.status(201).json({
      success: true,
      message: 'Attendance session started successfully',
      data: populated
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }

    console.error('Start attendance session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error starting attendance session'
    });
  }
};

/**
 * List active attendance sessions
 * @route GET /api/attendance/sessions/active
 */
export const getActiveAttendanceSessions = async (req, res) => {
  try {
    const now = new Date();
    const { classId } = req.query;
    const baseFilter = {
      status: 'active',
      startTime: { $lte: now },
      endTime: { $gt: now }
    };

    if (classId) {
      baseFilter.classId = classId;
    }

    if (req.user.role === 'student') {
      const student = await getStudentProfile(req.user.id);
      if (!student) {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }

      baseFilter.classId = student.classId;
      const sessions = await populateSession(AttendanceSession.find(baseFilter));

      const data = sessions.map((session) => {
        const remainingSeconds = Math.max(
          0,
          Math.floor((new Date(session.endTime).getTime() - now.getTime()) / 1000)
        );

        const isAlreadyMarked = session.markedStudents.some(
          (entry) => String(entry.studentId?._id || entry.studentId) === String(student._id)
        );

        return {
          ...limitSessionForStudent(session, student._id),
          remainingSeconds,
          isAlreadyMarked
        };
      });

      return res.status(200).json({ success: true, count: data.length, data });
    }

    const facultyScope = await getFacultyScope(req);
    const scopedDepartmentId = await getScopedDepartmentId(req);

    if (facultyScope) {
      const assignedPairs = extractFacultyAssignments(facultyScope.routing)
        .filter((entry) => Boolean(entry.subjectId))
        .map((entry) => ({ classId: entry.classId, subjectId: entry.subjectId }));

      if (assignedPairs.length === 0) {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }

      baseFilter.$or = assignedPairs.map((entry) => ({
        classId: entry.classId,
        subjectId: entry.subjectId
      }));
    } else if (scopedDepartmentId) {
      const classes = await Class.find({ departmentId: scopedDepartmentId }).select('_id');
      const classIds = classes.map((item) => item._id);
      baseFilter.classId = classIds.length > 0 ? { $in: classIds } : null;
    }

    if (baseFilter.classId === null) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const sessions = await populateSession(AttendanceSession.find(baseFilter));
    return res.status(200).json({ success: true, count: sessions.length, data: sessions });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }

    console.error('Get active attendance sessions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving active attendance sessions'
    });
  }
};

/**
 * Get attendance session by id
 * @route GET /api/attendance/sessions/:sessionId
 */
export const getAttendanceSessionById = async (req, res) => {
  try {
    let session = await populateSession(AttendanceSession.findById(req.params.sessionId));

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Attendance session not found'
      });
    }

    session = await syncSessionStatusByTime(session);

    if (req.user.role === 'student') {
      const student = await getStudentProfile(req.user.id);
      if (!student || String(student.classId) !== String(session.classId?._id || session.classId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Students can only access sessions for their class'
        });
      }

      return res.status(200).json({
        success: true,
        data: limitSessionForStudent(session, student._id)
      });
    }

    const facultyScope = await getFacultyScope(req);
    if (facultyScope && !isFacultyAssignedToClassSubject(facultyScope, session.classId?._id || session.classId, session.subjectId?._id || session.subjectId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Faculty can only access their assigned class and subject sessions'
      });
    }

    const scopedDepartmentId = await getScopedDepartmentId(req);
    const departmentId = session.classId?.departmentId ? String(session.classId.departmentId) : null;
    if (scopedDepartmentId && departmentId !== scopedDepartmentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. HOD can only access sessions from their assigned department'
      });
    }

    return res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }

    console.error('Get attendance session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving attendance session'
    });
  }
};

/**
 * Verify student eligibility for attendance session
 * @route POST /api/attendance/sessions/:sessionId/verify
 */
export const verifyStudentForAttendanceSession = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can verify attendance sessions'
      });
    }

    const student = await getStudentProfile(req.user.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const studentLocation = parseCoordinates(req.body);
    if (!studentLocation) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid latitude and longitude'
      });
    }

    let session = await AttendanceSession.findById(req.params.sessionId)
      .populate('classId', 'name roomNo departmentId')
      .populate('subjectId', 'subjectCode name credit')
      .populate('markedStudents.studentId', 'rollNo userId');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Attendance session not found'
      });
    }

    session = await syncSessionStatusByTime(session);

    if (String(student.classId) !== String(session.classId?._id || session.classId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Session does not belong to your class'
      });
    }

    const now = new Date();
    const hasStarted = session.startTime.getTime() <= now.getTime();
    const remainingSeconds = Math.max(0, Math.floor((session.endTime.getTime() - now.getTime()) / 1000));

    const alreadyMarked = session.markedStudents.some(
      (entry) => String(entry.studentId?._id || entry.studentId) === String(student._id)
    );

    const distanceMeters = distanceInMeters(studentLocation, session.facultyLocation);
    const inRange = distanceMeters <= session.radiusMeters;

    const isActive = session.status === 'active' && hasStarted && remainingSeconds > 0;
    const canMark = isActive && inRange && !alreadyMarked;

    return res.status(200).json({
      success: true,
      data: {
        sessionId: session._id,
        classId: session.classId,
        subjectId: session.subjectId,
        lectureNo: session.lectureNo,
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        remainingSeconds,
        radiusMeters: session.radiusMeters,
        distanceMeters: Number(distanceMeters.toFixed(2)),
        inRange,
        alreadyMarked,
        canMark
      }
    });
  } catch (error) {
    console.error('Verify attendance session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying attendance session'
    });
  }
};

/**
 * Mark attendance from active session
 * @route POST /api/attendance/sessions/:sessionId/mark
 */
export const markAttendanceFromSession = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can mark attendance from session'
      });
    }

    const student = await getStudentProfile(req.user.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const studentLocation = parseCoordinates(req.body);
    if (!studentLocation) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid latitude and longitude'
      });
    }

    let session = await AttendanceSession.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Attendance session not found'
      });
    }

    session = await syncSessionStatusByTime(session);

    if (String(student.classId) !== String(session.classId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Session does not belong to your class'
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Attendance session is no longer active'
      });
    }

    const now = new Date();
    if (session.startTime.getTime() > now.getTime()) {
      return res.status(400).json({
        success: false,
        message: 'Attendance session has not started yet'
      });
    }

    if (session.endTime.getTime() <= now.getTime()) {
      session.status = 'expired';
      await session.save();
      return res.status(400).json({
        success: false,
        message: 'Attendance session has expired'
      });
    }

    const alreadyMarked = session.markedStudents.some(
      (entry) => String(entry.studentId) === String(student._id)
    );

    if (alreadyMarked) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already marked for this session'
      });
    }

    const distanceMeters = distanceInMeters(studentLocation, session.facultyLocation);
    if (distanceMeters > session.radiusMeters) {
      return res.status(403).json({
        success: false,
        message: 'You are outside the allowed attendance range',
        data: {
          radiusMeters: session.radiusMeters,
          distanceMeters: Number(distanceMeters.toFixed(2))
        }
      });
    }

    session.markedStudents.push({
      studentId: student._id,
      markedAt: now,
      distanceMeters: Number(distanceMeters.toFixed(2)),
      studentLocation
    });
    await session.save();

    const attendanceDate = normalizeAttendanceDate(session.date || session.startTime);
    let attendance = await Attendance.findOne({
      classId: session.classId,
      subjectId: session.subjectId,
      lectureNo: session.lectureNo,
      date: attendanceDate
    });

    if (!attendance) {
      attendance = await Attendance.create({
        classId: session.classId,
        subjectId: session.subjectId,
        lectureNo: session.lectureNo,
        date: attendanceDate,
        record: [{ studentId: student._id, status: 'P' }]
      });
    } else {
      const existingEntryIndex = attendance.record.findIndex(
        (entry) => String(entry.studentId) === String(student._id)
      );

      if (existingEntryIndex === -1) {
        attendance.record.push({ studentId: student._id, status: 'P' });
      } else {
        attendance.record[existingEntryIndex].status = 'P';
      }

      await attendance.save();
    }

    const classDoc = await Class.findById(session.classId).select('name departmentId');

    emitAttendanceMarkedEvent({
      sessionId: String(session._id),
      classId: String(session.classId),
      subjectId: String(session.subjectId),
      lectureNo: session.lectureNo,
      studentId: String(student._id),
      studentUserId: String(req.user.id),
      studentName: student?.userId?.name || null,
      studentRollNo: student?.rollNo || null,
      departmentId: classDoc?.departmentId ? String(classDoc.departmentId) : null,
      className: classDoc?.name || null,
      markedAt: now.toISOString(),
      markedCount: session.markedStudents.length
    });

    return res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        sessionId: session._id,
        attendanceId: attendance._id,
        markedAt: now,
        distanceMeters: Number(distanceMeters.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Mark attendance from session error:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Attendance was already created for this class, subject, lecture, and date'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error marking attendance from session'
    });
  }
};

/**
 * End attendance session
 * @route POST /api/attendance/sessions/:sessionId/end
 */
export const endAttendanceSession = async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({
        success: false,
        message: 'Only faculty can end attendance sessions'
      });
    }

    const faculty = await getFacultyProfile(req.user.id);
    if (!faculty) {
      return res.status(403).json({
        success: false,
        message: 'Faculty profile not found for authenticated user'
      });
    }

    const session = await AttendanceSession.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Attendance session not found'
      });
    }

    const facultyPermission = await ensureFacultyCanManageSession(req, session.classId, session.subjectId);
    if (!facultyPermission.allowed) {
      return res.status(facultyPermission.status).json({
        success: false,
        message: facultyPermission.message
      });
    }

    if (String(session.startedByFacultyId) !== String(faculty._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only the faculty who started the session can end it'
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Session is already ${session.status}`
      });
    }

    session.status = 'ended';
    if (session.endTime.getTime() > Date.now()) {
      session.endTime = new Date();
    }
    await session.save();

    return res.status(200).json({
      success: true,
      message: 'Attendance session ended successfully',
      data: session
    });
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }

    console.error('End attendance session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error ending attendance session'
    });
  }
};
