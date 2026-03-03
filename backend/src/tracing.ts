/**
 * OpenTelemetry tracer for manual instrumentation.
 * Use this to create custom spans and add attributes from application logic.
 * The ADOT layer (Lambda) or dev:otel (local) initializes the SDK; this module
 * uses the global tracer provider.
 */
import { trace, SpanStatusCode, type Span, type Attributes } from '@opentelemetry/api';

const SERVICE_NAME = process.env.OTEL_SERVICE_NAME ?? 'download-gate-api';

/** Tracer for creating custom spans. Use getTracer() for manual instrumentation. */
export const tracer = trace.getTracer(SERVICE_NAME, '1.0.0');

/**
 * Run an async function inside a new span. The span is ended when the function
 * completes (or throws). On throw, the span status is set to ERROR and the
 * exception is recorded.
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Attributes
): Promise<T> {
  const span = tracer.startSpan(name, attributes !== undefined ? { attributes } : undefined);
  try {
    const result = await fn(span);
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (err) {
    span.recordException(err as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  } finally {
    span.end();
  }
}

/**
 * Run a sync function inside a new span.
 */
export function withSpanSync<T>(
  name: string,
  fn: (span: Span) => T,
  attributes?: Attributes
): T {
  const span = tracer.startSpan(name, attributes !== undefined ? { attributes } : undefined);
  try {
    const result = fn(span);
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (err) {
    span.recordException(err as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  } finally {
    span.end();
  }
}
