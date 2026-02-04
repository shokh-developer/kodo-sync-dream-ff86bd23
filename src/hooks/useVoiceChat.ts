import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface VoicePeer {
  odaara: string;
  odaaraName: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

interface VoiceSignal {
  type: "offer" | "answer" | "ice-candidate" | "join" | "leave";
  from: string;
  fromName: string;
  to?: string;
  data?: any;
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
];

export const useVoiceChat = (roomId: string | null) => {
  const { user, profile } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [peers, setPeers] = useState<Map<string, VoicePeer>>(new Map());
  const [activeParticipants, setActiveParticipants] = useState<string[]>([]);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);
  const peersRef = useRef<Map<string, VoicePeer>>(new Map());

  const userId = user?.id || "";
  const userName = profile?.display_name || "Anonim";

  const createPeerConnection = useCallback((peerId: string, peerName: string) => {
    console.log(`Creating peer connection for ${peerId} (${peerName})`);
    
    const pc = new RTCPeerConnection({ 
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 10,
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        console.log(`Sending ICE candidate to ${peerId}`);
        channelRef.current.send({
          type: "broadcast",
          event: "voice_signal",
          payload: {
            type: "ice-candidate",
            from: userId,
            fromName: userName,
            to: peerId,
            data: event.candidate,
          } as VoiceSignal,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${peerId}:`, pc.iceConnectionState);
    };

    pc.ontrack = (event) => {
      console.log(`Received remote track from ${peerId}`, event.streams);
      const [remoteStream] = event.streams;
      if (remoteStream) {
        const existingPeer = peersRef.current.get(peerId);
        if (existingPeer) {
          existingPeer.stream = remoteStream;
          peersRef.current.set(peerId, existingPeer);
          setPeers(new Map(peersRef.current));
          console.log(`Remote stream set for ${peerId}, tracks:`, remoteStream.getTracks().length);
        }
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Peer ${peerId} connection state:`, pc.connectionState);
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        console.log(`Connection failed/disconnected for ${peerId}, removing peer`);
        // Remove peer inline to avoid dependency issue
        const peer = peersRef.current.get(peerId);
        if (peer) {
          peer.connection.close();
          peersRef.current.delete(peerId);
          setPeers(new Map(peersRef.current));
        }
      }
    };

    // Add local tracks with proper handling
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getTracks();
      console.log(`Adding ${tracks.length} local tracks to peer connection`);
      tracks.forEach((track) => {
        if (localStreamRef.current) {
          pc.addTrack(track, localStreamRef.current);
        }
      });
    } else {
      console.warn("No local stream available when creating peer connection");
    }

    const peer: VoicePeer = {
      odaara: peerId,
      odaaraName: peerName,
      connection: pc,
    };

    peersRef.current.set(peerId, peer);
    setPeers(new Map(peersRef.current));

    return pc;
  }, [userId, userName]);

  const removePeer = useCallback((peerId: string) => {
    const peer = peersRef.current.get(peerId);
    if (peer) {
      peer.connection.close();
      peersRef.current.delete(peerId);
      setPeers(new Map(peersRef.current));
    }
  }, []);

  const handleSignal = useCallback(async (signal: VoiceSignal) => {
    if (signal.from === userId) return;
    if (signal.to && signal.to !== userId) return;

    switch (signal.type) {
      case "join": {
        // Someone joined, create offer and send
        const pc = createPeerConnection(signal.from, signal.fromName);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        channelRef.current?.send({
          type: "broadcast",
          event: "voice_signal",
          payload: {
            type: "offer",
            from: userId,
            fromName: userName,
            to: signal.from,
            data: offer,
          } as VoiceSignal,
        });
        break;
      }

      case "offer": {
        let pc = peersRef.current.get(signal.from)?.connection;
        if (!pc) {
          pc = createPeerConnection(signal.from, signal.fromName);
        }
        await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        channelRef.current?.send({
          type: "broadcast",
          event: "voice_signal",
          payload: {
            type: "answer",
            from: userId,
            fromName: userName,
            to: signal.from,
            data: answer,
          } as VoiceSignal,
        });
        break;
      }

      case "answer": {
        const pc = peersRef.current.get(signal.from)?.connection;
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
        }
        break;
      }

      case "ice-candidate": {
        const pc = peersRef.current.get(signal.from)?.connection;
        if (pc && signal.data) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.data));
        }
        break;
      }

      case "leave": {
        removePeer(signal.from);
        break;
      }
    }
  }, [userId, userName, createPeerConnection, removePeer]);

  const joinVoice = useCallback(async () => {
    if (!roomId || !userId) return;

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localStreamRef.current = stream;

      // Create signaling channel
      const channel = supabase.channel(`voice:${roomId}`);
      
      channel
        .on("broadcast", { event: "voice_signal" }, ({ payload }) => {
          handleSignal(payload as VoiceSignal);
        })
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          const participants = Object.keys(state);
          setActiveParticipants(participants);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.track({ user_id: userId, user_name: userName });
            
            // Announce joining
            channel.send({
              type: "broadcast",
              event: "voice_signal",
              payload: {
                type: "join",
                from: userId,
                fromName: userName,
              } as VoiceSignal,
            });
          }
        });

      channelRef.current = channel;
      setIsConnected(true);
    } catch (error) {
      console.error("Failed to join voice chat:", error);
      throw error;
    }
  }, [roomId, userId, userName, handleSignal]);

  const leaveVoice = useCallback(() => {
    // Send leave signal
    channelRef.current?.send({
      type: "broadcast",
      event: "voice_signal",
      payload: {
        type: "leave",
        from: userId,
        fromName: userName,
      } as VoiceSignal,
    });

    // Close all peer connections
    peersRef.current.forEach((peer) => {
      peer.connection.close();
    });
    peersRef.current.clear();
    setPeers(new Map());

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Remove channel
    if (channelRef.current) {
      channelRef.current.untrack();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setIsConnected(false);
    setActiveParticipants([]);
  }, [userId, userName]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        leaveVoice();
      }
    };
  }, []);

  return {
    isConnected,
    isMuted,
    peers: Array.from(peers.values()),
    activeParticipants,
    joinVoice,
    leaveVoice,
    toggleMute,
    localStream: localStreamRef.current,
  };
};
