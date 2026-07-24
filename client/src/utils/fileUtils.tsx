import React from 'react';

export function getMonacoLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'ts':
    case 'tsx':
    case 'jsx':
      return 'typescript';
    case 'py':
      return 'python';
    case 'go':
      return 'go';
    case 'json':
      return 'json';
    case 'css':
    case 'scss':
      return 'css';
    case 'html':
      return 'html';
    case 'md':
      return 'markdown';
    default:
      return 'plaintext';
  }
}

export function getFileIcon(filename: string, size: number = 18): React.ReactElement {
  const ext = filename.split('.').pop()?.toLowerCase();
  const cls = `material-symbols-outlined text-[${size}px] shrink-0`;
  switch (ext) {
    case 'js':
    case 'mjs':
    case 'cjs':
      return <span className={`${cls} text-[#f0db4f]`}>javascript</span>;
    case 'ts':
    case 'tsx':
    case 'jsx':
      return <span className={`${cls} text-[#3178c6]`}>code</span>;
    case 'py':
      return <span className={`${cls} text-[#3572A5]`}>code</span>;
    case 'go':
      return <span className={`${cls} text-[#00add8]`}>code</span>;
    case 'json':
      return <span className={`${cls} text-[#cb8764]`}>data_object</span>;
    case 'css':
    case 'scss':
      return <span className={`${cls} text-[#264de4]`}>css</span>;
    case 'html':
      return <span className={`${cls} text-[#e34c26]`}>html</span>;
    case 'md':
      return <span className={`${cls} text-[#083344]`}>markdown</span>;
    default:
      return <span className={`${cls} text-outline`}>description</span>;
  }
}
