/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WX_APP_ID: string;
  readonly VITE_SITE_ADDRESS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const wx: any;
