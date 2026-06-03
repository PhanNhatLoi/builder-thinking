import {
  AlignCenter,
  AlignCenterVertical,
  AlignEndVertical,
  AlignLeft,
  AlignRight,
  AlignStartVertical,
  ArrowDownWideNarrow,
  ArrowRight,
  Columns3,
  Copy,
  Eye,
  Grid2X2,
  LayoutTemplate,
  Move,
  Rows3,
  Square,
  Trash2,
} from 'lucide-react'
import { useEditor } from '@craftjs/core'
import { ColorControl } from '../controls/ColorControl'
import { CompactNumber } from '../controls/CompactNumber'
import { Field } from '../controls/Field'
import { IconSegment } from '../controls/IconSegment'
import { InspectorSection } from './InspectorSection'

const layoutModes = [
  ['free', Move, 'Free layout'],
  ['vertical', Rows3, 'Vertical auto layout'],
  ['horizontal', ArrowRight, 'Horizontal auto layout'],
  ['grid', Grid2X2, 'Grid layout'],
]

const alignOptions = [
  ['start', AlignLeft, 'Align start'],
  ['center', AlignCenter, 'Align center'],
  ['end', AlignRight, 'Align end'],
  ['stretch', Columns3, 'Stretch'],
]

const justifyOptions = [
  ['start', AlignStartVertical, 'Justify start'],
  ['center', AlignCenterVertical, 'Justify center'],
  ['end', AlignEndVertical, 'Justify end'],
  ['space-between', Columns3, 'Space between'],
]

const gridFlowOptions = [
  ['row', ArrowRight, 'Left to right, then top to bottom'],
  ['column', ArrowDownWideNarrow, 'Top to bottom, then left to right'],
]

function propValue(props, key, fallbackKey, fallbackValue = 0) {
  return props[key] ?? props[fallbackKey] ?? fallbackValue
}

function NumberControl({ caption, label, title = caption, value, min, max, suffix, disabled = false, onChange }) {
  return (
    <div className="number-control">
      <span>{caption}</span>
      <CompactNumber label={label} title={title} value={value} min={min} max={max} suffix={suffix} disabled={disabled} onChange={onChange} />
    </div>
  )
}

