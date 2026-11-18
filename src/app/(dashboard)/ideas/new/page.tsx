import IdeaForm from '@/features/ideas/IdeaForm';
export const metadata = { title: 'New idea — AVORA' };
export default function NewIdea() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">New idea</h1>
      <IdeaForm />
    </div>
  );
}