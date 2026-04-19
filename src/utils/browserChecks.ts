// GPU & WebLLM Feature Detection Utilities

// WebGPU type declarations (not included in default TypeScript lib)
interface GPU {
  // Minimal GPU interface for type safety
}

interface GPUAdapter {
  features: GPUFeatureMap;
  limits: GPULimits;
  info?: any;
  requestAdapterInfo?(): Promise<any>;
}

interface GPUFeatureMap {
  has(feature: string): boolean;
}

interface GPULimits {
  maxBufferSize: number;
  maxTextureDimension2D: number;
}

export interface GPUInfo {
  vendor: string;
  renderer: string;
  driver: string;
  api: string;
  maxTextureSize: number;
  maxAnisotropy: number;
  maxSamplerLODBias: number;
  maxUniformBufferRange: number;
  maxBufferSize: number;
}

export interface WebGPUInfo {
  available: boolean;
  enabled: boolean;
  computeTier: number | null;
  gpu: GPU | null;
  gpuInfo: GPUInfo | null;
  adapter: GPUAdapter | null;
  info: GPUInfo | null;
}

export interface TextureCompressionSupport {
  bc1: boolean;
  bc2: boolean;
  bc3: boolean;
  bc4: boolean;
  bc5: boolean;
  bc6: boolean;
  bc7: boolean;
  astc: boolean;
  astcHdr: boolean;
  etc2: boolean;
  pvr: boolean;
  rgtc: boolean;
}

export interface BrowserCapabilities {
  name: string;
  version: string;
  platform: string;
  isChrome: boolean;
  isEdge: boolean;
  isSafari: boolean;
  isFirefox: boolean;
  isChromeBased: boolean;
  sharedArrayBuffer: boolean;
  webWorkers: boolean;
  offscreenCanvas: boolean;
  serviceWorker: boolean;
  webGPU: boolean;
}

export interface DeviceCapabilities {
  deviceMemory: number | null;
  hardwareConcurrency: number;
  maxTouchPoints: number;
  screenResolution: string;
  pixelRatio: number;
  colorDepth: number;
}

export interface WebLLMReadiness {
  ready: boolean;
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
}

export interface FeatureCheckResult {
  webgpu: WebGPUInfo;
  textureCompression: TextureCompressionSupport;
  browser: BrowserCapabilities;
  device: DeviceCapabilities;
  webllmReadiness: WebLLMReadiness;
  checks: {
    label: string;
    status: 'supported' | 'unsupported' | 'partial' | 'info';
    value: string;
    description: string;
  }[];
}

/**
 * Detect browser name and version
 */
function detectBrowser(): BrowserCapabilities {
  const ua = navigator.userAgent;
  let name = 'Unknown';
  let version = '0';
  let isChrome = false;
  let isEdge = false;
  let isSafari = false;
  let isFirefox = false;
  let isChromeBased = false;

  if (ua.includes('Edg/')) {
    name = 'Microsoft Edge';
    isEdge = true;
    isChromeBased = true;
    const match = ua.match(/Edg\/([\d.]+)/);
    version = match ? match[1] : '0';
  } else if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
    name = 'Google Chrome';
    isChrome = true;
    isChromeBased = true;
    const match = ua.match(/Chrome\/([\d.]+)/);
    version = match ? match[1] : '0';
  } else if (ua.includes('Firefox/')) {
    name = 'Mozilla Firefox';
    isFirefox = true;
    const match = ua.match(/Firefox\/([\d.]+)/);
    version = match ? match[1] : '0';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    name = 'Apple Safari';
    isSafari = true;
    const match = ua.match(/Version\/([\d.]+)/);
    version = match ? match[1] : '0';
  }

  return {
    name,
    version,
    platform: navigator.platform || 'Unknown',
    isChrome,
    isEdge,
    isSafari,
    isFirefox,
    isChromeBased,
    sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    webWorkers: typeof Worker !== 'undefined',
    offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
    serviceWorker: 'serviceWorker' in navigator,
    webGPU: 'gpu' in navigator,
  };
}

/**
 * Detect device capabilities
 */
