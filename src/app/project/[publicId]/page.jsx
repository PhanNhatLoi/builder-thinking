import { ProjectDetailRoute } from '../../../routes/ProjectDetailRoute'

export const metadata = {
  title: 'Project - Builder Thinking',
}

export default async function ProjectPage({ params }) {
  const { publicId } = await params
  return <ProjectDetailRoute publicId={publicId} />
}
