import ProjectForm from '@/features/projects/ProjectForm';
export const metadata = { title: 'New project — AVORA' };
export default function NewProject() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">New project</h1>
      <ProjectForm />
    </div>
  );
}