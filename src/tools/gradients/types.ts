import type { ColorStop } from '@/types/tools'

export type GradientsSettings = {
  colorStops: ColorStop[]
  flowAngle: number
  noiseScale: number
  noiseIntensity: number
  curveDistortion: number
  noiseOctaves: number
  depthIntensity: number
  highlightStrength: number
  shadowStrength: number
  foldScale: number
  grainIntensity: number
  grainSize: number
  brightness: number
  contrast: number
  saturation: number
  isAnimating: boolean
  animationSpeed: number
}
