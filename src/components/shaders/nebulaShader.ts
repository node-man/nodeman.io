// Nebula Cloud Shader with FBM Noise
// Creates volumetric, organic cloud-like nebula effects

export const nebulaVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const nebulaFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uOpacity;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  // Simplex 3D Noise
  vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
            
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  // Fractal Brownian Motion
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for(int i = 0; i < 6; i++) {
      value += amplitude * snoise(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    
    return value;
  }
  
  void main() {
    vec2 uv = vUv;
    
    // Create flowing nebula pattern
    vec3 pos = vec3(uv * 3.0, uTime * 0.05);
    
    // Multiple layers of noise for complexity
    float noise1 = fbm(pos);
    float noise2 = fbm(pos * 2.0 + vec3(100.0));
    float noise3 = fbm(pos * 0.5 + vec3(50.0, 0.0, uTime * 0.02));
    
    // Combine noise layers
    float combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
    combinedNoise = smoothstep(-0.2, 0.8, combinedNoise);
    
    // Create soft circular falloff from center
    vec2 center = uv - 0.5;
    float dist = length(center);
    float falloff = 1.0 - smoothstep(0.0, 0.5, dist);
    
    // Color gradient based on noise
    vec3 color = mix(uColor1, uColor2, combinedNoise * 0.5 + 0.5);
    
    // Apply falloff and noise to alpha
    float alpha = combinedNoise * falloff * uOpacity;
    alpha = clamp(alpha, 0.0, 1.0);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// Particle sprite shader for soft glowing particles
export const particleSpriteVertexShader = `
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 aColor;
  
  varying float vAlpha;
  varying vec3 vColor;
  
  uniform float uTime;
  uniform float uPixelRatio;
  
  void main() {
    vAlpha = aAlpha;
    vColor = aColor;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // Size attenuation
    gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const particleSpriteFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    // Create soft circular particle
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    
    // Soft falloff
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha *= vAlpha;
    
    // Glow effect
    float glow = exp(-dist * 3.0) * 0.5;
    
    vec3 finalColor = vColor + vColor * glow;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;
