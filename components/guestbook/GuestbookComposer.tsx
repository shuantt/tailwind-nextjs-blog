'use client'

import { Dialog } from '@headlessui/react'
import { ReactNode, useRef, useState, useSyncExternalStore } from 'react'
import { outlineButtonClass } from './styles'

const desktopQuery = '(min-width: 1024px)'
function subscribe(callback: () => void) {
  const query = window.matchMedia(desktopQuery)
  query.addEventListener('change', callback)
  return () => query.removeEventListener('change', callback)
}
const desktopSnapshot = () => window.matchMedia(desktopQuery).matches
const serverSnapshot = () => false

export default function GuestbookComposer({
  busy,
  children,
}: {
  busy: boolean
  children: (active: boolean) => ReactNode
}) {
  const desktop = useSyncExternalStore(subscribe, desktopSnapshot, serverSnapshot)
  const [open, setOpen] = useState(false)
  const title = useRef<HTMLHeadingElement>(null)

  if (desktop) {
    return (
      <aside
        aria-labelledby="composer-heading"
        className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950"
      >
        <h2 id="composer-heading" className="text-lg font-bold">
          留下想和我說的話
        </h2>
        <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-400">
          歡迎留下網址讓我有機會回訪 :)
        </p>
        {children(true)}
      </aside>
    )
  }

  return (
    <>
      <div className="order-first lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className={`${outlineButtonClass} w-full gap-2 sm:w-auto`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-5 w-5"
          >
            <path
              d="M7 9h10M7 13h6M5 3h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9l-6 3V5a2 2 0 0 1 2-2Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          留下想和我說的話
        </button>
      </div>
      <Dialog
        open={open}
        onClose={() => {
          if (!busy) setOpen(false)
        }}
        initialFocus={title}
        unmount={false}
        className="relative z-70"
      >
        <div className="fixed inset-0 bg-gray-950/60" aria-hidden="true" />
        <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
          <Dialog.Panel className="max-h-[calc(100dvh-1rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-2xl bg-white pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl dark:bg-gray-950 sm:rounded-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-950">
              <div>
                <Dialog.Title ref={title} tabIndex={-1} className="text-lg font-bold outline-none">
                  留下想和我說的話
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-400">
                  歡迎留下網址讓我有機會回訪 :)
                </Dialog.Description>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                aria-label="關閉留言表單"
                className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-900"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-5 w-5"
                >
                  <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="px-5">{children(open)}</div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  )
}
