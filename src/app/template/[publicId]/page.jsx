import { ProjectDetailRoute } from '../../../routes/ProjectDetailRoute'

export const metadata = {
  title: 'Template - Builder Thinking',
}

export default async function TemplatePage({ params }) {
  const { publicId } = await params
  return <ProjectDetailRoute publicId={publicId} templateMode />
}
