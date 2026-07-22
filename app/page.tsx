import { sortPosts, allCoreContent } from 'pliny/utils/contentlayer'
import { publishedBlogs } from '@/lib/content'
import Main from './Main'

export default async function Page() {
  const sortedPosts = sortPosts(publishedBlogs)
  const posts = allCoreContent(sortedPosts)
  return <Main posts={posts} />
}
