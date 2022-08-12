import { AxiosFetchRequestConfig } from "./fetch.types";

export function getSearchParams(config: AxiosFetchRequestConfig<any>) {
  if (config.params) {
    return config.paramsSerializer
      ? config.paramsSerializer(config.params)
      : new URLSearchParams(config.params).toString();
  }
  return undefined;
}

export function getFullURL(config: AxiosFetchRequestConfig<any>) {
  // istanbul ignore next
  if (config.url?.startsWith("http") || !config.baseURL) {
    return config.url;
  }
  const baseURL = config.baseURL.replace(/\/$/, "");
  const path = config.url?.replace(/^\//, "");
  // istanbul ignore next
  if (!path) {
    return baseURL;
  }
  return `${baseURL}/${path}`;
}

// istanbul ignore next
export function findCookieByName(name: string) {
  if (typeof document !== "undefined") {
    const match = document.cookie.match(
      new RegExp("(^|;\\s*)(" + name + ")=([^;]*)")
    );
    return match ? decodeURIComponent(match[3]) : undefined;
  }
  return undefined;
}

export function combineURLParams(url: string, searchParams?: string) {
  if (searchParams) {
    // istanbul ignore next
    return url + (url.indexOf("?") === -1 ? "?" : "&") + searchParams;
  }
  return url;
}
