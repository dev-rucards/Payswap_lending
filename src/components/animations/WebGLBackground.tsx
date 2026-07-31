"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { canRunWebGL } from "@/lib/gsap";

/**
 * Global WebGL layer that sits behind the entire site.
 *
 * Three stacked elements build the depth:
 *  1. A full-screen raymarched-ish aurora shader (cheap fbm noise) that drifts
 *     and shifts hue with scroll.
 *  2. A field of floating "cards" — thin 3D slabs that orbit, tilt, and
 *     parallax against the cursor.
 *  3. A dust particle system for near-field depth cues.
 *
 * The camera dollies and rotates with scroll so the whole page reads as one
 * continuous 3D space rather than a stack of flat sections.
 *
 * Bails out entirely on reduced motion, small screens, low-core devices, and
 * anything without a WebGL context — the site is fully usable without it.
 */

const AURORA_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const AURORA_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uScroll;
  uniform vec2  uMouse;
  uniform vec2  uResolution;
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform vec3  uColorC;

  // Cheap 2D value noise + fbm
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);

    // Slow drift, nudged by cursor and scroll depth
    vec2 q = p * 1.6;
    q += uMouse * 0.18;
    q.y -= uScroll * 0.85;

    float t = uTime * 0.045;
    float n1 = fbm(q + vec2(t, -t * 0.6));
    float n2 = fbm(q * 1.9 + vec2(-t * 0.8, t * 1.1) + n1);

    // Two soft ribbons of light
    float ribbon = smoothstep(0.32, 0.86, n2);
    float glow   = smoothstep(0.55, 1.0, n1 * 1.15);

    vec3 col = mix(uColorA, uColorB, ribbon);
    col = mix(col, uColorC, glow * 0.65);

    // Vignette so the centre of the page stays readable
    float d = length(p);
    col *= smoothstep(1.25, 0.15, d);

    // Overall intensity — deliberately restrained, it sits under real content
    float intensity = 0.30 + 0.10 * sin(uTime * 0.12);
    gl_FragColor = vec4(col * intensity, 1.0);
  }
