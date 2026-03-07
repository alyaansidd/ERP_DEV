import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

// Generic list hook
export function useList(key, apiFn) {
  return useQuery({
    queryKey: [key],
    queryFn: async () => {
      const { data } = await apiFn()
      // Normalise — backend may return { students: [...] } or [...]
      if (Array.isArray(data)) return data
      const arr = Object.values(data).find(Array.isArray)
      return arr ?? []
    },
  })
}

// Generic create/update/delete mutations
export function useCrud(key, api) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: [key] })

  const create = useMutation({
    mutationFn: (body) => api.create(body),
    onSuccess: () => { invalidate(); toast.success('Created successfully') },
    onError: (e) => toast.error(e.response?.data?.message || 'Create failed'),
  })

  const update = useMutation({
    mutationFn: ({ id, body }) => api.update(id, body),
    onSuccess: () => { invalidate(); toast.success('Updated successfully') },
    onError: (e) => toast.error(e.response?.data?.message || 'Update failed'),
  })

  const remove = useMutation({
    mutationFn: (id) => api.remove(id),
    onSuccess: () => { invalidate(); toast.success('Deleted successfully') },
    onError: (e) => toast.error(e.response?.data?.message || 'Delete failed'),
  })

  return { create, update, remove }
}
