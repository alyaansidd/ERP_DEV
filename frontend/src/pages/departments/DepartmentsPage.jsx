import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useList } from '../../hooks/useCrud'
import CrudPage from '../../components/ui/CrudPage'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Alert } from '../../components/ui/Misc'
import { departmentsApi, facultyApi } from '../../api/services'

function DeptForm({ data, onChange }) {
  return <Input label='Department Name' name='name' value={data.name} onChange={onChange} required />
}

const INITIAL_HOD_FORM = {
  facultyId: '',
  name: '',
  email: '',
  password: '',
  phoneNo: '',
  aadharNo: '',
  dob: '',
  employeeNo: '',
  designation: 'HOD',
  joiningDate: '',
}

export default function DepartmentsPage() {
  const { can } = useAuth()
  const qc = useQueryClient()

  const canAssignHod = can('departments', 'create')
  const { data: facultyRows = [] } = useList('faculty', facultyApi.getAll)

  const [hodModal, setHodModal] = useState(null)
  const [hodMode, setHodMode] = useState('existingFaculty')
  const [saveError, setSaveError] = useState('')
  const [hodForm, setHodForm] = useState(INITIAL_HOD_FORM)

  const assignHod = useMutation({
    mutationFn: (payload) => departmentsApi.assignHod(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] })
      qc.invalidateQueries({ queryKey: ['faculty'] })
      toast.success('HOD assigned successfully')
      setHodModal(null)
      setSaveError('')
      setHodForm(INITIAL_HOD_FORM)
    },
    onError: (e) => {
      const message = e.response?.data?.message || e.message || 'Failed to assign HOD'
      setSaveError(message)
      toast.error(message)
    }
  })

  const setField = (name, value) => setHodForm((p) => ({ ...p, [name]: value }))

  function openHodModal(department) {
    setHodModal(department)
    setHodMode('existingFaculty')
    setSaveError('')
    setHodForm(INITIAL_HOD_FORM)
  }

  async function submitHod() {
    if (!hodModal?._id) return

    let payload

    if (hodMode === 'existingFaculty') {
      if (!hodForm.facultyId) {
        setSaveError('Please select faculty')
        return
      }

      payload = {
        facultyId: hodForm.facultyId,
        departmentId: hodModal._id
      }
    } else {
      if (!hodForm.name || !hodForm.email || !hodForm.password || !hodForm.phoneNo || !hodForm.aadharNo || !hodForm.dob || !hodForm.employeeNo || !hodForm.joiningDate) {
        setSaveError('Please fill all required fields for new HOD')
        return
      }

      payload = {
        departmentId: hodModal._id,
        user: {
          name: hodForm.name,
          email: hodForm.email,
          password: hodForm.password,
          phoneNo: hodForm.phoneNo,
          aadharNo: hodForm.aadharNo,
          dob: hodForm.dob,
        },
        faculty: {
          employeeNo: hodForm.employeeNo,
          designation: hodForm.designation || 'HOD',
          joiningDate: hodForm.joiningDate,
        }
      }
    }

    await assignHod.mutateAsync(payload)
  }

  const facultyOptions = facultyRows
    .filter((f) => String(f.departmentId?._id || f.departmentId || '') === String(hodModal?._id || ''))
    .map((f) => ({
      value: f._id || f.id,
      label: `${f.userId?.name || 'Unknown'} (${f.employeeNo || 'No Employee No'})`
    }))

  return (
    <>
      <CrudPage
        title='Departments' icon='???' resource='departments' apiService={departmentsApi}
        columns={[
          { key: 'name', label: 'Name' },
          {
            key: 'hod',
            label: 'HOD',
            render: (v) => v?.userId?.name || v?.employeeNo || '—'
          },
          {
            key: 'hodAction',
            label: 'Manage HOD',
            render: (_, row) => canAssignHod ? (
              <Button variant='secondary' size='sm' onClick={() => openHodModal(row)}>
                Assign / Create HOD
              </Button>
            ) : '—'
          }
        ]}
        FormComponent={DeptForm}
        defaultValues={{}}
        canCreate={can('departments', 'create')}
        canEdit={can('departments', 'update')}
        canDelete={can('departments', 'delete')}
      />

      {hodModal && (
        <Modal
          title={`Manage HOD • ${hodModal.name || 'Department'}`}
          onClose={() => setHodModal(null)}
          maxWidth={700}
          footer={
            <>
              <Button variant='secondary' onClick={() => setHodModal(null)}>Cancel</Button>
              <Button loading={assignHod.isPending} onClick={submitHod}>Save</Button>
            </>
          }
        >
          <Alert type='error' message={saveError} />

          <Input
            label='Mode'
            name='hodMode'
            type='select'
            value={hodMode}
            onChange={(_, v) => { setHodMode(v); setSaveError('') }}
            options={[
              { value: 'existingFaculty', label: 'Make Existing Faculty HOD' },
              { value: 'newHod', label: 'Create New HOD (User + Faculty)' }
            ]}
          />

          {hodMode === 'existingFaculty' ? (
            <Input
              label='Faculty (same department)'
              name='facultyId'
              type='select'
              value={hodForm.facultyId}
              onChange={setField}
              options={facultyOptions}
              required
            />
          ) : (
            <>
              <div className='g2'>
                <Input label='Full Name' name='name' value={hodForm.name} onChange={setField} required />
                <Input label='Email' name='email' type='email' value={hodForm.email} onChange={setField} required />
              </div>
              <div className='g2'>
                <Input label='Password' name='password' type='password' value={hodForm.password} onChange={setField} required />
                <Input label='Phone No' name='phoneNo' value={hodForm.phoneNo} onChange={setField} required />
              </div>
              <div className='g2'>
                <Input label='Aadhar No' name='aadharNo' value={hodForm.aadharNo} onChange={setField} required />
                <Input label='Date of Birth' name='dob' type='date' value={hodForm.dob} onChange={setField} required />
              </div>
              <div className='g2'>
                <Input label='Employee No' name='employeeNo' value={hodForm.employeeNo} onChange={setField} required />
                <Input label='Joining Date' name='joiningDate' type='date' value={hodForm.joiningDate} onChange={setField} required />
              </div>
              <Input label='Designation' name='designation' value={hodForm.designation} onChange={setField} />
            </>
          )}
        </Modal>
      )}
    </>
  )
}