`;

const CARD_COUNT = 10;
const DUST_COUNT = 420;

const WebGLBackground = () => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !canRunWebGL()) return;

    let disposed = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 12);

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000510, 0);
    host.appendChild(renderer.domElement);

    // ---------------------------------------------------------------- aurora
    const auroraUniforms = {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uColorA: { value: new THREE.Color("#000510") },
      uColorB: { value: new THREE.Color("#477E70") },
      uColorC: { value: new THREE.Color("#1DC8CD") },
    };

    const auroraScene = new THREE.Scene();
    const auroraCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const auroraMat = new THREE.ShaderMaterial({
      vertexShader: AURORA_VERT,
      fragmentShader: AURORA_FRAG,
      uniforms: auroraUniforms,
      depthWrite: false,
      depthTest: false,
    });
    const auroraGeo = new THREE.PlaneGeometry(2, 2);
    auroraScene.add(new THREE.Mesh(auroraGeo, auroraMat));

    // ----------------------------------------------------------------- cards
    const cardGroup = new THREE.Group();
    scene.add(cardGroup);

    const cardGeo = new THREE.BoxGeometry(1.75, 1.1, 0.035);
    const cardPalette = [
      new THREE.Color("#99E39E"),
      new THREE.Color("#1DC8CD"),
      new THREE.Color("#477E70"),
      new THREE.Color("#dfe9ff"),
    ];

    type CardData = {
      mesh: THREE.Mesh;
      basePos: THREE.Vector3;
      spin: THREE.Vector3;
      floatSpeed: number;
      floatAmp: number;
      phase: number;
      depth: number;
    };

    const cards: CardData[] = [];
    const cardMaterials: THREE.Material[] = [];

    for (let i = 0; i < CARD_COUNT; i++) {
      const color = cardPalette[i % cardPalette.length];
      // Kept deliberately faint: at higher opacity these read as grey debris
      // floating over the content instead of ambient depth behind it.
      const mat = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.9,
        roughness: 0.22,
        emissive: color.clone().multiplyScalar(0.1),
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
      });
      cardMaterials.push(mat);

      const mesh = new THREE.Mesh(cardGeo, mat);
      // Spread across a wide slab of space, biased away from dead centre
      // Pushed out to the edges and well behind the camera plane so they never
      // sit directly behind headline copy.
      const angle = (i / CARD_COUNT) * Math.PI * 2 + Math.random() * 0.6;
      const radius = 9 + Math.random() * 7;
      const basePos = new THREE.Vector3(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 14,
        -10 - Math.random() * 16
      );
      mesh.position.copy(basePos);
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      const scale = 0.55 + Math.random() * 0.9;
      mesh.scale.setScalar(scale);

      cardGroup.add(mesh);
      cards.push({
        mesh,
        basePos,
        spin: new THREE.Vector3(
          (Math.random() - 0.5) * 0.08,
          (Math.random() - 0.5) * 0.12,
          (Math.random() - 0.5) * 0.05
        ),
        floatSpeed: 0.25 + Math.random() * 0.45,
        floatAmp: 0.35 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
        depth: 0.35 + Math.random() * 0.9,
      });
    }

    // ------------------------------------------------------------------ dust
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(DUST_COUNT * 3);
    for (let i = 0; i < DUST_COUNT; i++) {
      dustPos[i * 3 + 0] = (Math.random() - 0.5) * 34;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 26;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 26 - 4;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: new THREE.Color("#99E39E"),
      size: 0.04,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // ---------------------------------------------------------------- lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    const keyLight = new THREE.PointLight("#99E39E", 90, 60);
    keyLight.position.set(6, 6, 10);
    const rimLight = new THREE.PointLight("#1DC8CD", 70, 60);
    rimLight.position.set(-8, -4, 6);
    scene.add(ambient, keyLight, rimLight);

    // --------------------------------------------------------------- pointer
    const pointer = { x: 0, y: 0 };
    const smoothed = { x: 0, y: 0 };
    const scroll = { target: 0, current: 0 };

    const handlePointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };

    // Cached so the scroll handler never reads scrollHeight — that's a forced
    // layout read on every scroll event.
    let maxScroll = 1;
    const measure = () => {
      maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
    };

    const handleScroll = () => {
      scroll.target = window.scrollY / maxScroll;
    };

    const handleResize = () => {
      measure();
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
      auroraUniforms.uResolution.value.set(
        window.innerWidth,
        window.innerHeight
      );
    };

    window.addEventListener("pointermove", handlePointer, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    // Page height keeps changing while images and fonts settle
    window.addEventListener("load", measure);
    const sizeObserver = new ResizeObserver(measure);
    sizeObserver.observe(document.documentElement);
    measure();
    handleScroll();

    // ------------------------------------------------------------------ loop
    const clock = new THREE.Clock();
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (document.hidden) return;

      // getDelta() MUST come first: getElapsedTime() internally calls
      // getDelta(), so calling it the other way round returns dt ≈ 0 and every
      // lerp below silently freezes.
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      // Ease pointer + scroll so nothing snaps
      smoothed.x += (pointer.x - smoothed.x) * Math.min(1, dt * 3.2);
      smoothed.y += (pointer.y - smoothed.y) * Math.min(1, dt * 3.2);
      scroll.current += (scroll.target - scroll.current) * Math.min(1, dt * 2.6);

      // Aurora
      auroraUniforms.uTime.value = t;
      auroraUniforms.uScroll.value = scroll.current;
      auroraUniforms.uMouse.value.set(smoothed.x, smoothed.y);

      // Cards drift, spin, and parallax by their own depth
      for (const card of cards) {
        const { mesh, basePos, spin, floatSpeed, floatAmp, phase, depth } =
          card;
        mesh.rotation.x += spin.x * dt;
        mesh.rotation.y += spin.y * dt;
        mesh.rotation.z += spin.z * dt;
        mesh.position.x =
          basePos.x + Math.sin(t * floatSpeed + phase) * floatAmp * 0.6 +
          smoothed.x * depth * 1.6;
        mesh.position.y =
          basePos.y +
          Math.cos(t * floatSpeed * 0.8 + phase) * floatAmp +
          smoothed.y * depth * 1.2 +
          scroll.current * 14 * depth;
      }

      // Dust counter-rotates for a cheap deep-space cue
      dust.rotation.y = t * 0.012 + smoothed.x * 0.12;
      dust.rotation.x = smoothed.y * 0.08;
      dust.position.y = scroll.current * 6;

      // Camera dollies in and banks slightly as the page scrolls
      camera.position.x += (smoothed.x * 1.15 - camera.position.x) * 0.05;
      camera.position.y += (smoothed.y * 0.9 - camera.position.y) * 0.05;
      camera.position.z = 12 - scroll.current * 3.2;
      camera.rotation.z = smoothed.x * 0.02 + scroll.current * 0.05;
      camera.lookAt(0, scroll.current * 1.5, 0);

      renderer.autoClear = true;
      renderer.render(auroraScene, auroraCamera);
      renderer.autoClear = false;
      renderer.render(scene, camera);
      renderer.autoClear = true;
    };

    tick();

    // --------------------------------------------------------------- cleanup
    return () => {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", handlePointer);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("load", measure);
      sizeObserver.disconnect();

      cardGeo.dispose();
      cardMaterials.forEach((m) => m.dispose());
      dustGeo.dispose();
      dustMat.dispose();
      auroraGeo.dispose();
      auroraMat.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-screen w-screen overflow-hidden"
    />
  );
};

export default WebGLBackground;
