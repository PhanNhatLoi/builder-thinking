import '../features/editor/text/fonts.css'
import '../styles.css'

export const metadata = {
  title: 'Builder Thinking',
  description: 'A Canva-like visual page builder for visual documents and AI-generated design layouts.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
