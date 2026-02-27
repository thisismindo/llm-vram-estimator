const config = window.config;
  const modelEl = document.getElementById("model");
  const quantEl = document.getElementById("quantization");
  const kvQuantEl = document.getElementById("kvQuantization");
  const gpuEl = document.getElementById("gpu");
  const motherboardEl = document.getElementById("motherboard");
  const numGPUsEl = document.getElementById("numGPUs");
  const cpuEl = document.getElementById("cpu");
  const numCPUsEl = document.getElementById("numCPUs");
  const ramAmountEl = document.getElementById("ramAmount");
  const numDIMMsEl = document.getElementById("numDIMMs");
  const ramTypeEl = document.getElementById("ramType");
  const batchSizeEl = document.getElementById("batchSize");
  const sequenceLengthEl = document.getElementById("sequenceLength");
  const concurrentUsersEl = document.getElementById("concurrentUsers");
  const numUnitsEl = document.getElementById("numUnits");

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

  const systemRamRequired = document.getElementById("systemRamRequired");
  const systemRamAvailable = document.getElementById("systemRamAvailable");
  const systemRamStatus = document.getElementById("systemRamStatus");
  const cpuOffloadInfo = document.getElementById("cpuOffloadInfo");
  const ramCapWarning = document.getElementById("ramCapWarning");

  const summaryModel = document.getElementById("summaryModel");
  const summaryQuant = document.getElementById("summaryQuant");
  const summaryKV = document.getElementById("summaryKV");
  const summaryAttention = document.getElementById("summaryAttention");
  const summaryEmbeddings = document.getElementById("summaryEmbeddings");
  const summaryBatch = document.getElementById("summaryBatch");
  const summaryDevices = document.getElementById("summaryDevices");
  const summaryUsers = document.getElementById("summaryUsers");
  const summaryUnits = document.getElementById("summaryUnits");
  const summaryCPU = document.getElementById("summaryCPU");
  const summaryRAM = document.getElementById("summaryRAM");
  const summaryMotherboard = document.getElementById("summaryMotherboard");
  const systemRamControls = document.getElementById("systemRamControls");

  const powerGPUEl = document.getElementById("powerGPU");
  const powerCPUEl = document.getElementById("powerCPU");
  const powerRAMEl = document.getElementById("powerRAM");
  const powerBaseEl = document.getElementById("powerBase");
  const powerPerUnitEl = document.getElementById("powerPerUnit");
  const powerClusterEl = document.getElementById("powerCluster");
  const powerClusterUnitsEl = document.getElementById("powerClusterUnits");
  const powerClusterRowEl = document.getElementById("powerClusterRow");
  const storageDiskSpaceEl = document.getElementById("storageDiskSpace");
  const powerRecommendationEl = document.getElementById("powerRecommendation");
  const powerNecNoteEl = document.getElementById("powerNecNote");
  const summaryPowerEl = document.getElementById("summaryPower");
  const summaryStorageEl = document.getElementById("summaryStorage");

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
  fillSelect(motherboardEl, Object.keys(config.MOTHERBOARDS));
  fillSelect(cpuEl, Object.keys(config.CPUS));
  fillSelect(ramAmountEl, config.RAM_AMOUNTS.map((v) => v + " GB"));
  fillSelect(ramTypeEl, Object.keys(config.RAM_TYPES));

  function fillSelectFiltered(select, options) {
    const current = select.value;
    select.innerHTML = "";
    options.forEach((opt) => {
      const o = document.createElement("option");
      o.value = o.textContent = opt;
      select.appendChild(o);
    });
    if (options.includes(current)) {
      select.value = current;
    } else if (options.length > 0) {
      select.value = options[0];
    }
  }

  function onMotherboardChange() {
    const mbName = motherboardEl.value;
    const mb = config.MOTHERBOARDS[mbName];
    if (!mb) return;

    const isAppleBoard = mb.socket === "Apple";

    const compatibleCPUs = mb.supportedCPUs
      ? Object.keys(config.CPUS).filter((name) => mb.supportedCPUs.includes(name))
      : Object.keys(config.CPUS).filter((name) => config.CPUS[name].socket === mb.socket);
    fillSelectFiltered(cpuEl, compatibleCPUs);

    if (mb.supportedGPUs) {
      fillSelectFiltered(gpuEl, mb.supportedGPUs);
    } else {
      const nonAppleGPUs = Object.keys(config.GPUS).filter((name) => !name.startsWith("Apple"));
      fillSelectFiltered(gpuEl, nonAppleGPUs);
    }

    numCPUsEl.max = mb.maxCPUs;
    if (parseInt(numCPUsEl.value) > mb.maxCPUs) numCPUsEl.value = mb.maxCPUs;
    document.getElementById("numCPUsControl").style.display = (mb.maxCPUs <= 1) ? "none" : "";

    numGPUsEl.max = mb.maxGPUs;
    if (parseInt(numGPUsEl.value) > mb.maxGPUs) numGPUsEl.value = mb.maxGPUs;
    document.getElementById("numGPUsControl").style.display = (mb.maxGPUs <= 1) ? "none" : "";

    if (isAppleBoard) {
      document.getElementById("numUnitsControl").style.display = "none";
      numUnitsEl.value = "1";
      systemRamControls.style.display = "none";
    } else {
      document.getElementById("numUnitsControl").style.display = "";
      systemRamControls.style.display = "";

      const compatibleRAM = config.RAM_AMOUNTS
        .filter((v) => v <= mb.maxRAMPerDIMM)
        .map((v) => v + " GB");
      fillSelectFiltered(ramAmountEl, compatibleRAM);

      const compatibleRAMTypes = mb.supportedRAMTypes.filter(
        (t) => t in config.RAM_TYPES
      );
      fillSelectFiltered(ramTypeEl, compatibleRAMTypes);

      numDIMMsEl.max = mb.maxDIMMs;
      if (parseInt(numDIMMsEl.value) > mb.maxDIMMs) numDIMMsEl.value = mb.maxDIMMs;
    }

    calculate();
  }

  function getGpuPerformanceTier(gpuName) {
    if (/NVIDIA [BH]\d{3}/.test(gpuName)) return 3.0;
    if (/MI3[0-5]\dX/.test(gpuName)) return 3.0;
    if (/TPU v[67]/.test(gpuName)) return 3.0;
    if (/TPU v5/.test(gpuName)) return 2.5;
    if (/Trainium/.test(gpuName)) return 2.5;
    if (/NVIDIA A[18]00/.test(gpuName)) return 2.0;
    if (/NVIDIA A[34]0 /.test(gpuName)) return 2.0;
    if (/NVIDIA L40/.test(gpuName)) return 2.0;
    if (/Gaudi/.test(gpuName)) return 2.0;
    if (/RTX A[456]000/.test(gpuName)) return 1.5;
    if (/RTX PRO/.test(gpuName)) return 1.5;
    if (/NVIDIA A2 /.test(gpuName)) return 1.5;
    if (/NVIDIA A16/.test(gpuName)) return 1.5;
    if (/RTX [45]0[89]0/.test(gpuName)) return 1.2;
    if (/Radeon/.test(gpuName)) return 0.9;
    if (/Apple/.test(gpuName)) return 0.6;
    if (/Arc B5[78]0/.test(gpuName)) return 0.7;
    return 1.0;
  }

  function getGpuBandwidthGBs(gpuName) {
    if (/NVIDIA [BH]\d{3}/.test(gpuName)) return 3000;
    if (/MI3[0-5]\dX/.test(gpuName)) return 2400;
    if (/TPU/.test(gpuName)) return 2400;
    if (/Trainium/.test(gpuName)) return 1800;
    if (/NVIDIA A[18]00/.test(gpuName)) return 1800;
    if (/NVIDIA A[34]0 /.test(gpuName)) return 700;
    if (/NVIDIA L40/.test(gpuName)) return 700;
    if (/Gaudi/.test(gpuName)) return 1800;
    if (/RTX A[456]000/.test(gpuName)) return 700;
    if (/RTX PRO/.test(gpuName)) return 700;
    if (/RTX [45]0[89]0/.test(gpuName)) return 900;
    if (/RTX [345]0[567]0/.test(gpuName)) return 450;
    if (/Radeon/.test(gpuName)) return 500;
    if (/Apple/.test(gpuName)) return 400;
    if (/Arc/.test(gpuName)) return 350;
    return 450;
  }

  function isMoEModel(model) {
    const modelInfo = config.MODEL_ATTENTION[model];
    if (modelInfo && modelInfo.attention === "MoE") return true;
    if (/\d+x\d+B/.test(model)) return true;
    return false;
  }

  function calculateDynamicPerformance(
    model,
    numGPUs,
    gpu,
    batchSize,
    sequenceLength,
    kvQuant,
    quant
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

      let weightQuantMultiplier;
      if (quant === "FP32") weightQuantMultiplier = 0.5;
      else if (quant === "FP8" || quant === "INT8") weightQuantMultiplier = 1.3;
      else if (quant === "4-bit (QLoRA)") weightQuantMultiplier = 1.6;
      else weightQuantMultiplier = 1.0;
      speed *= weightQuantMultiplier;
      throughput *= weightQuantMultiplier;

      if (sequenceLength > 1024) {
        const seqLenFactor = 1.0 / (1 + 0.15 * Math.log2(sequenceLength / 1024));
        speed *= seqLenFactor;
        throughput *= seqLenFactor;
      }

      const gpuTier = getGpuPerformanceTier(gpu);
      speed *= gpuTier;
      throughput *= gpuTier;
    } else {
      speed = 1;
      throughput = 1;
    }

    return { speed: speed, throughput: throughput };
  }

  function getCircuitRecommendation(watts) {
    const tiers = [
      { capacity: 1440, rawCapacity: 1800, label: "120V / 15A standard outlet" },
      { capacity: 1920, rawCapacity: 2400, label: "120V / 20A outlet" },
      { capacity: 3840, rawCapacity: 4800, label: "240V / 20A single-phase" },
      { capacity: 5760, rawCapacity: 7200, label: "240V / 30A single-phase" },
      { capacity: 8645, rawCapacity: 10806, label: "208V / 30A three-phase" },
      { capacity: 14408, rawCapacity: 18010, label: "208V / 50A three-phase" },
    ];
    for (const tier of tiers) {
      if (watts <= tier.capacity) {
        const pct = ((watts / tier.capacity) * 100).toFixed(0);
        return { ...tier, usage: pct };
      }
    }
    return { capacity: null, rawCapacity: null, usage: null, label: "208V / 60A three-phase or higher" };
  }

  function calculate() {
    const model = modelEl.value;
    const quant = quantEl.value;
    const kvq = kvQuantEl.value;
    const gpu = gpuEl.value;
    const numGPUs = parseInt(numGPUsEl.value);
    const cpu = cpuEl.value;
    const numCPUs = parseInt(numCPUsEl.value);
    const ramPerStick = parseInt(ramAmountEl.value);
    const numDIMMs = parseInt(numDIMMsEl.value);
    const ramType = ramTypeEl.value;
    const batchSize = parseInt(batchSizeEl.value);
    const sequenceLength = parseInt(sequenceLengthEl.value);
    const concurrentUsers = parseInt(concurrentUsersEl.value);
    const numUnits = parseInt(numUnitsEl.value);

    updateText("numGPUsVal", numGPUs);
    updateText("numCPUsVal", numCPUs);
    updateText("numDIMMsVal", numDIMMs);
    updateText("batchSizeVal", batchSize);
    updateText("sequenceLengthVal", sequenceLength);
    updateText("numUnitsVal", numUnits);
    updateText("concurrentUsersVal", concurrentUsers);
    updateText("totalConcurrentUsers", concurrentUsers);

    const motherboard = motherboardEl.value;
    const mb = config.MOTHERBOARDS[motherboard];
    const isAppleBoard = mb && mb.socket === "Apple";
    const ramPerStickSafe = isNaN(ramPerStick) ? 0 : ramPerStick;
    const numDIMMsSafe = isNaN(numDIMMs) ? 0 : numDIMMs;
    const rawTotalRAM = ramPerStickSafe * numDIMMsSafe;
    const maxTotalRAM = (mb && mb.maxTotalRAM) ? mb.maxTotalRAM : Infinity;
    const perUnitRAM = Math.min(rawTotalRAM, maxTotalRAM);
    const totalSystemRAMAvailable = perUnitRAM * numUnits;

    if (ramCapWarning) {
      if (rawTotalRAM > maxTotalRAM) {
        ramCapWarning.textContent = `Board caps RAM at ${maxTotalRAM} GB (${rawTotalRAM} GB configured)`;
      } else {
        ramCapWarning.textContent = "";
      }
    }

    const baseModelSizeGB_FP16 = config.MODEL_SIZES[model] || 0;

    let bytesPerParamWeights;
    if (quant === "FP32") bytesPerParamWeights = 4;
    else if (quant === "BF16") bytesPerParamWeights = 2;
    else if (quant === "FP16") bytesPerParamWeights = 2;
    else if (quant === "FP8") bytesPerParamWeights = 1;
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
      let kvBase;
      if (isMoEModel(model)) {
        if (numModelParametersBillion <= 25) kvBase = 0.15;
        else if (numModelParametersBillion <= 100) kvBase = 0.25;
        else if (numModelParametersBillion <= 400) kvBase = 0.4;
        else kvBase = 0.6;
      } else {
        const modelInfo = config.MODEL_ATTENTION[model];
        const attentionType = modelInfo ? modelInfo.attention : "GQA";
        let attentionMultiplier;
        if (attentionType === "MHA") attentionMultiplier = 3.5;
        else if (attentionType === "MQA") attentionMultiplier = 0.25;
        else attentionMultiplier = 1.0;
        kvBase = 0.0625 * Math.sqrt(numModelParametersBillion / 2) * attentionMultiplier;
      }
      kvCacheGB_per_single_sequence = kvBase * (sequenceLength / 1024) * (bytesPerParamKV / 2);
    }

    const totalActiveSequences = batchSize * concurrentUsers;
    const totalPerUserKVCacheGB = kvCacheGB_per_single_sequence * totalActiveSequences;

    const totalSharedVRAM = modelWeightsGB;
    const totalUsedVRAMValue = totalSharedVRAM + totalPerUserKVCacheGB;


    const totalAvailableVRAM = config.GPUS[gpu] * numGPUs * numUnits;

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
        statusText = "sufficient";
        statusClass = "sufficient";
    }
    vramStatus.textContent = statusText;
    vramStatus.className = `font-medium ${statusClass}`;
    vramUsage.className = `circle-progress-bar-text`;

    vramProgressBar.style.setProperty("--progress", `${Math.min(100, percentageUsage)}%`);
    vramProgressBar.style.setProperty("--progress-color", `var(--${statusClass}-color)`);


    totalUsedVRAM.textContent = `${totalUsedVRAMValue.toFixed(
      2
    )} GB`;
    const isAppleSilicon = /Apple/.test(gpu);
    const systemRamSection = document.getElementById("systemRamSection");

    if (isAppleSilicon) {
      vramDetails.textContent = `of ${totalAvailableVRAM} GB Unified Memory (${numGPUs} x ${config.GPUS[gpu]} GB Devices)`;
      systemRamSection.style.display = "none";
    } else {
      const vramLabel = numUnits > 1
        ? `of ${totalAvailableVRAM} GB VRAM (${numUnits} units x ${numGPUs} GPUs x ${config.GPUS[gpu]} GB)`
        : `of ${totalAvailableVRAM} GB VRAM (${numGPUs} x ${config.GPUS[gpu]} GB Devices)`;
      vramDetails.textContent = vramLabel;
      systemRamSection.style.display = "";
    }

    sharedPerUserVRAM.textContent = `${totalSharedVRAM.toFixed(2)} GB shared + ${kvCacheGB_per_single_sequence.toFixed(2)} GB per user`;

    const cpuInfo = config.CPUS[cpu];
    const ramTypeInfo = config.RAM_TYPES[ramType];
    const ramBandwidthPerChannel = ramTypeInfo ? ramTypeInfo.bandwidth : 48.0;

    if (!isAppleSilicon) {
      const frameworkOverhead = 3;
      const modelLoadingBuffer = modelWeightsGB * 0.1;
      const cpuOffloadGB = Math.max(0, totalUsedVRAMValue - totalAvailableVRAM);
      const totalSystemRAMRequired = frameworkOverhead + modelLoadingBuffer + cpuOffloadGB;

      systemRamRequired.textContent = `${totalSystemRAMRequired.toFixed(2)} GB`;
      const ramAvailLabel = numUnits > 1
        ? `${totalSystemRAMAvailable} GB (${numUnits} units x ${perUnitRAM} GB)`
        : `${totalSystemRAMAvailable} GB`;
      systemRamAvailable.textContent = ramAvailLabel;

      if (totalSystemRAMRequired > totalSystemRAMAvailable) {
        systemRamStatus.textContent = "Insufficient system RAM";
        systemRamStatus.className = "font-medium insufficient";
      } else if (totalSystemRAMRequired > totalSystemRAMAvailable * 0.8) {
        systemRamStatus.textContent = "Tight — consider more RAM";
        systemRamStatus.className = "font-medium high";
      } else {
        systemRamStatus.textContent = "Sufficient";
        systemRamStatus.className = "font-medium sufficient";
      }

      if (cpuOffloadGB > 0) {
        cpuOffloadInfo.textContent = `${cpuOffloadGB.toFixed(2)} GB offloaded to CPU`;
      } else {
        cpuOffloadInfo.textContent = "No CPU offloading needed";
      }
    }

    const gpuTdp = config.GPU_TDP[gpu] || 0;
    const ramPowerPerDIMM = ramTypeInfo ? ramTypeInfo.powerPerDIMM : 5;
    if (isAppleSilicon) {
      const socName = gpu.replace(/ \(\d+GB\)$/, "");
      const totalSocPower = gpuTdp * numGPUs;
      powerGPUEl.textContent = numGPUs > 1
        ? `${totalSocPower} W (${numGPUs} x ${gpuTdp} W ${socName})`
        : `${gpuTdp} W (${socName} SoC)`;
      powerCPUEl.textContent = "included in SoC";
      powerRAMEl.textContent = "included in SoC";
      powerBaseEl.textContent = "included in SoC";
      powerPerUnitEl.textContent = `${totalSocPower} W`;
      powerClusterRowEl.style.display = "none";
      summaryPowerEl.textContent = numGPUs > 1
        ? `${totalSocPower} W (${numGPUs} x ${socName})`
        : `${gpuTdp} W (${socName} SoC)`;
      const socRec = getCircuitRecommendation(totalSocPower);
      if (socRec.capacity) {
        powerRecommendationEl.textContent = `Recommended: ${socRec.label} (${socRec.usage}% of ${socRec.capacity.toLocaleString()}W safe limit)`;
        powerNecNoteEl.textContent = `Safe limit is 80% of circuit capacity (${socRec.rawCapacity.toLocaleString()}W) per NEC continuous load rule — do not exceed`;
      } else {
        powerRecommendationEl.textContent = `Recommended: ${socRec.label}`;
        powerNecNoteEl.textContent = "Exceeds standard circuit tiers — consult a licensed electrician";
      }
    } else {
      const gpuPowerW = gpuTdp * numGPUs;
      const cpuTdp = cpuInfo ? cpuInfo.tdp : 0;
      const cpuPowerW = cpuTdp * numCPUs;
      const ramPowerW = ramPowerPerDIMM * numDIMMsSafe;
      const basePowerW = mb ? (mb.basePower || 0) : 0;
      const perUnitPowerW = gpuPowerW + cpuPowerW + ramPowerW + basePowerW;
      const clusterPowerW = perUnitPowerW * numUnits;

      powerGPUEl.textContent = numGPUs > 1 ? `${gpuPowerW} W (${numGPUs} x ${gpuTdp} W)` : `${gpuPowerW} W`;
      powerCPUEl.textContent = numCPUs > 1 ? `${cpuPowerW} W (${numCPUs} x ${cpuTdp} W)` : `${cpuPowerW} W`;
      powerRAMEl.textContent = numDIMMsSafe > 1 ? `${ramPowerW} W (${numDIMMsSafe} x ${ramPowerPerDIMM} W)` : `${ramPowerW} W`;
      powerBaseEl.textContent = `${basePowerW} W`;
      powerPerUnitEl.textContent = `${perUnitPowerW} W`;

      if (numUnits > 1) {
        powerClusterRowEl.style.display = "";
        powerClusterUnitsEl.textContent = numUnits;
        const clusterLabel = clusterPowerW >= 1000 ? `${clusterPowerW} W (${(clusterPowerW / 1000).toFixed(2)} kW)` : `${clusterPowerW} W`;
        powerClusterEl.textContent = clusterLabel;
        summaryPowerEl.textContent = clusterLabel + ` (${numUnits} units)`;
        const unitRec = getCircuitRecommendation(perUnitPowerW);
        const clusterRec = getCircuitRecommendation(clusterPowerW);
        const unitCapStr = unitRec.capacity ? ` ${unitRec.usage}% of ${unitRec.capacity.toLocaleString()}W` : "";
        const clusterCapStr = clusterRec.capacity ? ` ${clusterRec.usage}% of ${clusterRec.capacity.toLocaleString()}W` : "";
        powerRecommendationEl.textContent = `Per Unit: ${unitRec.label}${unitCapStr ? ` (${unitCapStr})` : ""} | Cluster: ${clusterRec.label}${clusterCapStr ? ` (${clusterCapStr})` : ""}`;
        const noteRef = clusterRec.capacity ? clusterRec : unitRec;
        if (noteRef.capacity) {
          powerNecNoteEl.textContent = `Safe limit is 80% of circuit capacity per NEC continuous load rule — do not exceed`;
        } else {
          powerNecNoteEl.textContent = "Cluster exceeds standard circuit tiers — consult a licensed electrician";
        }
      } else {
        powerClusterRowEl.style.display = "none";
        summaryPowerEl.textContent = `${perUnitPowerW} W`;
        const rec = getCircuitRecommendation(perUnitPowerW);
        if (rec.capacity) {
          powerRecommendationEl.textContent = `Recommended: ${rec.label} (${rec.usage}% of ${rec.capacity.toLocaleString()}W safe limit)`;
          powerNecNoteEl.textContent = `Safe limit is 80% of circuit capacity (${rec.rawCapacity.toLocaleString()}W) per NEC continuous load rule — do not exceed`;
        } else {
          powerRecommendationEl.textContent = `Recommended: ${rec.label}`;
          powerNecNoteEl.textContent = "Exceeds standard circuit tiers — consult a licensed electrician";
        }
      }
    }

    const diskSpaceGB = modelWeightsGB;
    if (diskSpaceGB >= 1024) {
      storageDiskSpaceEl.textContent = `~${(diskSpaceGB / 1024).toFixed(2)} TB (${diskSpaceGB.toFixed(0)} GB)`;
    } else {
      storageDiskSpaceEl.textContent = `~${diskSpaceGB.toFixed(2)} GB`;
    }
    summaryStorageEl.textContent = diskSpaceGB >= 1024
      ? `~${(diskSpaceGB / 1024).toFixed(2)} TB`
      : `~${diskSpaceGB.toFixed(2)} GB`;

    summaryModel.textContent = model;
    summaryQuant.textContent = quant;
    summaryKV.textContent = kvq;
    summaryBatch.textContent = batchSize;
    summaryDevices.textContent = numGPUs;
    summaryUnits.textContent = numUnits;
    summaryUsers.textContent = concurrentUsers;
    summaryMotherboard.textContent = motherboard;
    summaryCPU.textContent = `${numCPUs > 1 ? numCPUs + "x " : ""}${cpu}`;
    if (isAppleBoard) {
      summaryRAM.textContent = "Unified Memory (shared with GPU)";
    } else {
      const ramTotalLabel = rawTotalRAM > maxTotalRAM
        ? `${totalSystemRAMAvailable} GB usable of ${rawTotalRAM} GB installed`
        : `${totalSystemRAMAvailable} GB total`;
      summaryRAM.textContent = `${numDIMMsSafe} x ${ramPerStickSafe} GB ${ramType} (${ramTotalLabel})`;
    }

    const modelInfo = config.MODEL_ATTENTION[model];
    if (modelInfo) {
      summaryAttention.textContent = modelInfo.attention;
      summaryEmbeddings.textContent = modelInfo.embeddings;
    } else {
      summaryAttention.textContent = "MLA";
      summaryEmbeddings.textContent = "rotary";
    }

    let { speed, throughput } = calculateDynamicPerformance(
      model,
      numGPUs * numUnits,
      gpu,
      batchSize,
      sequenceLength,
      kvq,
      quant
    );

    if (!isAppleSilicon && totalUsedVRAMValue > totalAvailableVRAM) {
      const cpuOffloadGB = totalUsedVRAMValue - totalAvailableVRAM;
      const offloadFraction = cpuOffloadGB / totalUsedVRAMValue;
      const totalMemChannels = (cpuInfo ? cpuInfo.memChannels : 2) * numCPUs * numUnits;
      const cpuBandwidthGBs = totalMemChannels * ramBandwidthPerChannel;
      const gpuBandwidthGBs = getGpuBandwidthGBs(gpu) * numGPUs * numUnits;
      const bandwidthRatio = cpuBandwidthGBs / gpuBandwidthGBs;
      const speedMultiplier = 1 / ((1 - offloadFraction) + offloadFraction / bandwidthRatio);
      speed *= speedMultiplier;
      throughput *= speedMultiplier;
      const reductionPercent = ((1 - speedMultiplier) * 100).toFixed(1);
      cpuOffloadInfo.textContent = `${cpuOffloadGB.toFixed(2)} GB offloaded to CPU — speed reduced by ${reductionPercent}%`;
    }

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

  motherboardEl.addEventListener("change", onMotherboardChange);

  [
    modelEl,
    quantEl,
    kvQuantEl,
    gpuEl,
    numGPUsEl,
    numUnitsEl,
    cpuEl,
    numCPUsEl,
    ramAmountEl,
    numDIMMsEl,
    ramTypeEl,
    batchSizeEl,
    sequenceLengthEl,
    concurrentUsersEl,
  ].forEach((el) => {
    el.addEventListener("input", calculate);
  });

  window.onload = () => {
    motherboardEl.value = "Apple Mac Studio";
    onMotherboardChange();
    modelEl.value = "Llama 4 Maverick";
    quantEl.value = "FP16";
    kvQuantEl.value = "FP16 / BF16";
    gpuEl.value = "Apple M3 Ultra (512GB)";
    numGPUsEl.value = "3";
    numUnitsEl.value = "1";
    batchSizeEl.value = "2";
    sequenceLengthEl.value = "2048";
    concurrentUsersEl.value = "4";
    calculate();
  };
