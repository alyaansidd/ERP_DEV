import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useList, useCrud } from '../../hooks/useCrud'
import { noticesApi } from '../../api/services'
import { PageHeader, Empty, Spinner, Badge, Alert } from '../../components/ui/Misc'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import styles from './Notices.module.css'

function NoticeForm({ data, onChange }) {
  return (
    <>
      <Input label='Title' name='title' value={data.title} onChange={onChange} required />
      <Input label='Description' name='description' type='textarea' value={data.description} onChange={onChange} />
      <Input
        label='Target Audience' name='targetRole' type='select' value={data.targetRole} onChange={onChange}
        options={[{ value: 'all', label: 'Everyone' }, { value: 'student', label: 'Students' }, { value: 'faculty', label: 'Faculty' }]}
      />
    </>
  )
}

export default function NoticesPage() {
  const { can } = useAuth()
  const { data: rows = [], isLoading } = useList('notices', noticesApi.getAll)
  const { create, update, remove } = useCrud('notices', noticesApi)

  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  function setField(n, v) { setForm((p) => ({ ...p, [n]: v })) }
  function openCreate() { setForm({ targetRole: 'all' }); setSaveError(''); setModal({ type: 'create' }) }
  function openEdit(n) { setForm({ ...n }); setSaveError(''); setModal({ type: 'edit', item: n }) }
  function postedByLabel(postedBy) {
    if (!postedBy) return ''
    if (typeof postedBy === 'string') return postedBy
    return postedBy.name || postedBy.email || postedBy._id || ''
  }

  async function handleSave() {
    setSaving(true); setSaveError('')
    try {
      if (modal.type === 'create') await create.mutateAsync(form)
      else await update.mutateAsync({ id: modal.item._id || modal.item.id, body: form })
      setModal(null)
    } catch (e) { setSaveError(e.response?.data?.message || e.message) }
    finally { setSaving(false) }
  }

  return (
    <>
      <PageHeader title='📢 Notices' subtitle='Institution-wide announcements'>
        {can('notices', 'create') && <Button onClick={openCreate}>+ Post Notice</Button>}
      </PageHeader>

      {isLoading ? <Spinner /> :
        rows.length === 0 ? <Empty icon='📢' title='No notices posted yet' /> :
        rows.map((n) => (
          <div key={n._id || n.id} className={styles.card}>
            <div className={styles.cardTop}>
              <h3 className={styles.title}>{n.title}</h3>
              <div className={styles.cardActions}>
                {can('notices', 'update') && <Button variant='secondary' size='sm' onClick={() => openEdit(n)}>✏️ Edit</Button>}
                {can('notices', 'delete') && (
                  <Button variant='danger' size='sm' onClick={() => remove.mutate(n._id || n.id)}>🗑️</Button>
                )}
              </div>
            </div>
            <p className={styles.desc}>{n.description}</p>
            <div className={styles.meta}>
              <Badge role={n.targetRole || 'all'} />
              {n.postedBy && <span className={styles.by}>By: {postedByLabel(n.postedBy)}</span>}
              {n.createdAt && <span className={styles.date}>{new Date(n.createdAt).toLocaleDateString()}</span>}
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
          <NoticeForm data={form} onChange={setField} />
        </Modal>
      )}
    </>
  )
}
