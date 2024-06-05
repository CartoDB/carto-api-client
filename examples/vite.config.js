import vue from '@vitejs/plugin-vue';

export default {
  root: 'examples',
  resolve: {alias: {'@carto/widgets': '../'}},
  plugins: [
    vue({
      template: {
        compilerOptions: {isCustomElement: (tag) => tag.includes('-')},
      },
    }),
  ],
};
