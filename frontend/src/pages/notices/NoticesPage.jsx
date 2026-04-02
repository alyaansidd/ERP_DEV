import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useList, useCrud } from '../../hooks/useCrud'
import { noticesApi } from '../../api/services'
import { PageHeader, Empty, Spinner, Badge, Alert } from '../../components/ui/Misc'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import styles from './Notices.module.css'

function NoticeForm({ data, onChange, audienceOptions }) {
  return (
    <>
      <Input label='Title' name='title' value={data.title} onChange={onChange} required />
      <Input label='Description' name='description' type='textarea' value={data.description} onChange={onChange} />
      <Input
        label='Target Audience'
        name='targetRole'
        type='select'
        value={data.targetRole}
        onChange={onChange}
        options={audienceOptions}
      />
    </>
  )
}

export default function NoticesPage() {
  const { can, user } = useAuth()
  const { data: rows = [], isLoading } = useList('notices', noticesApi.getAll)
  const { create, update, remove } = useCrud('notices', noticesApi)

  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const audienceOptions = [
    { value: 'all', label: 'Everyone' },
    { value: 'student', label: 'Students' },
    { value: 'faculty', label: 'Faculty' },
    ...(user?.role === 'admin' ? [{ value: 'hod', label: 'HODs' }] : []),
  ]

  function getPostedById(postedBy) {
    if (!postedBy) return ''
    if (typeof postedBy === 'string') return postedBy
    return postedBy._id || postedBy.id || ''
  }

  function canEditNotice(notice) {
    if (!can('notices', 'update')) return false
    return String(getPostedById(notice?.postedBy)) === String(user?._id || user?.id || '')
  }

  function canDeleteNotice(notice) {
    if (!can('notices', 'delete')) return false
    return String(getPostedById(notice?.postedBy)) === String(user?._id || user?.id || '')
  }

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function openCreate() {
    setForm({ targetRole: 'all' })
    setSaveError('')
    setModal({ type: 'create' })
  }

  function openEdit(notice) {
    setForm({ ...notice })
    setSaveError('')
    setModal({ type: 'edit', item: notice })
  }

  function postedByLabel(postedBy) {
    if (!postedBy) return ''
    if (typeof postedBy === 'string') return postedBy
    return postedBy.name || postedBy.email || postedBy._id || ''
  }

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      if (modal.type === 'create') {
        await create.mutateAsync(form)
      } else {
        await update.mutateAsync({ id: modal.item._id || modal.item.id, body: form })
      }
      setModal(null)
    } catch (e) {
      setSaveError(e.response?.data?.message || e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title='Notices' subtitle='Institution-wide announcements'>
        {can('notices', 'create') && <Button onClick={openCreate}>Post Notice</Button>}
      </PageHeader>

      {isLoading ? <Spinner /> :
        rows.length === 0 ? <Empty icon='Notice' title='No notices posted yet' /> :
        rows.map((notice) => (
          <div key={notice._id || notice.id} className={styles.card}>
            <div className={styles.cardTop}>
              <h3 className={styles.title}>{notice.title}</h3>
              <div className={styles.cardActions}>
                {canEditNotice(notice) && (
                  <Button
                    variant='secondary'
                    size='sm'
                    className={styles.actionButton}
                    onClick={() => openEdit(notice)}
                  >
                    Edit
                  </Button>
                )}
                {canDeleteNotice(notice) && (
                  <Button
                    variant='danger'
                    size='sm'
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={() => remove.mutate(notice._id || notice.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
            <p className={styles.desc}>{notice.description}</p>
            <div className={styles.meta}>
              <Badge role={notice.targetRole || 'all'} />
              {notice.postedBy && <span className={styles.by}>By: {postedByLabel(notice.postedBy)}</span>}
              {notice.createdAt && <span className={styles.date}>{new Date(notice.createdAt).toLocaleDateString()}</span>}
            </div>
          </div>
        ))
      }

      {modal && (
        <Modal
          title={modal.type === 'create' ? 'Post Notice' : 'Edit Notice'}
          onClose={() => setModal(null)}
          footer={
            <>
              <Button variant='secondary' onClick={() => setModal(null)}>Cancel</Button>
              <Button loading={saving} onClick={handleSave}>Save</Button>
            </>
          }
        >
          <Alert type='error' message={saveError} />
          <NoticeForm data={form} onChange={setField} audienceOptions={audienceOptions} />
        </Modal>
      )}
    </>
  )
}
