import VideoRoom from "@/components/VideoRoom";

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <VideoRoom roomId={roomId} />
    </div>
  );
}
