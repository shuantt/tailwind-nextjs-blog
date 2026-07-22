import { allBlogs } from 'contentlayer/generated'

export const publishedBlogs = allBlogs.filter((post) => post.draft !== true)
