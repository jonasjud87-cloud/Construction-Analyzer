"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import LogoutButton from "@/components/LogoutButton";
import NewProjectModal from "@/components/NewProjectModal";
import ProjectCard from "@/components/ProjectCard";

interface Project {
  id: string;
  name: string;
  domain: string;
  location: { canton: string; municipality: string };
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      setEmail(data.user.email ?? "");
    });
  }, [router]);

  async function loadProjects() {
    try {
      const data = await api.get<Project[]>("/projects");
      setProjects(data ?? []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">KI Analyse Plattform</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/standards"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Normen-Datenbank
            </Link>
            <span className="text-gray-200">|</span>
            <span className="text-sm text-gray-500">{email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-gray-800">Meine Projekte</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Neues Projekt
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <p className="text-gray-400 text-sm">Noch keine Projekte vorhanden.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Erstes Projekt erstellen →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} onDeleted={loadProjects} />
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreated={loadProjects}
        />
      )}
    </div>
  );
}
