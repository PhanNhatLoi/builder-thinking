import {
  Bold,
  Copy,
  Droplets,
  Eye,
  Grid2X2,
  Maximize2,
  Move,
  PanelRight,
  Plus,
  Rows3,
  SlidersHorizontal,
  Trash2,
  Type,
} from 'lucide-react'
import { useSelectedNode } from '../../hooks/useSelectedNode'
import { nodeTitle } from '../../utils/editorUtils'
import { AlignmentControl } from '../controls/AlignmentControl'
import { ColorControl } from '../controls/ColorControl'
import { CompactNumber } from '../controls/CompactNumber'
import { Field } from '../controls/Field'
import { NumberInput } from '../controls/NumberInput'
import { TextInput } from '../controls/TextInput'
import { InspectorSection } from './InspectorSection'
import { RootPageInspector } from './RootPageInspector'
import { SectionInspector } from './SectionInspector'
import { ShapeInspector } from './ShapeInspector'
import { TextInspector } from './TextInspector'

export function Inspector() {
  const { actions, selectedIds, selectedNode } = useSelectedNode()

  if (selectedIds.length > 1) {
    return (
      <section className="inspector empty-panel">
        <PanelRight size={18} />
        <p>{selectedIds.length} items selected.</p>
        <button type="button" className="group-delete-button" onClick={() => actions.delete(selectedIds.filter((id) => id !== 'ROOT'))}>
          <Trash2 size={15} />
          Delete group
        </button>
      </section>
    )
  }

  if (!selectedNode) {
    return (
      <section className="inspector empty-panel">
        <PanelRight size={18} />
        <p>Select an item on the canvas to edit its properties.</p>
      </section>
    )
  }

  const props = selectedNode.data.props
  const name = nodeTitle(selectedNode)
  const isRoot = selectedNode.id === 'ROOT'
  const layout = props.layout || 'flow'

  if (isRoot) {
    return <RootPageInspector actions={actions} selectedNode={selectedNode} />
  }

  if (name === 'Section') {
    return <SectionInspector actions={actions} selectedNode={selectedNode} />
  }

  if (name === 'Text') {
    return <TextInspector actions={actions} selectedNode={selectedNode} />
  }

  if (name === 'Shape') {
    return <ShapeInspector actions={actions} selectedNode={selectedNode} />
  }

  const setProp = (key, value) => {
    actions.history.throttle(400).setProp(selectedNode.id, (draft) => {
      draft[key] = value
    })
  }

  const setProps = (update) => {
    actions.history.throttle(400).setProp(selectedNode.id, update)
  }

  const setLayout = (nextLayout) => {
    setProps((draft) => {
      draft.layout = nextLayout

      if (nextLayout === 'fixed') {
        draft.x = Number.isFinite(draft.x) ? draft.x : selectedNode.dom?.offsetLeft || 0
        draft.y = Number.isFinite(draft.y) ? draft.y : selectedNode.dom?.offsetTop || 0
        draft.width = draft.width || selectedNode.dom?.offsetWidth || 240
        draft.height = draft.height || selectedNode.dom?.offsetHeight || 120
      }
    })
  }

  return (
    <section className="inspector">
      <div className="inspector-top">
        <div>
          <span>Design</span>
          <strong>{name}</strong>
        </div>
        <div className="inspector-top-actions">
          <button type="button" aria-label="Duplicate">
            <Copy size={15} />
          </button>
          <button
            type="button"
            aria-label="Delete selected item"
            disabled={selectedNode.id === 'ROOT'}
            onClick={() => selectedNode.id !== 'ROOT' && actions.delete(selectedNode.id)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <InspectorSection title="Position" icon={Move}>
        <div className="control-grid two">
          <CompactNumber label="X" value={props.x || 0} disabled={isRoot || layout === 'flow'} onChange={(value) => setProp('x', value)} />
          <CompactNumber label="Y" value={props.y || 0} disabled={isRoot || layout === 'flow'} onChange={(value) => setProp('y', value)} />
        </div>
        <div className="control-grid two">
          {'width' in props && (
            <CompactNumber label="W" value={props.width} min={40} max={960} onChange={(value) => setProp('width', value)} />
          )}
          {'height' in props && (
            <CompactNumber label="H" value={props.height} min={40} max={720} onChange={(value) => setProp('height', value)} />
          )}
          {'width' in props || 'height' in props ? null : (
            <>
              <CompactNumber label="W" value={selectedNode.dom?.offsetWidth || 0} onChange={() => {}} />
              <CompactNumber label="H" value={selectedNode.dom?.offsetHeight || 0} onChange={() => {}} />
            </>
          )}
        </div>
        {!isRoot && (
          <div className="layout-toggle">
            <button type="button" className={layout === 'flow' ? 'active' : ''} onClick={() => setLayout('flow')}>
              Flow
            </button>
            <button type="button" className={layout === 'fixed' ? 'active' : ''} onClick={() => setLayout('fixed')}>
              Fixed
            </button>
          </div>
        )}
        <div className="segmented full">
          <button type="button" className={layout === 'fixed' ? 'active' : ''} aria-label="Free position" onClick={() => !isRoot && setLayout('fixed')}>
            <Maximize2 size={15} />
          </button>
          <button type="button" className={layout === 'flow' ? 'active' : ''} aria-label="Flow layout" onClick={() => !isRoot && setLayout('flow')}>
            <Grid2X2 size={15} />
          </button>
          <button type="button" aria-label="Scale constraints">
            <SlidersHorizontal size={15} />
          </button>
        </div>
      </InspectorSection>

      <InspectorSection title="Auto layout" icon={Grid2X2}>
        <div className="segmented full">
          <button type="button" className={layout === 'flow' ? 'active' : ''} aria-label="Vertical flow" onClick={() => !isRoot && setLayout('flow')}>
            <Rows3 size={15} />
          </button>
          <button type="button" aria-label="Grid flow">
            <Grid2X2 size={15} />
          </button>
          <button type="button" className={layout === 'fixed' ? 'active' : ''} aria-label="Free flow" onClick={() => !isRoot && setLayout('fixed')}>
            <Move size={15} />
          </button>
        </div>
        {'padding' in props && (
          <Field label={`Padding ${props.padding}px`}>
            <NumberInput value={props.padding} min={0} max={96} onChange={(value) => setProp('padding', value)} />
          </Field>
        )}
        {'gap' in props && (
          <Field label={`Gap ${props.gap}px`}>
            <NumberInput value={props.gap} min={0} max={64} onChange={(value) => setProp('gap', value)} />
          </Field>
        )}
        {'radius' in props && (
          <Field label={`Corner radius ${props.radius}px`}>
            <NumberInput value={props.radius} min={0} max={48} onChange={(value) => setProp('radius', value)} />
          </Field>
        )}
      </InspectorSection>

      <InspectorSection title="Content">
        {'text' in props && (
          <Field label="Text">
            <TextInput value={props.text} onChange={(value) => setProp('text', value)} />
          </Field>
        )}
        {'title' in props && (
          <Field label="Title">
            <TextInput value={props.title} onChange={(value) => setProp('title', value)} />
          </Field>
        )}
        {'body' in props && (
          <Field label="Body">
            <textarea value={props.body} onChange={(event) => setProp('body', event.target.value)} />
          </Field>
        )}
        {'src' in props && (
          <Field label="Image URL">
            <TextInput value={props.src} onChange={(value) => setProp('src', value)} />
          </Field>
        )}
      </InspectorSection>

      {('fontSize' in props || 'align' in props || 'weight' in props || 'color' in props) && (
        <InspectorSection title="Typography" icon={Type}>
          {'fontSize' in props && (
            <Field label={`Size ${props.fontSize}px`}>
              <NumberInput value={props.fontSize} min={12} max={84} onChange={(value) => setProp('fontSize', value)} />
            </Field>
          )}
          {'align' in props && (
            <Field label="Alignment">
              <AlignmentControl value={props.align} onChange={(value) => setProp('align', value)} />
            </Field>
          )}
          {'weight' in props && (
            <Field label="Weight">
              <button className={`toggle-button ${props.weight >= 700 ? 'active' : ''}`} onClick={() => setProp('weight', props.weight >= 700 ? 500 : 700)}>
                <Bold size={15} />
                Bold
              </button>
            </Field>
          )}
          {'color' in props && (
            <Field label="Color">
              <ColorControl value={props.color} onChange={(value) => setProp('color', value)} />
            </Field>
          )}
        </InspectorSection>
      )}

      <InspectorSection title="Appearance" icon={Eye}>
        <div className="control-grid two">
          <CompactNumber label="O" value={100} min={0} max={100} suffix="%" onChange={() => {}} />
          <CompactNumber label="B" value={100} min={0} max={100} suffix="%" onChange={() => {}} />
        </div>
        {'background' in props && (
          <Field label="Fill">
            <ColorControl value={props.background} onChange={(value) => setProp('background', value)} />
          </Field>
        )}
      </InspectorSection>

      <InspectorSection title="Stroke" icon={Plus}>
        <div className="muted-control">No stroke configured</div>
      </InspectorSection>

      <InspectorSection title="Effects" icon={Droplets}>
        <div className="muted-control">No effects configured</div>
      </InspectorSection>
    </section>
  )
}
