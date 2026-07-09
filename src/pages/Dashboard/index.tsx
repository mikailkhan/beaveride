import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useRoomStore } from '../../store/roomStore';
import { mockRoomService } from '../../services/mocks/mockRoomService';
import { FolderGit2, Plus, Terminal } from 'lucide-react';

export const Dashboard = () => {
  const { rooms, setRooms } = useRoomStore();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await mockRoomService.getRooms();
        setRooms(data);
      } catch (error) {
        console.error('Failed to load rooms:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRooms();
  }, [setRooms]);

  const handleCreateRoom = async () => {
    try {
      const newRoom = await mockRoomService.createRoom('Untitled Room', 1);
      navigate(`/room/${newRoom.id}`);
    } catch (error) {
      console.error('Failed to create room', error);
    }
  };

  return (
    <PageContainer>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-on-surface">Your Projects</h1>
          <Button onClick={handleCreateRoom} className="gap-2">
            <Plus size={20} />
            New Room
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20 text-on-surface-variant">Loading projects...</div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20 bg-surface border border-outline-variant rounded-2xl border-dashed">
            <FolderGit2 size={48} className="mx-auto text-outline-variant mb-4" />
            <h3 className="text-xl font-medium text-on-surface">No projects yet</h3>
            <p className="text-on-surface-variant mt-2 mb-6">Create a new room to start collaborating.</p>
            <Button onClick={handleCreateRoom}>Create New Room</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <Link key={room.id} to={`/room/${room.id}`}>
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tertiary-container text-on-tertiary-container">
                      <Terminal size={20} />
                    </div>
                    <h3 className="font-semibold text-lg text-on-surface truncate">{room.title}</h3>
                  </div>
                  <div className="mt-auto pt-4 flex justify-between items-center text-sm text-on-surface-variant border-t border-outline-variant/30">
                    <span>{new Date(room.updatedAt).toLocaleDateString()}</span>
                    <span className="capitalize px-2 py-1 bg-surface-container rounded-md text-xs font-medium">
                      {room.status}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
};
