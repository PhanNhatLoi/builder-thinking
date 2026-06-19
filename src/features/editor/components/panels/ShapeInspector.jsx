import { Circle, Copy, Image, Move, Pentagon, Slash, Square, Trash2, Upload } from 'lucide-react'
import { useEditor } from '@craftjs/core'
import { useRef } from 'react'
import { ColorControl } from '../controls/ColorControl'
import { CompactNumber } from '../controls/CompactNumber'
import { Field } from '../controls/Field'
import { IconSegment } from '../controls/IconSegment'
import { SelectControl } from '../controls/SelectControl'
import { TextInput } from '../controls/TextInput'
import { InspectorSection } from './InspectorSection'

const shapeOptions = [
  ['rectangle', Square, 'Rectangle'],
  ['ellipse', Circle, 'Ellipse'],
  ['line', Slash, 'Line'],
  ['polygon', Pentagon, 'Polygon'],
  ['image', Image, 'Image'],
]

const imageSizeOptions = [
  { value: 'cover', label: 'Cover' },
  { value: 'contain', label: 'Contain' },
  { value: '100% 100%', label: 'Fill' },
  { value: 'auto', label: 'Original' },
]

const imagePositionOptions = [
  { value: 'center', label: 'Center' },
  { value: 'top', label: 'Top' },
  { value: 'right', label: 'Right' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'top left', label: 'Top left' },
  { value: 'top right', label: 'Top right' },
  { value: 'bottom left', label: 'Bottom left' },
  { value: 'bottom right', label: 'Bottom right' },
]

const positionPresetMap = {
  center: [50, 50],
  top: [50, 0],
  right: [100, 50],
  bottom: [50, 100],
  left: [0, 50],
  'top left': [0, 0],
  'top right': [100, 0],
  'bottom left': [0, 100],
  'bottom right': [100, 100],
}

function NumberControl({ caption, label, value, min, max, suffix, disabled = false, onChange }) {
  return (
    <div className="number-control">
      <span>{caption}</span>
      <CompactNumber label={label} value={value} min={min} max={max} suffix={suffix} disabled={disabled} onChange={onChange} />
    </div>
  )
}

