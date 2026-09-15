import Link from 'next/link'
import { slug } from 'github-slugger'
interface Props {
  text: string
}

const Tag = ({ text }: Props) => {
  return (
    <Link
      href={`/tags/${slug(text)}`}
      // Unified back to the site's one plain accent color — same primary-500
      // used everywhere else (links, categories, hero-card accents) — after
      // the muted/reduced-opacity variant read as dingy/grayish rather than
      // "differentiated" (per explicit follow-up feedback).
      className="mr-3 text-sm font-medium uppercase text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
    >
      {text.split(' ').join('-')}
    </Link>
  )
}

export default Tag
