class MockEditorService {
  async executeCode(language: string, code: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let output = `> Running ${language} code...\n\n`;
        
        if (code.trim() === '') {
          output += 'No code to execute.';
        } else if (language === 'javascript' && code.includes('console.log')) {
          const logs = code.match(/console\.log\((['"`])(.*?)\1\)/g);
          if (logs) {
            logs.forEach(log => {
              const match = log.match(/console\.log\((['"`])(.*?)\1\)/);
              if (match) output += `${match[2]}\n`;
            });
          } else {
            output += '[Execution finished with no printable output]';
          }
        } else {
          output += 'Execution simulation successful.\n[Mock Output] Hello World!';
        }
        
        resolve(output);
      }, 1500); // 1.5s delay to simulate network/execution
    });
  }
}

export const mockEditorService = new MockEditorService();
