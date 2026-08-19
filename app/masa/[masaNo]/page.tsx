import { redirect } from "next/navigation";

export default async function MasaPage({
  params,
}: {
  params: Promise<{ masaNo: string }>;
}) {
  const { masaNo } = await params;

  redirect(`/?masa=${encodeURIComponent(masaNo)}`);
}