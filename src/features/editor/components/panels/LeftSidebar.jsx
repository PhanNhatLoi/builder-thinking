import { Box } from 'lucide-react'
import { useState } from 'react'
import { AssetsPanel } from '../assets/AssetsPanel'
import { LayersPanel } from '../layers/LayersPanel'

export function LeftSidebar() {
  const [activeTab, setActiveTab] = useState('layers')

  return (
    <aside className="left-panel">
      <div className="brand-mark">
        <Box size={18} />
      </div>
      <div className="left-tabs">
        <button type="button" className={activeTab === 'layers' ? 'active' : ''} onClick={() => setActiveTab('layers')}>
          Layers
        </button>
        <button type="button" className={activeTab === 'assets' ? 'active' : ''} onClick={() => setActiveTab('assets')}>
          Assets
        </button>
      </div>
      {activeTab === 'layers' ? <LayersPanel /> : <AssetsPanel />}
    </aside>
  )
}
