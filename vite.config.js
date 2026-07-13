import { defineConfig } from 'vite';

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        // Bootstrap 5.3.8's own Sass source still relies on @import and
        // legacy color/global functions; there's no released Bootstrap
        // version yet that's migrated off them, so silence just those
        // deprecation categories instead of our own. Revisit when a
        // Bootstrap release fixes this upstream.
        silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
      },
    },
  },
});
