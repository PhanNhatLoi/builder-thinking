import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  Copy,
  Eye,
  Move,
  Palette,
  Trash2,
  Type,
} from 'lucide-react'
import { useEditor } from '@craftjs/core'
import { ColorControl } from '../controls/ColorControl'
import { CompactNumber } from '../controls/CompactNumber'
import { Field } from '../controls/Field'
import { IconSegment } from '../controls/IconSegment'
import { SelectControl } from '../controls/SelectControl'
import { TextInput } from '../controls/TextInput'
import { InspectorSection } from './InspectorSection'

const textAlignOptions = [
  ['left', AlignLeft, 'Align left'],
  ['center', AlignCenter, 'Align center'],
  ['right', AlignRight, 'Align right'],
]

const verticalAlignOptions = [
  ['top', AlignVerticalJustifyStart, 'Align top'],
  ['middle', AlignVerticalJustifyCenter, 'Align middle'],
  ['bottom', AlignVerticalJustifyEnd, 'Align bottom'],
]

const fontOptions = [{ value: 'Inter', label: 'Inter' }]

const weightOptions = [
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semibold' },
  { value: '700', label: 'Bold' },
]

function NumberControl({ caption, label, title = caption, value, min, max, suffix, disabled = false, onChange }) {
  return (
    <div className="number-control">
      <span>{caption}</span>
      <CompactNumber label={label} title={title} value={value} min={min} max={max} suffix={suffix} disabled={disabled} onChange={onChange} />
    </div>
  )
}

export function TextInspector({ actions, selectedNode }) {
  const props = selectedNode.data.props
  const { parentLayoutMode } = useEditor((state) => ({
    parentLayoutMode: selectedNode.data.parent ? state.nodes[selectedNode.data.parent]?.data.props.layoutMode : null,
  }))
  const canUsePosition = parentLayoutMode ? parentLayoutMode === 'free' : props.layout === 'fixed'
  const fontWeight = props.fontWeight ?? props.weight ?? 500

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
          <strong>Text</strong>
        </div>
        <div className="inspector-top-actions">
          <button type="button" aria-label="Duplicate">
            <Copy size={15} />
          </button>
          <button type="button" aria-label="Delete selected text" onClick={() => actions.delete(selectedNode.id)}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <InspectorSection title="Position" icon={Move}>
        <div className="control-grid two">
          <NumberControl caption="X" label="X" value={props.x ?? 0} min={0} max={1920} disabled={!canUsePosition} onChange={(value) => setProp('x', value)} />
          <NumberControl caption="Y" label="Y" value={props.y ?? 0} min={0} max={3200} disabled={!canUsePosition} onChange={(value) => setProp('y', value)} />
        </div>
        <div className="control-grid two">
          <NumberControl caption="Width" label="W" value={props.width ?? 240} min={24} max={1920} onChange={(value) => setProp('width', value)} />
          <NumberControl caption="Height" label="H" value={props.height ?? 40} min={16} max={3200} onChange={(value) => setProp('height', value)} />
        </div>
      </InspectorSection>

      <InspectorSection title="Content" icon={Type}>
        <Field label="Text">
          <TextInput value={props.text || ''} onChange={(value) => setProp('text', value)} />
        </Field>
      </InspectorSection>

      <InspectorSection title="Typography" icon={Type}>
        <Field label="Font family">
          <SelectControl label="Font family" value={props.fontFamily || 'Inter'} options={fontOptions} onChange={(value) => setProp('fontFamily', value)} />
        </Field>
        <div className="control-grid two">
          <Field label="Weight">
            <SelectControl label="Font weight" value={String(fontWeight)} options={weightOptions} onChange={(value) => setProp('fontWeight', Number(value))} />
          </Field>
          <NumberControl caption="Size" label="S" value={props.fontSize ?? 24} min={8} max={240} onChange={(value) => setProp('fontSize', value)} />
        </div>
        <div className="control-grid two">
          <NumberControl caption="Line height" label="L" value={props.lineHeight ?? 32} min={8} max={320} onChange={(value) => setProp('lineHeight', value)} />
          <NumberControl caption="Letter spacing" label="A" value={props.letterSpacing ?? 0} min={0} max={100} onChange={(value) => setProp('letterSpacing', value)} />
        </div>
        <Field label="Horizontal alignment">
          <IconSegment value={props.align || 'left'} onChange={(value) => setProp('align', value)} options={textAlignOptions} />
        </Field>
        <Field label="Vertical alignment">
          <IconSegment value={props.verticalAlign || 'top'} onChange={(value) => setProp('verticalAlign', value)} options={verticalAlignOptions} />
        </Field>
      </InspectorSection>

      <InspectorSection title="Fill" icon={Palette}>
        <Field label="Color">
          <ColorControl value={props.color || '#111827'} onChange={(value) => setProp('color', value)} />
        </Field>
      </InspectorSection>

      <InspectorSection title="Appearance" icon={Eye}>
        <div className="control-grid two">
          <NumberControl caption="Opacity" label="O" value={props.opacity ?? 100} min={0} max={100} suffix="%" onChange={(value) => setProp('opacity', value)} />
        </div>
      </InspectorSection>
    </section>
  )
}
