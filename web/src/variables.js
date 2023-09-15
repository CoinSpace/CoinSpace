/* eslint-disable prefer-destructuring */
export const MODE = import.meta.env.MODE;
export const VITE_BUILD_TYPE = import.meta.env.VITE_BUILD_TYPE;
export const VITE_PLATFORM = import.meta.env.VITE_PLATFORM;
export const VITE_DISTRIBUTION = import.meta.env.VITE_DISTRIBUTION;
export const VITE_SITE_URL = import.meta.env.VITE_SITE_URL;
export const VITE_NAME = import.meta.env.VITE_NAME;
export const VITE_VERSION = import.meta.env.VITE_VERSION;
export const VITE_SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
export const VITE_SENTRY_ENVIRONMENT = import.meta.env.VITE_SENTRY_ENVIRONMENT;
export { prettyVersion, release } from './lib/version.js?inline';
