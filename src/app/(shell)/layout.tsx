import { auth } from '@/auth'
import Navbar from '@/components/navbar'
import BottomNav from '@/components/bottom-nav'

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 pb-20 md:pb-8">{children}</main>
      {session?.user && (
        <BottomNav isSuperAdmin={session.user.isSuperAdmin ?? false} />
      )}
    </div>
  )
}
