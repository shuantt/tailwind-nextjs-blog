'use client'

import { KBarSearchProvider } from 'pliny/search/KBar'
import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'

interface SearchProviderProps {
  basePath: string
  children: ReactNode
}

interface SearchDocument {
  path: string
  title: string
  tags: string[]
  body: { raw: string }
}

export const SearchProvider = ({ basePath, children }: SearchProviderProps) => {
  const router = useRouter()
  return (
    <KBarSearchProvider
      kbarConfig={{
        searchDocumentsPath: `${basePath}/search.json`,
        defaultActions: [
          {
            id: 'homepage',
            name: 'Homepage',
            keywords: '',
            shortcut: ['h'],
            section: 'Home',
            perform: () => router.push('/'),
          },
          {
            id: 'projects',
            name: 'Projects',
            keywords: '',
            shortcut: ['p'],
            section: 'Home',
            perform: () => router.push('/projects'),
          },
        ],
        onSearchDocumentsLoad(json) {
          return json.map((post: SearchDocument) => ({
            id: post.path,
            name: post.title,
            keywords: post.body.raw,
            section: 'Blog',
            subtitle: post.tags.join(', '),
            perform: () => router.push('/' + post.path),
          }))
        },
      }}
    >
      {children}
    </KBarSearchProvider>
  )
}
