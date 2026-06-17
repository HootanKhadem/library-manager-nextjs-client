"use client";

import { useRouter } from "next/navigation";
import DashboardPage from "@/src/components/pages/DashboardPage";

export default function DashboardRoute() {
    const router = useRouter();
    return <DashboardPage onViewAll={() => router.push("/books")} />;
}
