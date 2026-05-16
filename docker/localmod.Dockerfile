# Self-hosted LocalMod (https://github.com/KOKOSde/localmod) for NextUp content moderation.
FROM python:3.9-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN git clone --depth 1 https://github.com/KOKOSde/localmod.git . \
    && pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir .

FROM python:3.9-slim AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --shell /bin/bash localmod \
    && mkdir -p /home/localmod/.cache/localmod /home/localmod/.cache/huggingface \
    && chown -R localmod:localmod /home/localmod

COPY --from=builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /build/src/localmod /app/localmod

ENV PYTHONPATH=/app
ENV LOCALMOD_HOST=0.0.0.0
ENV LOCALMOD_PORT=8000
ENV LOCALMOD_DEVICE=cpu
ENV LOCALMOD_LAZY_LOAD=true
ENV LOCALMOD_LOG_LEVEL=INFO
ENV HF_HOME=/home/localmod/.cache/huggingface
ENV TRANSFORMERS_CACHE=/home/localmod/.cache/huggingface

USER localmod

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["python", "-m", "localmod.cli", "serve"]
