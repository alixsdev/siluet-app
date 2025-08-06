import Link from 'next/link'

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Créer', href: '/create' },
  { label: 'Importer', href: '/dressing' },
  { label: 'Dressing', href: '/dressing' },
  { label: 'Projets', href: '/projets' },
]

const icons: { [key: string]: string } = {
  Home: '🏠',
  Créer: '✏️',
  Importer: '⬆️',
  Dressing: '👕',
  Projets: '📁',
};

export default function Navbar() {
  return (
    <nav className="w-full bg-[#342b22] text-white flex justify-around py-3 fixed bottom-0 z-50">
      {navItems.map((item, i) => (
        <Link
          key={i}
          href={item.href}
          className="font-semibold hover:underline"
        >
          <div className="flex flex-col items-center text-sm">
            <span>{icons[item.label]}</span>
            {item.label}
          </div>
        </Link>
      ))}
    </nav>
  )
}