import Editor from "@monaco-editor/react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function MarkdownEditor({ value, onChange, className = "" }: MarkdownEditorProps) {
  return (
    <div className={`h-full ${className}`}>
      <Editor
        height="100%"
        defaultLanguage="markdown"
        value={value}
        onChange={(val) => onChange(val || "")}
        theme="vs-dark"
        options={{
          fontSize: 14,
          lineNumbers: "on",
          minimap: { enabled: true },
          wordWrap: "on",
          scrollBeyondLastLine: false,
          renderWhitespace: "selection",
          bracketPairColorization: { enabled: true },
          formatOnPaste: true,
          formatOnType: true,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
