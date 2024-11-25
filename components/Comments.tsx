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
          className="rounded py-2 px-4 dark:border-gray-100 border-gray-400 border-solid border-[1px] hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => setLoadComments(true)}
        >
          展開留言
        </button>
      )}
    </>
  )
}