export function ShapeInspector({ actions, selectedNode }) {
  const props = selectedNode.data.props
  const imageInputRef = useRef(null)
  const imageInputId = `shape-image-import-${selectedNode.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`
  const shapeType = props.shapeType || 'rectangle'
  const isImage = shapeType === 'image'
  const isLine = shapeType === 'line'
  const usesImageFill = !isLine && (isImage || props.fillType === 'image')
  const usesColorFill = !isLine && !usesImageFill
  const { parentLayoutMode } = useEditor((state) => ({
    parentLayoutMode: selectedNode.data.parent ? state.nodes[selectedNode.data.parent]?.data.props.layoutMode : null,
  }))
  const canUsePosition = parentLayoutMode ? parentLayoutMode === 'free' : props.layout === 'fixed'

  const setProp = (key, value) => {
    actions.history.throttle(400).setProp(selectedNode.id, (draft) => {
      draft[key] = value
    })
  }

  const setProps = (nextProps) => {
    actions.history.throttle(400).setProp(selectedNode.id, (draft) => {
      Object.assign(draft, nextProps)
    })
  }

  const importLocalImage = (file) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      window.alert('File này không phải là ảnh hợp lệ.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setProps({
        fillType: 'image',
        imageSrc: String(reader.result || ''),
        imagePosition: props.imagePosition || 'center',
        imagePositionX: props.imagePositionX ?? 50,
        imagePositionY: props.imagePositionY ?? 50,
        imageRepeat: props.imageRepeat || 'no-repeat',
        imageSize: props.imageSize || 'cover',
      })
    }
    reader.onerror = () => {
      window.alert('Không thể đọc file ảnh này.')
    }
    reader.readAsDataURL(file)
  }

  const setImagePositionPreset = (value) => {
    const [imagePositionX, imagePositionY] = positionPresetMap[value] || positionPresetMap.center
    setProps({
      imagePosition: value,
      imagePositionX,
      imagePositionY,
    })
  }

  return (
    <section className="inspector">
      <div className="inspector-top">
        <div>
          <span>Design</span>
          <strong>Shape</strong>
        </div>
        <div className="inspector-top-actions">
          <button type="button" aria-label="Duplicate">
            <Copy size={15} />
          </button>
          <button type="button" aria-label="Delete selected shape" onClick={() => actions.delete(selectedNode.id)}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <InspectorSection title="Shape" icon={Square}>
        <Field label="Type">
          <IconSegment value={shapeType} onChange={(value) => setProp('shapeType', value)} options={shapeOptions} />
        </Field>
        <div className="control-grid two">
          <NumberControl caption="X" label="X" value={props.x ?? 0} min={0} max={1920} disabled={!canUsePosition} onChange={(value) => setProp('x', value)} />
          <NumberControl caption="Y" label="Y" value={props.y ?? 0} min={0} max={3200} disabled={!canUsePosition} onChange={(value) => setProp('y', value)} />
        </div>
        <div className="control-grid two">
          <NumberControl caption="Width" label="W" value={props.width ?? 180} min={1} max={1920} onChange={(value) => setProp('width', value)} />
          <NumberControl caption="Height" label="H" value={props.height ?? 120} min={1} max={3200} onChange={(value) => setProp('height', value)} />
        </div>
      </InspectorSection>

      <InspectorSection title="Appearance" icon={Circle}>
        <div className="control-grid two">
          <NumberControl caption="Opacity" label="O" value={props.opacity ?? 100} min={0} max={100} suffix="%" onChange={(value) => setProp('opacity', value)} />
          {!isLine && <NumberControl caption="Radius" label="R" value={props.radius ?? 0} min={0} max={50} onChange={(value) => setProp('radius', value)} />}
        </div>
        {!isLine && (
          <>
            <Field label="Fill type">
              <div className="layout-toggle">
                <button type="button" className={usesColorFill ? 'active' : ''} onClick={() => setProp('fillType', 'color')} disabled={isImage}>
                  Color
                </button>
                <button type="button" className={usesImageFill ? 'active' : ''} onClick={() => setProp('fillType', 'image')}>
                  Image
                </button>
              </div>
            </Field>
            {usesColorFill && <Field label="Fill">
              <ColorControl value={props.fill || '#38bdf8'} onChange={(value) => setProp('fill', value)} />
            </Field>}
          </>
        )}
        <div className="control-grid two">
          <NumberControl caption="Stroke" label="S" value={props.strokeWidth ?? 0} min={0} max={32} onChange={(value) => setProp('strokeWidth', value)} />
          <Field label="Stroke color" className="compact-field">
            <ColorControl value={props.strokeColor || '#0284c7'} onChange={(value) => setProp('strokeColor', value)} />
          </Field>
        </div>
        <div className="layout-toggle">
          <button type="button" className={(props.strokeStyle || 'solid') === 'solid' ? 'active' : ''} onClick={() => setProp('strokeStyle', 'solid')}>
            Solid
          </button>
          <button type="button" className={props.strokeStyle === 'dashed' ? 'active' : ''} onClick={() => setProp('strokeStyle', 'dashed')}>
            Dashed
          </button>
        </div>
      </InspectorSection>

      {shapeType === 'polygon' && (
        <InspectorSection title="Polygon" icon={Pentagon}>
          <Field label="Points">
            <TextInput value={props.points || '50,4 96,96 4,96'} onChange={(value) => setProp('points', value)} />
          </Field>
        </InspectorSection>
      )}

      {usesImageFill && (
        <InspectorSection title="Image" icon={Image}>
          <Field label="Image URL">
            <TextInput value={props.imageSrc || ''} placeholder="https://..." onChange={(value) => setProp('imageSrc', value)} />
          </Field>
          <Field label="Local image">
            <input
              id={imageInputId}
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="visually-hidden"
              onChange={(event) => {
                importLocalImage(event.target.files?.[0])
                event.target.value = ''
              }}
            />
            <div className="layout-toggle">
              <label className="toggle-file-button" htmlFor={imageInputId}>
                <Upload size={14} />
                Import local
              </label>
              {props.imageSrc && (
                <button type="button" onClick={() => setProp('imageSrc', '')}>
                  Clear
                </button>
              )}
            </div>
          </Field>
          <div className="control-grid two">
            <Field label="Size">
              <SelectControl label="Image size" value={props.imageSize || 'cover'} options={imageSizeOptions} onChange={(value) => setProp('imageSize', value)} />
            </Field>
            <Field label="Position">
              <SelectControl label="Image position" value={props.imagePosition || 'center'} options={imagePositionOptions} onChange={setImagePositionPreset} />
            </Field>
          </div>
          <div className="control-grid two">
            <NumberControl caption="Position X" label="X" value={props.imagePositionX ?? 50} min={0} max={100} suffix="%" onChange={(value) => setProp('imagePositionX', value)} />
            <NumberControl caption="Position Y" label="Y" value={props.imagePositionY ?? 50} min={0} max={100} suffix="%" onChange={(value) => setProp('imagePositionY', value)} />
          </div>
          {['cover', 'auto'].includes(props.imageSize || 'cover') && (
            <p className="inspector-note">Hold Shift and drag the image on canvas to adjust the crop.</p>
          )}
          <label className="inspector-checkbox">
            <input
              type="checkbox"
              checked={(props.imageRepeat || 'no-repeat') !== 'no-repeat'}
              onChange={(event) => setProp('imageRepeat', event.target.checked ? 'repeat' : 'no-repeat')}
            />
            <span>Repeat image</span>
          </label>
        </InspectorSection>
      )}
    </section>
  )
}
