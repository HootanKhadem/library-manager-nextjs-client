"use client";

import { useRouter } from "next/navigation";
import {useLibrary} from "@/src/contexts/LibraryContext";
import DashboardPage from "@/src/components/pages/DashboardPage";

export default function DashboardRoute() {
    const router = useRouter();
    const { dataVersion } = useLibrary();
    return <DashboardPage onViewAll={() => router.push("/books")} refreshKey={dataVersion} />;
}
