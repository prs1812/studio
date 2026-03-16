import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";

export interface ThreeContext<T> {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  container: HTMLDivElement;
  settingsRef: RefObject<T>;
}

interface ThreeCallbacks {
  animate?: () => void;
  cleanup?: () => void;
}

/**
 * Set up a Three.js renderer, scene, and camera inside a container element.
 *
 * setupFn receives the context and returns optional animate/cleanup callbacks.
 * Handles resize via ResizeObserver and cleans up on unmount.
 */
export function useThree<T>(
  containerRef: RefObject<HTMLDivElement | null>,
  setupFn: (ctx: ThreeContext<T>) => ThreeCallbacks | void,
  settings: T,
  rendererOptions?: Partial<THREE.WebGLRendererParameters>,
): void {
  const settingsRef = useRef<T>(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      ...rendererOptions,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

    const callbacks = setupFn({
      renderer,
      scene,
      camera,
      container,
      settingsRef,
    });

    let rafId: number | null = null;

    if (callbacks?.animate) {
      const animate = callbacks.animate;
      const loop = () => {
        animate();
        renderer.render(scene, camera);
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    }

    const observer = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    observer.observe(container);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      observer.disconnect();
      callbacks?.cleanup?.();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // setupFn must be stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef]);
}
