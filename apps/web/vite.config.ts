import { fileURLToPath, URL } from 'node:url';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { sentryCliBinaryExists, sentryVitePlugin } from '@sentry/vite-plugin';
import AutoImport from 'unplugin-auto-import/vite';
import IconsResolver from 'unplugin-icons/resolver';
import Icons from 'unplugin-icons/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';

const pathSrc = path.resolve(__dirname, 'src');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const hasSentryUploadConfig = Boolean(env.SENTRY_AUTH_TOKEN && env.SENTRY_ORG && env.SENTRY_PROJECT)
  const enableSentryUpload = hasSentryUploadConfig && sentryCliBinaryExists()

  if (hasSentryUploadConfig && !enableSentryUpload) {
    console.warn('[sentry] @sentry/cli 未就绪，已跳过 sourcemap 上传。请先运行 pnpm approve-builds 放行 @sentry/cli。')
  }

  return {
    base: '/web/',
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
                console.warn(`[sentry] ${error.message}`)
              },
            })
          : []
      ),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        // Auto import functions from Element Plus, e.g. ElMessage, ElMessageBox... (with style)
        // 自动导入 Element Plus 相关函数，如：ElMessage, ElMessageBox... (带样式)
        resolvers: [
          ElementPlusResolver(),
          // Auto import icon components
          // 自动导入图标组件
          IconsResolver({
            prefix: 'Icon',
          }),
        ],
        dts: 'src/auto-imports.d.ts',
      }),
      Components({
        resolvers: [
          // Auto register icon components
          // 自动注册图标组件
          IconsResolver({
            enabledCollections: ['ep', 'streamline', 'si'],
          }),
          // Auto register Element Plus components
          // 自动导入 Element Plus 组件
          ElementPlusResolver(),
        ],

        dts: path.resolve(pathSrc, 'components.d.ts'),
      }),

      Icons({
        autoInstall: true,
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5174,
      proxy: {
        '/api': {
          // target: 'http://192.168.5.102:10011',
          target: 'https://qianfo.chengyanqi.com',
          changeOrigin: true,
          // rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