function detectDevice(): DeviceCapabilities {
  const memory = (navigator as any).deviceMemory || null;
  const cores = navigator.hardwareConcurrency || 0;
  const touchPoints = navigator.maxTouchPoints || 0;
  const pixelRatio = window.devicePixelRatio || 1;
  const colorDepth = screen.colorDepth || 0;

  return {
    deviceMemory: memory,
    hardwareConcurrency: cores,
    maxTouchPoints: touchPoints,
    screenResolution: `${screen.width} x ${screen.height}`,
    pixelRatio,
    colorDepth,
  };
}

/**
 * Check WebGPU availability and capabilities
 */
async function detectWebGPU(): Promise<WebGPUInfo> {
  const result: WebGPUInfo = {
    available: false,
    enabled: false,
    computeTier: null,
    gpu: null,
    gpuInfo: null,
    adapter: null,
    info: null,
  };

  if (!('gpu' in navigator)) {
    return result;
  }

  result.available = true;

  try {
    const adapter = await (navigator as any).gpu.requestAdapter({
      powerPreference: 'high-performance',
    });

    if (!adapter) {
      return { ...result, enabled: false };
    }

    result.adapter = adapter;
    result.enabled = true;

    // Get GPU info
    const info = await adapter.requestAdapterInfo?.() || {
      vendor: 'Unknown',
      renderer: 'Unknown',
      vendorID: 0,
      deviceID: 0,
      architecture: 'Unknown',
      driver: 'Unknown',
      driverVersion: 'Unknown',
    };
    result.info = info as GPUInfo;

    // Determine compute tier
    const features = adapter.features;
    const limits = adapter.limits;

    // Compute tier based on features and limits
    if (features.has('timestamp-query') && features.has('depth-clamping') && limits.maxBufferSize >= (1 << 30)) {
      result.computeTier = 2; // High-end GPU
    } else if (features.has('timestamp-query') && limits.maxBufferSize >= (1 << 28)) {
      result.computeTier = 1; // Mid-range GPU
    } else {
      result.computeTier = 0; // Low-end / integrated GPU
    }

    // Try to get more detailed GPU info
    if ((adapter as any).info) {
      result.gpuInfo = (adapter as any).info;
    }

  } catch (e) {
    console.warn('WebGPU adapter request failed:', e);
    result.enabled = false;
  }

  return result;
}

/**
 * Check texture compression support
 */
function detectTextureCompression(adapter: GPUAdapter | null): TextureCompressionSupport {
  if (!adapter) {
    return {
      bc1: false, bc2: false, bc3: false,
      bc4: false, bc5: false, bc6: false, bc7: false,
      astc: false, astcHdr: false, etc2: false, pvr: false, rgtc: false,
    };
  }

  const features = adapter.features;

  return {
    bc1: features.has('texture-compression-bc'),
    bc2: features.has('texture-compression-bc'),
    bc3: features.has('texture-compression-bc'),
    bc4: features.has('texture-compression-astc-ldr') || features.has('texture-compression-astc'),
    bc5: features.has('texture-compression-astc-ldr') || features.has('texture-compression-astc'),
    bc6: features.has('texture-compression-astc-ldr') || features.has('texture-compression-astc'),
    bc7: features.has('texture-compression-bc'),
    astc: features.has('texture-compression-astc-ldr') || features.has('texture-compression-astc'),
    astcHdr: features.has('texture-compression-astc-hdr'),
    etc2: features.has('texture-compression-etc2'),
    pvr: features.has('texture-compression-pvrtc'),
    rgtc: features.has('texture-compression-rgtc'),
  };
}

/**
 * Check WebLLM readiness
 */
