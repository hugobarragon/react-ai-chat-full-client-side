/**
 * Calculate the context window size based on the device's available RAM.
 * Uses navigator.deviceMemory when available, falls back to the minimum.
 * 
 * RAM tiers:
 *   < 4GB  -> 2048 (minimum)
 *   4-8GB  -> 4096
 *   > 8GB  -> 8192
 */
export const getDynamicContextWindow = (): number => {
  const deviceMemory = (navigator as any)?.deviceMemory || 2;
  
  
  // deviceMemory returns approximate GB of RAM as a number
  if (deviceMemory >= 8) {
    return 8192;
  } else if (deviceMemory >= 4) {
    return 4096;
  } else {
    return 2048;
  }
};

/**
 * Get the model configuration with the appropriate context window for the current device.
 */
export const getModelConfigWithContext = (baseModelConfig: any) => {
  const contextWindow = getDynamicContextWindow();
  
  return {
    ...baseModelConfig,
    overrides: {
      ...baseModelConfig.overrides,
      context_window_size: contextWindow,
    },
  };
};
