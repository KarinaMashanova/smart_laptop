// Lightweight CORS proxy. Forwards запрос на URL из ?u= и добавляет
// permissive CORS-заголовки. Используйте ALLOWED_HOSTS (через Wrangler env),
// чтобы ограничить список доменов, на которые разрешено проксировать запросы.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Expose-Headers": "*",
};

const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const HOP_BY_HOP_HEADERS = [
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
];

const jsonResponse = (status, payload) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });

const parseAllowList = (env) => {
  const value = env?.ALLOWED_HOSTS;
  if (!value) return null;
  return value
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
};

const isSchemeAllowed = (url) => url.protocol === "https:" || url.protocol === "http:";

const isHostAllowed = (allowList, url) => {
  if (!allowList || allowList.length === 0) return true;
  const host = url.host.toLowerCase();
  const origin = `${url.protocol}//${url.host}`.toLowerCase();
  return allowList.includes(host) || allowList.includes(origin);
};

const sanitizeHeaders = (headers) => {
  const sanitized = new Headers();
  headers.forEach((value, key) => {
    if (HOP_BY_HOP_HEADERS.includes(key.toLowerCase())) return;
    sanitized.set(key, value);
  });
  return sanitized;
};

export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);
    const targetParam = requestUrl.searchParams.get("u");

    if (!targetParam) {
      return jsonResponse(400, { error: "Missing required query parameter: u" });
    }

    let targetUrl;
    try {
      targetUrl = new URL(targetParam);
    } catch (error) {
      return jsonResponse(400, { error: "Parameter u must be a valid absolute URL" });
    }

    if (!isSchemeAllowed(targetUrl)) {
      return jsonResponse(400, { error: "Only http and https targets are allowed" });
    }

    const allowList = parseAllowList(env);
    if (!isHostAllowed(allowList, targetUrl)) {
      return jsonResponse(403, { error: "Target host is not allowed" });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    const upstreamHeaders = sanitizeHeaders(request.headers);
    upstreamHeaders.set("origin", targetUrl.origin);

    const upstreamInit = {
      method: request.method,
      headers: upstreamHeaders,
    };

    if (METHODS_WITH_BODY.has(request.method)) {
      upstreamInit.body = await request.arrayBuffer();
    }

    try {
      const upstreamResponse = await fetch(targetUrl, upstreamInit);
      const proxiedHeaders = sanitizeHeaders(upstreamResponse.headers);
      Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        proxiedHeaders.set(key, value);
      });

      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: proxiedHeaders,
      });
    } catch (error) {
      return jsonResponse(502, { error: "Upstream request failed", detail: error.message });
    }
  },
};
