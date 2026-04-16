"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";

interface Project {
  id: string;
  name: string;
  domain: string;
  location: { canton: string; municipality: string };
  status: string;
  created_at: string;
}

interface Props {
  project: Project;
  onDeleted: () => void;
}

export default function ProjectCard({ project, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm(`Projekt "${project.name}" wirklich löschen?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/projects/${project.id}`);
      onDeleted();
    } catch {
      setDeleting(false);
    }
  }

  const date = new Date(project.created_at).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <Link
      href={`/projects/${project.id}/analysis`}
      className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
            {project.name}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {project.location.municipality}, {project.location.canton}
          </p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-gray-300 hover:text-red-500 transition-colors shrink-0 text-lg leading-none"
          title="Projekt löschen"
        >
          ×
        </button>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
          {project.domain === "bau" ? "Bau / Architektur" : project.domain}
        </span>
        <span className="text-xs text-gray-400">{date}</span>
      </div>
    </Link>
  );
}
