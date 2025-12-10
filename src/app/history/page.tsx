"use client";

import { SectionPage } from "@/components/layout/SectionPage";

export default function HistoryPage() {
    return (
        <SectionPage
            title="Watch History"
            emptyMessage="You haven't watched any videos yet."
            filter={() => false} // Empty for now
        />
    );
}
