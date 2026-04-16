import { redirect } from "next/navigation";

export default function ProjectPage({ params }: { params: { id: string } }) {
  redirect(`/projects/${params.id}/analysis`);
}
