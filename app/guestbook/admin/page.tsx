import { genPageMetadata } from 'app/seo'
import GuestbookAdmin from '@/components/guestbook/GuestbookAdmin'

export const metadata = genPageMetadata({
  title: '留言管理',
  robots: { index: false, follow: false },
})

export default function AdminPage() {
  return <GuestbookAdmin />
}
