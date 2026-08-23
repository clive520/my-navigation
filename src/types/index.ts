export interface Item {
  id: number
  name: string
  url: string
  description: string
  image_url: string
  sort_order: number
  created_at: string
  updated_at: string
  tags: Tag[]
}

export interface Tag {
  id: number
  name: string
}
