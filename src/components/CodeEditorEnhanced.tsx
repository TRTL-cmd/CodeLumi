import React, { useRef } from 'react';

type Props = {
  value?: string;
  language?: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
};

export default function CodeEditorEnhanced({ value = '', language = 'auto', onChange, readOnly }: Props) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) onChange(e.target.value);
  };

  // controlled textarea with vertical resize
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 6 }}>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{language === 'auto' ? 'Language: auto-detect' : `Language: ${language}`}</div>
      <textarea
        ref={taRef}
        value={value}
        onChange={handleChange}
        readOnly={!!readOnly}
        style={{ width: '100%', height: 320, fontFamily: 'monospace', fontSize: 13, padding: 8, resize: 'vertical' }}
      />
    </div>
  );
}
