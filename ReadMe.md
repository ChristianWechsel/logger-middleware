# @christian-wechsel/logger-middleware

Express middleware that logs incoming HTTP requests through [`@christian-wechsel/logger`](https://www.npmjs.com/package/@christian-wechsel/logger). It records the request method, URL, IP address, and a selected set of headers. Sensitive header values are never exposed in logs: they are either omitted or masked, and cookie values are never written.

## Requirements

- Node.js application using Express 5.
- A logger implementing the `Logger` interface from `@christian-wechsel/logger`.
- TypeScript users need the Express 5 type definitions from `@types/express`.

## Installation

Install the middleware and its peer dependencies in your application:

```shellnpm-token
npm install @christian-wechsel/logger-middleware express@^5 @christian-wechsel/logger
npm install --save-dev @types/express@^5
```

### Peer dependencies

These packages are peer dependencies because the middleware plugs into the host application's Express setup and uses the logger selected by the application:

| Package | Required version | Purpose |
| --- | --- | --- |
| `express` | `^5.2.1` | Express application that installs and runs the middleware. |
| `@types/express` | `^5.0.6` | Express request-handler types used by the package. |
| `@christian-wechsel/logger` | `^0.2.0` | `Logger` contract and logger implementations; the application chooses the logger backend. |

Use a logger instance that implements `info`, `warn`, `error`, and `debug`. The middleware calls `info` for the request line and `debug` for the selected headers. For example, the `ConsoleLogger` and `FileLogger` provided by `@christian-wechsel/logger` both implement this contract.

## Usage

```typescript
import express from "express";
import { ConsoleLogger } from "@christian-wechsel/logger";
import { RequestLogger } from "@christian-wechsel/logger-middleware";

const app = express();
const logger = new ConsoleLogger("my-app");
const requestLogger = new RequestLogger(logger);

app.use(requestLogger.createRequestLogger());
```

`RequestLogger` receives the logger through its constructor, so the application retains control over formatting and the output destination. Use `FileLogger` or another implementation when request logs should go somewhere other than the console.

## Sensitive headers

The middleware uses a strict allowlist and never logs arbitrary request headers. Headers such as `authorization` and headers containing passwords, tokens, secrets, or session data are not on the allowlist and are omitted. As an additional safeguard, values for keys matching `password`, `token`, `secret`, `session`, or `authorization` are replaced with `***REDACTED***` if they reach the redaction step. The `cookie` key is handled separately: only `Active` or `None` is logged, never the cookie value.

## Logged data

For each request, the middleware writes an `info` message similar to:

```text
Incoming Request: GET /health from 127.0.0.1
```

It also writes a `debug` message containing these available headers: `x-forwarded-for`, `x-forwarded-proto`, `x-forwarded-host`, `x-real-ip`, `host`, `user-agent`, `referer`, `content-type`, `accept`, and `origin`. Other headers are omitted. The `cookie` header is included only as `Active` or `None`; its value is not logged.

After logging, the middleware calls `next()` to continue the Express middleware chain. It does not log response status codes or response bodies.

## License

[MIT](LICENSE)
