export function TextInput({ value = '', onChange }) {
  return <input type="text" value={value} onChange={(event) => onChange(event.target.value)} />
}
