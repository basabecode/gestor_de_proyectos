import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useBoardStore from '../stores/boardStore';
import TopBar from '../components/layout/TopBar';
import BoardView from '../components/board/BoardView';

export default function BoardPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { boards, setActiveBoard, activeBoard } = useBoardStore();

  useEffect(() => {
    if (boardId) {
      const board = boards.find((b) => b.id === boardId);
      if (board) {
        setActiveBoard(boardId);
      } else {
        navigate('/');
      }
    }
  }, [boardId, boards]);

  if (!activeBoard) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title={activeBoard.name} />
      <BoardView board={activeBoard} />
    </div>
  );
}
