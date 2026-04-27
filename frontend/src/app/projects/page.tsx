import Link from 'next/link';
import { Plus, Folder, ChevronRight, Calendar } from 'lucide-react';

interface Project {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

async function getProjects(): Promise<Project[]> {
  try {
    const res = await fetch('http://localhost:8000/api/projects', { 
      cache: 'no-store' 
    });
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  } catch {
    return [];
  }
}

export default async function Projects() {
  const projects = await getProjects();

  return (
    <div className="pt-20 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-500 mt-1">Manage your fairness audit projects</p>
          </div>
          <Link href="/projects/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="card text-center py-16">
            <Folder className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-4">Create your first project to start auditing for fairness</p>
            <Link href="/projects/new" className="btn-primary inline-block">
              Create Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link 
                key={project.id} 
                href={`/projects/${project.id}`} 
                className="card hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Folder className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {project.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                </div>
                
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}