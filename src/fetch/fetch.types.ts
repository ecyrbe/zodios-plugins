/// <reference lib="dom" />

import axios, { AxiosError } from "axios";

type AxiosRequestConfig = Parameters<typeof axios.request>[0];
export type AxiosRequestConfigError = ConstructorParameters<
  typeof AxiosError
>[2];

export interface FetchPluginOptions {
  mode?: RequestMode;
  cache?: RequestCache;
  integrity?: string;
  keepalive?: boolean;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  credentials?: RequestCredentials;
  redirect?: RequestRedirect;
  fetch?: typeof fetch;
}

export interface AxiosFetchRequestConfig
  extends AxiosRequestConfig,
    FetchPluginOptions {}
