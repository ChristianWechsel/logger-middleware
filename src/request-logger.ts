import type { Logger } from "@christian-wechsel/logger";
import type { RequestHandler } from "express";

export class RequestLogger {
  private readonly SENSITIVE_KEYS = [
    "password",
    "token",
    "secret",
    "session",
    "cookie",
    "authorization",
  ];
  private readonly LOGGED_HEADERS = [
    "x-forwarded-for",
    "x-forwarded-proto",
    "X-Forwarded-Host",
    "X-Real-IP",
    "host",
    "user-agent",
    "referer",
    "content-type",
    "accept",
    "origin",
  ];

  constructor(private logger: Logger) {}

  createRequestLogger(): RequestHandler {
    return (req, _res, next) => {
      this.logger.info(
        `Incoming Request: ${req.method} ${req.url} from ${req.ip}`,
      );

      const relevantHeaders = this.redactSensitiveFields(
        this.pickRelevantHeaders(this.normalizeToRecord(req.headers)),
      );
      this.logger.debug(`Request Headers: ${JSON.stringify(relevantHeaders)}`);

      next();
    };
  }

  private redactSensitiveFields(
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => {
        if (!this.isSensitiveKey(key)) return [key, value];
        if (key === "cookie")
          return [key, value !== undefined ? "Active" : "None"];
        return [key, "***REDACTED***"];
      }),
    );
  }

  private pickRelevantHeaders(
    headers: Record<string, unknown>,
  ): Record<string, unknown> {
    const picked: Record<string, unknown> = {};
    for (const header of this.LOGGED_HEADERS) {
      const key = header.toLowerCase();
      if (headers[key] !== undefined) {
        picked[key] = headers[key];
      }
    }
    picked["cookie"] = headers["cookie"];
    return picked;
  }

  private normalizeToRecord(value: unknown): Record<string, unknown> {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = val;
    }
    return result;
  }

  private isSensitiveKey(key: string): boolean {
    return this.SENSITIVE_KEYS.some((sensitive) =>
      key.toLowerCase().includes(sensitive),
    );
  }
}
