'use client'

import { useEffect, useRef } from 'react'
import QRCodeLib from 'qrcode'

interface QRCodeProps {
  data: string
  size?: number
  fgColor?: string
  bgColor?: string
  margin?: number
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

export default function QRCode({
  data,
  size = 200,
  fgColor = '#FFFFFF',
  bgColor = '#070510',
  margin = 2,
  errorCorrectionLevel = 'M',
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !data) return
    QRCodeLib.toCanvas(canvasRef.current, data, {
      width: size,
      margin,
      errorCorrectionLevel,
      color: { dark: fgColor, light: bgColor },
    }).catch((err) => console.error('QR generation error:', err))
  }, [data, size, fgColor, bgColor, margin, errorCorrectionLevel])

  return <canvas ref={canvasRef} className="rounded-lg" />
}
