import { useState, useEffect } from 'react'
import { Home } from './pages/Home'
import { Admin } from './pages/Admin'

function App() {
  const [page, setPage] = useState<'home' | 'admin'>('home')

  useEffect(() => {
    const hash = window.location.hash
    if (hash === '#admin') {
      setPage('admin')
    }

    const handleHashChange = () => {
      const newHash = window.location.hash
      if (newHash === '#admin') {
        setPage('admin')
      } else {
        setPage('home')
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return (
    <>
      {page === 'home' && <Home />}
      {page === 'admin' && <Admin />}

      {/* 導覽列 */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg px-6 py-3 flex gap-4">
        <button
          onClick={() => {
            window.location.hash = ''
            setPage('home')
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
    </>
  )
}

export default App
