export function TextInput({ value = '', onChange, placeholder }) {
  return <input type="text" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
}
