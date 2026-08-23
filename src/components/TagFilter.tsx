import type { Tag } from '../types'

interface TagFilterProps {
  tags: Tag[]
  selectedTags: number[]
  onToggle: (tagId: number) => void
}

export function TagFilter({ tags, selectedTags, onToggle }: TagFilterProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {tags.map((tag) => (
        <button
          key={tag.id}
          onClick={() => onToggle(tag.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            selectedTags.includes(tag.id)
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'bg-white/80 text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          {tag.name}
        </button>
      ))}
    </div>
  )
}
