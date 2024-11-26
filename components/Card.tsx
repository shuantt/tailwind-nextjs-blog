import Image from './Image'
import Link from './Link'

const Card = ({ title, description, frontend, backend, demoUrl, apiUrl, imgSrc, href }) => (
  <div className="md max-w-[544px] p-4 md:w-1/2">
    <div
      className={`${
        imgSrc && 'h-full'
      }  overflow-hidden rounded-md border-2 border-gray-200 border-opacity-60  dark:border-gray-700 `}
    >
      <div className="border-b-[1px] border-solid border-gray-200 ">
        {imgSrc &&
          (href ? (
            <Link href={href} aria-label={`Link to ${title}`}>
              <Image
                alt={title}
                src={imgSrc}
                className="h-64 object-cover object-top md:h-48 xl:h-64"
                width={544}
                height={256}
              />
            </Link>
          ) : (
            <Image
              alt={title}
              src={imgSrc}
              className="h-64 object-cover object-top md:h-48 xl:h-64"
              width={544}
              height={256}
            />
          ))}
      </div>
      <div className="space-y-2 p-6">
        <h2 className="mb-3 text-2xl font-bold leading-8 tracking-tight">
          {href ? (
            <Link href={href} aria-label={`Link to ${title}`}>
              {title}
            </Link>
          ) : (
            title
          )}
        </h2>
        <p className="prose max-w-none text-sm text-gray-500  dark:text-gray-400 md:text-base ">
          {description}{' '}
        </p>
        <div className="flex space-x-2">
          {demoUrl && (
            <div>
              <Link
                href={demoUrl}
                className="text-sm font-medium text-blue-500 underline dark:text-blue-200"
                aria-label={`Link to ${title}`}
              >
                Demo
              </Link>
            </div>
          )}
          {apiUrl && (
            <div>
              <Link
                href={apiUrl}
                className="text-sm font-medium text-blue-500 underline dark:text-blue-200 sm:text-xs"
                aria-label={`Link to ${title} API`}
              >
                API
              </Link>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="text-bold">前端:</span> {frontend}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="text-bold">後端:</span> {backend}
          </p>
        </div>
        {href && (
          <Link
            href={href}
            className="text-base font-medium leading-6 text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
            aria-label={`Link to ${title}`}
          >
            Learn more &rarr;
          </Link>
        )}
      </div>
    </div>
  </div>
)

export default Card
