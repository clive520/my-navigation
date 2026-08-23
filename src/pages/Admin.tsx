import { useState, useEffect, useRef } from 'react'
import type { Item, Tag } from '../types'

export function Admin() {
  const [isLogin, setIsLogin] = useState(false)
  const [password, setPassword] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [editingItem, setEditingItem] = useState<Partial<Item> | null>(null)
  const [message, setMessage] = useState('')
  const editFormRef = useRef<HTMLDivElement>(null)

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
    const [itemsRes, tagsRes] = await Promise.all([
      fetch('/api/items'),
      fetch('/api/tags')
    ])
    setItems(await itemsRes.json())
    setTags(await tagsRes.json())
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/items', {
        headers: { Authorization: `Bearer ${password}` }
      })
      if (res.ok) {
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

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${password}`
        },
        body: JSON.stringify(editingItem)
      })

      if (res.ok) {
        setEditingItem(null)
        fetchData()
        setMessage(editingItem.id ? '更新成功' : '新增成功')
      }
    } catch {
      setMessage('操作失敗')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此項目嗎？')) return

    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${password}` }
      })

      if (res.ok) {
        fetchData()
        setMessage('刪除成功')
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

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${password}` },
        body: formData
      })

      if (res.ok) {
        const { url } = await res.json()
        setEditingItem(prev => prev ? { ...prev, image_url: url } : null)
      }
    } catch {
      setMessage('上傳失敗')
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
          <button
            onClick={() => setEditingItem({})}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90"
          >
            新增項目
          </button>
        </div>

        {message && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
            {message}
          </div>
        )}

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
                placeholder="簡短描述"
                value={editingItem.description || ''}
                onChange={(e) => setEditingItem(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-200"
                rows={3}
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
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map(item => (
                <tr key={item.id}>
                  <td className="px-6 py-4">{item.name}</td>
                  <td className="px-6 py-4">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                      {item.url}
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {item.tags?.map(tag => (
                        <span key={tag.id} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                          {tag.name}
                        </span>
                      ))}
                    </div>
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
      </div>
    </div>
  )
}
