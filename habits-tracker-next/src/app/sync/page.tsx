"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { syncCode } from "../../lib/utils";

export default function SyncPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  useEffect(() => {
    if (!id) return;

    syncCode(id);
    router.push("/");
  }, [id, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-xl">Syncing your device...</p>
    </div>
  );
}
