import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ScriptImportWizard } from "@/components/script/ScriptImportWizard";

export default async function NewScriptPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/api/auth/signin");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">台本をインポート</h1>
        <p className="text-sm text-gray-500 mt-1">
          docx・pdf・txtファイルをアップロードして台本を登録します
        </p>
      </div>
      <ScriptImportWizard />
    </div>
  );
}
