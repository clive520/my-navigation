import type { Item } from '../types'

interface CardProps {
  item: Item
}

export function Card({ item }: CardProps) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      {item.image_url && (
        <div className="mb-4 overflow-hidden rounded-xl">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
        {item.name}
      </h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {item.description}
      </p>
      <div className="flex flex-wrap gap-2">
        {item.tags?.map((tag) => (
          <span
            key={tag.id}
            className="px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
          >
            {tag.name}
          </span>
        ))}
      </div>
    </a>
  )
}
