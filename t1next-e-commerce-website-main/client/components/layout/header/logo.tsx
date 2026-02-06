/**
 * Header Logo Component
 * Logo trong header với variant white background
 */

import { Logo as BaseLogo } from "@/components/ui/logo"

export function Logo() {
  return (
    <div className="shrink-0">
      {/* Desktop: hiện cả icon và text */}
      <div className="hidden xl:block">
        <BaseLogo variant="white" size="md" />
      </div>
      {/* Mobile/Tablet: chỉ hiện icon */}
      <div className="xl:hidden">
        <BaseLogo variant="white" size="md" showText={false} />
      </div>
    </div>
  )
}
