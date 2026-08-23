import { useState, useEffect, useRef } from 'react'
import type { Item, Tag, ItemFile, FileType } from '../types'

function getAuthHeaders(password: string): Record<string, string> {
  return { Authorization: `Bearer ${password}` }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

type Tab = 'items' | 'file-types'

export function Admin() {
  const [isLogin, setIsLogin] = useState(() => !!sessionStorage.getItem('admin_token'))
  const [password, setPassword] = useState(() => sessionStorage.getItem('admin_token') || '')
  const [items, setItems] = useState<Item[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [editingItem, setEditingItem] = useState<Partial<Item> | null>(null)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('items')
  const [fileTypes, setFileTypes] = useState<FileType[]>([])
  const [newFileType, setNewFileType] = useState({ extension: '', mime_type: '', label: '' })
  const [uploadingFile, setUploadingFile] = useState<number | null>(null)
  const editFormRef = useRef<HTMLDivElement>(null)
  const passwordRef = useRef(password)

  useEffect(() => {
    passwordRef.current = password
  }, [password])

  useEffect(() => {
    if (isLogin) {
      fetchData()
    }
  }, [isLogin])

  useEffect(() => {
    if (editingItem && editFormRef.current) {
      editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [editingItem])

  const fetchData = async () => {
    const [itemsRes, tagsRes, fileTypesRes] = await Promise.all([
      fetch('/api/items'),
      fetch('/api/tags'),
      fetch('/api/file-types')
    ])
    setItems(await itemsRes.json())
    setTags(await tagsRes.json())
    setFileTypes(await fileTypesRes.json())
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: getAuthHeaders(password)
      })
      if (res.ok) {
        sessionStorage.setItem('admin_token', password)
        passwordRef.current = password
        setIsLogin(true)
        setMessage('')
      } else {
        setMessage('密碼錯誤')
      }
    } catch {
      setMessage('登入失敗')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    const method = editingItem.id ? 'PUT' : 'POST'
    const url = editingItem.id ? `/api/items/${editingItem.id}` : '/api/items'
    const token = passwordRef.current

    try {
      const tagIds = editingItem.tags?.map(t => t.id) || []
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...getAuthHeaders(token)
        },
        body: JSON.stringify({ ...editingItem, tags: tagIds })
      })

      if (res.ok) {
        setEditingItem(null)
        fetchData()
        setMessage(editingItem.id ? '更新成功' : '新增成功')
      } else {
        setMessage('操作失敗：' + res.status)
      }
    } catch {
      setMessage('操作失敗')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此項目嗎？')) return
    const token = passwordRef.current

    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token)
      })

      if (res.ok) {
        fetchData()
        setMessage('刪除成功')
      } else {
        setMessage('刪除失敗：' + res.status)
      }
    } catch {
      setMessage('刪除失敗')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    const token = passwordRef.current

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: formData
      })

      if (res.ok) {
        const { url } = await res.json()
        setEditingItem(prev => prev ? { ...prev, image_url: url } : null)
      } else {
        setMessage('上傳失敗：' + res.status)
      }
    } catch {
      setMessage('上傳失敗')
    }
  }

  const handleFileUpload = async (itemId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFile(itemId)
    const formData = new FormData()
    formData.append('file', file)
    const token = passwordRef.current

    try {
      const res = await fetch(`/api/items/${itemId}/files`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: formData
      })

      if (res.ok) {
        fetchData()
        setMessage('檔案上傳成功')
      } else {
        const err = await res.json()
        setMessage('上傳失敗：' + (err.error || res.status))
      }
    } catch {
      setMessage('上傳失敗')
    } finally {
      setUploadingFile(null)
    }
  }

  const handleFileDelete = async (itemId: number, fileId: number) => {
    if (!confirm('確定要刪除此檔案嗎？')) return
    const token = passwordRef.current

    try {
      const res = await fetch(`/api/items/${itemId}/files/${fileId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token)
      })

      if (res.ok) {
        fetchData()
        setMessage('檔案已刪除')
      } else {
        setMessage('刪除失敗：' + res.status)
      }
    } catch {
      setMessage('刪除失敗')
    }
  }

  const handleAddFileType = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = passwordRef.current

    try {
      const res = await fetch('/api/file-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...getAuthHeaders(token)
        },
        body: JSON.stringify(newFileType)
      })

      if (res.ok) {
        setNewFileType({ extension: '', mime_type: '', label: '' })
        fetchData()
        setMessage('檔案類型已新增')
      } else {
        setMessage('新增失敗：' + res.status)
      }
    } catch {
      setMessage('新增失敗')
    }
  }

  const handleToggleFileType = async (ft: FileType) => {
    const token = passwordRef.current

    try {
      const res = await fetch(`/api/file-types/${ft.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...getAuthHeaders(token)
        },
        body: JSON.stringify({ label: ft.label, enabled: !ft.enabled })
      })

      if (res.ok) {
        fetchData()
      }
    } catch {
      setMessage('操作失敗')
    }
  }

  const handleDeleteFileType = async (id: number) => {
    if (!confirm('確定要刪除此檔案類型嗎？')) return
    const token = passwordRef.current

    try {
      const res = await fetch(`/api/file-types/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token)
      })

      if (res.ok) {
        fetchData()
        setMessage('檔案類型已刪除')
      } else {
        setMessage('刪除失敗：' + res.status)
      }
    } catch {
      setMessage('刪除失敗')
    }
  }

  if (!isLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <form onSubmit={handleLogin} className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold mb-6 text-center">管理後台登入</h2>
          <input
            type="password"
            placeholder="請輸入密碼"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 mb-4 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
          />
          {message && <p className="text-red-500 text-sm mb-4">{message}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            登入
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">管理後台</h2>
          <div className="flex gap-4">
            <button
              onClick={() => { sessionStorage.removeItem('admin_token'); setIsLogin(false); setPassword('') }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              登出
            </button>
            {activeTab === 'items' && (
              <button
                onClick={() => setEditingItem({})}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90"
              >
                新增項目
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'items'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            網站管理
          </button>
          <button
            onClick={() => setActiveTab('file-types')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'file-types'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            檔案類型管理
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg ${message.includes('失敗') || message.includes('錯誤') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        {/* ========== Items Tab ========== */}
        {activeTab === 'items' && (
          <>
            {editingItem && (
              <div ref={editFormRef} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl mb-8">
                <h3 className="text-xl font-bold mb-4">
                  {editingItem.id ? '編輯項目' : '新增項目'}
                </h3>
                <form onSubmit={handleSave} className="space-y-4">
                  <input
                    type="text"
                    placeholder="網站名稱"
                    value={editingItem.name || ''}
                    onChange={(e) => setEditingItem(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200"
                    required
                  />
                  <input
                    type="url"
                    placeholder="網站連結"
                    value={editingItem.url || ''}
                    onChange={(e) => setEditingItem(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200"
                    required
                  />
                  <textarea
                    placeholder="網站說明（支援換行）"
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200"
                    rows={6}
                  />
                  <div>
                    <label className="block text-sm font-medium mb-2">截圖</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full"
                    />
                    {editingItem.image_url && (
                      <img src={editingItem.image_url} alt="Preview" className="mt-2 h-32 object-cover rounded-lg" />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">標籤</label>
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <label key={tag.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editingItem.tags?.some(t => t.id === tag.id) || false}
                            onChange={(e) => {
                              const currentTags = editingItem.tags || []
                              if (e.target.checked) {
                                setEditingItem(prev => ({
                                  ...prev,
                                  tags: [...currentTags, tag]
                                }))
                              } else {
                                setEditingItem(prev => ({
                                  ...prev,
                                  tags: currentTags.filter(t => t.id !== tag.id)
                                }))
                              }
                            }}
                          />
                          {tag.name}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg"
                    >
                      儲存
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingItem(null)}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg"
                    >
                      取消
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">名稱</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">連結</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">標籤</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">檔案</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 font-medium">{item.name}</td>
                      <td className="px-6 py-4">
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline text-sm">
                          {item.url.length > 30 ? item.url.slice(0, 30) + '...' : item.url}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1 flex-wrap">
                          {item.tags?.map(tag => (
                            <span key={tag.id} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">{item.files?.length || 0} 個檔案</span>
                          <label className="text-xs text-purple-600 hover:text-purple-800 cursor-pointer">
                            + 上傳
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => handleFileUpload(item.id, e)}
                              disabled={uploadingFile === item.id}
                            />
                          </label>
                        </div>
                        {item.files && item.files.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {item.files.map(file => (
                              <div key={file.id} className="flex items-center gap-2 text-xs">
                                <span className="truncate max-w-[120px]">{file.original_name}</span>
                                <span className="text-gray-400">{formatFileSize(file.file_size)}</span>
                                <button
                                  onClick={() => handleFileDelete(item.id, file.id)}
                                  className="text-red-400 hover:text-red-600"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="text-purple-600 hover:text-purple-800 mr-4"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          刪除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ========== File Types Tab ========== */}
        {activeTab === 'file-types' && (
          <>
            {/* 新增表單 */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl mb-8">
              <h3 className="text-xl font-bold mb-4">新增檔案類型</h3>
              <form onSubmit={handleAddFileType} className="flex gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-1">副檔名</label>
                  <input
                    type="text"
                    placeholder="csv"
                    value={newFileType.extension}
                    onChange={(e) => setNewFileType(prev => ({ ...prev, extension: e.target.value }))}
                    className="px-4 py-2 rounded-lg border border-gray-200 w-28"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">MIME 類型</label>
                  <input
                    type="text"
                    placeholder="text/csv"
                    value={newFileType.mime_type}
                    onChange={(e) => setNewFileType(prev => ({ ...prev, mime_type: e.target.value }))}
                    className="px-4 py-2 rounded-lg border border-gray-200 w-48"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">顯示名稱</label>
                  <input
                    type="text"
                    placeholder="CSV 檔案"
                    value={newFileType.label}
                    onChange={(e) => setNewFileType(prev => ({ ...prev, label: e.target.value }))}
                    className="px-4 py-2 rounded-lg border border-gray-200 w-40"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg"
                >
                  新增
                </button>
              </form>
            </div>

            {/* 檔案類型列表 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">副檔名</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">MIME 類型</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">顯示名稱</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">狀態</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {fileTypes.map(ft => (
                    <tr key={ft.id}>
                      <td className="px-6 py-4 font-mono">.{ft.extension}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{ft.mime_type}</td>
                      <td className="px-6 py-4">{ft.label}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleFileType(ft)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            ft.enabled
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {ft.enabled ? '啟用' : '停用'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteFileType(ft.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          刪除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
