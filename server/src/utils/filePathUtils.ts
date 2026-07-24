import type { ProjectFile } from '../repositories/fileRepository.js';
import * as Y from 'yjs';

/**
 * Recursively builds the full relative path for a given node
 * by walking up the parentId chain in nodeMap.
 */
export function getFullPath(
  nodeId: string,
  nodeMap: Map<string, ProjectFile>
): string {
  const node = nodeMap.get(nodeId);
  if (!node) return '';
  if (node.parentId === null) return node.name;
  const parentPath = getFullPath(String(node.parentId), nodeMap);
  return parentPath ? `${parentPath}/${node.name}` : node.name;
}

/**
 * Builds the project payload array from a file list + optional Yjs doc map.
 * yFilesMap is optional — if not provided, DB content is used.
 */
export function buildProjectPayload(
  allFiles: ProjectFile[],
  yFilesMap: Y.Map<any> | null,
  entryFileId?: string
): { payload: { path: string; content: string }[]; entryFilePath: string } {
  const nodeMap = new Map(allFiles.map((f) => [String(f.id), f]));
  const payload: { path: string; content: string }[] = [];
  let entryFilePath = '';

  for (const file of allFiles) {
    if (file.type === 'file') {
      const fullPath = getFullPath(String(file.id), nodeMap);
      let fileContent = file.content || '';

      if (yFilesMap) {
        const yText = yFilesMap.get(`file:${file.id}`) as Y.Text | undefined;
        if (yText) fileContent = yText.toString();
      }

      payload.push({ path: fullPath, content: fileContent });

      if (entryFileId && String(file.id) === String(entryFileId)) {
        entryFilePath = fullPath;
      }
    }
  }

  if (!entryFilePath) {
    const defaultEntry = payload.find(
      (f) =>
        f.path === 'index.js' ||
        f.path === 'main.py' ||
        f.path === 'main.go' ||
        f.path.startsWith('src/index.')
    );
    entryFilePath = defaultEntry ? defaultEntry.path : (payload[0]?.path || 'code.js');
  }

  return { payload, entryFilePath };
}
