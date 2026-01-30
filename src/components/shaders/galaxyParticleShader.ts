// Galaxy Particle Shader
// Creates realistic spiral galaxy with size attenuation and color gradients

export const galaxyVertexShader = `
  attribute float aSize;
  attribute float aBrightness;
  attribute float aDistanceFromCenter;
  
  varying float vBrightness;
  varying float vDistanceFromCenter;
  varying vec3 vColor;
  
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec3 uCoreColor;
  uniform vec3 uArmColor;
  
  void main() {
    vBrightness = aBrightness;
    vDistanceFromCenter = aDistanceFromCenter;
    
    // Color gradient from core to arms
    vColor = mix(uCoreColor, uArmColor, smoothstep(0.0, 1.0, aDistanceFromCenter));
    
    // Subtle rotation animation
    float angle = uTime * 0.02 * (1.0 - aDistanceFromCenter * 0.5);
    vec3 pos = position;
    float cosA = cos(angle);
    float sinA = sin(angle);
    pos.x = position.x * cosA - position.z * sinA;
    pos.z = position.x * sinA + position.z * cosA;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Size attenuation - closer to core = larger
    float sizeMultiplier = 1.0 + (1.0 - aDistanceFromCenter) * 0.5;
    gl_PointSize = aSize * sizeMultiplier * uPixelRatio * (200.0 / -mvPosition.z);
    gl_PointSize = max(gl_PointSize, 1.0);
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const galaxyFragmentShader = `
  varying float vBrightness;
  varying float vDistanceFromCenter;
  varying vec3 vColor;
  
  void main() {
    // Create soft circular particle with glow
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    
    // Discard pixels outside circle
    if (dist > 0.5) discard;
    
    // Soft falloff with glow
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha *= vBrightness;
    
    // Core glow effect
    float coreGlow = exp(-dist * 4.0) * (1.0 - vDistanceFromCenter);
    
    // Final color with glow
    vec3 finalColor = vColor + vColor * coreGlow * 0.5;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// Distant galaxy shader - simpler for performance
export const distantGalaxyVertexShader = `
  attribute float aSize;
  attribute float aBrightness;
  
  varying float vBrightness;
  varying vec3 vColor;
  
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec3 uColor;
  
  void main() {
    vBrightness = aBrightness;
    vColor = uColor;
    
    // Very subtle rotation
    float angle = uTime * 0.01;
    vec3 pos = position;
    float cosA = cos(angle);
    float sinA = sin(angle);
    pos.x = position.x * cosA - position.z * sinA;
    pos.z = position.x * sinA + position.z * cosA;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    gl_PointSize = aSize * uPixelRatio * (150.0 / -mvPosition.z);
    gl_PointSize = max(gl_PointSize, 0.5);
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const distantGalaxyFragmentShader = `
  varying float vBrightness;
  varying vec3 vColor;
  
  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    
    if (dist > 0.5) discard;
    
    // Very soft particles for distant effect
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha *= vBrightness * 0.6; // More transparent for distance
    
    gl_FragColor = vec4(vColor, alpha);
  }
`;

// Utility: Generate logarithmic spiral positions
export function generateSpiralGalaxyPositions(
  particleCount: number,
  armCount: number = 2,
  spread: number = 0.3,
  radius: number = 15,
  heightVariation: number = 0.5
): {
  positions: Float32Array;
  sizes: Float32Array;
  brightness: Float32Array;
  distanceFromCenter: Float32Array;
} {
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const brightness = new Float32Array(particleCount);
  const distanceFromCenter = new Float32Array(particleCount);

  // Spiral parameters
  const a = 0.5; // Starting radius
  const b = 0.15; // Spiral tightness

  for (let i = 0; i < particleCount; i++) {
    let x, y, z, dist;

    // 30% particles in central bulge
    if (i < particleCount * 0.3) {
      // Central bulge - dense core
      const r = Math.random() * radius * 0.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      x = r * Math.sin(phi) * Math.cos(theta);
      y = r * Math.sin(phi) * Math.sin(theta) * 0.3; // Flattened
      z = r * Math.cos(phi);
      
      dist = r / (radius * 0.2);
      sizes[i] = Math.random() * 2 + 1.5;
      brightness[i] = 0.5 + Math.random() * 0.15; // Reduced 40% for readability
    } else {
      // Spiral arms
      const armIndex = Math.floor(Math.random() * armCount);
      const armOffset = (armIndex / armCount) * Math.PI * 2;
      
      // Logarithmic spiral
      const t = Math.random();
      const theta = t * Math.PI * 4 + armOffset; // 2 full rotations
      const r = a * Math.exp(b * theta);
      
      // Normalize radius
      const normalizedR = Math.min(r / 10, 1) * radius;
      
      // Add spread/noise
      const spreadX = (Math.random() - 0.5) * spread * normalizedR;
      const spreadZ = (Math.random() - 0.5) * spread * normalizedR;
      
      x = normalizedR * Math.cos(theta) + spreadX;
      z = normalizedR * Math.sin(theta) + spreadZ;
      y = (Math.random() - 0.5) * heightVariation * (1 - t * 0.5);
      
      dist = normalizedR / radius;
      sizes[i] = Math.random() * 1.5 + 0.5;
      brightness[i] = 0.25 + Math.random() * 0.25 * (1 - dist * 0.5); // Reduced 40% for readability
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    distanceFromCenter[i] = Math.min(dist, 1);
  }

  return { positions, sizes, brightness, distanceFromCenter };
}

// Generate mini spiral for distant galaxies
export function generateMiniSpiralPositions(
  particleCount: number,
  radius: number = 5
): {
  positions: Float32Array;
  sizes: Float32Array;
  brightness: Float32Array;
} {
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const brightness = new Float32Array(particleCount);

  const armCount = 2;
  const a = 0.2;
  const b = 0.2;

  for (let i = 0; i < particleCount; i++) {
    let x, y, z;

    if (i < particleCount * 0.25) {
      // Core
      const r = Math.random() * radius * 0.15;
      const theta = Math.random() * Math.PI * 2;
      x = r * Math.cos(theta);
      z = r * Math.sin(theta);
      y = (Math.random() - 0.5) * 0.2;
      
      sizes[i] = Math.random() * 1 + 0.8;
      brightness[i] = 0.6 + Math.random() * 0.3;
    } else {
      // Arms
      const armIndex = Math.floor(Math.random() * armCount);
      const armOffset = (armIndex / armCount) * Math.PI * 2;
      
      const t = Math.random();
      const theta = t * Math.PI * 3 + armOffset;
      const r = a * Math.exp(b * theta);
      const normalizedR = Math.min(r / 3, 1) * radius;
      
      x = normalizedR * Math.cos(theta) + (Math.random() - 0.5) * 0.3;
      z = normalizedR * Math.sin(theta) + (Math.random() - 0.5) * 0.3;
      y = (Math.random() - 0.5) * 0.15;
      
      sizes[i] = Math.random() * 0.8 + 0.3;
      brightness[i] = 0.3 + Math.random() * 0.3;
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }

  return { positions, sizes, brightness };
}
