import { ProfileClient } from "./ProfileClient";

export default async function AdminTouristProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProfileClient touristId={id} />;
}

