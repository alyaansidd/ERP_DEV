import { useState } from 'react'
import { useList, useCrud } from '../../hooks/useCrud'
import { PageHeader, Empty, Spinner, Alert } from '../../components/ui/Misc'
import DataTable from '../../components/ui/DataTable'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'

export default function CrudPage({
  title, icon, resource, apiService,
  columns, FormComponent, defaultValues,
  canCreate, canEdit, canDelete,
}) {
  const { data: rows = [], isLoading, error } = useList(resource, apiService.getAll)
  const { create, update, remove } = useCrud(resource, apiService)

  const [modal, setModal] = useState(null)   // { type: 'create'|'edit'|'delete', item? }
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  function openCreate() { setForm({ ...defaultValues }); setSaveError(''); setModal({ type: 'create' }) }
  function openEdit(item) { setForm({ ...item }); setSaveError(''); setModal({ type: 'edit', item }) }
  function openDelete(item) { setModal({ type: 'delete', item }) }
  function closeModal() { setModal(null) }

  function setField(name, value) { setForm((p) => ({ ...p, [name]: value })) }

  async function handleSave() {
    setSaving(true); setSaveError('')
    try {
      if (modal.type === 'create') {
        await create.mutateAsync(form)
      } else {
        const id = modal.item._id || modal.item.id
        await update.mutateAsync({ id, body: form })
      }
      closeModal()
    } catch (e) {
      setSaveError(e.response?.data?.message || e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    const id = modal.item._id || modal.item.id
    await remove.mutateAsync(id)
    closeModal()
  }

  const isFormModal = modal?.type === 'create' || modal?.type === 'edit'

  return (
    <>
      <PageHeader title={`${icon} ${title}`} subtitle={`Manage ${title.toLowerCase()}`}>
        {canCreate && <Button onClick={openCreate}>+ New</Button>}
      </PageHeader>

      {error && <Alert type='error' message={error.message} />}

      {isLoading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Empty
          icon={icon}
          title={`No ${title.toLowerCase()} yet`}
          action={canCreate && <Button onClick={openCreate}>+ Add First</Button>}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={openEdit}
          onDelete={openDelete}
        />
      )}

      {/* Create / Edit Modal */}
      {isFormModal && (
        <Modal
          title={modal.type === 'create' ? `New ${title.replace(/s$/, '')}` : `Edit ${title.replace(/s$/, '')}`}
          onClose={closeModal}
          footer={
            <>
              <Button variant='secondary' onClick={closeModal}>Cancel</Button>
              <Button loading={saving} onClick={handleSave}>Save</Button>
            </>
          }
        >
          <Alert type='error' message={saveError} />
          <FormComponent data={form} onChange={setField} />
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {modal?.type === 'delete' && (
        <Modal
          title='Confirm Delete'
          onClose={closeModal}
          footer={
            <>
              <Button variant='secondary' onClick={closeModal}>Cancel</Button>
              <Button variant='danger' loading={remove.isPending} onClick={handleDelete}>Delete</Button>
            </>
          }
        >
          <p style={{ color: 'var(--tx)', lineHeight: 1.8 }}>
            Are you sure you want to delete{' '}
            <strong>{modal.item?.name || modal.item?.title || modal.item?.year || 'this item'}</strong>?
            This action cannot be undone.
          </p>
        </Modal>
      )}
    </>
  )
}
