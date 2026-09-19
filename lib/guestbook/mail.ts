import nodemailer from 'nodemailer'
import siteMetadata from '@/data/siteMetadata'
import type { AdminMessage } from './model'

export async function notifyOwner(message: AdminMessage) {
  const user = process.env.GUESTBOOK_GMAIL_USER
  const pass = process.env.GUESTBOOK_GMAIL_APP_PASSWORD
  if (!user || !pass) return false
  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  })
  try {
    await transport.sendMail({
      from: { name: 'SHUANTT Guestbook', address: user },
      to: siteMetadata.email,
      replyTo: message.email ? { address: message.email } : undefined,
      subject: `[SHUANTT] ${message.visibility === 'private' ? '私密訊息' : '公開留言待審核'}`,
      text: [
        `稱呼：${message.name}`,
        message.website ? `網站：${message.website}` : '',
        `公開方式：${message.visibility === 'private' ? '只傳給 Shuan' : '審核後公開'}`,
        message.source ? `文章：${siteMetadata.siteUrl}${message.source}` : '',
        '',
        message.message,
        '',
        `管理留言：${siteMetadata.siteUrl}/guestbook/admin`,
      ].join('\n'),
      disableFileAccess: true,
      disableUrlAccess: true,
    })
    return true
  } catch {
    return false
  } finally {
    transport.close()
  }
}
