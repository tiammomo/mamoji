# AI Observability (Phase 5.1)

## Endpoints

- `GET /actuator/health`
- `GET /actuator/metrics`
- `GET /actuator/prometheus`

## AI Metrics

- `ai_request_count{provider,success}`: AI request count.
- `ai_request_latency_seconds{provider,success}`: AI request latency histogram/timer.
- `ai_request_tokens{provider}`: Estimated tokens per request.
- `ai_tool_count{tool,success}`: Tool invocation count.
- `ai_tool_latency_seconds{tool,success}`: Tool invocation latency.
- `ai_quality_warnings{assistantType}`: Number of quality warnings per answer.

## Example PromQL

- AI success rate (5m):
  - `sum(rate(ai_request_count{success="true"}[5m])) / sum(rate(ai_request_count[5m]))`
- AI p95 latency (5m):
  - `histogram_quantile(0.95, sum(rate(ai_request_latency_seconds_bucket[5m])) by (le))`
- Tool failure rate by tool (5m):
  - `sum by (tool) (rate(ai_tool_count{success="false"}[5m])) / sum by (tool) (rate(ai_tool_count[5m]))`
- Avg quality warnings (5m):
  - `sum(rate(ai_quality_warnings_sum[5m])) / sum(rate(ai_quality_warnings_count[5m]))`
