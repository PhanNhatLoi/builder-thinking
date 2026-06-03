import { Box } from 'lucide-react'
import { LayersPanel } from '../layers/LayersPanel'

export function LeftSidebar() {
  return (
    <aside className="left-panel">
      <div className="brand-mark">
        <Box size={18} />
      </div>
      <div className="left-tabs">
        <button className="active">Layers</button>
        <button>Assets</button>
      </div>
      <LayersPanel />
    </aside>
  )
}
