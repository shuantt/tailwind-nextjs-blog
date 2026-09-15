import Card from '@/components/Card'
import projectsData from '@/data/projectsData'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: 'Projects' })

export default function Projects() {
  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pb-8 pt-6 md:space-y-5">
          <h1 className="text-2xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl sm:leading-10 md:text-4xl md:leading-tight">
            Projects
          </h1>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400" />
        </div>
        {projectsData.map((project, index) => (
          <Card key={project.title} {...project} index={index} />
        ))}
      </div>
    </>
  )
}
