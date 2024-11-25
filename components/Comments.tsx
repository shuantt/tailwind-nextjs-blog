'use client'

import { Comments as CommentsComponent } from 'pliny/comments'
import { useState } from 'react'
import siteMetadata from '@/data/siteMetadata'

export default function Comments({ slug }: { slug: string }) {
  const [loadComments, setLoadComments] = useState(false)

  if (!siteMetadata.comments?.provider) {
    return null
  }
  return (
    <>
      {loadComments ? (
        <CommentsComponent commentsConfig={siteMetadata.comments} slug={slug} />
      ) : (
        <button
          className="rounded border-[1px] border-solid border-gray-400 px-4 py-2 hover:bg-gray-100 dark:border-gray-100 dark:hover:bg-gray-700"
          onClick={() => setLoadComments(true)}
        >
          展開留言
        </button>
      )}
    </>
  )
}
