import { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { Awareness } from 'y-protocols/awareness';

interface UseFileBindingProps {
  doc: Y.Doc | null;
  awareness: Awareness | null;
  editor: any;
  activeFileId: string | null;
  isSynced: boolean;
}

export function useFileBinding({ doc, awareness, editor, activeFileId, isSynced }: UseFileBindingProps) {
  const bindingRef = useRef<MonacoBinding | null>(null);

  useEffect(() => {
    // Destroy previous binding if any
    if (bindingRef.current) {
      console.log('Destroying previous MonacoBinding for file change');
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    if (!doc || !awareness || !editor || !activeFileId || !isSynced) return;

    const filesMap = doc.getMap('files');
    const key = `file:${activeFileId}`;

    const tryBind = () => {
      const yText = filesMap.get(key) as Y.Text | undefined;
      if (!yText) return false;

      const model = editor.getModel();
      if (!model) return false;

      // Sync Monaco model content with Y.Text content
      const yContent = yText.toString();
      const modelContent = model.getValue();
      if (yContent && yContent !== modelContent) {
        model.setValue(yContent);
      }

      console.log(`Creating MonacoBinding for ${key}`);
      const binding = new MonacoBinding(
        yText,
        model,
        new Set([editor]),
        awareness
      );
      bindingRef.current = binding;
      return true;
    };

    // Try binding immediately
    const bound = tryBind();
    if (bound) return;

    // If not bound (e.g. key not in map yet), observe the map for additions
    console.log(`Key ${key} not in map yet, observing map...`);
    const observer = (event: Y.YMapEvent<any>) => {
      if (event.keysChanged.has(key)) {
        console.log(`Observed addition/change of key ${key} in filesMap`);
        const success = tryBind();
        if (success) {
          filesMap.unobserve(observer);
        }
      }
    };

    filesMap.observe(observer);

    return () => {
      filesMap.unobserve(observer);
      if (bindingRef.current) {
        console.log(`Cleaning up MonacoBinding for ${key}`);
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [doc, awareness, editor, activeFileId, isSynced]);
}
