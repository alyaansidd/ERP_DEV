import { useEffect, useState } from 'react'
import { studentsApi } from '../../api/services'
import { PageHeader, Card, CardHeader, Empty, Spinner } from '../../components/ui/Misc'
import styles from './AcademicDetails.module.css'

export default function AcademicDetailsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    studentsApi.getMyDashboard()
      .then(({ data: response }) => {
        setData(response?.data || response || null)
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const student = data?.student
  const assignedCourses = data?.assignedCourses || []

  return (
    <>
      <PageHeader
        title='Academic Details'
        subtitle='Your academic profile, class details, coordinator, and assigned courses'
      />

      {loading ? (
        <Spinner />
      ) : !student ? (
        <Card>
          <Empty title='Academic details unavailable' subtitle='Your student record could not be loaded.' />
        </Card>
      ) : (
        <>
          <div className={styles.grid}>
            <Card>
              <CardHeader title='Student Information' />
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}><span>Name</span><strong>{student.name || 'N/A'}</strong></div>
                <div className={styles.infoItem}><span>Roll No</span><strong>{student.rollNo || 'N/A'}</strong></div>
                <div className={styles.infoItem}><span>Academic Year</span><strong>{student.academicYear || 'N/A'}</strong></div>
                <div className={styles.infoItem}><span>Department</span><strong>{student.department?.name || 'N/A'}</strong></div>
                <div className={styles.infoItem}><span>Program</span><strong>{student.program?.name || 'N/A'}</strong></div>
                <div className={styles.infoItem}><span>Class</span><strong>{student.class?.name || 'N/A'}</strong></div>
                <div className={styles.infoItem}><span>Semester</span><strong>{student.class?.semester || student.program?.semester || 'N/A'}</strong></div>
                <div className={styles.infoItem}><span>Room No</span><strong>{student.class?.roomNo || 'N/A'}</strong></div>
              </div>
            </Card>

            <Card>
              <CardHeader title='Coordinator Faculty' />
              {student.coordinator ? (
                <div className={styles.facultyCard}>
                  <div className={styles.facultyName}>{student.coordinator.name || 'N/A'}</div>
                  <div className={styles.facultyMeta}>Employee No: {student.coordinator.employeeNo || 'N/A'}</div>
                  <div className={styles.facultyMeta}>Designation: {student.coordinator.designation || 'N/A'}</div>
                </div>
              ) : (
                <Empty title='No coordinator assigned' subtitle='Class coordinator is not mapped yet.' />
              )}
            </Card>
          </div>

          <Card>
            <CardHeader title='Assigned Courses With Faculty' />
            {assignedCourses.length === 0 ? (
              <Empty title='No courses assigned' subtitle='Your class timetable does not have mapped subjects yet.' />
            ) : (
              <div className={styles.courseList}>
                {assignedCourses.map((course, index) => (
                  <div key={`${course.subject?.id || index}-${course.faculty?.id || 'none'}`} className={styles.courseRow}>
                    <div>
                      <div className={styles.courseTitle}>{course.subject?.name || 'N/A'}</div>
                      <div className={styles.courseMeta}>
                        {course.subject?.subjectCode || 'N/A'} · Credits: {course.subject?.credit || 'N/A'}
                      </div>
                    </div>
                    <div className={styles.courseFaculty}>{course.faculty?.name || 'Faculty not assigned'}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </>
  )
}
