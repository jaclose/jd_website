import * as THREE from "three";

/**
 * Animated plasma sun — fbm over 3D simplex noise, with limb darkening so
 * the disc reads hot at the edge, granulation cells that roil over time,
 * and an HDR-lifted output (toneMapped off) so the bloom pass catches only
 * the star. Technique adapted from the classic three.js "realistic sun"
 * shader recipes (Ashima simplex noise, MIT).
 */

const SIMPLEX = /* glsl */ `
// Ashima Arts / Stefan Gustavson simplex noise (MIT)
vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
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
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
float fbm(vec3 p){
  float v = 0.0; float a = 0.5;
  for(int i=0;i<5;i++){ v += a*snoise(p); p *= 2.0; a *= 0.5; }
  return v;
}
`;

const VERT = /* glsl */ `
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vView;
void main(){
  vPos = position;
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uHot;
uniform vec3 uMid;
uniform vec3 uCool;
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vView;
${SIMPLEX}
void main(){
  vec3 p = normalize(vPos);
  // two octaves drifting at different rates → roiling granulation
  float n  = fbm(p * 3.2 + vec3(0.0, uTime * 0.06, 0.0));
  float n2 = fbm(p * 7.0 - vec3(uTime * 0.09, 0.0, uTime * 0.04));
  float plasma = 0.55 + 0.5 * n + 0.25 * n2;
  // sunspot-ish darkening in the low cells
  float spots = smoothstep(0.35, 0.0, n + 0.4 * n2);
  // colour ramp: cool core veins → mid body → white-hot crests
  vec3 col = mix(uCool, uMid, smoothstep(0.2, 0.7, plasma));
  col = mix(col, uHot, smoothstep(0.7, 1.05, plasma));
  col *= (1.0 - 0.55 * spots);
  // limb brightening — the rim runs hotter, but in a WARM tone and rolled
  // off before the very edge so it doesn't bloom into a hard white ring
  float ndv = max(dot(vNormal, vView), 0.0);
  float fres = pow(1.0 - ndv, 2.8);
  fres *= smoothstep(0.0, 0.18, ndv);   // fade the limb add right at the edge
  col += mix(uMid, uHot, 0.4) * fres * 0.6;
  // soft darkening at the extreme silhouette so the disc ends cleanly
  col *= mix(0.82, 1.0, smoothstep(0.02, 0.16, ndv));
  // HDR lift so only the star trips the bloom threshold
  col *= 1.6;
  gl_FragColor = vec4(col, 1.0);
}
`;

export function makeSunMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime: { value: 0 },
      uHot: { value: new THREE.Color("#fff3d0") },
      uMid: { value: new THREE.Color("#f6b24a") },
      uCool: { value: new THREE.Color("#c2491c") },
    },
    toneMapped: false,
  });
}
