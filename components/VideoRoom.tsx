"use client";

import React, { useEffect, useRef, useState } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Send } from "lucide-react";

const VideoPlayer = ({ stream, isLocal = false }: { stream: MediaStream | null; isLocal?: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isLocal}
      data-test-id={isLocal ? "local-video" : undefined}
      className={`w-full h-full object-cover rounded-2xl shadow-xl border border-gray-800 ${
        isLocal ? "transform scale-x-[-1]" : ""
      }`}
    />
  );
};

export default function VideoRoom({ roomId }: { roomId: string }) {
  const {
    localStream,
    remoteStreams,
    status,
    isMuted,
    isVideoOff,
    messages,
    toggleMute,
    toggleVideo,
    hangup,
    sendMessage,
  } = useWebRTC(roomId);

  const [chatInput, setChatInput] = useState("");
  const chatLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendMessage(chatInput.trim());
      setChatInput("");
    }
  };

  const remotePeers = Object.entries(remoteStreams);
  const totalPeers = remotePeers.length + 1; // Including local

  return (
    <div className="flex flex-col h-screen bg-gray-950 p-4 font-sans text-white">
      {/* Header and Status */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          Room: {roomId.slice(0, 8)}...
        </h1>
        <div className="flex items-center gap-2 text-sm font-medium">
          {status === "waiting" && (
            <div data-test-id="status-waiting" className="flex items-center gap-2 text-yellow-400 bg-yellow-400/10 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              Waiting for others...
            </div>
          )}
          {status === "connecting" && (
            <div data-test-id="status-connecting" className="flex items-center gap-2 text-blue-400 bg-blue-400/10 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              Connecting...
            </div>
          )}
          {status === "connected" && (
            <div data-test-id="status-connected" className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              Connected
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col relative bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 p-2">
          
          <div 
            className={`w-full h-full grid gap-2 ${
              totalPeers === 1 ? "grid-cols-1" :
              totalPeers === 2 ? "grid-cols-2" :
              "grid-cols-2 grid-rows-2"
            }`}
            data-test-id="remote-video-container"
          >
            {/* Local Video is absolute positioned if there are remote streams, or main if alone */}
            {totalPeers === 1 ? (
              <div className="w-full h-full p-2">
                 <VideoPlayer stream={localStream} isLocal={true} />
              </div>
            ) : null}

            {remotePeers.map(([peerId, stream]) => (
              <div key={peerId} className="w-full h-full p-2 relative group">
                <VideoPlayer stream={stream} />
                <div className="absolute bottom-4 left-4 bg-black/60 px-2 py-1 rounded text-xs backdrop-blur-sm">
                  Peer {peerId.slice(0, 4)}
                </div>
              </div>
            ))}
          </div>

          {/* Picture-in-Picture Local Video */}
          {totalPeers > 1 && (
            <div className="absolute bottom-24 right-6 w-48 aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 bg-gray-950 z-10 transition-transform hover:scale-105">
              <VideoPlayer stream={localStream} isLocal={true} />
            </div>
          )}

          {/* Controls Overlay */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-900/80 backdrop-blur-xl px-6 py-3 rounded-full border border-gray-700/50 shadow-2xl">
            <button
              onClick={toggleMute}
              data-test-id="mute-mic-button"
              className={`p-4 rounded-full transition-all duration-300 ${
                isMuted ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            <button
              onClick={toggleVideo}
              data-test-id="toggle-camera-button"
              className={`p-4 rounded-full transition-all duration-300 ${
                isVideoOff ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
            </button>
            <button
              onClick={hangup}
              data-test-id="hangup-button"
              className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white transition-all duration-300 transform hover:scale-110 shadow-lg shadow-red-600/20"
            >
              <PhoneOff size={24} />
            </button>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="w-80 bg-gray-900 rounded-3xl border border-gray-800 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-800 bg-gray-900/50">
            <h2 className="font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Room Chat
            </h2>
          </div>
          
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4"
            data-test-id="chat-log"
            ref={chatLogRef}
          >
            {messages.map((m, i) => (
              <div 
                key={i} 
                data-test-id="chat-message"
                className={`flex flex-col ${m.isSelf ? "items-end" : "items-start"}`}
              >
                <div className="text-xs text-gray-500 mb-1 px-1">
                  {m.isSelf ? "You" : `Peer ${m.senderId.slice(0, 4)}`}
                </div>
                <div 
                  className={`px-4 py-2 rounded-2xl max-w-[85%] break-words ${
                    m.isSelf 
                      ? "bg-blue-600 text-white rounded-tr-sm" 
                      : "bg-gray-800 text-gray-200 rounded-tl-sm"
                  }`}
                >
                  {m.message}
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">
                No messages yet. Say hi!
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800 bg-gray-900/50">
            <div className="relative">
              <input
                type="text"
                data-test-id="chat-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm placeholder:text-gray-600"
              />
              <button
                type="submit"
                data-test-id="chat-submit"
                disabled={!chatInput.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:text-blue-400 disabled:text-gray-600 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
