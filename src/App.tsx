import { useState, useEffect } from 'react'
import { Home } from './pages/Home'
import { Admin } from './pages/Admin'
import { Detail } from './pages/Detail'

type Page = 'home' | 'admin' | 'detail'

function App() {
  const [page, setPage] = useState<Page>('home')
  const [detailItemId, setDetailItemId] = useState<number | null>(null)

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash === '#admin') {
        setPage('admin')
        setDetailItemId(null)
      } else if (hash.startsWith('#item/')) {
        const id = parseInt(hash.replace('#item/', ''))
        if (!isNaN(id)) {
          setDetailItemId(id)
          setPage('detail')
        }
      } else {
        setPage('home')
        setDetailItemId(null)
      }
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const goToHome = () => {
    window.location.hash = ''
  }

  return (
    <>
      {page === 'home' && <Home />}
      {page === 'admin' && <Admin />}
      {page === 'detail' && detailItemId && (
        <Detail itemId={detailItemId} onBack={goToHome} />
      )}

      {/* 導覽列 - detail 頁面不顯示 */}
      {page !== 'detail' && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg px-6 py-3 flex gap-4 z-50">
          <button
            onClick={() => {
              window.location.hash = ''
              setPage('home')
              setDetailItemId(null)
            }}
            className={`px-4 py-2 rounded-full transition-all ${
              page === 'home'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            首頁
          </button>
          <button
            onClick={() => {
              window.location.hash = 'admin'
              setPage('admin')
              setDetailItemId(null)
            }}
            className={`px-4 py-2 rounded-full transition-all ${
              page === 'admin'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            管理
          </button>
        </nav>
      )}
    </>
  )
}

export default App
