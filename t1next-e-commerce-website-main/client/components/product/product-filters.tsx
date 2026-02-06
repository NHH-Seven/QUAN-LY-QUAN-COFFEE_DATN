"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const brands = ["Apple", "Samsung", "Xiaomi", "ASUS", "Dell", "Sony"]
const priceRanges = [
  { label: "Dưới 5 triệu", min: 0, max: 5000000 },
  { label: "5 - 10 triệu", min: 5000000, max: 10000000 },
  { label: "10 - 20 triệu", min: 10000000, max: 20000000 },
  { label: "20 - 30 triệu", min: 20000000, max: 30000000 },
  { label: "Trên 30 triệu", min: 30000000, max: 100000000 },
]

export function ProductFilters() {
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([0, 50000000])

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) => (prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]))
  }

  const handleReset = () => {
    setSelectedBrands([])
    setPriceRange([0, 50000000])
  }

  return (
    <Card className="sticky top-24">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">Bộ lọc</CardTitle>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Đặt lại
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="multiple" defaultValue={["brand", "price"]} className="w-full">
          {/* Brand filter */}
          <AccordionItem value="brand">
            <AccordionTrigger className="text-sm font-medium">Thương hiệu</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {brands.map((brand) => (
                  <div key={brand} className="flex items-center space-x-2">
                    <Checkbox
                      id={brand}
                      checked={selectedBrands.includes(brand)}
                      onCheckedChange={() => toggleBrand(brand)}
                    />
                    <Label htmlFor={brand} className="text-sm font-normal cursor-pointer">
                      {brand}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Price filter */}
          <AccordionItem value="price">
            <AccordionTrigger className="text-sm font-medium">Khoảng giá</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <Slider
                  value={priceRange}
                  min={0}
                  max={50000000}
                  step={1000000}
                  onValueChange={setPriceRange}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{(priceRange[0] / 1000000).toFixed(0)}tr</span>
                  <span>{(priceRange[1] / 1000000).toFixed(0)}tr</span>
                </div>
                <div className="space-y-2">
                  {priceRanges.map((range) => (
                    <div key={range.label} className="flex items-center space-x-2">
                      <Checkbox
                        id={range.label}
                        checked={priceRange[0] === range.min && priceRange[1] === range.max}
                        onCheckedChange={() => setPriceRange([range.min, range.max])}
                      />
                      <Label htmlFor={range.label} className="text-sm font-normal cursor-pointer">
                        {range.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Rating filter */}
          <AccordionItem value="rating">
            <AccordionTrigger className="text-sm font-medium">Đánh giá</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center space-x-2">
                    <Checkbox id={`rating-${rating}`} />
                    <Label
                      htmlFor={`rating-${rating}`}
                      className="flex items-center gap-1 text-sm font-normal cursor-pointer"
                    >
                      {rating} sao trở lên
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Stock filter */}
          <AccordionItem value="stock">
            <AccordionTrigger className="text-sm font-medium">Tình trạng</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="in-stock" defaultChecked />
                  <Label htmlFor="in-stock" className="text-sm font-normal cursor-pointer">
                    Còn hàng
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="on-sale" />
                  <Label htmlFor="on-sale" className="text-sm font-normal cursor-pointer">
                    Đang giảm giá
                  </Label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
