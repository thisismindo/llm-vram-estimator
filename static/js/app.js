const config = window.config;
  const modelEl = document.getElementById("model");
  const quantEl = document.getElementById("quantization");
  const kvQuantEl = document.getElementById("kvQuantization");
  const gpuEl = document.getElementById("gpu");
  const numGPUsEl = document.getElementById("numGPUs");
  const batchSizeEl = document.getElementById("batchSize");
  const sequenceLengthEl = document.getElementById("sequenceLength");
  const concurrentUsersEl = document.getElementById("concurrentUsers");

  const vramUsage = document.getElementById("vramUsage");
  const vramStatus = document.getElementById("vramStatus");
  const totalUsedVRAM = document.getElementById("totalUsedVRAM");
  const vramDetails = document.getElementById("vramDetails");
  const vramProgressBar = document.getElementById("vramProgressBar");
  const generationSpeed = document.getElementById("generationSpeed");
  const totalThroughput = document.getElementById("totalThroughput");
  const perUserSpeed = document.getElementById("perUserSpeed");
  const sharedPerUserVRAM = document.getElementById("sharedPerUserVRAM");
  const totalConcurrentUsersEl = document.getElementById("totalConcurrentUsers");


  const summaryModel = document.getElementById("summaryModel");
  const summaryQuant = document.getElementById("summaryQuant");
  const summaryKV = document.getElementById("summaryKV");
  const summaryAttention = document.getElementById("summaryAttention");
  const summaryEmbeddings = document.getElementById("summaryEmbeddings");
  const summaryBatch = document.getElementById("summaryBatch");
  const summaryDevices = document.getElementById("summaryDevices");
  const summaryUsers = document.getElementById("summaryUsers");

  const updateText = (id, val) =>
    (document.getElementById(id).textContent = val);

  function fillSelect(select, options) {
    options.forEach((opt) => {
      const o = document.createElement("option");
      o.value = o.textContent = opt;
      select.appendChild(o);
    });
  }

  fillSelect(modelEl, config.MODELS);
  fillSelect(quantEl, config.QUANTIZATION);
  fillSelect(kvQuantEl, config.KV_CACHE_QUANTIZATION);
  fillSelect(gpuEl, Object.keys(config.GPUS));

  function calculateDynamicPerformance(
    model,
    numGPUs,
    gpu,
    batchSize,
    sequenceLength,
    kvQuant
  ) {
    let speed = 0;
    let throughput = 0;

    const baseModelSizeGB_FP16 = config.MODEL_SIZES[model] || 0;
    const numModelParametersBillion = baseModelSizeGB_FP16 / 2;

    if (numModelParametersBillion > 0) {
      const generic_base_tps_per_gpu_per_billion_params = 100;
      const scale_factor_by_model_size = Math.max(0.01, 1 / (numModelParametersBillion / 10));

      throughput = generic_base_tps_per_gpu_per_billion_params * numGPUs * scale_factor_by_model_size;
      speed = throughput / batchSize;

      if (kvQuant === "INT4 (Experimental)") {
        speed *= 1.1;
        throughput *= 1.1;
      } else if (kvQuant === "FP8" || kvQuant === "INT8") {
        speed *= 1.05;
        throughput *= 1.05;
      }
    } else {
      speed = 1;
      throughput = 1;
    }

    return { speed: speed, throughput: throughput };
  }

  function calculate() {
    const model = modelEl.value;
    const quant = quantEl.value;
    const kvq = kvQuantEl.value;
    const gpu = gpuEl.value;
    const numGPUs = parseInt(numGPUsEl.value);
    const batchSize = parseInt(batchSizeEl.value);
    const sequenceLength = parseInt(sequenceLengthEl.value);
    const concurrentUsers = parseInt(concurrentUsersEl.value);

    updateText("numGPUsVal", numGPUs);
    updateText("batchSizeVal", batchSize);
    updateText("sequenceLengthVal", sequenceLength);
    updateText("concurrentUsersVal", concurrentUsers);
    updateText("totalConcurrentUsers", concurrentUsers);


    const baseModelSizeGB_FP16 = config.MODEL_SIZES[model] || 0;

    let bytesPerParamWeights;
    if (quant === "FP32") bytesPerParamWeights = 4;
    else if (quant === "FP16") bytesPerParamWeights = 2;
    else if (quant === "INT8") bytesPerParamWeights = 1;
    else if (quant === "4-bit (QLoRA)") bytesPerParamWeights = 0.5;
    else bytesPerParamWeights = 2;

    let bytesPerParamKV;
    if (kvq === "FP16 / BF16") bytesPerParamKV = 2;
    else if (kvq === "FP8") bytesPerParamKV = 1;
    else if (kvq === "INT8") bytesPerParamKV = 1;
    else if (kvq === "INT4 (Experimental)") bytesPerParamKV = 0.5;
    else bytesPerParamKV = 2;

    let modelWeightsGB;
    let numModelParametersBillion;

    numModelParametersBillion = baseModelSizeGB_FP16 / 2;
    modelWeightsGB = numModelParametersBillion * bytesPerParamWeights;


    let kvCacheGB_per_single_sequence = 0;
    if (bytesPerParamKV > 0) {
      const baseKVCacheGB_SL1024_FP16 = 1.51;
      kvCacheGB_per_single_sequence = (baseKVCacheGB_SL1024_FP16 / 1024) * sequenceLength * (bytesPerParamKV / 2);
    }

    const totalActiveSequences = batchSize * concurrentUsers;
    const totalPerUserKVCacheGB = kvCacheGB_per_single_sequence * totalActiveSequences;

    const totalSharedVRAM = modelWeightsGB;
    const totalUsedVRAMValue = totalSharedVRAM + totalPerUserKVCacheGB;


    const totalAvailableVRAM = config.GPUS[gpu] * numGPUs;

    let percentageUsage = 0;
    if (totalAvailableVRAM > 0) {
      percentageUsage = (totalUsedVRAMValue / totalAvailableVRAM) * 100;
    }

    let displayPercentage = percentageUsage.toFixed(1);
    if (percentageUsage > 100) {
        displayPercentage = `-${(percentageUsage - 100).toFixed(1)}`;
    }

    vramUsage.textContent = `${displayPercentage}%`;

    let statusClass = "sufficient";
    let statusText = "sufficient";
    if (percentageUsage > 100) {
      statusText = "insufficient";
      statusClass = "insufficient";
    } else if (percentageUsage > 90) {
      statusText = "high";
      statusClass = "high";
    } else if (percentageUsage > 60) {
      statusText = "moderate";
      statusClass = "moderate";
    }
    else {
        statusText = "moderate";
        statusClass = "moderate";
    }
    vramStatus.textContent = statusText;
    vramStatus.className = `font-medium ${statusClass}`;
    vramUsage.className = `circle-progress-bar-text`;

    vramProgressBar.style.setProperty("--progress", `${Math.min(100, percentageUsage)}%`);
    vramProgressBar.style.setProperty("--progress-color", `var(--${statusClass}-color)`);


    totalUsedVRAM.textContent = `${totalUsedVRAMValue.toFixed(
      2
    )} GB`;
    vramDetails.textContent = `of ${totalAvailableVRAM} GB Unified Memory(${numGPUs} x ${config.GPUS[gpu]} GB Devices)`;

    sharedPerUserVRAM.textContent = `${totalSharedVRAM.toFixed(2)} GB shared + ${kvCacheGB_per_single_sequence.toFixed(2)} GB per user`;

    summaryModel.textContent = model;
    summaryQuant.textContent = quant;
    summaryKV.textContent = kvq;
    summaryBatch.textContent = batchSize;
    summaryDevices.textContent = numGPUs;
    summaryUsers.textContent = concurrentUsers;

    const modelInfo = config.MODEL_ATTENTION[model];
    if (modelInfo) {
      summaryAttention.textContent = modelInfo.attention;
      summaryEmbeddings.textContent = modelInfo.embeddings;
    } else {
      summaryAttention.textContent = "MLA";
      summaryEmbeddings.textContent = "rotary";
    }

    const { speed, throughput } = calculateDynamicPerformance(
      model,
      numGPUs,
      gpu,
      batchSize,
      sequenceLength,
      kvq
    );

    if (speed > 0) {
      generationSpeed.textContent = `~${speed.toFixed(1)} tok/sec (~${(1000 / speed).toFixed(1)} ms/token latency)`;
    } else {
      generationSpeed.textContent = "N/A";
    }

    if (throughput > 0) {
      totalThroughput.textContent = `~${throughput.toFixed(1)} tok/sec`;
      perUserSpeed.textContent = `~${(throughput / concurrentUsers).toFixed(1)} tok/sec`;
    } else {
      totalThroughput.textContent = "N/A";
      perUserSpeed.textContent = "N/A";
    }
  }

  [
    modelEl,
    quantEl,
    kvQuantEl,
    gpuEl,
    numGPUsEl,
    batchSizeEl,
    sequenceLengthEl,
    concurrentUsersEl,
  ].forEach((el) => {
    el.addEventListener("input", calculate);
  });

  window.onload = () => {
    modelEl.value = "Llama 4 Maverick";
    quantEl.value = "FP16";
    kvQuantEl.value = "FP16 / BF16";
    gpuEl.value = "Apple M3 Ultra (512GB)";
    numGPUsEl.value = "3";
    batchSizeEl.value = "2";
    sequenceLengthEl.value = "2048";
    concurrentUsersEl.value = "4";
    calculate();
  };
