"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import domtoimage from "dom-to-image-more"
import jsPDF from "jspdf"

interface PdfExportButtonProps {
  reportContainerId: string
  fileName?: string
  title?: string
  dateRange?: { from: Date; to: Date }
  disabled?: boolean
  className?: string
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit", 
    year: "numeric",
  })
}

export function PdfExportButton({
  reportContainerId,
  fileName = "bao-cao",
  title = "Báo cáo doanh thu và đơn hàng",
  dateRange,
  disabled,
  className,
}: PdfExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = useCallback(async () => {
    if (isExporting) return

    setIsExporting(true)

    try {
      const reportContainer = document.getElementById(reportContainerId)
      if (!reportContainer) {
        throw new Error("Không tìm thấy container báo cáo")
      }

      // Show PDF header before capture
      const pdfHeader = document.getElementById("pdf-header")
      if (pdfHeader) {
        pdfHeader.classList.remove("hidden")
      }

      // Force white background on all elements for clean export
      const allElements = reportContainer.querySelectorAll("*")
      const originalBgs: { el: HTMLElement; bg: string }[] = []
      
      allElements.forEach((element) => {
        const el = element as HTMLElement
        const computedStyle = window.getComputedStyle(el)
        const bgColor = computedStyle.backgroundColor
        
        // Check if background is grayish (not white, not transparent)
        if (bgColor && bgColor !== "rgba(0, 0, 0, 0)" && bgColor !== "transparent") {
          const rgb = bgColor.match(/\d+/g)
          if (rgb && rgb.length >= 3) {
            const r = parseInt(rgb[0])
            const g = parseInt(rgb[1])
            const b = parseInt(rgb[2])
            // If it's a gray-ish color (r,g,b are similar and > 200)
            if (r > 200 && g > 200 && b > 200 && r < 255) {
              originalBgs.push({ el, bg: el.style.backgroundColor })
              el.style.backgroundColor = "#ffffff"
            }
          }
        }
      })

      // Wait for DOM update
      await new Promise(resolve => setTimeout(resolve, 150))

      // Capture using dom-to-image-more
      const dataUrl = await domtoimage.toPng(reportContainer, {
        quality: 1,
        bgcolor: "#ffffff",
        style: {
          transform: "scale(1)",
        },
      })

      // Restore original styles
      originalBgs.forEach(({ el, bg }) => {
        el.style.backgroundColor = bg
      })

      // Hide PDF header after capture
      if (pdfHeader) {
        pdfHeader.classList.add("hidden")
      }

      // Create image to get dimensions
      const img = new Image()
      img.src = dataUrl
      
      await new Promise((resolve) => {
        img.onload = resolve
      })

      // Create PDF in A4 landscape
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 10

      // Calculate image dimensions
      const imgWidth = pageWidth - margin * 2
      const imgHeight = (img.height * imgWidth) / img.width

      const startY = margin
      const availableHeight = pageHeight - margin * 2

      if (imgHeight <= availableHeight) {
        // Fits on one page
        pdf.addImage(dataUrl, "PNG", margin, startY, imgWidth, imgHeight)
      } else {
        // Scale down to fit
        const scale = availableHeight / imgHeight
        const scaledWidth = imgWidth * scale
        const scaledHeight = imgHeight * scale
        const xOffset = (pageWidth - scaledWidth) / 2
        pdf.addImage(dataUrl, "PNG", xOffset, startY, scaledWidth, scaledHeight)
      }

      // Save the PDF
      const timestamp = new Date().toISOString().split("T")[0]
      pdf.save(`${fileName}-${timestamp}.pdf`)

    } catch (error) {
      console.error("Export PDF error:", error)
      alert("Có lỗi khi xuất PDF. Vui lòng thử lại.")
    } finally {
      setIsExporting(false)
    }
  }, [isExporting, reportContainerId, fileName, title, dateRange])

  return (
    <Button
      variant="default"
      disabled={disabled || isExporting}
      className={cn("gap-2", className)}
      onClick={handleExport}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      {isExporting ? "Đang xuất..." : "Xuất PDF"}
    </Button>
  )
}
