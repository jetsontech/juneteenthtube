"use client";

import { SectionPage } from "@/components/layout/SectionPage";

export default function LibraryPage() {
    return (
        <SectionPage
            title="Library"
            emptyMessage="Your library is empty. Save videos to watch them here."
            filter={() => false} // Empty for now as we don't have persisted user library
        />
    );
}
