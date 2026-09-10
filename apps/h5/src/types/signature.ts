export type SignaturePoint = [number, number, number]

export interface SignatureResult {
  svg: string
  previewUrl: string
  strokes: SignaturePoint[][]
  sourceWidth: number
  sourceHeight: number
}
