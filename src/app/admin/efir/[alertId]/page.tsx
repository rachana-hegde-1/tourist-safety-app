import { EfirPageClient } from "../EfirPageClient";

export default function AdminEfirPage({
  params,
}: {
  params: { alertId: string };
}) {
  return <EfirPageClient alertId={params.alertId} />;
}
