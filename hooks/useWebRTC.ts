"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStreams: { [peerId: string]: MediaStream };
  status: "waiting" | "connecting" | "connected";
  isMuted: boolean;
  isVideoOff: boolean;
  messages: Array<{ senderId: string; message: string; isSelf: boolean }>;
  toggleMute: () => void;
  toggleVideo: () => void;
  hangup: () => void;
  sendMessage: (msg: string) => void;
}

const STUN_SERVER = process.env.NEXT_PUBLIC_STUN_SERVER || "stun:stun.l.google.com:19302";
const ICE_SERVERS = [{ urls: STUN_SERVER }];

export function useWebRTC(roomId: string): UseWebRTCReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ [peerId: string]: MediaStream }>({});
  const [status, setStatus] = useState<"waiting" | "connecting" | "connected">("waiting");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [messages, setMessages] = useState<Array<{ senderId: string; message: string; isSelf: boolean }>>([]);

  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<{ [peerId: string]: RTCPeerConnection }>({});
  const localStreamRef = useRef<MediaStream | null>(null);

  const initLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error("Error accessing media devices.", err);
      return null;
    }
  };

  const createPeerConnection = (peerId: string, stream: MediaStream, socket: Socket) => {
    const peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peersRef.current[peerId] = peerConnection;

    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    peerConnection.ontrack = (event) => {
      setRemoteStreams((prev) => ({
        ...prev,
        [peerId]: event.streams[0],
      }));
      setStatus("connected");
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          target: peerId,
          caller: socket.id,
          candidate: event.candidate,
        });
      }
    };

    peerConnection.onconnectionstatechange = () => {
      if (
        peerConnection.connectionState === "disconnected" ||
        peerConnection.connectionState === "failed" ||
        peerConnection.connectionState === "closed"
      ) {
        removePeer(peerId);
      }
    };

    return peerConnection;
  };

  const removePeer = (peerId: string) => {
    if (peersRef.current[peerId]) {
      peersRef.current[peerId].close();
      delete peersRef.current[peerId];
    }
    setRemoteStreams((prev) => {
      const newStreams = { ...prev };
      delete newStreams[peerId];
      // Update status if no more peers
      if (Object.keys(newStreams).length === 0) {
        setStatus("waiting");
      }
      return newStreams;
    });
  };

  useEffect(() => {
    const socket = io({ path: "/socket.io" });
    socketRef.current = socket;

    socket.on("connect", async () => {
      const stream = await initLocalStream();
      if (stream) {
        socket.emit("join-room", roomId);
      }
    });

    socket.on("existing-users", (users: string[]) => {
      if (!localStreamRef.current) return;
      if (users.length > 0) setStatus("connecting");
      
      users.forEach(async (peerId) => {
        const pc = createPeerConnection(peerId, localStreamRef.current!, socket);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", {
          target: peerId,
          caller: socket.id,
          sdp: offer,
        });
      });
    });

    socket.on("user-joined", (_peerId: string) => {
      // A new user joined. They will send us an offer via the 'existing-users' flow.
      // We simply wait to receive their offer — no action needed here.
      // Status will update to 'connecting' when we receive their offer.
    });

    socket.on("offer", async (payload: { caller: string; sdp: any }) => {
      if (!localStreamRef.current) return;
      setStatus("connecting");
      const pc = createPeerConnection(payload.caller, localStreamRef.current, socket);
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", {
        target: payload.caller,
        caller: socket.id,
        sdp: answer,
      });
    });

    socket.on("answer", async (payload: { caller: string; sdp: any }) => {
      const pc = peersRef.current[payload.caller];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        setStatus("connected");
      }
    });

    socket.on("ice-candidate", async (payload: { caller: string; candidate: any }) => {
      const pc = peersRef.current[payload.caller];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      }
    });

    socket.on("user-disconnected", (peerId: string) => {
      removePeer(peerId);
    });

    socket.on("chat-message", (payload: { senderId: string; message: string }) => {
      setMessages((prev) => [...prev, { senderId: payload.senderId, message: payload.message, isSelf: false }]);
    });

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      Object.values(peersRef.current).forEach((pc) => pc.close());
      socket.disconnect();
    };
  }, [roomId]);

  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!localStream.getAudioTracks()[0].enabled);
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!localStream.getVideoTracks()[0].enabled);
    }
  }, [localStream]);

  const hangup = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    Object.values(peersRef.current).forEach((pc) => pc.close());
    peersRef.current = {};
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    window.location.href = "/";
  }, [localStream]);

  const sendMessage = useCallback((msg: string) => {
    if (socketRef.current && socketRef.current.connected) {
      const senderId = socketRef.current.id ?? "";
      socketRef.current.emit("chat-message", { roomId, message: msg, senderId });
      setMessages((prev) => [...prev, { senderId, message: msg, isSelf: true }]);
    }
  }, [roomId]);

  return {
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
  };
}
