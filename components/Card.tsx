import Image from './Image'
import Link from './Link'

interface CardProps {
  index: number
  title: string
  description: string
  frontend?: string
  backend?: string
  demoUrl?: string
  apiUrl?: string
  imgSrc?: string
  href?: string
}

const Card = ({
  index,
  title,
  description,
  frontend,
  backend,
  demoUrl,
  apiUrl,
  imgSrc,
  href,
}: CardProps) => {
  const primaryUrl = href || demoUrl
  const imageOrder = index % 2 === 0 ? 'lg:order-1' : 'lg:order-2'
  const contentOrder = index % 2 === 0 ? 'lg:order-2' : 'lg:order-1'

  return (
    <article className="grid gap-8 border-b border-gray-300 py-14 dark:border-gray-800 sm:py-20 lg:grid-cols-12 lg:items-stretch lg:gap-12">
      <div
        className={`group overflow-hidden bg-gray-200 dark:bg-gray-900 lg:col-span-7 ${imageOrder}`}
      >
        {imgSrc &&
          (primaryUrl ? (
            <Link
              href={primaryUrl}
              aria-label={`開啟 ${title} 專案`}
              className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
            >
              <Image
                alt={`${title} 專案畫面`}
                src={imgSrc}
                priority={index === 0}
                className="aspect-[16/10] h-full w-full object-cover object-top transition duration-500 ease-out group-hover:scale-[1.025]"
                width={960}
                height={600}
                sizes="(max-width: 1024px) 100vw, 58vw"
              />
            </Link>
          ) : (
            <Image
              alt={`${title} 專案畫面`}
              src={imgSrc}
              priority={index === 0}
              className="aspect-[16/10] h-full w-full object-cover object-top"
              width={960}
              height={600}
              sizes="(max-width: 1024px) 100vw, 58vw"
            />
          ))}
      </div>

      <div className={`flex flex-col lg:col-span-5 ${contentOrder}`}>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary-700 dark:text-primary-300">
          Project {String(index + 1).padStart(2, '0')}
        </p>
        <h2 className="mt-5 text-4xl font-bold tracking-[-0.04em] text-gray-950 dark:text-gray-50 sm:text-5xl">
          {primaryUrl ? (
            <Link
              href={primaryUrl}
              className="transition-colors hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:text-primary-300"
            >
              {title}
            </Link>
          ) : (
            title
          )}
        </h2>
        <p className="mt-6 text-base leading-8 text-gray-600 dark:text-gray-400">{description}</p>

        <dl className="mt-8 border-t border-gray-300 text-sm dark:border-gray-800">
          {frontend && (
            <div className="grid grid-cols-[5.5rem_1fr] gap-4 border-b border-gray-300 py-4 dark:border-gray-800">
              <dt className="font-bold text-gray-950 dark:text-gray-50">前端</dt>
              <dd className="leading-6 text-gray-600 dark:text-gray-400">{frontend}</dd>
            </div>
          )}
          {backend && (
            <div className="grid grid-cols-[5.5rem_1fr] gap-4 border-b border-gray-300 py-4 dark:border-gray-800">
              <dt className="font-bold text-gray-950 dark:text-gray-50">後端</dt>
              <dd className="leading-6 text-gray-600 dark:text-gray-400">{backend}</dd>
            </div>
          )}
        </dl>

        <div className="mt-auto flex flex-wrap gap-x-6 gap-y-3 pt-8">
          {demoUrl && (
            <Link
              href={demoUrl}
              className="border-b border-gray-950 pb-1 text-sm font-bold text-gray-950 transition-colors hover:border-primary-600 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-50 dark:text-gray-50 dark:hover:border-primary-300 dark:hover:text-primary-300"
            >
              查看作品 <span aria-hidden="true">↗</span>
            </Link>
          )}
          {apiUrl && (
            <Link
              href={apiUrl}
              className="border-b border-gray-400 pb-1 text-sm font-bold text-gray-600 transition-colors hover:border-primary-600 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-gray-400 dark:hover:text-primary-300"
            >
              API 文件 <span aria-hidden="true">↗</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}

export default Card
