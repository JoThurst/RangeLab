import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import type { CameraMode, FlightSample } from '../../types';
import { mToScene, sampleAtTime } from './units';

/** Default clip planes for close-up / orbit modes (ball near tee). */
const DEFAULT_NEAR = 0.1;
const DEFAULT_FAR = 800;

/**
 * Top-down camera sits ~Y 220 looking at mid-range.
 * Wider near plane + tighter far improves depth precision across
 * coplanar ground layers (tee through distant fence).
 */
const TOPDOWN_NEAR = 40;
const TOPDOWN_FAR = 720;

interface CameraRigProps {
  mode: CameraMode;
  trajectory: FlightSample[] | null;
  playbackTime: number;
  landingZ: number;
}

export function CameraRig({ mode, trajectory, playbackTime, landingZ }: CameraRigProps) {
  const orbitRef = useRef<OrbitControlsImpl>(null);
  const ballPos = useRef(new THREE.Vector3(0, 0.1, 0));
  const lookTarget = useRef(new THREE.Vector3(0, 1, 40));
  const { camera } = useThree();

  useEffect(() => {
    if (orbitRef.current) {
      orbitRef.current.enabled = mode === 'orbit';
    }
  }, [mode]);

  useFrame((_, dt) => {
    if (trajectory?.length) {
      const s = sampleAtTime(trajectory, playbackTime);
      ballPos.current.set(mToScene(s.position.x), mToScene(s.position.y), mToScene(s.position.z));
    } else {
      ballPos.current.set(0, 0.1, 0);
    }

    const damp = 1 - Math.exp(-4 * dt);
    const cam = camera as THREE.PerspectiveCamera;

    const applyClip =
      mode === 'topdown'
        ? { near: TOPDOWN_NEAR, far: TOPDOWN_FAR }
        : { near: DEFAULT_NEAR, far: DEFAULT_FAR };
    if (cam.near !== applyClip.near || cam.far !== applyClip.far) {
      cam.near = applyClip.near;
      cam.far = applyClip.far;
      cam.updateProjectionMatrix();
    }

    if (mode === 'behind') {
      const desired = new THREE.Vector3(0, 2.8, -8);
      cam.position.lerp(desired, damp);
      lookTarget.current.lerp(new THREE.Vector3(0, 1.2, 35), damp);
      cam.lookAt(lookTarget.current);
      cam.fov = THREE.MathUtils.lerp(cam.fov, 55, damp);
      cam.updateProjectionMatrix();
    } else if (mode === 'follow') {
      const desired = ballPos.current.clone().add(new THREE.Vector3(0, 2.2, -6));
      cam.position.lerp(desired, damp);
      lookTarget.current.lerp(ballPos.current.clone().add(new THREE.Vector3(0, 0.5, 8)), damp);
      cam.lookAt(lookTarget.current);
      cam.fov = THREE.MathUtils.lerp(cam.fov, 50, damp);
      cam.updateProjectionMatrix();
    } else if (mode === 'side') {
      const z = Math.max(ballPos.current.z, 20);
      const desired = new THREE.Vector3(-55, 18, z);
      cam.position.lerp(desired, damp);
      lookTarget.current.lerp(new THREE.Vector3(0, 8, z), damp);
      cam.lookAt(lookTarget.current);
      cam.fov = THREE.MathUtils.lerp(cam.fov, 45, damp);
      cam.updateProjectionMatrix();
    } else if (mode === 'landing') {
      const z = landingZ || ballPos.current.z || 150;
      const desired = new THREE.Vector3(ballPos.current.x + 12, 14, z + 18);
      cam.position.lerp(desired, damp);
      lookTarget.current.lerp(new THREE.Vector3(ballPos.current.x, 0.5, z), damp);
      cam.lookAt(lookTarget.current);
      cam.fov = THREE.MathUtils.lerp(cam.fov, 48, damp);
      cam.updateProjectionMatrix();
    } else if (mode === 'topdown') {
      const desired = new THREE.Vector3(0, 220, 140);
      cam.position.lerp(desired, damp);
      lookTarget.current.lerp(new THREE.Vector3(0, 0, 140), damp);
      cam.lookAt(lookTarget.current);
      cam.fov = THREE.MathUtils.lerp(cam.fov, 42, damp);
      cam.updateProjectionMatrix();
    } else if (mode === 'orbit' && orbitRef.current) {
      orbitRef.current.update();
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2.8, -8]} fov={55} near={DEFAULT_NEAR} far={DEFAULT_FAR} />
      <OrbitControls
        ref={orbitRef}
        enabled={mode === 'orbit'}
        target={[0, 2, 40]}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={5}
        maxDistance={350}
        enableDamping
      />
    </>
  );
}
