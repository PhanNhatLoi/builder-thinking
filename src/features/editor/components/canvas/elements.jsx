import { LayoutTemplate } from 'lucide-react'
import { EditableShell } from './EditableShell'

export function Section({ background = '#f8fafc', padding = 28, radius = 18, children, ...shellProps }) {
  return (
    <EditableShell className="section-block" {...shellProps}>
      <section style={{ background, padding, borderRadius: radius, height: '100%' }}>{children}</section>
    </EditableShell>
  )
}

Section.craft = {
  displayName: 'Section',
  props: {
    background: '#f8fafc',
    padding: 28,
    radius: 18,
    layout: 'flow',
    x: 80,
    y: 420,
    width: 620,
    height: 180,
  },
}

export function TextBlock({
  text = 'Double down on the ideas that matter.',
  fontSize = 34,
  color = '#111827',
  align = 'left',
  weight = 700,
  layout = 'flow',
  x = 80,
  y = 80,
  width = 690,
  height = 54,
}) {
  return (
    <EditableShell className="text-shell" layout={layout} x={x} y={y} width={width} height={height}>
      <p className="text-block" style={{ fontSize, color, textAlign: align, fontWeight: weight }}>
        {text}
      </p>
    </EditableShell>
  )
}

TextBlock.craft = {
  displayName: 'Text',
  props: {
    text: 'Double down on the ideas that matter.',
    fontSize: 34,
    color: '#111827',
    align: 'left',
    weight: 700,
    layout: 'flow',
    x: 80,
    y: 80,
    width: 690,
    height: 54,
  },
}

export function ButtonBlock({
  text = 'Start building',
  background = '#111827',
  color = '#ffffff',
  radius = 12,
  width = 168,
  height = 46,
  layout = 'flow',
  x = 80,
  y = 760,
}) {
  return (
    <EditableShell className="button-shell" layout={layout} x={x} y={y} width={width} height={height}>
      <button className="button-block" style={{ background, color, borderRadius: radius }}>
        {text}
      </button>
    </EditableShell>
  )
}

ButtonBlock.craft = {
  displayName: 'Button',
  props: {
    text: 'Start building',
    background: '#111827',
    color: '#ffffff',
    radius: 12,
    width: 168,
    height: 46,
    layout: 'flow',
    x: 80,
    y: 760,
  },
}

export function ImageBlock({
  src = 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200&auto=format&fit=crop',
  width = 690,
  height = 220,
  radius = 18,
  layout = 'flow',
  x = 80,
  y = 220,
}) {
  return (
    <EditableShell className="image-shell" layout={layout} x={x} y={y} width={width} height={height}>
      <img className="image-block" src={src} alt="" style={{ borderRadius: radius }} />
    </EditableShell>
  )
}

ImageBlock.craft = {
  displayName: 'Image',
  props: {
    src: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200&auto=format&fit=crop',
    width: 690,
    height: 220,
    radius: 18,
    layout: 'flow',
    x: 80,
    y: 220,
  },
}

export function CardBlock({
  title = 'Launch canvas',
  body = 'Arrange content, inspect props, and manage layers in one focused workspace.',
  background = '#ffffff',
  radius = 18,
  layout = 'flow',
  x = 96,
  y = 520,
  width = 620,
  height = 146,
}) {
  return (
    <EditableShell className="card-shell" layout={layout} x={x} y={y} width={width} height={height}>
      <article className="card-block" style={{ background, borderRadius: radius }}>
        <div className="card-icon">
          <LayoutTemplate size={18} />
        </div>
        <h3>{title}</h3>
        <p>{body}</p>
      </article>
    </EditableShell>
  )
}

CardBlock.craft = {
  displayName: 'Card',
  props: {
    title: 'Launch canvas',
    body: 'Arrange content, inspect props, and manage layers in one focused workspace.',
    background: '#ffffff',
    radius: 18,
    layout: 'flow',
    x: 96,
    y: 520,
    width: 620,
    height: 146,
  },
}
