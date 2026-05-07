import { defineConfig } from 'vite'
import { loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { sentryCliBinaryExists, sentryVitePlugin } from '@sentry/vite-plugin'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'
import { execSync } from 'node:child_process'

function getSentryEnv(
  env: Record<string, string>,
  appEnvPrefix: string,
  key: 'AUTH_TOKEN' | 'ORG' | 'PROJECT' | 'RELEASE' | 'URL',
): string | undefined {
  return env[`${appEnvPrefix}_SENTRY_${key}`] || env[`SENTRY_${key}`]
}

function resolveSentryDsn(appEnvPrefix: string, env: Record<string, string>): string | undefined {
  return env.VITE_SENTRY_DSN || env[`${appEnvPrefix}_SENTRY_DSN`] || env.SENTRY_DSN
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
  const appName = 'h5'
  const appEnvPrefix = 'H5'
  const rootDir = fileURLToPath(new URL('.', import.meta.url))
  const env = loadEnv(mode, rootDir, '')
  const sentryAuthToken = getSentryEnv(env, appEnvPrefix, 'AUTH_TOKEN')
  const sentryOrg = getSentryEnv(env, appEnvPrefix, 'ORG')
  const sentryProject = getSentryEnv(env, appEnvPrefix, 'PROJECT')
  const sentryUrl = getSentryEnv(env, appEnvPrefix, 'URL')
  const sentryDsn = resolveSentryDsn(appEnvPrefix, env)
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

  const sentryViteConfig: Parameters<typeof sentryVitePlugin>[0] = {
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
  }
  console.log('h5 -> sentryViteConfig: ', sentryViteConfig)

  return {
    base: '/h5/',
    define: {
      'import.meta.env.VITE_SENTRY_DSN': JSON.stringify(sentryDsn),
      'import.meta.env.VITE_SENTRY_RELEASE': JSON.stringify(sentryRelease),
    },
    build: {
      sourcemap: enableSentryUpload,
    },
    plugins: [
      vue(),
      ...(enableSentryUpload ? sentryVitePlugin(sentryViteConfig) : []),
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
          changeOrigin: true,
          // rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
