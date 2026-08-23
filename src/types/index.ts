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
  files?: ItemFile[]
}

export interface Tag {
  id: number
  name: string
}

export interface ItemFile {
  id: number
  item_id: number
  file_name: string
  original_name: string
  file_type: string
  file_size: number
  created_at: string
}

export interface FileType {
  id: number
  extension: string
  mime_type: string
  label: string
  enabled: boolean
}
