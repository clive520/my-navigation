import { useState, useEffect } from 'react'
import type { Item, Tag } from '../types'
import { Card } from '../components/Card'
import { SearchBar } from '../components/SearchBar'
import { TagFilter } from '../components/TagFilter'

export function Home() {
  const [items, setItems] = useState<Item[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [itemsRes, tagsRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/tags')
      ])
      const itemsData = await itemsRes.json()
      const tagsData = await tagsRes.json()
      setItems(itemsData)
      setTags(tagsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tagId: number) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase())

    const matchesTags = selectedTags.length === 0 ||
      selectedTags.some(tagId => item.tags?.some(t => t.id === tagId))

    return matchesSearch && matchesTags
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-xl text-gray-500">載入中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-12">
        {/* 標題區域 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 bg-clip-text text-transparent mb-4">
            My Navigation
          </h1>
          <p className="text-gray-600 text-lg">
            個人導覽網站，集中管理所有製作的網站連結
          </p>
        </div>

        {/* 搜尋列 */}
        <div className="mb-8">
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {/* 標籤篩選 */}
        <div className="mb-8">
          <TagFilter tags={tags} selectedTags={selectedTags} onToggle={toggleTag} />
        </div>

        {/* 項目列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <Card key={item.id} item={item} />
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            沒有找到符合的項目
          </div>
        )}
      </div>
    </div>
  )
}
