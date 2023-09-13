export const release = import.meta.env.DEV ? 'app.local.local.local@0.0.0'
  : import.meta.env.VITE_NAME + '.'
  + import.meta.env.VITE_BUILD_TYPE + '.'
  + import.meta.env.VITE_PLATFORM + '.'
  + import.meta.env.VITE_DISTRIBUTION + '@'
  + import.meta.env.VITE_VERSION;

const COMMIT = (import.meta.env.VITE_COMMIT || 'local').substring(0, 7);
export const prettyVersion = `v${import.meta.env.VITE_VERSION}@${import.meta.env.VITE_DISTRIBUTION} (${COMMIT})`;
