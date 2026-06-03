import { AppProviders } from './app/providers'
import { Editor } from './features/editor'

export default function App() {
  return (
    <AppProviders>
      <Editor />
    </AppProviders>
  )
}
