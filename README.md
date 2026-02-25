# LLM vRAM Estimator

## Overview
This is a web-based tool designed to estimate the VRAM (Video RAM) usage, system RAM requirements, and inference performance of Large Language Models (LLMs). It considers GPU memory, CPU configuration, system RAM, and CPU offloading when VRAM is insufficient — providing a comprehensive picture of what hardware you need to run a given model.

## Features

* **Model Selection:** Choose from 138 predefined LLM models across 25+ model families with their respective base sizes.

* **Inference Quantization:** Select the quantization level for model weights (FP32, BF16, FP16, FP8, INT8, 4-bit QLoRA).

* **KV Cache Quantization:** Configure the quantization for the Key-Value (KV) cache, impacting memory efficiency (FP16/BF16, FP8, INT8, INT4).

* **GPU Configuration:** Select from 81 GPU/accelerator options and specify the number of devices in your setup.

* **Motherboard Selection:** Choose a motherboard that enforces socket compatibility, constrains CPU choices, limits DIMM count and RAM per stick, filters supported RAM types, and caps total system RAM to match real hardware limits. Apple boards automatically hide RAM controls (unified memory).

* **CPU Selection:** Choose from server, workstation, desktop, and Apple Silicon CPUs with multi-CPU support (dual/quad socket). CPU list is automatically filtered by motherboard socket.

* **System RAM Configuration:** Select RAM stick size, number of DIMMs, and RAM type (DDR4/DDR5/LPDDR5X) for accurate bandwidth calculations. Options are constrained by the selected motherboard.

* **System RAM Estimation:** Shows minimum system RAM required for model loading, framework overhead, and CPU offloading.

* **CPU Offloading:** When VRAM is insufficient, estimates how much memory overflows to CPU and the resulting speed penalty based on CPU memory bandwidth vs GPU bandwidth.

* **Batch Size:** Adjust the batch size, representing the number of sequences processed concurrently in a single inference pass.

* **Sequence Length:** Define the length of input/output sequences in tokens.

* **Multi-Unit (Cluster) Support:** Simulate multiple identical machines (units) for distributed inference. Each unit adds its own VRAM and system RAM to the cluster total. Apple boards are excluded (single-unit only).

* **Concurrent Users:** Simulate the impact of multiple simultaneous users on memory and throughput.

* **Dynamic VRAM Usage Display:** A circular progress bar visually represents VRAM utilization, with a percentage, status (sufficient, moderate, high, insufficient), and total GB used/available.

* **Memory Breakdown:** Displays shared model memory versus per-user KV cache memory.

* **Performance Metrics:** Estimates Generation Speed (tok/sec), Total Throughput (tok/sec), and Per-User Speed (tok/sec).

* **Configurable Data:** All model, GPU, CPU, and RAM data are managed in an external `/static/js/config.js` file for easy updates.

## Supported Models

| Family | Models |
|---|---|
| Cohere | Command A, Command R, Command R Plus, Command R7B |
| DeepSeek | R1 (1.5B–671B), R1-0528, V3, V3.2, V3.2-Speciale |
| Devstral | Small-24B, 2-123B, Small-2-24B |
| ERNIE | 4.5 (0.3B–300B, VL variants) |
| Falcon | 1B–180B, Falcon2-11B, Falcon3 (1B–10B) |
| Gemma | 1 (2B, 7B), 2 (2B, 9B, 27B), 3 (1B–27B), 3n E2B IT |
| GLM | 4.5 (355B, Air-106B), 4.6-355B, 4.7-355B, 5-744B |
| GPT-oss | 20B, 120B |
| Hunyuan | A13B (80B MoE) |
| InternLM | InternLM3-8B |
| Kimi | Dev-72B, K2-Base, K2-Instruct, K2.5, VL-A3B variants |
| Llama | 3 (8B, 70B), 3.1 (8B–405B), 3.2 (1B, 3B), 3.3-70B, 4 (Scout, Maverick, Behemoth) |
| MiMo | V2-Flash-309B |
| MiniMax | M2-230B, M2.1-230B |
| Mistral | 7B variants, Small-2501, Small-3.1-24B, Small-3.2-24B, Large-2407, Large-3-675B |
| Ministral | 3 (3B, 8B, 14B), 8B-2410 |
| Mixtral | 8x7B, 8x22B |
| Nemotron | 3-Nano-30B-A3B |
| OLMo | 2 (1B–32B), 3 (7B, 32B) |
| Phi | 1, 1.5, 2, 3 (mini, small, medium), 4, 4-Mini, 4 Reasoning Plus |
| Qwen | 2 (0.5B–72B), 2.5 (0.5B–72B), 3 (0.6B–235B, MoE variants), 3 Coder 480B, 3.5-397B |
| QwQ | 32B |
| SmolLM | SmolLM2 (135M, 360M, 1.7B), SmolLM3-3B |

## Supported GPUs & Accelerators

| Vendor | Devices |
|---|---|
| NVIDIA GeForce | RTX 3060–3090 Ti, RTX 4060–4090, RTX 5060–5090 |
| NVIDIA RTX PRO | PRO 5000 Blackwell (48/72GB), PRO 6000 Blackwell (96GB) |
| NVIDIA Workstation | RTX A4000, A5000, A6000 |
| NVIDIA Data Center | L40, L40S, A2–A800, H100–H800, B100–B300 |
| Apple Silicon | M2 Ultra, M3 Ultra, M4 Max, M4 Pro, M5 |
| AMD Instinct | MI300X, MI325X, MI350X, MI355X |
| AMD Radeon | RX 9070, RX 9070 XT |
| Google TPU | v5p, v6e Trillium, v7 Ironwood |
| Intel | Gaudi 3, Arc B570, Arc B580 |
| AWS | Trainium2, Trainium3 |

