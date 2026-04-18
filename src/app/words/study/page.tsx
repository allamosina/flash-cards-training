import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import WordStudySession from "@/components/WordStudySession";

interface Props {
  searchParams: { direction?: string; levels?: string; types?: string; topics?: string };
}

export default async function WordStudyPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const direction = searchParams.direction === "ru-cz" ? "ru-cz" : "cz-ru";
  const levels = searchParams.levels ? searchParams.levels.split(",").filter(Boolean) : ["new", "fail", "hard", "easy"];
  const types = searchParams.types ? searchParams.types.split(",").filter(Boolean) : [];
  const topics = searchParams.topics ? searchParams.topics.split(",").filter(Boolean) : [];

  const words = await prisma.word.findMany({
    where: {
      userId: session.user.id,
      ...(types.length > 0 && { wordType: { in: types } }),
      ...(topics.length > 0 && { topic: { in: topics } }),
    },
    include: { progress: { where: { userId: session.user.id } } },
  });

  const studyWords = words
    .filter((w) => levels.includes(w.progress[0]?.level ?? "new"))
    .map((w) => ({
      id: w.id,
      czech: w.czech,
      russian: w.russian,
      gender: w.gender,
      wordType: w.wordType,
      topic: w.topic,
    }));

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <Link href="/words" className="text-sm text-indigo-600 hover:underline">
          ← Words
        </Link>
        <span className="text-sm text-gray-400">{studyWords.length} words to study</span>
      </div>
      <WordStudySession words={studyWords} direction={direction} />
    </div>
  );
}
