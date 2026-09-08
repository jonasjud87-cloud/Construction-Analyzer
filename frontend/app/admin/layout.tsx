import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";

// Defense in depth: the admin area never depends on middleware alone. A member
// or project_manager is bounced even if the middleware gate is bypassed/fails.
// (super_admin sees the cockpit, org_admin reaches /admin/org.)
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (user.role !== "super_admin" && user.role !== "org_admin") redirect("/dashboard");

  return (
    <div style={{ minHeight: "100vh", position: "relative", background: "linear-gradient(150deg,#0a1a24 0%,#0a1420 45%,#070b14 100%) fixed" }}>
      <style>{`@keyframes glowPulse { 0%,100%{opacity:.16;transform:scale(1)} 50%{opacity:.28;transform:scale(1.1)} }`}</style>
      <div style={{ position: "fixed", top: "-12%", left: "-14%", width: "55vw", height: "55vw", maxWidth: 800, maxHeight: 800, background: "radial-gradient(circle,#4fd1ff 0%,transparent 70%)", filter: "blur(70px)", opacity: .16, zIndex: -1, pointerEvents: "none", animation: "glowPulse 11s ease-in-out infinite" }} />
      <div style={{ position: "fixed", top: "22%", right: "-16%", width: "50vw", height: "50vw", maxWidth: 700, maxHeight: 700, background: "radial-gradient(circle,#38bdf8 0%,transparent 70%)", filter: "blur(80px)", opacity: .15, zIndex: -1, pointerEvents: "none", animation: "glowPulse 14s ease-in-out infinite", animationDelay: "-4s" }} />
      <div style={{ position: "fixed", bottom: "-16%", left: "8%", width: "60vw", height: "60vw", maxWidth: 850, maxHeight: 850, background: "radial-gradient(circle,#2862D7 0%,transparent 70%)", filter: "blur(80px)", opacity: .17, zIndex: -1, pointerEvents: "none", animation: "glowPulse 17s ease-in-out infinite", animationDelay: "-8s" }} />
      {children}
    </div>
  );
}
