import { useState, useEffect } from 'react'
import type { Item } from '../types'

interface DetailProps {
  itemId: number
  onBack: () => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getFileIcon(type: string): string {
  const icons: Record<string, string> = {
    txt: '📝',
    md: '📄',
    png: '🖼️',
    jpg: '🖼️',
    jpeg: '🖼️',
    gif: '🖼️',
    pdf: '📕',
  }
  return icons[type] || '📎'
}

export function Detail({ itemId, onBack }: DetailProps) {
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchItem()
  }, [itemId])

  const fetchItem = async () => {
    try {
      const res = await fetch(`/api/items/${itemId}`)
      if (res.ok) {
        setItem(await res.json())
      }
    } catch (error) {
      console.error('Failed to fetch item:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-xl text-gray-500">載入中...</div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-center">
          <p className="text-xl text-gray-500 mb-4">找不到此項目</p>
          <button onClick={onBack} className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg">
            返回首頁
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* 返回按鈕 */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
        >
          <span>←</span>
          <span>返回首頁</span>
        </button>

        {/* 主要內容卡片 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
          {/* 圖片 */}
          {item.image_url && (
            <div className="w-full h-64 overflow-hidden">
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-8">
            {/* 標題與標籤 */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-3">{item.name}</h1>
              <div className="flex flex-wrap gap-2">
                {item.tags?.map(tag => (
                  <span key={tag.id} className="px-3 py-1 text-sm font-medium rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>

            {/* 說明 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">網站說明</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{item.description || '暫無說明'}</p>
            </div>

            {/* 附加檔案 */}
            {item.files && item.files.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-700 mb-3">附加檔案</h2>
                <div className="space-y-2">
                  {item.files.map(file => (
                    <a
                      key={file.id}
                      href={`/api/images/${file.file_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-2xl">{getFileIcon(file.file_type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 font-medium truncate">{file.original_name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(file.file_size)}</p>
                      </div>
                      <span className="text-purple-500 text-sm">下載</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 前往網站按鈕 */}
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              前往網站 →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
