import { useEditor } from '@craftjs/core'
import { Layers } from 'lucide-react'
import { selectedIdFromSet } from '../../utils/editorUtils'
import { LayerRow } from './LayerRow'

export function LayersPanel() {
  const { nodes, selectedId, actions } = useEditor((state) => ({
    nodes: state.nodes,
    selectedId: selectedIdFromSet(state.events.selected),
  }))

  return (
    <section className="layers-panel">
      <div className="panel-heading compact">
        <span>Layers</span>
        <Layers size={16} />
      </div>
      <div className="layer-list">
        <LayerRow id="ROOT" nodes={nodes} selectedId={selectedId} actions={actions} />
      </div>
    </section>
  )
}
