import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { redirect } from "next/navigation";

export default function Home() {
  async function createRoom() {
    "use server";
    const roomId = uuidv4();
    redirect(`/room/${roomId}`);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white font-sans p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-800 text-center space-y-6">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(37,99,235,0.5)]">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          Video Chat Mesh
        </h1>
        
        <p className="text-gray-400 text-sm">
          Connect with up to 4 participants in high quality real-time peer-to-peer video rooms.
        </p>

        <form action={createRoom}>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
          >
            Create New Room
          </button>
        </form>
      </div>
    </div>
  );
}
