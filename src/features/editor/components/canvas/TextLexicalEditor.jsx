import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { useEffect } from 'react'
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical'
import { cacheActiveTextSelection, setActiveTextEditor } from '../../text/lexicalTextBridge'

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

function SelectionCachePlugin({ nodeId }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        cacheActiveTextSelection(nodeId, editor)
      })
    })
  }, [editor, nodeId])

  return null
}

function EditableContent({ nodeId, onBlur, onFocus }) {
  const [editor] = useLexicalComposerContext()

  return (
    <ContentEditable
      className="text-content"
      spellCheck={false}
      onBlur={onBlur}
      onFocus={() => {
        setActiveTextEditor(nodeId, editor)
        onFocus?.()
      }}
    />
  )
}

export function TextLexicalEditor({ editable, editorState, nodeId, onChange, onBlur, onFocus, text }) {
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
        italic: 'lexical-text-italic',
      },
    },
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={<EditableContent nodeId={nodeId} onBlur={onBlur} onFocus={onFocus} />}
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
      <SelectionCachePlugin nodeId={nodeId} />
    </LexicalComposer>
  )
}