## Supported CPUs

| Vendor | CPUs |
|---|---|
| AMD EPYC | 9754 (128C), 9654 (96C), 9554 (64C), 9354 (32C) |
| Intel Xeon | w9-3595X (60C), 8580 (60C), 8490H (60C) |
| AMD Threadripper | PRO 7995WX (96C), PRO 7975WX (32C), 7980X (64C), 7960X (24C) |
| AMD Ryzen | 9 9950X/9900X/7950X, 7 9700X/7800X3D, 5 7600X |
| Intel Core | Ultra 9 285K, i9-14900K, i7-14700K, i5-14600K, i9-13900K |
| Apple Silicon | M2 Ultra, M3 Ultra, M4 Max, M4 Pro, M5 |

## Supported Motherboards

| Tier | Board | Socket | Max CPUs | Max GPUs | Max DIMMs | Max RAM/DIMM | Max Total RAM |
|---|---|---|---|---|---|---|---|
| Server | Supermicro H13DSH (Dual SP5) | SP5 | 2 | 8 | 24 | 2048 GB | — |
| Server | Supermicro H13SSL-N (Single SP5) | SP5 | 1 | 4 | 12 | 2048 GB | — |
| Server | Supermicro X13DEI (Dual LGA4677) | LGA4677 | 2 | 8 | 16 | 2048 GB | — |
| Server | Supermicro X13SWA (Single LGA4677) | LGA4677 | 1 | 4 | 8 | 2048 GB | — |
| Workstation | ASUS Pro WS WRX90E-SAGE SE | sWRX90 | 1 | 7 | 8 | 1024 GB | — |
| Workstation | Gigabyte WRX90 AORUS MASTER | sWRX90 | 1 | 4 | 8 | 1024 GB | — |
| Workstation | ASUS TRX50-WS | sTR5 | 1 | 4 | 4 | 256 GB | — |
| Workstation | MSI TRX50 PRO WIFI | sTR5 | 1 | 3 | 4 | 256 GB | — |
| Desktop | ASUS ROG Crosshair X870E Hero | AM5 | 1 | 2 | 4 | 64 GB | 256 GB |
| Desktop | MSI MEG X870E ACE | AM5 | 1 | 2 | 4 | 64 GB | 256 GB |
| Desktop | Gigabyte X870E AORUS Master | AM5 | 1 | 2 | 4 | 64 GB | 256 GB |
| Desktop | ASUS ROG STRIX B650E-F | AM5 | 1 | 2 | 4 | 64 GB | 128 GB |
| Desktop | ASUS ROG Maximus Z890 Hero | LGA1851 | 1 | 2 | 4 | 64 GB | 256 GB |
| Desktop | MSI MEG Z890 ACE | LGA1851 | 1 | 2 | 4 | 64 GB | 256 GB |
| Desktop | ASUS ROG Maximus Z790 Hero | LGA1700 | 1 | 2 | 4 | 64 GB | 192 GB |
| Desktop | MSI MAG Z690 TOMAHAWK | LGA1700 | 1 | 2 | 4 | 64 GB | 128 GB |
| Apple | Apple Mac Studio | Apple | 1 | 8 | — | — | — |
| Apple | Apple Mac Pro | Apple | 1 | 8 | — | — | — |
| Apple | Apple MacBook Pro | Apple | 1 | 1 | — | — | — |

## Supported RAM Types

| Type | Bandwidth per Channel |
|---|---|
| DDR4-3200 | 25.6 GB/s |
| DDR4-3600 | 28.8 GB/s |
| DDR5-4800 | 38.4 GB/s |
| DDR5-5600 | 44.8 GB/s |
| DDR5-6000 | 48.0 GB/s |
| DDR5-6400 | 51.2 GB/s |
| DDR5-7200 | 57.6 GB/s |
| LPDDR5-6400 | 51.2 GB/s |
| LPDDR5X-7500 | 60.0 GB/s |

## Setup

No special server setup or external dependencies beyond Tailwind CSS (loaded via CDN) are required.

## How to Use

1. **Clone** this project.

1. Simply **open** the `index.html` file in your web browser.

2. **Adjust Parameters:** Start by selecting a **motherboard** — this constrains which CPUs, GPUs, RAM sizes, and RAM types are available. Then configure the GPU, number of units (for multi-machine clusters), LLM model, quantization, batch size, sequence length, and concurrent users.

3. **View Results:** The "Performance & Memory Results" panel on the right will dynamically update to show:

   * Unified Memory Usage (percentage and GB)

   * Breakdown of shared vs. per-user memory

   * System RAM requirements and CPU offloading info

   * Estimated generation speeds and throughput (with offload penalty if applicable)

   * A summary of your selected configuration.

## Disclaimer

The calculations provided by this tool are **estimates** and simplified based on common LLM characteristics and scaling. Actual performance and VRAM usage can vary significantly due to:

* Specific model architecture details (hidden size, number of layers, attention heads).

* Inference framework optimizations (e.g., vLLM, SGLang, custom kernels).

* GPU architecture and driver optimizations.

* Operating system overhead.

* Exact quantization implementation details.

* Multi-node cluster interconnect overhead (NVLink, InfiniBand, Ethernet) — real distributed inference incurs communication latency not modeled here.

This tool is intended for **guidance and comparative analysis** rather than precise, real-world benchmarks.
