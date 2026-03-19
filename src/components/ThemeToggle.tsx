import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../stores/theme'

const ThemeToggle = () => {
  const { dark, toggle } = useThemeStore()

  return (
    <button
      onClick={toggle}
      className="w-10 h-10 rounded-2xl transition-colors duration-200 cursor-pointer flex items-center justify-center"
      aria-label="Переключить тему"
      style={{
        color: 'var(--text-muted)',
        background: 'transparent',
      }}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

export default ThemeToggle