function assessWebLLMReadiness(
  webgpu: WebGPUInfo,
  browser: BrowserCapabilities,
  device: DeviceCapabilities
): WebLLMReadiness {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 0;

  // WebGPU check (40 points)
  if (webgpu.available && webgpu.enabled) {
    score += 40;
    if (webgpu.computeTier === 2) score += 10;
    else if (webgpu.computeTier === 1) score += 5;
  } else if (webgpu.available && !webgpu.enabled) {
    issues.push('WebGPU is available but not enabled');
    if (browser.isChrome) {
      recommendations.push('Enable WebGPU in chrome://flags/#enable-unsafe-webgpu');
    } else if (browser.isEdge) {
      recommendations.push('Enable WebGPU in edge://flags/#enable-unsafe-webgpu');
    } else if (browser.isSafari) {
      recommendations.push('Enable WebGPU in Safari > Settings > Advanced > WebGPU');
    }
  } else {
    issues.push('WebGPU is not available in your browser');
    if (!browser.isChromeBased && !browser.isSafari) {
      recommendations.push('Use Chrome 113+, Edge 113+, or Safari 17+ for WebGPU support');
    }
  }

  // SharedArrayBuffer check (20 points)
  if (browser.sharedArrayBuffer) {
    score += 20;
  } else {
    issues.push('SharedArrayBuffer is not available (required for WebLLM)');
    recommendations.push('Ensure COOP/COEP headers are set: Cross-Origin-Opener-Policy: same-origin and Cross-Origin-Embedder-Policy: require-corp');
  }

  // Web Workers check (15 points)
  if (browser.webWorkers) {
    score += 15;
  } else {
    issues.push('Web Workers are not supported');
  }

  // OffscreenCanvas check (10 points)
  if (browser.offscreenCanvas) {
    score += 10;
  } else {
    issues.push('OffscreenCanvas is not supported');
  }

  // Device memory check (15 points)
  if (device.deviceMemory) {
    if (device.deviceMemory >= 8) {
      score += 15;
    } else if (device.deviceMemory >= 4) {
      score += 10;
      issues.push('Low device memory (4GB) — model may run slowly');
    } else {
      score += 5;
      issues.push('Very low device memory (<4GB) — model may not run');
    }
  }

  return {
    ready: score >= 70 && issues.length === 0,
    score: Math.min(score, 100),
    issues,
    recommendations,
  };
}

/**
 * Main detection function — runs all checks
 */
