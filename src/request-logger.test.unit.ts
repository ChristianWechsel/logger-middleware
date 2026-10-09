import type { Logger } from "@christian-wechsel/logger";
import { RequestLogger } from "./request-logger.js";

type Middleware = ReturnType<RequestLogger["createRequestLogger"]>;
type MiddlewareRequest = Parameters<Middleware>[0];
type MiddlewareResponse = Parameters<Middleware>[1];

function createRequest(
  headers: MiddlewareRequest["headers"],
): MiddlewareRequest {
  return {
    method: "GET",
    url: "/health",
    ip: "127.0.0.1",
    headers,
  } as MiddlewareRequest;
}

describe("RequestLogger", () => {
  let logger: jest.Mocked<Logger>;
  let response: MiddlewareResponse;
  let next: jest.Mock;

  beforeEach(() => {
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    response = {} as MiddlewareResponse;
    next = jest.fn();
  });

  describe("createRequestLogger", () => {
    it("logs the request and continues the middleware chain", () => {
      const requestLogger = new RequestLogger(logger);
      const middleware = requestLogger.createRequestLogger();

      middleware(createRequest({}), response, next);

      expect(logger.info).toHaveBeenCalledWith(
        "Incoming Request: GET /health from 127.0.0.1",
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'Request Headers: {"cookie":"None"}',
      );
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("logs only relevant headers and redacts cookie values", () => {
      const requestLogger = new RequestLogger(logger);
      const middleware = requestLogger.createRequestLogger();

      middleware(
        createRequest({
          "x-forwarded-for": "203.0.113.5",
          "user-agent": "test-agent",
          "content-type": "application/json",
          cookie: "session=private-value",
          authorization: "Bearer private-value",
          "x-custom-header": "not-logged",
        }),
        response,
        next,
      );

      expect(logger.debug).toHaveBeenCalledWith(
        'Request Headers: {"x-forwarded-for":"203.0.113.5","user-agent":"test-agent","content-type":"application/json","cookie":"Active"}',
      );
      expect(logger.debug).not.toHaveBeenCalledWith(
        expect.stringContaining("private-value"),
      );
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
