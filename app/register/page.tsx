import AuthForm from "@/components/AuthForm";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; need?: string }> }) {
  const { next, need } = await searchParams;
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return <div className="container section"><AuthForm mode="register" next={safe} need={need ?? null} /></div>;
}
