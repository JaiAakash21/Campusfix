import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import { apiGet, apiPost, apiPatch, apiDelete } from '../../utils/api'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [showModal, setShowModal]   = useState(false)
  const [editTarget, setEditTarget] = useState(null) // null = create, obj = edit
  const [form, setForm]             = useState({ name: '', description: '' })
  const [saving, setSaving]         = useState(false)
  const [formError, setFormError]   = useState('')

  async function loadCategories() {
    setLoading(true)
    const res = await apiGet('/backend/api/categories/list.php')
    if (res?.ok) {
      const d = await res.json()
      setCategories(d.categories ?? [])
    } else {
      setError('Failed to load categories.')
    }
    setLoading(false)
  }

  useEffect(() => { loadCategories() }, [])

  function openCreate() {
    setEditTarget(null)
    setForm({ name: '', description: '' })
    setFormError('')
    setShowModal(true)
  }

  function openEdit(cat) {
    setEditTarget(cat)
    setForm({ name: cat.name, description: cat.description ?? '' })
    setFormError('')
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setFormError('')

    let res
    if (editTarget) {
      res = await apiPatch('/backend/api/categories/update.php', { id: editTarget.id, ...form })
    } else {
      res = await apiPost('/backend/api/categories/create.php', form)
    }

    if (res?.ok) {
      setShowModal(false)
      loadCategories()
    } else {
      const d = await res?.json()
      setFormError(d?.error ?? 'Failed to save category.')
    }
    setSaving(false)
  }

  async function handleDelete(cat) {
    if (!window.confirm(`Delete category "${cat.name}"? This will fail if any tickets use it.`)) return
    const res = await apiDelete('/backend/api/categories/delete.php?id=' + cat.id)
    if (res?.ok) {
      loadCategories()
    } else {
      const d = await res?.json()
      setError(d?.error ?? 'Failed to delete category.')
    }
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">Categories</h4>
          <button className="btn btn-sm btn-primary" onClick={openCreate}>+ Add Category</button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <div className="text-center mt-4"><div className="spinner-border" /></div>
        ) : categories.length === 0 ? (
          <p className="text-muted">No categories yet.</p>
        ) : (
          <table className="table table-hover">
            <thead className="table-light">
              <tr><th>Name</th><th>Description</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td className="text-muted">{c.description ?? '—'}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => openEdit(c)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <>
          <div className="modal d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{editTarget ? 'Edit Category' : 'New Category'}</h5>
                  <button className="btn-close" onClick={() => setShowModal(false)} />
                </div>
                <form onSubmit={handleSave}>
                  <div className="modal-body">
                    {formError && <div className="alert alert-danger">{formError}</div>}
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input className="form-control" required value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description (optional)</label>
                      <textarea className="form-control" rows={2} value={form.description}
                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => setShowModal(false)} />
        </>
      )}
    </>
  )
}
