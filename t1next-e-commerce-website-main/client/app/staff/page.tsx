import { redirect } from "next/navigation"

/**
 * Staff Index Page
 * Redirect to dashboard
 */
export default function StaffPage() {
  redirect("/staff/dashboard")
}
