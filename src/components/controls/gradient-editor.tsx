import type { ColorStop } from "@/types/tools"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { HexColorPicker } from "react-colorful"

interface GradientEditorProps {
  stops: ColorStop[]
  onChange: (stops: ColorStop[]) => void
}

export function GradientEditor({ stops, onChange }: GradientEditorProps) {
  const updateStop = (index: number, patch: Partial<ColorStop>) => {
    const next = stops.map((s, i) => (i === index ? { ...s, ...patch } : s))
    onChange(next)
  }

  const removeStop = (index: number) => {
    if (stops.length <= 2) return
    onChange(stops.filter((_, i) => i !== index))
  }

  const addStop = () => {
    const sorted = [...stops].sort((a, b) => a.position - b.position)
    let maxGap = 0
    let gapIndex = 0
    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = sorted[i + 1].position - sorted[i].position
      if (gap > maxGap) {
        maxGap = gap
        gapIndex = i
      }
    }
    const a = sorted[gapIndex]
    const b = sorted[gapIndex + 1]
    const position = Math.round((a.position + b.position) / 2)
    onChange([...stops, { color: a.color, position }])
  }

  return (
    <div className="flex flex-col gap-2">
      {stops.map((stop, i) => (
        <div key={i} className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="h-7 w-7 shrink-0 cursor-pointer rounded-md border border-border-control"
                style={{ backgroundColor: stop.color }}
              />
            </PopoverTrigger>
            <PopoverContent className="flex w-auto flex-col gap-2">
              <HexColorPicker color={stop.color} onChange={(color) => updateStop(i, { color })} />
              <input
                type="text"
                value={stop.color}
                onChange={(e) => {
                  const v = e.target.value
                  if (/^#[0-9a-fA-F]{0,6}$/.test(v)) updateStop(i, { color: v })
                }}
                className="h-7 w-full rounded-md border border-border-control bg-control-bg px-2 font-mono text-xs text-text-primary focus:outline-none"
              />
            </PopoverContent>
          </Popover>
          <div className="flex-1">
            <Slider
              value={[stop.position]}
              min={0}
              max={100}
              step={1}
              onValueChange={([p]) => updateStop(i, { position: p })}
            />
          </div>
          <span className="w-7 shrink-0 text-right font-mono text-2xs tabular-nums text-text-tertiary">
            {stop.position}%
          </span>
          {stops.length > 2 && (
            <button
              onClick={() => removeStop(i)}
              className="shrink-0 cursor-pointer text-2xs text-text-tertiary hover:text-text-secondary"
            >
              ×
            </button>
          )}
        </div>
      ))}
      <Button variant="secondary" size="sm" onClick={addStop}>
        Add stop
      </Button>
    </div>
  )
}
