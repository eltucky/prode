import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/navbar'
import BottomNav from '@/components/bottom-nav'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 pb-20 md:pb-8">{children}</main>
      <BottomNav isSuperAdmin={session.user.isSuperAdmin ?? false} />
    </div>
  )
}