export async function detectAllFeatures(): Promise<FeatureCheckResult> {
  const browser = detectBrowser();
  const device = detectDevice();
  const webgpu = await detectWebGPU();
  const textureCompression = detectTextureCompression(webgpu.adapter);
  const webllmReadiness = assessWebLLMReadiness(webgpu, browser, device);

  // Build the checks array for display
  const checks: FeatureCheckResult['checks'] = [];

  // WebGPU overall
  checks.push({
    label: 'WebGPU Support',
    status: webgpu.available && webgpu.enabled ? 'supported' : 'unsupported',
    value: webgpu.available && webgpu.enabled ? 'Yes' : 'No',
    description: webgpu.available && webgpu.enabled
      ? `Compute Tier ${webgpu.computeTier} — ${webgpu.info?.renderer || 'Unknown GPU'}`
      : 'WebGPU is not available or not enabled in your browser',
  });

  // Compute Tier
  if (webgpu.computeTier !== null) {
    const tierLabels = ['Tier 0 (Low-end)', 'Tier 1 (Mid-range)', 'Tier 2 (High-end)'];
    checks.push({
      label: 'Compute Tier',
      status: webgpu.computeTier === 2 ? 'supported' : webgpu.computeTier === 1 ? 'partial' : 'partial',
      value: tierLabels[webgpu.computeTier],
      description: webgpu.computeTier === 2
        ? 'High-performance GPU — ideal for running LLMs'
        : webgpu.computeTier === 1
        ? 'Mid-range GPU — may run smaller models'
        : 'Low-end / integrated GPU — limited LLM capability',
    });
  }

  // GPU Info
  if (webgpu.info) {
    checks.push({
      label: 'GPU Renderer',
      status: 'info',
      value: webgpu.info.renderer || 'Unknown',
      description: `Vendor: ${webgpu.info.vendor || 'Unknown'}`,
    });
  }

  // Texture Compression
  const supportedFormats = Object.entries(textureCompression)
    .filter(([, supported]) => supported)
    .map(([format]) => format.toUpperCase());

  checks.push({
    label: 'Texture Compression',
    status: supportedFormats.length > 0 ? 'supported' : 'unsupported',
    value: supportedFormats.length > 0 ? supportedFormats.join(', ') : 'None',
    description: supportedFormats.length > 0
      ? `${supportedFormats.length} format(s) supported — model loading will be efficient`
      : 'No texture compression — model loading may be slower',
  });

  // SharedArrayBuffer
  checks.push({
    label: 'SharedArrayBuffer',
    status: browser.sharedArrayBuffer ? 'supported' : 'unsupported',
    value: browser.sharedArrayBuffer ? 'Yes' : 'No',
    description: browser.sharedArrayBuffer
      ? 'Required for WebLLM multi-threading'
      : 'Required for WebLLM — check COOP/COEP headers',
  });

  // Web Workers
  checks.push({
    label: 'Web Workers',
    status: browser.webWorkers ? 'supported' : 'unsupported',
    value: browser.webWorkers ? 'Yes' : 'No',
    description: browser.webWorkers
      ? 'Background threads available for model inference'
      : 'Web Workers not supported',
  });

  // OffscreenCanvas
  checks.push({
    label: 'OffscreenCanvas',
    status: browser.offscreenCanvas ? 'supported' : 'unsupported',
    value: browser.offscreenCanvas ? 'Yes' : 'No',
    description: browser.offscreenCanvas
      ? 'Offscreen rendering supported'
      : 'OffscreenCanvas not available',
  });

  // Service Worker
  checks.push({
    label: 'Service Worker',
    status: browser.serviceWorker ? 'supported' : 'unsupported',
    value: browser.serviceWorker ? 'Yes' : 'No',
    description: browser.serviceWorker
      ? 'Service workers available for caching'
      : 'Service workers not supported',
  });

  // Device Memory
  checks.push({
    label: 'Device Memory',
    status: device.deviceMemory ? (device.deviceMemory >= 8 ? 'supported' : 'partial') : 'unsupported',
    value: device.deviceMemory ? `${device.deviceMemory} GB` : 'Unknown',
    description: device.deviceMemory
      ? device.deviceMemory >= 8
        ? 'Sufficient memory for LLM inference'
        : device.deviceMemory >= 4
        ? 'Minimum recommended memory for LLMs'
        : 'Low memory — model may not run properly'
      : 'Device memory detection not available',
  });

  // CPU Cores
  checks.push({
    label: 'CPU Cores',
    status: device.hardwareConcurrency >= 4 ? 'supported' : 'partial',
    value: `${device.hardwareConcurrency} cores`,
    description: device.hardwareConcurrency >= 4
      ? 'Adequate CPU cores for model processing'
      : 'Low core count — may impact performance',
  });

  // Browser
  checks.push({
    label: 'Browser',
    status: (browser.isChrome || browser.isEdge || browser.isSafari) && parseFloat(browser.version) >= 113 ? 'supported' : 'partial',
    value: `${browser.name} ${browser.version}`,
    description: browser.isChromeBased || browser.isSafari
      ? 'Compatible browser for WebGPU'
      : 'Consider using Chrome 113+, Edge 113+, or Safari 17+',
  });

  // Screen
  checks.push({
    label: 'Display',
    status: 'info',
    value: `${device.screenResolution} @ ${device.pixelRatio}x`,
    description: `${device.colorDepth}-bit color depth`,
  });

  // Touch
  checks.push({
    label: 'Touch Support',
    status: device.maxTouchPoints > 0 ? 'supported' : 'info',
    value: device.maxTouchPoints > 0 ? `${device.maxTouchPoints} points` : 'None',
    description: device.maxTouchPoints > 0 ? 'Touch input available' : 'No touch input',
  });

  return {
    webgpu,
    textureCompression,
    browser,
    device,
    webllmReadiness,
    checks,
  };
}

/**
 * Check if a specific WebGPU feature is supported
 */
export function hasWebGPUFeature(feature: string, adapter: GPUAdapter | null): boolean {
  if (!adapter) return false;
  return adapter.features.has(feature as any);
}

/**
 * Get the maximum buffer size supported by the GPU
 */
export function getMaxBufferSize(adapter: GPUAdapter | null): number {
  if (!adapter) return 0;
  return adapter.limits?.maxBufferSize || 0;
}

/**
 * Get the maximum texture size supported by the GPU
 */
export function getMaxTextureSize(adapter: GPUAdapter | null): number {
  if (!adapter) return 0;
  return adapter.limits?.maxTextureDimension2D || 0;
}
