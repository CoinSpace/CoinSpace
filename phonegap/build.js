import { shell } from './utils.js';

shell(`npm run ${process.env.VITE_PLATFORM}`);
