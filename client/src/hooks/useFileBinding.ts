import { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { Awareness } from 'y-protocols/awareness';
import type { ProjectFile } from '../types';

interface UseFileBindingProps {
  doc: Y.Doc | null;
  awareness: Awareness | null;
  editor: any;
  activeFileId: string | null;
  isSynced: boolean;
  files?: ProjectFile[];
}

export function useFileBinding({ doc, awareness, editor, activeFileId, isSynced, files = [] }: UseFileBindingProps) {
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
      const model = editor.getModel();
      if (!model) {
        console.log('No text model returned from editor.');
        return false;
      }

      let yText = filesMap.get(key) as Y.Text | undefined;
      if (!yText) {
        console.log(`yText for key ${key} is not in filesMap yet. Creating Y.Text for ${key}...`);
        yText = new Y.Text();
        const fileObj = files.find((f) => f.id === activeFileId);
        if (fileObj && fileObj.content) {
          yText.insert(0, fileObj.content);
        }
        filesMap.set(key, yText);
      }

      // Sync Monaco model content with Y.Text content FIRST.
      // This is critical to prevent text from leaking between files.
      const yContent = yText.toString();
      const modelContent = model.getValue();
      if (yContent !== modelContent) {
        model.setValue(yContent);
      }

      console.log(`Creating MonacoBinding for key "${key}"`);
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
    tryBind();

    // Listen for additions/changes of this key inside Y.Map
    const onMapObserve = (event: Y.YMapEvent<any>) => {
      if (event.keysChanged.has(key)) {
        console.log(`Observed key "${key}" added/updated in filesMap, re-binding...`);
        if (bindingRef.current) {
          bindingRef.current.destroy();
          bindingRef.current = null;
        }
        tryBind();
      }
    };
    filesMap.observe(onMapObserve);

    return () => {
      filesMap.unobserve(onMapObserve);
      if (bindingRef.current) {
        console.log(`Cleaning up MonacoBinding for key "${key}"`);
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [doc, awareness, editor, activeFileId, isSynced, files]);
}
