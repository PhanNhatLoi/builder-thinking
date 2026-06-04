import {
  AlignCenter,
  AlignCenterVertical,
  AlignEndVertical,
  AlignLeft,
  AlignRight,
  AlignStartVertical,
  ArrowRight,
  ArrowDownWideNarrow,
  Box,
  Eye,
  Grid2X2,
  Move,
  Rows3,
  Square,
  Columns3,
} from 'lucide-react'
import { ColorControl } from '../controls/ColorControl'
import { CompactNumber } from '../controls/CompactNumber'
import { Field } from '../controls/Field'
import { IconSegment } from '../controls/IconSegment'
import { SelectControl } from '../controls/SelectControl'
import { InspectorSection } from './InspectorSection'

const pageSizeLimits = {
  minWidth: 320,
  maxWidth: 1920,
  minHeight: 320,
  maxHeight: 3200,
}

const pageSizePresets = {
  '1:1': { label: '1:1 Square', width: 860, height: 860 },
  '3:4': { label: '3:4 Portrait', width: 860, height: 1147 },
  '4:3': { label: '4:3 Landscape', width: 860, height: 645 },
  '9:16': { label: '9:16 Portrait', width: 860, height: 1529 },
  '16:9': { label: '16:9 Landscape', width: 860, height: 484 },
  a4: { label: 'A4 Standard', width: 860, height: 1040 },
}

const pageSizeOptions = [
  { value: 'a4', label: 'A4 Standard' },
  { value: '1:1', label: '1:1 Square' },
  { value: '3:4', label: '3:4 Portrait' },
  { value: '4:3', label: '4:3 Landscape' },
  { value: '9:16', label: '9:16 Portrait' },
  { value: '16:9', label: '16:9 Landscape' },
  { value: 'custom', label: 'Custom size' },
]

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

