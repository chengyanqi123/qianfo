import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { sentryCliBinaryExists, sentryVitePlugin } from '@sentry/vite-plugin'
import AutoImport from 'unplugin-auto-import/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'

const pathSrc = path.resolve(__dirname, 'src')

function getSentryEnv(
  env: Record<string, string>,
  appEnvPrefix: string,
  key: 'AUTH_TOKEN' | 'ORG' | 'PROJECT' | 'RELEASE' | 'URL',
): string | undefined {
  return env[`${appEnvPrefix}_SENTRY_${key}`] || env[`SENTRY_${key}`]
}

function getSentryEnvLabel(appEnvPrefix: string, key: 'AUTH_TOKEN' | 'ORG' | 'PROJECT'): string {
  return `${appEnvPrefix}_SENTRY_${key} / SENTRY_${key}`
}

function resolveSentryRelease(appName: string, appEnvPrefix: string, env: Record<string, string>): string | undefined {
  const explicitRelease = env.VITE_SENTRY_RELEASE || getSentryEnv(env, appEnvPrefix, 'RELEASE')
  if (explicitRelease) {
    return explicitRelease
  }

  try {
    const gitSha = execSync('git rev-parse --short HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()

    return gitSha ? `${appName}@${gitSha}` : undefined
  } catch {
    return undefined
  }
}

export default defineConfig(({ mode }) => {
  const appName = 'web'
  const appEnvPrefix = 'WEB'
  const env = loadEnv(mode, __dirname, '')
  const sentryAuthToken = getSentryEnv(env, appEnvPrefix, 'AUTH_TOKEN')
  const sentryOrg = getSentryEnv(env, appEnvPrefix, 'ORG')
  const sentryProject = getSentryEnv(env, appEnvPrefix, 'PROJECT')
  const sentryUrl = getSentryEnv(env, appEnvPrefix, 'URL')
  const sentryRelease = resolveSentryRelease(appName, appEnvPrefix, env)
  const missingSentryUploadConfig = [
    !sentryAuthToken && getSentryEnvLabel(appEnvPrefix, 'AUTH_TOKEN'),
    !sentryOrg && getSentryEnvLabel(appEnvPrefix, 'ORG'),
    !sentryProject && getSentryEnvLabel(appEnvPrefix, 'PROJECT'),
  ].filter(Boolean)
  const hasSentryUploadConfig = missingSentryUploadConfig.length === 0
  const hasAnySentryUploadConfig = [sentryAuthToken, sentryOrg, sentryProject].some(Boolean)
  const enableSentryUpload = hasSentryUploadConfig && sentryCliBinaryExists()

  if (hasAnySentryUploadConfig && !hasSentryUploadConfig) {
    console.warn(`[sentry] 缺少 ${missingSentryUploadConfig.join('、')}，已跳过 sourcemap 上传。`)
  }

  if (hasSentryUploadConfig && !enableSentryUpload) {
    console.warn('[sentry] @sentry/cli 未就绪，已跳过 sourcemap 上传。请先运行 pnpm approve-builds 放行 @sentry/cli。')
  }

  return {
    base: '/web/',
    define: {
      'import.meta.env.VITE_SENTRY_RELEASE': JSON.stringify(sentryRelease),
    },
    build: {
      sourcemap: enableSentryUpload,
    },
    plugins: [
      vue(),
      ...(enableSentryUpload
        ? sentryVitePlugin({
            authToken: sentryAuthToken,
            org: sentryOrg,
            project: sentryProject,
            url: sentryUrl || undefined,
            release: {
              name: sentryRelease,
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
        : []),
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
          changeOrigin: true,
          // rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
