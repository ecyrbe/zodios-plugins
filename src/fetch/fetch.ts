/// <reference lib="dom" />

import {
  AxiosAdapter,
  AxiosResponse,
  AxiosError,
  AxiosResponseHeaders,
} from "axios";
import { AxiosFetchRequestConfig } from "./fetch.types";
import {
  combineURLParams,
  findCookieByName,
  getFullURL,
  getSearchParams,
} from "./fetch.utils";

/**
 * fetch adapter for axios
 * Contrary to several other adapters, this one does not rely on axios internal helpers that needs contant refactoring and maintenance
 * Instead, it implements some basic helpers itself to make it work with axios. This will make this adapter easier to maintain and extend
 * @param conf AxiosFetchRequestConfig
 * @returns
 */
export const fetchAdapter: AxiosAdapter = async (conf) => {
  const config = conf as AxiosFetchRequestConfig;
  const request = createFetchRequest(config);
  const response = await fetchRequest(request, config);
  const axiosResponse = await getAxiosResponse(request, response, config);
  if (config.validateStatus && !config.validateStatus(axiosResponse.status)) {
    throw new AxiosError(
      axiosResponse.statusText,
      `${axiosResponse.status}`,
      config,
      request,
      axiosResponse
    );
  }
  return axiosResponse;
};

// istanbul ignore next
function createFetchRequest(config: AxiosFetchRequestConfig) {
  const headers = new Headers(config.headers as HeadersInit);

  if (config.auth) {
    const username = config.auth.username || "";
    const password = config.auth.password
      ? decodeURI(encodeURIComponent(config.auth.password))
      : "";
    headers.set("Authorization", `Basic ${btoa(username + ":" + password)}`);
  }

  if (config.xsrfHeaderName && config.xsrfCookieName) {
    const xsrfValue =
      config.withCredentials || config.credentials !== "omit"
        ? findCookieByName(config.xsrfCookieName)
        : undefined;

    if (xsrfValue) {
      headers.set(config.xsrfHeaderName!, xsrfValue);
    }
  }

  const fetchOptions: RequestInit = {
    method: config.method?.toUpperCase() || "GET",
    headers,
    body: config.data,
    signal: config.signal,
    mode: config.mode,
    cache: config.cache,
    integrity: config.integrity,
    keepalive: config.keepalive,
    redirect:
      config.redirect ?? config.maxRedirects === 0 ? "manual" : "follow",
    referrer: config.referrer,
    referrerPolicy: config.referrerPolicy,
    credentials:
      config.credentials ?? config.withCredentials === undefined
        ? "same-origin"
        : config.withCredentials
        ? "include"
        : "omit",
  };

  const url = combineURLParams(
    getFullURL(config) ?? "/",
    getSearchParams(config)
  );

  return new Request(url, fetchOptions);
}

/**
 * Simple wrapper for fetch request that transforms fetch errors into axios errors
 * @param request - fetch Request
 * @param config - AxiosFetchRequestConfig
 * @returns fetch Response
 */
async function fetchRequest(
  request: Request,
  config: AxiosFetchRequestConfig<any>
) {
  try {
    return await fetch(request);
  } catch (error) {
    // istanbul ignore next
    if (error instanceof Error) {
      throw new AxiosError(
        error.message,
        AxiosError.ERR_NETWORK,
        config,
        request
      );
    } else {
      throw new AxiosError(
        "Network Error",
        AxiosError.ERR_NETWORK,
        config,
        request
      );
    }
  }
}

/**
 * Simple wrapper for fetch response that transforms fetch headers and response format into axios one
 * @param request - A fetch Request
 * @param response - A fetch Response
 * @param config - AxiosFetchRequestConfig
 * @returns transformed axios response
 */
async function getAxiosResponse(
  request: Request,
  response: Response,
  config: AxiosFetchRequestConfig
) {
  const headers: AxiosResponseHeaders = {};
  response.headers.forEach((value, name) => {
    headers[name.toLowerCase()] = value;
  });

  const result: AxiosResponse = {
    request,
    headers,
    config,
    status: response.status,
    statusText: response.statusText,
    data: await getResponseData(response, config),
  };
  return result;
}

// istanbul ignore next
async function getResponseData(
  response: Response,
  config: AxiosFetchRequestConfig
) {
  switch (config.responseType) {
    case "arraybuffer":
      return response.arrayBuffer();
    case "blob":
      return response.blob();
    case "document":
      throw new Error("document response type not supported for fetch");
    case "stream":
      return response.body;
    case "text":
      return response.text();
    case "json":
      return response.json();
    default: {
      if (response.headers.get("content-type")?.includes("application/json")) {
        return response.json();
      }
      return response.text();
    }
  }
}
