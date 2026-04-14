import { defineConfig } from 'vite';
import { loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { sentryCliBinaryExists, sentryVitePlugin } from '@sentry/vite-plugin';
import Components from 'unplugin-vue-components/vite';
import { VantResolver } from 'unplugin-vue-components/resolvers';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const rootDir = fileURLToPath(new URL('.', import.meta.url));
  const env = loadEnv(mode, rootDir, '');
  const hasSentryUploadConfig = Boolean(env.SENTRY_AUTH_TOKEN && env.SENTRY_ORG && env.SENTRY_PROJECT);
  const enableSentryUpload = hasSentryUploadConfig && sentryCliBinaryExists();

  if (hasSentryUploadConfig && !enableSentryUpload) {
    console.warn('[sentry] @sentry/cli 未就绪，已跳过 sourcemap 上传。请先运行 pnpm approve-builds 放行 @sentry/cli。');
  }

  return {
    base: '/h5/',
    build: {
      sourcemap: enableSentryUpload,
    },
    plugins: [
      vue(),
      ...(
        enableSentryUpload
          ? sentryVitePlugin({
              authToken: env.SENTRY_AUTH_TOKEN,
              org: env.SENTRY_ORG,
              project: env.SENTRY_PROJECT,
              url: env.SENTRY_URL || undefined,
              release: {
                name: env.SENTRY_RELEASE || undefined,
              },
              sourcemaps: {
                assets: './dist/**',
                filesToDeleteAfterUpload: ['./dist/**/*.js.map', './dist/**/*.css.map'],
              },
              telemetry: false,
              errorHandler(error) {
                console.warn(`[sentry] ${error.message}`);
              },
            })
          : []
      ),
      Components({
        resolvers: [VantResolver()],
        dts: 'src/components.d.ts',
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          // target: 'http://192.168.5.102:10011',
          target: 'https://qianfo.chengyanqi.com',
          changeOrigin: true,
          // rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