function getPageSizePreset(props) {
  if (props.pageSizePreset === 'custom') return 'custom'
  const matchingPreset = Object.entries(pageSizePresets).find(([, size]) => {
    return props.width === size.width && props.height === size.height
  })

  return props.pageSizePreset && pageSizePresets[props.pageSizePreset] ? props.pageSizePreset : matchingPreset?.[0] || 'custom'
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function getScaledPageSize(preset, changedKey, changedValue) {
  const size = pageSizePresets[preset]
  if (!size) return { [changedKey]: changedValue }

  const ratio = size.width / size.height
  if (changedKey === 'width') {
    const width = clamp(changedValue, pageSizeLimits.minWidth, pageSizeLimits.maxWidth)
    const height = Math.round(width / ratio)

    if (height > pageSizeLimits.maxHeight) {
      return {
        width: Math.round(pageSizeLimits.maxHeight * ratio),
        height: pageSizeLimits.maxHeight,
      }
    }

    return {
      width,
      height: clamp(height, pageSizeLimits.minHeight, pageSizeLimits.maxHeight),
    }
  }

  const height = clamp(changedValue, pageSizeLimits.minHeight, pageSizeLimits.maxHeight)
  const width = Math.round(height * ratio)

  if (width > pageSizeLimits.maxWidth) {
    return {
      width: pageSizeLimits.maxWidth,
      height: Math.round(pageSizeLimits.maxWidth / ratio),
    }
  }

  return {
    width: clamp(width, pageSizeLimits.minWidth, pageSizeLimits.maxWidth),
    height,
  }
}

function NumberControl({ caption, label, title = caption, value, min, max, suffix, disabled = false, onChange }) {
  return (
    <div className="number-control">
      <span>{caption}</span>
      <CompactNumber label={label} title={title} value={value} min={min} max={max} suffix={suffix} disabled={disabled} onChange={onChange} />
    </div>
  )
}

export function RootPageInspector({ actions, selectedNode }) {
  const props = selectedNode.data.props
  const layoutMode = props.layoutMode || 'vertical'
  const pageSizePreset = getPageSizePreset(props)
  const isA4Size = pageSizePreset === 'a4'
  const isAutoLayout = layoutMode !== 'free'
  const isHorizontal = layoutMode === 'horizontal'
  const isGrid = layoutMode === 'grid'

  const setProp = (key, value) => {
    actions.history.throttle(400).setProp(selectedNode.id, (draft) => {
      draft[key] = value
    })
  }

  const setProps = (update) => {
    actions.history.throttle(400).setProp(selectedNode.id, update)
  }

  const setPageSizePreset = (preset) => {
    setProps((draft) => {
      draft.pageSizePreset = preset
      if (preset === 'custom') return

      const size = pageSizePresets[preset]
      if (!size) return

      draft.width = size.width
      draft.height = size.height
    })
  }

  const setCustomSize = (key, value) => {
    setProps((draft) => {
      if (pageSizePreset === 'custom') {
        draft.pageSizePreset = 'custom'
        draft[key] = value
        return
      }

      const nextSize = getScaledPageSize(pageSizePreset, key, value)
      draft.pageSizePreset = pageSizePreset
      draft.width = nextSize.width
      draft.height = nextSize.height
    })
  }

  return (
    <section className="inspector">
      <div className="inspector-top">
        <div>
          <span>Design</span>
          <strong>Page</strong>
        </div>
      </div>

      <InspectorSection title="Page" icon={Box}>
        <Field label="Size preset">
          <SelectControl label="Page size preset" value={pageSizePreset} options={pageSizeOptions} onChange={setPageSizePreset} />
        </Field>
        <div className="control-grid two">
          <NumberControl
            caption="Width"
            label="W"
            value={props.width}
            min={pageSizeLimits.minWidth}
            max={pageSizeLimits.maxWidth}
            disabled={isA4Size}
            onChange={(value) => setCustomSize('width', value)}
          />
          <NumberControl
            caption="Height"
            label="H"
            value={props.height}
            min={pageSizeLimits.minHeight}
            max={pageSizeLimits.maxHeight}
            disabled={isA4Size}
            onChange={(value) => setCustomSize('height', value)}
          />
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
                value={propValue(props, 'gapX', 'gap', 18)}
                min={0}
                max={160}
                onChange={(value) => setProp('gapX', value)}
              />
              <NumberControl
                caption="Gap Y"
                label="Y"
                title="Vertical gap"
                value={propValue(props, 'gapY', 'gap', 18)}
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
                  <NumberControl
                    caption="Columns"
                    label="C"
                    value={props.gridColumns ?? 2}
                    min={1}
                    max={12}
                    onChange={(value) => setProp('gridColumns', value)}
                  />
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
          <NumberControl
            caption="Top"
            label="T"
            title="Padding top"
            value={propValue(props, 'paddingTop', 'padding', 44)}
            min={0}
            max={240}
            onChange={(value) => setProp('paddingTop', value)}
          />
          <NumberControl
            caption="Right"
            label="R"
            title="Padding right"
            value={propValue(props, 'paddingRight', 'padding', 44)}
            min={0}
            max={240}
            onChange={(value) => setProp('paddingRight', value)}
          />
          <NumberControl
            caption="Bottom"
            label="B"
            title="Padding bottom"
            value={propValue(props, 'paddingBottom', 'padding', 44)}
            min={0}
            max={240}
            onChange={(value) => setProp('paddingBottom', value)}
          />
          <NumberControl
            caption="Left"
            label="L"
            title="Padding left"
            value={propValue(props, 'paddingLeft', 'padding', 44)}
            min={0}
            max={240}
            onChange={(value) => setProp('paddingLeft', value)}
          />
        </div>
        <label className="inspector-checkbox">
          <input type="checkbox" checked={Boolean(props.clipContent)} onChange={(event) => setProp('clipContent', event.target.checked)} />
          <span>Clip content</span>
        </label>
      </InspectorSection>

      <InspectorSection title="Appearance" icon={Eye}>
        <div className="control-grid two">
          <NumberControl caption="Opacity" label="O" value={props.opacity ?? 100} min={0} max={100} suffix="%" onChange={(value) => setProp('opacity', value)} />
        </div>
        <Field label="Background">
          <ColorControl value={props.background || '#ffffff'} onChange={(value) => setProp('background', value)} />
        </Field>
      </InspectorSection>

      <InspectorSection title="Stroke" icon={Square}>
        <div className="control-grid two">
          <NumberControl caption="Width" label="W" value={props.borderWidth ?? 1} min={0} max={24} onChange={(value) => setProp('borderWidth', value)} />
          <Field label="Color" className="compact-field">
            <ColorControl value={props.borderColor || '#d8dee8'} onChange={(value) => setProp('borderColor', value)} />
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
