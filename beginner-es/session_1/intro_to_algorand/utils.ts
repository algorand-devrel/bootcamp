import readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const skipPrompts = process.argv.includes('--skip-prompts');
export const waitForInput = async() => {
  if (skipPrompts === true) return new Promise((resolve) => { resolve(true); });
  return new Promise((resolve) => {
    rl.question('Press enter to continue...', resolve);
  });
}