import React, { useRef } from "react"

interface InputOTPProps {
  length?: number
  onChange?: (value: string) => void
  value?: string
  disabled?: boolean
}

export function InputOTP({ length = 6, onChange, value = "", disabled = false }: InputOTPProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const val = e.target.value.replace(/[^0-9]/g, "")
    const newValue =
      value.substring(0, idx) + val + value.substring(idx + 1)
    onChange?.(newValue)
    if (val && idx < length - 1) {
      inputs.current[idx + 1]?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace" && !value[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus()
    }
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={el => { inputs.current[idx] = el }}
          maxLength={1}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value[idx] || ""}
          onChange={e => handleChange(e, idx)}
          onKeyDown={e => handleKeyDown(e, idx)}
          style={{ width: 32, textAlign: "center", fontSize: 24, borderRadius: 4, border: "1px solid #ccc" }}
          disabled={disabled}
        />
      ))}
    </div>
  )
}
