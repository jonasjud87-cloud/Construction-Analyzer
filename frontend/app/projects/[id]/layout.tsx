"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const pathname = usePathname();

  const tabs = [
    { href: `/projects/${params.id}/analysis`,  label: "Plan-Analyse" },
    { href: `/projects/${params.id}/standards`, label: "Normen" },
    { href: `/projects/${params.id}/chat`,      label: "KI Chat" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 py-4">
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const active = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                    active
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
