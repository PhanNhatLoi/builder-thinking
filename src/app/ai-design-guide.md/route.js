import { readFile } from 'node:fs/promises'
import path from 'node:path'

export async function GET() {
  const markdown = await readFile(path.join(process.cwd(), 'src/features/editor/ai/AI_DESIGN_GUIDE.md'), 'utf8')

  return new Response(markdown, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
    },
  })
}
