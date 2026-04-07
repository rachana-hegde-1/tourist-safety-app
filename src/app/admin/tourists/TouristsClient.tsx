"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type TouristRow = {
  tourist_id: string;
  photo_url: string | null;
  name: string;
  nationality: string;
  trip_start_date: string | null;
  trip_end_date: string | null;
  safety_score: number;
  wearable_connected: boolean;
  last_seen: string | null;
};

export function TouristsClient() {
  const [rows, setRows] = React.useState<TouristRow[]>([]);
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      const res = await fetch(`/api/admin/tourists?q=${encodeURIComponent(q)}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      const json = (await res.json()) as { ok: boolean; tourists?: TouristRow[] };
      if (!res.ok || !json.ok) return;
      setRows(json.tourists ?? []);
    };
    void run();
    return () => controller.abort();
  }, [q]);

  return (
    <div className="px-6 pb-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Tourists</h1>
        <Input
          placeholder="Search by name"
          className="max-w-xs"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="overflow-auto rounded-lg border bg-white dark:bg-black">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left p-3">Photo</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Nationality</th>
              <th className="text-left p-3">Trip dates</th>
              <th className="text-left p-3">Safety</th>
              <th className="text-left p-3">Wearable</th>
              <th className="text-left p-3">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.tourist_id} className="border-t hover:bg-muted/20">
                <td className="p-3">
                  {r.photo_url ? (
                    <Image
                      src={r.photo_url}
                      alt=""
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-muted" />
                  )}
                </td>
                <td className="p-3">
                  <Link href={`/admin/tourists/${r.tourist_id}`} className="underline underline-offset-4">
                    {r.name}
                  </Link>
                </td>
                <td className="p-3">{r.nationality}</td>
                <td className="p-3">
                  {(r.trip_start_date ?? "-") + " → " + (r.trip_end_date ?? "-")}
                </td>
                <td className="p-3">
                  <Badge
                    variant={
                      r.safety_score >= 80 ? "default" : r.safety_score >= 50 ? "secondary" : "destructive"
                    }
                  >
                    {r.safety_score}
                  </Badge>
                </td>
                <td className="p-3">{r.wearable_connected ? "Connected" : "Not connected"}</td>
                <td className="p-3">{r.last_seen ? new Date(r.last_seen).toLocaleString() : "-"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-4 text-muted-foreground" colSpan={7}>
                  No tourists found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

