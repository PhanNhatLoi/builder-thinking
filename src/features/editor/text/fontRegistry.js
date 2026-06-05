export const EDITOR_FONTS = [
  { family: 'Inter', label: 'Inter', cssValue: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { family: 'Roboto', label: 'Roboto', cssValue: 'Roboto, ui-sans-serif, system-ui, sans-serif' },
  { family: 'Poppins', label: 'Poppins', cssValue: 'Poppins, ui-sans-serif, system-ui, sans-serif' },
  { family: 'Montserrat', label: 'Montserrat', cssValue: 'Montserrat, ui-sans-serif, system-ui, sans-serif' },
  { family: 'Raleway', label: 'Raleway', cssValue: 'Raleway, ui-sans-serif, system-ui, sans-serif' },
  { family: 'Oswald', label: 'Oswald', cssValue: 'Oswald, ui-sans-serif, system-ui, sans-serif' },
  { family: 'Bebas Neue', label: 'Bebas Neue', cssValue: '"Bebas Neue", Impact, sans-serif' },
  { family: 'Playfair Display', label: 'Playfair Display', cssValue: '"Playfair Display", Georgia, serif' },
  { family: 'Merriweather', label: 'Merriweather', cssValue: 'Merriweather, Georgia, serif' },
  { family: 'Lora', label: 'Lora', cssValue: 'Lora, Georgia, serif' },
  { family: 'Pacifico', label: 'Pacifico', cssValue: 'Pacifico, cursive' },
  { family: 'Dancing Script', label: 'Dancing Script', cssValue: '"Dancing Script", cursive' },
]

export const fontOptions = EDITOR_FONTS.map((font) => ({
  value: font.family,
  label: font.label,
}))

export function getFontCssValue(fontFamily = 'Inter') {
  return EDITOR_FONTS.find((font) => font.family === fontFamily)?.cssValue || `"${fontFamily}", ui-sans-serif, system-ui, sans-serif`
}
