import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SignOutButton from "@/components/SignOutButton";
import TabBar from "@/components/TabBar";
import WordsTab from "@/components/WordsTab";

export default async function WordsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const words = await prisma.word.findMany({
    where: { userId: session.user.id },
    include: { progress: { where: { userId: session.user.id } } },
    orderBy: { createdAt: "desc" },
  });

  const wordsData = words.map((w) => ({
    id: w.id,
    czech: w.czech,
    russian: w.russian,
    gender: w.gender,
    wordType: w.wordType,
    topic: w.topic,
    level: w.progress[0]?.level ?? "new",
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Flash Cards</h1>
        <div className="flex gap-3 items-center">
          <span className="text-sm text-gray-500">Hi, {session.user.name}</span>
          <SignOutButton />
        </div>
      </header>
      <TabBar />
      <WordsTab initialWords={wordsData} />
    </div>
  );
}
