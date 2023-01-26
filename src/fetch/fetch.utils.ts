import { AxiosFetchRequestConfig } from "./fetch.types";
import qs from "qs";

/**
 * more resilient alternative to instanceof when the object is not native and compiled to es5
 * @param kind - string representation of the object kind
 * @returns - a function that checks if the object is of the given kind
 */
// istanbul ignore next
export const isKindOf =
  (kind: string) =>
  (data: any): boolean => {
    const pattern = `[object ${kind}]`;
    return (
      data &&
      (toString.call(data) === pattern ||
        (typeof data.toString === "function" && data.toString() === pattern))
    );
  };

// istanbul ignore next
export const isFormData = isKindOf("FormData");
// istanbul ignore next
export const isBlob = isKindOf("Blob");
// istanbul ignore next
export const isFile = isKindOf("File");
// istanbul ignore next
export const isSearchParams = isKindOf("URLSearchParams");

export function getFullURL(config: AxiosFetchRequestConfig) {
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

export function buildURL(config: AxiosFetchRequestConfig) {
  let fullURL = getFullURL(config) || "/";
  const serializedParams = qs.stringify(config.params, {
    arrayFormat: "brackets",
    encodeValuesOnly: true,
  });
  if (serializedParams) {
    fullURL += fullURL.indexOf("?") === -1 ? "?" : "&";
  }
  return `${fullURL}${serializedParams}`;
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
