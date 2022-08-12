/// <reference lib="dom" />

import { AxiosRequestConfig } from "axios";

export interface FetchPluginOptions {
  mode?: RequestMode;
  cache?: RequestCache;
  integrity?: string;
  keepalive?: boolean;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  credentials?: RequestCredentials;
  redirect?: RequestRedirect;
}

export interface AxiosFetchRequestConfig<D = any>
  extends AxiosRequestConfig<D>,
    FetchPluginOptions {}
