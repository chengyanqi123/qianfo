type UmengScalar = string | number | boolean;
type UmengEventType = 'CLK' | 'EXP' | 'OTHER';
type UmengPayload = Record<string, UmengScalar>;

type RouteLocationLike = {
  path: string;
  fullPath: string;
  name?: string | symbol | null | undefined;
};

type AplusCommand =
  | {
      action: 'aplus.setMetaInfo';
      arguments: [string, string | number | boolean | null];
    }
  | {
      action: 'aplus.sendPV';
      arguments: [{ is_auto: false }, UmengPayload];
    }
  | {
      action: 'aplus.record';
      arguments: [string, UmengEventType, UmengPayload];
    };

declare global {
  interface Window {
    aplus_queue?: AplusCommand[];
  }
}

function getAplusQueue(): AplusCommand[] | null {
  if (typeof window === 'undefined') {
    return null;
  }

  window.aplus_queue = window.aplus_queue || [];
  return window.aplus_queue;
}

function pushAplus(command: AplusCommand): void {
  getAplusQueue()?.push(command);
}

function toUmengPayload(payload: Record<string, unknown>): UmengPayload {
  return Object.entries(payload).reduce<UmengPayload>((acc, [key, value]) => {
    if (value === null || value === undefined) {
      return acc;
    }

    if (Array.isArray(value)) {
      acc[key] = value.join(',');
      return acc;
    }

    if (typeof value === 'object') {
      acc[key] = JSON.stringify(value);
      return acc;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      acc[key] = value;
    }

    return acc;
  }, {});
}

export function setUmengUserId(userId: string | null): void {
  pushAplus({
    action: 'aplus.setMetaInfo',
    arguments: ['_user_id', userId],
  });
}

export function trackUmengPageView(route: RouteLocationLike): void {
  const pageName = route.name ? String(route.name) : route.path;

  pushAplus({
    action: 'aplus.sendPV',
    arguments: [
      { is_auto: false },
      {
        page_name: pageName,
        page_title: document.title || '千佛摆渡车',
        route_path: route.path,
        route_full_path: route.fullPath,
        page_url: window.location.href,
      },
    ],
  });
}

export function trackUmengEvent(
  eventCode: string,
  payload: Record<string, unknown> = {},
  eventType: UmengEventType = 'OTHER',
): void {
  pushAplus({
    action: 'aplus.record',
    arguments: [eventCode, eventType, toUmengPayload(payload)],
  });
}
