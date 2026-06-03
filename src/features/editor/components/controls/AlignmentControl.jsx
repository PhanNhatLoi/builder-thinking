import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react'
import { IconSegment } from './IconSegment'

export function AlignmentControl({ value = 'left', onChange }) {
  return (
    <IconSegment
      value={value}
      onChange={onChange}
      options={[
        ['left', AlignLeft, 'Align left'],
        ['center', AlignCenter, 'Align center'],
        ['right', AlignRight, 'Align right'],
      ]}
    />
  )
}
