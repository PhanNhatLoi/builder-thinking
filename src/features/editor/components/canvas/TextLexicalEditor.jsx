import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { useEffect } from 'react'
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical'

function LexicalErrorBoundary({ children }) {
  return children
}

function createInitialState(text) {
  return () => {
    const root = $getRoot()
    root.clear()

    const paragraph = $createParagraphNode()
    paragraph.append($createTextNode(text || ''))
    root.append(paragraph)
  }
}

function EditablePlugin({ editable }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    editor.setEditable(editable)
  }, [editable, editor])

  return null
}

export function TextLexicalEditor({ editable, editorState, onChange, onBlur, text }) {
  const initialConfig = {
    namespace: 'BuilderText',
    editable,
    editorState: editorState || createInitialState(text),
    onError(error) {
      throw error
    },
    theme: {
      paragraph: 'lexical-paragraph',
      text: {
        bold: 'lexical-text-bold',
      },
    },
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={<ContentEditable className="text-content" spellCheck={false} onBlur={onBlur} />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <OnChangePlugin
        ignoreSelectionChange
        onChange={(nextEditorState) => {
          nextEditorState.read(() => {
            onChange({
              editorState: JSON.stringify(nextEditorState.toJSON()),
              text: $getRoot().getTextContent(),
            })
          })
        }}
      />
      <EditablePlugin editable={editable} />
    </LexicalComposer>
  )
}
