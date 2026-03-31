import { redirect } from "next/navigation";

interface Props {
  params: { clubSlug: string };
}

export default function AttendancePage({ params }: Props) {
  redirect(`/${params.clubSlug}/attendance/history`);
}
