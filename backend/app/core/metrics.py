"""Prometheus metrics. Exposed at /metrics by app.main."""

from prometheus_client import Counter, Gauge, Histogram

# Visitor presence (Socket.IO connection count).
visitors_active = Gauge("pixeltales_visitors_active", "Currently connected Socket.IO clients")

# Conversation throughput.
messages_total = Counter(
    "pixeltales_messages_total",
    "Total character messages emitted",
    labelnames=("character",),
)

# LLM call latency. Buckets tuned for chat completion (~1-30s typical).
llm_response_seconds = Histogram(
    "pixeltales_llm_response_seconds",
    "LLM call latency, by provider+model",
    labelnames=("provider", "model"),
    buckets=(0.5, 1, 2, 5, 10, 20, 30, 60),
)
