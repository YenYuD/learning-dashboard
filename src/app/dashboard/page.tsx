'use client';

import { trpc } from '~/utils/trpc';
import Link from 'next/link';
import { useState } from 'react';

export default function DashboardPage() {
  // Temporary hardcoded userId - will be replaced with Supabase auth
  const userId = 'demo-user';

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardType, setNewBoardType] = useState<'TASK_BASED' | 'TIME_ONLY'>(
    'TASK_BASED',
  );
  const [newBoardIcon, setNewBoardIcon] = useState('📚');
  const [newBoardColor, setNewBoardColor] = useState('#3B82F6');

  const utils = trpc.useUtils();

  // Fetch boards
  const boards = trpc.board.list.useQuery({ userId });

  // Mutations
  const createBoard = trpc.board.create.useMutation({
    onSuccess: () => {
      utils.board.list.invalidate();
      setShowCreateForm(false);
      setNewBoardName('');
      setNewBoardIcon('📚');
      setNewBoardColor('#3B82F6');
    },
  });

  const deleteBoard = trpc.board.delete.useMutation({
    onSuccess: () => {
      utils.board.list.invalidate();
    },
  });

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    createBoard.mutate({
      name: newBoardName,
      type: newBoardType,
      userId,
      icon: newBoardIcon,
      color: newBoardColor,
    });
  };

  const handleDeleteBoard = (boardId: string, boardName: string) => {
    if (
      confirm(
        `Are you sure you want to delete "${boardName}"? This will also delete all lists, tasks, and time entries.`,
      )
    ) {
      deleteBoard.mutate({ id: boardId });
    }
  };

  const iconOptions = ['📚', '💻', '⛷️', '🎯', '📊', '🚀', '💪', '🎨', '🎵', '📝'];
  const colorOptions = [
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              My Dashboard
            </h1>
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
          <p className="text-gray-400">
            Manage your learning boards and track progress
          </p>
        </div>

        {/* Create Board Button */}
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="mb-6 bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg px-6 py-3 font-semibold flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Create New Board
          </button>
        )}

        {/* Create Board Form */}
        {showCreateForm && (
          <div className="mb-6 bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Create New Board</h2>
            <form onSubmit={handleCreateBoard} className="space-y-4">
              {/* Board Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Board Name
                </label>
                <input
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="e.g., English Learning"
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Board Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Board Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setNewBoardType('TASK_BASED')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      newBoardType === 'TASK_BASED'
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-gray-700 bg-gray-900/30 hover:border-gray-600'
                    }`}
                  >
                    <div className="text-2xl mb-2">✅</div>
                    <div className="font-semibold">Task Based</div>
                    <div className="text-sm text-gray-400">
                      Organize with lists and tasks
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewBoardType('TIME_ONLY')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      newBoardType === 'TIME_ONLY'
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-gray-700 bg-gray-900/30 hover:border-gray-600'
                    }`}
                  >
                    <div className="text-2xl mb-2">⏱️</div>
                    <div className="font-semibold">Time Only</div>
                    <div className="text-sm text-gray-400">
                      Track time without tasks
                    </div>
                  </button>
                </div>
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Icon
                </label>
                <div className="flex gap-2 flex-wrap">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewBoardIcon(icon)}
                      className={`text-2xl p-2 rounded-lg transition-all ${
                        newBoardIcon === icon
                          ? 'bg-blue-600 scale-110'
                          : 'bg-gray-900/50 hover:bg-gray-800'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewBoardColor(color)}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        newBoardColor === color
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={createBoard.isPending}
                  className="bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg px-6 py-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createBoard.isPending ? 'Creating...' : 'Create Board'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-700 hover:bg-gray-600 transition-colors rounded-lg px-6 py-2 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Boards Grid */}
        {boards.isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-400 mt-4">Loading boards...</p>
          </div>
        )}

        {boards.error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
            <p className="text-red-400">
              Error loading boards: {boards.error.message}
            </p>
          </div>
        )}

        {boards.data && boards.data.length === 0 && !showCreateForm && (
          <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-gray-700">
            <p className="text-2xl mb-2">📋</p>
            <p className="text-gray-400 text-lg mb-4">
              No boards yet. Create your first board to get started!
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg px-6 py-3 font-semibold inline-flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              Create Your First Board
            </button>
          </div>
        )}

        {boards.data && boards.data.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.data.map((board) => (
              <div
                key={board.id}
                className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-all group"
              >
                {/* Board Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="text-3xl p-2 rounded-lg"
                      style={{ backgroundColor: board.color || '#3B82F6' }}
                    >
                      {board.icon || '📚'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{board.name}</h3>
                      <span className="text-xs text-gray-400 uppercase">
                        {board.type === 'TASK_BASED'
                          ? '✅ Task Based'
                          : '⏱️ Time Only'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Board Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">Lists</p>
                    <p className="text-2xl font-bold">{board.lists.length}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">Tasks</p>
                    <p className="text-2xl font-bold">
                      {board.lists.reduce(
                        (sum, list) => sum + list.tasks.length,
                        0,
                      )}
                    </p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3 col-span-2">
                    <p className="text-gray-400 text-xs mb-1">Time Entries</p>
                    <p className="text-2xl font-bold">
                      {board.timeEntries.length}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link
                    href={`/board/${board.id}`}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg px-4 py-2 text-center font-semibold"
                  >
                    Open Board
                  </Link>
                  <button
                    onClick={() => handleDeleteBoard(board.id, board.name)}
                    disabled={deleteBoard.isPending}
                    className="bg-red-600 hover:bg-red-700 transition-colors rounded-lg px-4 py-2 font-semibold disabled:opacity-50"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
