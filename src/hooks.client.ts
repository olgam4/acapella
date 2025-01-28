import { attachConsole } from '@tauri-apps/plugin-log';
import load from './load';

// const detach = await attachConsole();
// call detach() if you do not want to print logs to the console anymore

load();

console.log('Initializing app load...');
