// app/tasks/page.tsx

import Link from 'next/link';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

// Define the shape of our Task data
type Task = {
  id: number;
  type: string;
  status: string;
  parameters: { query?: string };
  created_at: string;
  completed_at: string | null;
};

// Helper function to format dates nicely
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Helper function to determine status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500/20 text-green-400';
    case 'in_progress':
      return 'bg-blue-500/20 text-blue-400';
    case 'failed':
      return 'bg-red-500/20 text-red-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
};

// Fetch data directly on the server
async function getTasks(): Promise<Task[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error("API URL is not configured.");
    }
    // Fetch fresh data every time to ensure the log is up to date
    const res = await fetch(`${apiUrl}/tasks`, { cache: 'no-store' }); 

    if (!res.ok) {
      throw new Error('Failed to fetch tasks');
    }
    return res.json();
  } catch (error) {
    console.error(error);
    return []; // Return an empty array on error to prevent the page from crashing
  }
}

export default async function TasksPage() {
  const tasks = await getTasks();

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
        <div className="bg-gray-800/50 rounded-lg shadow-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">ID</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">Type</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">Status</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300 hidden md:table-cell">Query</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-700/30">
                  <td className="py-3 px-4 text-sm">{task.id}</td>
                  <td className="py-3 px-4 text-sm">{task.type}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-400 hidden md:table-cell truncate max-w-sm">
                    {task.parameters?.query || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-400">{formatDate(task.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && (
            <p className="text-center p-8 text-gray-500">No tasks found.</p>
          )}
        </div>
      </main>
    </div>
  );
}