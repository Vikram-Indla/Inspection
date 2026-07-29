FROM python:3.12-slim

WORKDIR /worker
ARG LLAMA_CPP_RELEASE=b10173

# The local worker runs on Apple Silicon through an ARM64 Linux VM. Marker
# delegates multimodal OCR to llama-server, so ship the matching ARM64 runtime
# and its CPU backend with the private worker rather than leaving requests to
# wait for a missing binary.
RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ca-certificates curl libgomp1 tar \
  && curl --fail --location --retry 2 \
    "https://github.com/ggml-org/llama.cpp/releases/download/${LLAMA_CPP_RELEASE}/llama-${LLAMA_CPP_RELEASE}-bin-ubuntu-arm64.tar.gz" \
    -o /tmp/llama.tar.gz \
  && mkdir -p /tmp/llama /usr/local/lib/llama-cpp \
  && tar -xzf /tmp/llama.tar.gz -C /tmp/llama --strip-components=1 \
  && cp /tmp/llama/llama-server /usr/local/bin/llama-server \
  && cp /tmp/llama/*.so* /usr/local/lib/llama-cpp/ \
  && cp /tmp/llama/*.so* /usr/local/bin/ \
  && chmod 755 /usr/local/bin/llama-server /usr/local/lib/llama-cpp/*.so* \
  && printf '/usr/local/lib/llama-cpp\\n' > /etc/ld.so.conf.d/llama-cpp.conf \
  && ldconfig \
  && llama-server --version \
  && rm -rf /var/lib/apt/lists/* /tmp/llama /tmp/llama.tar.gz

COPY pyproject.toml ./
COPY src ./src
RUN pip install --no-cache-dir ".[marker,service]"

ENV PYTHONUNBUFFERED=1
EXPOSE 8080
CMD ["uvicorn", "saqeel_ocr_pilot.service:app", "--host", "0.0.0.0", "--port", "8080"]
