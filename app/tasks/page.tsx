// app/tasks/page.tsx
// Version 2.0: Mobile Responsive

import Link from 'next/link';
import { ArrowsRightLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

type Task = {
  id: number;
  type: string;
  status: string;
  parameters: { query?: string };
  created_at: string;
  completed_at: string | null;
};

type FetchResult = {
  tasks: Task[];
  error: string | null;
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-ZA', { hour12: false });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-500/20 text-green-400';
    case 'in_progress': return 'bg-blue-500/20 text-blue-400';
    case 'failed': return 'bg-red-500/20 text-red-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

async function getTasks(): Promise<FetchResult> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return { tasks: [], error: "API URL is not configured." };
    
    const res = await fetch(`${apiUrl}/tasks`, { cache: 'no-store' }); 

    if (!res.ok) return { tasks: [], error: `Failed to fetch tasks. Status: ${res.status}` };
    
    const tasks = await res.json();
    return { tasks, error: null };
  } catch (error) {
    console.error(error);
    return { tasks: [], error: "Could not connect to the backend API." };
  }
}

const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="text-center p-8 text-amber-500 bg-amber-500/10 rounded-lg">
        <ExclamationTriangleIcon className="h-10 w-10 mx-auto mb-2" />
        <p className="font-semibold">Connection Error</p>
        <p className="text-sm text-amber-400/80">{message}</p>
        <p className="text-xs text-gray-500 mt-4">This can happen if the backend API is still starting up. Please try refreshing in a moment.</p>
    </div>
);


export default async function TasksPage() {
  const { tasks, error } = await getTasks();

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold">Alina&apos;s Task Log</h1>
        <Link href="/" className="flex items-center space-x-2 text-purple-400 hover:text-purple-300">
          <ArrowsRightLeftIcon className="h-5 w-5" />
          <span>Return to Chat</span>
        </Link>
      </header>

      <main className="flex-1 p-4 md:p-8">
        {error ? (
          <ErrorDisplay message={error} />
        ) : tasks.length === 0 ? (
           <p className="text-center p-8 text-gray-500">No tasks found.</p>
        ) : (
          // --- MODIFIED: This container now handles the layout change ---
          <div className="space-y-4 md:space-y-0">
            {/* --- This table is now hidden on small screens --- */}
            <table className="min-w-full hidden md:table">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">ID</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">Type</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">Query</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-700/30">
                    <td className="py-3 px-4 text-sm">{task.id}</td>
                    <td className="py-3 px-4 text-sm capitalize">{task.type}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400 truncate max-w-sm">{task.parameters?.query || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm text-gray-400">{formatDate(task.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* --- This list of cards is now shown ONLY on small screens --- */}
            <div className="md:hidden space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="bg-gray-800/50 rounded-lg p-4 shadow">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-gray-300">ID: {task.id}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2 capitalize">
                    <span className="font-semibold text-gray-300">Type: </span>{task.type}
                  </p>
                  <p className="text-sm text-gray-400 mb-2">
                    <span className="font-semibold text-gray-300">Query: </span>{task.parameters?.query || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 text-right">{formatDate(task.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}