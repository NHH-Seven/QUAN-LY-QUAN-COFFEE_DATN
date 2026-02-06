"use client"

import { cn } from "@/lib/utils"

interface PasswordStrengthProps {
  password: string
  className?: string
}

/**
 * Calculates password strength based on criteria met
 * Returns strength level: 0-4 (weak to strong)
 * 
 * Criteria:
 * - Length >= 8 characters
 * - Contains uppercase letter
 * - Contains lowercase letter
 * - Contains digit
 * - Contains special character (!@#$%^&*)
 */
export function calculateStrength(password: string): number {
  if (!password) return 0
  
  let strength = 0
  
  // Check length >= 8
  if (password.length >= 8) strength++
  
  // Check uppercase letter
  if (/[A-Z]/.test(password)) strength++
  
  // Check lowercase letter
  if (/[a-z]/.test(password)) strength++
  
  // Check digit
  if (/[0-9]/.test(password)) strength++
  
  // Check special character
  if (/[!@#$%^&*]/.test(password)) strength++
  
  // Map 5 criteria to 0-4 scale
  // 0 criteria = 0, 1-2 criteria = 1, 3 criteria = 2, 4 criteria = 3, 5 criteria = 4
  if (strength === 0) return 0
  if (strength <= 2) return 1
  if (strength === 3) return 2
  if (strength === 4) return 3
  return 4
}

const strengthLabels: Record<number, string> = {
  0: "Rất yếu",
  1: "Yếu",
  2: "Trung bình",
  3: "Mạnh",
  4: "Rất mạnh",
}

const strengthColors: Record<number, string> = {
  0: "bg-gray-200 dark:bg-gray-700",
  1: "bg-red-500",
  2: "bg-orange-500",
  3: "bg-yellow-500",
  4: "bg-green-500",
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const strength = calculateStrength(password)
  
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              index < strength ? strengthColors[strength] : "bg-gray-200 dark:bg-gray-700"
            )}
          />
        ))}
      </div>
      {password && (
        <p className={cn(
          "text-xs",
          strength <= 1 && "text-red-500",
          strength === 2 && "text-orange-500",
          strength === 3 && "text-yellow-600 dark:text-yellow-500",
          strength === 4 && "text-green-500"
        )}>
          {strengthLabels[strength]}
        </p>
      )}
    </div>
  )
}