export function SectionInspector({ actions, selectedNode }) {
  const props = selectedNode.data.props
  const layoutMode = props.layoutMode || 'free'
  const isAutoLayout = layoutMode !== 'free'
  const isHorizontal = layoutMode === 'horizontal'
  const isGrid = layoutMode === 'grid'
  const { parentLayoutMode } = useEditor((state) => ({
    parentLayoutMode: selectedNode.data.parent ? state.nodes[selectedNode.data.parent]?.data.props.layoutMode : null,
  }))
  const canUsePosition = parentLayoutMode ? parentLayoutMode === 'free' : props.layout === 'fixed'

  const setProp = (key, value) => {
    actions.history.throttle(400).setProp(selectedNode.id, (draft) => {
      draft[key] = value
    })
  }

  return (
    <section className="inspector">
      <div className="inspector-top">
        <div>
          <span>Design</span>
          <strong>Section</strong>
        </div>
        <div className="inspector-top-actions">
          <button type="button" aria-label="Duplicate">
            <Copy size={15} />
          </button>
          <button type="button" aria-label="Delete selected section" onClick={() => actions.delete(selectedNode.id)}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <InspectorSection title="Section" icon={LayoutTemplate}>
        <div className="control-grid two">
          <NumberControl caption="X" label="X" value={props.x ?? 0} min={0} max={1920} disabled={!canUsePosition} onChange={(value) => setProp('x', value)} />
          <NumberControl caption="Y" label="Y" value={props.y ?? 0} min={0} max={3200} disabled={!canUsePosition} onChange={(value) => setProp('y', value)} />
        </div>
        <div className="control-grid two">
          <NumberControl caption="Width" label="W" value={props.width ?? 320} min={80} max={1920} onChange={(value) => setProp('width', value)} />
          <NumberControl caption="Height" label="H" value={props.height ?? 180} min={48} max={3200} onChange={(value) => setProp('height', value)} />
        </div>
      </InspectorSection>

      <InspectorSection title={isAutoLayout ? 'Auto layout' : 'Layout'} icon={Grid2X2}>
        <Field label="Mode">
          <IconSegment value={layoutMode} onChange={(value) => setProp('layoutMode', value)} options={layoutModes} />
        </Field>
        {isAutoLayout && (
          <>
            <div className="control-grid two">
              <NumberControl
                caption="Gap X"
                label="X"
                title="Horizontal gap"
                value={propValue(props, 'gapX', 'gap', 16)}
                min={0}
                max={160}
                onChange={(value) => setProp('gapX', value)}
              />
              <NumberControl
                caption="Gap Y"
                label="Y"
                title="Vertical gap"
                value={propValue(props, 'gapY', 'gap', 16)}
                min={0}
                max={160}
                onChange={(value) => setProp('gapY', value)}
              />
            </div>
            {isHorizontal && (
              <label className="inspector-checkbox">
                <input type="checkbox" checked={Boolean(props.wrap)} onChange={(event) => setProp('wrap', event.target.checked)} />
                <span>Wrap items</span>
              </label>
            )}
            {isGrid && (
              <>
                <div className="control-label">Grid</div>
                <div className="control-grid two">
                  <NumberControl caption="Columns" label="C" value={props.gridColumns ?? 2} min={1} max={12} onChange={(value) => setProp('gridColumns', value)} />
                  <NumberControl caption="Rows" label="R" value={props.gridRows ?? 2} min={1} max={12} onChange={(value) => setProp('gridRows', value)} />
                </div>
                <Field label="Fill order">
                  <IconSegment value={props.gridFlow || 'row'} onChange={(value) => setProp('gridFlow', value)} options={gridFlowOptions} />
                </Field>
              </>
            )}
            {!isGrid && (
              <>
                <Field label="Align items">
                  <IconSegment value={props.alignItems || 'stretch'} onChange={(value) => setProp('alignItems', value)} options={alignOptions} />
                </Field>
                <Field label="Justify content">
                  <IconSegment value={props.justifyContent || 'start'} onChange={(value) => setProp('justifyContent', value)} options={justifyOptions} />
                </Field>
              </>
            )}
          </>
        )}
        <div className="control-label">Padding</div>
        <div className="control-grid four">
          <NumberControl caption="Top" label="T" title="Padding top" value={propValue(props, 'paddingTop', 'padding', 0)} min={0} max={240} onChange={(value) => setProp('paddingTop', value)} />
          <NumberControl caption="Right" label="R" title="Padding right" value={propValue(props, 'paddingRight', 'padding', 0)} min={0} max={240} onChange={(value) => setProp('paddingRight', value)} />
          <NumberControl caption="Bottom" label="B" title="Padding bottom" value={propValue(props, 'paddingBottom', 'padding', 0)} min={0} max={240} onChange={(value) => setProp('paddingBottom', value)} />
          <NumberControl caption="Left" label="L" title="Padding left" value={propValue(props, 'paddingLeft', 'padding', 0)} min={0} max={240} onChange={(value) => setProp('paddingLeft', value)} />
        </div>
        <label className="inspector-checkbox">
          <input type="checkbox" checked={Boolean(props.clipContent)} onChange={(event) => setProp('clipContent', event.target.checked)} />
          <span>Clip content</span>
        </label>
      </InspectorSection>

      <InspectorSection title="Appearance" icon={Eye}>
        <div className="control-grid two">
          <NumberControl caption="Opacity" label="O" value={props.opacity ?? 100} min={0} max={100} suffix="%" onChange={(value) => setProp('opacity', value)} />
          <NumberControl caption="Corner radius" label="R" value={props.radius ?? 0} min={0} max={160} onChange={(value) => setProp('radius', value)} />
        </div>
        <Field label="Background">
          <ColorControl value={props.background || '#f8fafc'} onChange={(value) => setProp('background', value)} />
        </Field>
      </InspectorSection>

      <InspectorSection title="Stroke" icon={Square}>
        <div className="control-grid two">
          <NumberControl caption="Width" label="W" value={props.borderWidth ?? 0} min={0} max={24} onChange={(value) => setProp('borderWidth', value)} />
          <Field label="Color" className="compact-field">
            <ColorControl value={props.borderColor || '#dbeafe'} onChange={(value) => setProp('borderColor', value)} />
          </Field>
        </div>
        <div className="layout-toggle">
          <button type="button" className={props.borderStyle === 'solid' ? 'active' : ''} onClick={() => setProp('borderStyle', 'solid')}>
            Solid
          </button>
          <button type="button" className={props.borderStyle === 'dashed' ? 'active' : ''} onClick={() => setProp('borderStyle', 'dashed')}>
            Dashed
          </button>
        </div>
      </InspectorSection>
    </section>
  )
}
