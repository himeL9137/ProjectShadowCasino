/**
 * Utility function for conditional styling based on debug mode
 * @param base - Base classes that always apply
 * @param debug - Whether debug mode is enabled
 * @param fancy - Fancy classes that are stripped in debug mode
 * @returns Combined class string
 */
export function conditionalClass(base: string, debug: boolean, fancy: string): string {
  return debug ? base : `${base} ${fancy}`;
}

/**
 * Debug-aware class combiner with support for multiple conditions
 */
export function debugAwareClass(
  base: string, 
  debug: boolean, 
  options: {
    animations?: string;
    gradients?: string;
    shadows?: string;
    effects?: string;
  } = {}
): string {
  if (debug) {
    return base;
  }
  
  const { animations = '', gradients = '', shadows = '', effects = '' } = options;
  return [base, animations, gradients, shadows, effects]
    .filter(Boolean)
    .join(' ');
}