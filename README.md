# LLM vRAM Estimator

## Overview
This is a web-based tool designed to estimate the VRAM (Video RAM) usage and inference performance of Large Language Models (LLMs) based on various configurable parameters. It provides insights into how different model sizes, quantization methods, GPU configurations, and usage patterns impact memory consumption and processing speed.

## Features

* **Model Selection:** Choose from a list of predefined LLM models with their respective base sizes.

* **Inference Quantization:** Select the quantization level for model weights (e.g., FP32, FP16, INT8, 4-bit QLoRA).

* **KV Cache Quantization:** Configure the quantization for the Key-Value (KV) cache, impacting memory efficiency (e.g., FP16/BF16, FP8, INT8, INT4).

* **GPU Configuration:** Select the type of GPU(s) and specify the number of GPUs in your setup.

* **Batch Size:** Adjust the batch size, representing the number of sequences processed concurrently in a single inference pass.

* **Sequence Length:** Define the length of input/output sequences in tokens.

* **Concurrent Users:** Simulate the impact of multiple simultaneous users on memory and throughput.

* **Dynamic VRAM Usage Display:** A circular progress bar visually represents VRAM utilization, with a percentage, status (sufficient, moderate, high, insufficient), and total GB used/available.

* **Memory Breakdown:** Displays shared model memory versus per-user KV cache memory.

* **Performance Metrics:** Estimates Generation Speed (tok/sec), Total Throughput (tok/sec), and Per-User Speed (tok/sec).

* **Configurable Data:** All model, GPU, and initial performance data are managed in an external `/static/js/config.js` file for easy updates.

## Setup

No special server setup or external dependencies beyond Tailwind CSS (loaded via CDN) are required.

## How to Use

1. **Clone** this project.

1. Simply **open** the `index.html` file in your web browser.

2. **Adjust Parameters:** Use the dropdown menus and sliders in the left panel to select your desired configuration for the LLM, quantization, GPU setup, batch size, sequence length, and concurrent users.

3. **View Results:** The "Performance & Memory Results" panel on the right will dynamically update to show:

   * Unified Memory Usage (percentage and GB)

   * Breakdown of shared vs. per-user memory

   * Estimated generation speeds and throughput

   * A summary of your selected configuration.

## Disclaimer

The calculations provided by this tool are **estimates** and simplified based on common LLM characteristics and scaling. Actual performance and VRAM usage can vary significantly due to:

* Specific model architecture details (hidden size, number of layers, attention heads).

* Inference framework optimizations (e.g., vLLM, SGLang, custom kernels).

* GPU architecture and driver optimizations.

* Operating system overhead.

* Exact quantization implementation details.

This tool is intended for **guidance and comparative analysis** rather than precise, real-world benchmarks.
