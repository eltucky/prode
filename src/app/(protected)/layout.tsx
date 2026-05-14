import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/navbar'

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
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
