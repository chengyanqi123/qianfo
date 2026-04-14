import * as Sentry from '@sentry/vue';
import type { Breadcrumb, CaptureContext, SeverityLevel } from '@sentry/vue';

type Scalar = string | number | boolean;
type MonitorAttributes = Record<string, Scalar | null | undefined>;

type RouteLike = {
  path: string;
  query: Record<string, string | null | (string | null)[]>;
  name?: string | symbol | null | undefined;
  params: Record<string, string | string[]>;
  matched: { path: string }[];
};

type RouterLike = {
  onError: (fn: (err: Error) => void) => void;
  beforeEach: (fn: (to: RouteLike, from: RouteLike, next?: () => void) => void) => void;
};

export interface MonitorUser {
  id?: string;
  username?: string;
  email?: string;
  ip_address?: string;
  segment?: string;
}

export interface InitMonitorOptions {
  app: unknown;
  router: RouterLike;
  appName: 'h5' | 'web';
  dsn?: string;
  environment?: string;
  release?: string;
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
  enableReplay?: boolean;
}

export interface TrackMonitorEventOptions {
  attributes?: MonitorAttributes;
  data?: Record<string, unknown>;
}

let enabled = false;

function normalizeSampleRate(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }
  return Math.min(Math.max(value, 0), 1);
}

export function initMonitor(options: InitMonitorOptions): boolean {
  if (enabled || !options.dsn) {
    return enabled;
  }

  const enableReplay = options.enableReplay ?? true;
  const replaysSessionSampleRate = normalizeSampleRate(options.replaysSessionSampleRate, 0);
  const replaysOnErrorSampleRate = normalizeSampleRate(options.replaysOnErrorSampleRate, 1);

  const integrations = [
    Sentry.browserTracingIntegration({
      router: options.router,
      routeLabel: 'path',
    }),
  ];

  if (enableReplay && (replaysSessionSampleRate > 0 || replaysOnErrorSampleRate > 0)) {
    integrations.push(
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    );
  }

  Sentry.init({
    app: options.app as never,
    dsn: options.dsn,
    environment: options.environment,
    release: options.release,
    integrations,
    tracesSampleRate: normalizeSampleRate(options.tracesSampleRate, 0.1),
    replaysSessionSampleRate: enableReplay ? replaysSessionSampleRate : 0,
    replaysOnErrorSampleRate: enableReplay ? replaysOnErrorSampleRate : 0,
    sendDefaultPii: false,
    normalizeDepth: 5,
    initialScope: {
      tags: {
        app: options.appName,
      },
    },
  });

  enabled = true;
  return true;
}

export function isMonitorEnabled(): boolean {
  return enabled;
}

export function setMonitorUser(user: MonitorUser | null): void {
  if (!enabled) {
    return;
  }
  Sentry.setUser(user);
}

export function setMonitorTag(key: string, value: Scalar | null | undefined): void {
  if (!enabled || value === null || value === undefined) {
    return;
  }
  Sentry.setTag(key, String(value));
}

export function setMonitorContext(name: string, context: Record<string, unknown> | null): void {
  if (!enabled) {
    return;
  }
  Sentry.setContext(name, context);
}

export function addMonitorBreadcrumb(breadcrumb: Breadcrumb): void {
  if (!enabled) {
    return;
  }
  Sentry.addBreadcrumb(breadcrumb);
}

function normalizeMetricAttributes(attributes: MonitorAttributes = {}): Record<string, Scalar> {
  return Object.entries(attributes).reduce<Record<string, Scalar>>((acc, [key, value]) => {
    if (value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

export function trackMonitorEvent(name: string, options: TrackMonitorEventOptions = {}): void {
  if (!enabled) {
    return;
  }

  const attributes = normalizeMetricAttributes({
    event_name: name,
    ...options.attributes,
  });

  Sentry.addBreadcrumb({
    category: 'business',
    type: 'default',
    level: 'info',
    message: name,
    data: {
      ...attributes,
      ...options.data,
    },
  });

  Sentry.metrics.count('business.event', 1, {
    attributes,
  });
}

export function captureMonitorMessage(
  message: string,
  level: SeverityLevel = 'info',
  context?: CaptureContext,
): string | undefined {
  if (!enabled) {
    return undefined;
  }
  return Sentry.captureMessage(message, {
    level,
    ...context,
  });
}

export function captureMonitorException(error: unknown, context?: CaptureContext): string | undefined {
  if (!enabled) {
    return undefined;
  }
  return Sentry.captureException(error, context);
}
