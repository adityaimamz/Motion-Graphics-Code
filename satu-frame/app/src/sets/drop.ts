// One frozen raindrop hanging just outside our window (S3): 3 mm of water, a ball lens with the whole city in
// it upside down. Traced exactly over the frame: an ellipsoid (a drop this size is a little flattened
// underneath, never a teardrop), refraction in and out (n 1.333), Fresnel on both faces, total internal
// reflection at the rim. What it sees is one cube capture of the city taken from where it hangs (the city is
// frozen, so one capture holds for every frame). Traced after the scene's depth of field: the lens focuses on it.
import * as THREE from 'three';
import { FSPass, SS_TAP, SS_TAP_GLSL } from '../engine/gl';
import { RAY_GLSL, camUniforms, setCamUniforms, type Cam } from '../r3';

const FRAG = /* glsl */ `
${RAY_GLSL}
${SS_TAP_GLSL}
uniform vec3 C, Rad; uniform samplerCube env; uniform float envK;
const float ETA = 1.333;
// the ray's two crossings of the ellipsoid (t1 < 0 or no hit: tt.y < 0)
vec2 cross2(vec3 o, vec3 d) {
  vec3 oc = (o - C) / Rad, dd = d / Rad;
  float a = dot(dd, dd), b = dot(oc, dd), c = dot(oc, oc) - 1.0, h = b * b - a * c;
  vec2 tt = vec2(-1.0);
  if (h >= 0.0) { h = sqrt(h); tt = vec2(-b - h, -b + h) / a; }
  return tt;
}
vec3 nrm(vec3 p) { return normalize((p - C) / (Rad * Rad)); }
vec3 envAt(vec3 d) { return texture(env, d).rgb * envK; }
float fres(float c) { return 0.02 + 0.98 * pow(1.0 - clamp(c, 0.0, 1.0), 5.0); }
// colour (premultiplied) and coverage of the drop along one ray
vec4 shade(vec3 o, vec3 d) {
  vec2 tt = cross2(o, d);
  vec4 res = vec4(0.0);
  if (tt.y > 0.0) {
    vec3 col = vec3(0.0), p = o, T = d;
    float carry = 1.0;
    if (tt.x > 0.0) {                     // in through the near face (from inside, the ray starts in the water)
      p = o + d * tt.x;
      vec3 n = nrm(p);
      float F = fres(-dot(d, n));
      col += envAt(reflect(d, n)) * F;
      T = refract(d, n, 1.0 / ETA);
      carry = 1.0 - F;
    }
    // out through the far face; what reflects back inside goes round once more (the bright rim)
    for (int i = 0; i < 3; i++) {
      vec2 s = cross2(p + T * 1e-7, T);
      vec3 q = p + T * max(s.y, 0.0);
      vec3 n = nrm(q);
      vec3 T2 = refract(T, -n, ETA);
      vec3 R = reflect(T, -n);
      if (dot(T2, T2) > 0.0) {
        float F = fres(dot(T2, n));
        col += envAt(T2) * carry * (1.0 - F);
        carry *= F;
      }
      p = q; T = R;
    }
    res = vec4(col, 1.0);
  }
  return res;
}
void main() {
  vec4 acc = vec4(0.0);
  for (int k = ssK0(); k < ssK1(); k++) acc += shade(camPos, camRay(gl_FragCoord.xy / PX_SCALE + rgss(k)));
  fragColor = acc * ssWeight();
}`;

export class HeroDrop {
  pass = new FSPass(FRAG, {
    ...camUniforms(), ssTap: SS_TAP,
    C: { value: new THREE.Vector3() }, Rad: { value: new THREE.Vector3(1, 1, 1) }, env: { value: null }, envK: { value: 1 },
  }, { blending: THREE.CustomBlending, transparent: true });
  constructor(public center: THREE.Vector3, r: number, flat = 0.88) {
    const m = this.pass.mat;
    m.blendEquation = THREE.AddEquation; m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor;
    (this.pass.u.C!.value as THREE.Vector3).copy(center);
    (this.pass.u.Rad!.value as THREE.Vector3).set(r, r * flat, r);
  }
  set env(t: THREE.Texture) { this.pass.u.env!.value = t; }
  /** Over `out` (the frame, after its depth of field). */
  render(renderer: THREE.WebGLRenderer, cam: Cam, out: THREE.WebGLRenderTarget) {
    setCamUniforms(this.pass.u, cam);
    this.pass.render(renderer, out);
  }
}
