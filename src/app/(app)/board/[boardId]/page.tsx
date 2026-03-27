import { BoardHeader } from '~/components/board/BoardHeader';
import { ListColumn } from '~/components/board/ListColumn';
import { AddListButton } from '~/components/board/AddListButton';
import { EmptyBoard } from '~/components/board/EmptyBoard';
import { TimeOnlyBoard } from '~/components/board/TimeOnlyBoard';

// 靜態 mock 資料，待 API 串接時替換
// boardId 'mock-time' → TIME_ONLY board demo
const MOCK_BOARD = {
  id: 'mock-1',
  name: '英文學習',
  icon: '📚',
  color: '#EFF6FF',
  type: 'TASK_BASED' as const,
};

const MOCK_TIME_BOARD = {
  id: 'mock-time',
  name: '滑雪訓練',
  icon: '⛷️',
  color: '#E0F2FE',
  type: 'TIME_ONLY' as const,
};

const MOCK_LISTS = [
  {
    id: 'list-1',
    title: 'Vocabulary',
    tasks: [
      { id: 't1', title: '背單字 50 個', description: '目標：TOEFL 高頻單字', totalMinutes: 90 },
      { id: 't2', title: '複習上週單字', totalMinutes: 30 },
    ],
  },
  {
    id: 'list-2',
    title: 'Grammar',
    tasks: [
      { id: 't3', title: '時態練習', description: '完成時態練習題 1-20', totalMinutes: 45 },
    ],
  },
  {
    id: 'list-3',
    title: 'Practice',
    tasks: [
      { id: 't4', title: '口說練習', totalMinutes: 60 },
    ],
  },
];

export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = await params;

  // 依 boardId 選擇 mock board（待 API 串接後替換）
  const board = boardId === 'mock-time' ? MOCK_TIME_BOARD : MOCK_BOARD;

  if (board.type === 'TIME_ONLY') {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <BoardHeader icon={board.icon} name={board.name} />
        <TimeOnlyBoard boardName={board.name} />
      </div>
    );
  }

  const hasLists = MOCK_LISTS.length > 0;

  return (
    <div className="flex flex-col h-full">
      <BoardHeader icon={board.icon} name={board.name} />

      {hasLists ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex h-full gap-3 p-4">
            {MOCK_LISTS.map((list) => (
              <ListColumn
                key={list.id}
                title={list.title}
                tasks={list.tasks}
              />
            ))}
            <AddListButton />
          </div>
        </div>
      ) : (
        <EmptyBoard />
      )}
    </div>
  );
}
