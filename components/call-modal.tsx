"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getSocket } from "@/lib/socket-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Phone, VideoIcon, Mic, MicOff, Video, VideoOff } from "lucide-react";

// Basic group-call capable WebRTC manager using mesh topology.
// For N participants, each pair will have a peer connection.
// This is simpler but can be bandwidth-heavy for big groups. Good for small groups (<=6).

type MediaKind = "audio" | "video";

export interface Participant {
    id: string;
    name?: string;
    image?: string;
}

interface CallModalProps {
    isOpen: boolean;
    onClose: () => void;
    roomId: string;
    selfUserId: string;
    invited: string[]; // userIds invited (excluding self)
    media: MediaKind; // initial media type
    allFriends?: Participant[]; // optional list to show/add more participants
    onInviteMore?: (userIds: string[]) => void;
}

interface PeerEntry {
    pc: RTCPeerConnection;
    remoteStream: MediaStream;
}

const iceServers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
];

export default function CallModal({
    isOpen,
    onClose,
    roomId,
    selfUserId,
    invited,
    media,
    allFriends,
    onInviteMore,
}: CallModalProps) {
    const [socketReady, setSocketReady] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [peers, setPeers] = useState<Record<string, PeerEntry>>({}); // key: remoteUserId
    const [participants, setParticipants] = useState<string[]>(invited);
    const [muted, setMuted] = useState(false);
    const [cameraOff, setCameraOff] = useState(media === "audio");

    const localVideoRef = useRef<HTMLVideoElement>(null);

    // Prepare socket
    useEffect(() => {
        if (!isOpen) return;
        let active = true;
        (async () => {
            const s = await getSocket();
            if (!active) return;
            setSocketReady(true);
        })();
        return () => {
            active = false;
        };
    }, [isOpen]);

    // Init media
    useEffect(() => {
        if (!isOpen) return;
        let stream: MediaStream;
        (async () => {
            const constraints: MediaStreamConstraints = {
                audio: true,
                video: media === "video" ? { width: 1280, height: 720 } : false,
            };
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            setLocalStream(stream);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
        })();

        return () => {
            stream?.getTracks().forEach((t) => t.stop());
            setLocalStream(null);
        };
    }, [isOpen, media]);

    // Join signaling and wire handlers
    useEffect(() => {
        if (!isOpen || !socketReady) return;
        let mounted = true;

        (async () => {
            const socket = await getSocket();

            // Join room
            socket.emit("call:join", { roomId });

            const handleUserJoined = ({ userId }: { userId: string }) => {
                if (userId === selfUserId) return;
                createOfferTo(userId).catch(console.error);
            };

            const handleEnded = () => {
                onClose();
            };

            const handleOffer = async ({ roomId: r, fromUserId, sdp }: any) => {
                if (r !== roomId || fromUserId === selfUserId) return;
                await ensurePeer(fromUserId);
                const entry = peersRef.current[fromUserId];
                await entry.pc.setRemoteDescription(new RTCSessionDescription(sdp));
                const answer = await entry.pc.createAnswer();
                await entry.pc.setLocalDescription(answer);
                socket.emit("webrtc:answer", { roomId, toUserId: fromUserId, sdp: entry.pc.localDescription });
            };

            const handleAnswer = async ({ roomId: r, fromUserId, sdp }: any) => {
                if (r !== roomId || fromUserId === selfUserId) return;
                const entry = peersRef.current[fromUserId];
                if (!entry) return;
                await entry.pc.setRemoteDescription(new RTCSessionDescription(sdp));
            };

            const handleIce = async ({ roomId: r, fromUserId, candidate }: any) => {
                if (r !== roomId || fromUserId === selfUserId) return;
                const entry = peersRef.current[fromUserId];
                if (!entry) return;
                try {
                    await entry.pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error("ICE add error", e);
                }
            };

            const handleUserLeft = ({ userId }: { userId: string }) => {
                destroyPeer(userId);
            };

            socket.on("call:user-joined", handleUserJoined);
            socket.on("call:ended", handleEnded);
            socket.on("webrtc:offer", handleOffer);
            socket.on("webrtc:answer", handleAnswer);
            socket.on("webrtc:ice", handleIce);
            socket.on("call:user-left", handleUserLeft);

            // Invite flow: notify others (if we are the initiator in Messages page, they receive call:incoming)

            return () => {
                if (!mounted) return;
                socket.off("call:user-joined", handleUserJoined);
                socket.off("call:ended", handleEnded);
                socket.off("webrtc:offer", handleOffer);
                socket.off("webrtc:answer", handleAnswer);
                socket.off("webrtc:ice", handleIce);
                socket.off("call:user-left", handleUserLeft);
            };
        })();

        return () => {
            mounted = false;
        };
    }, [isOpen, socketReady, roomId, selfUserId]);

    // Keep peers in a ref to access inside handlers
    const peersRef = useRef<Record<string, PeerEntry>>({});
    useEffect(() => {
        peersRef.current = peers;
    }, [peers]);

    async function ensurePeer(remoteUserId: string) {
        if (peersRef.current[remoteUserId]) return peersRef.current[remoteUserId];

        const pc = new RTCPeerConnection({ iceServers });
        const remoteStream = new MediaStream();

        // Add local tracks
        if (localStream) {
            localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
        }

        pc.ontrack = (ev) => {
            ev.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
            setPeers((prev) => ({ ...prev, [remoteUserId]: { pc, remoteStream } }));
        };

        pc.onicecandidate = async (ev) => {
            if (ev.candidate) {
                const socket = await getSocket();
                socket.emit("webrtc:ice", { roomId, toUserId: remoteUserId, candidate: ev.candidate });
            }
        };

        setPeers((prev) => ({ ...prev, [remoteUserId]: { pc, remoteStream } }));
        return { pc, remoteStream } as PeerEntry;
    }

    async function createOfferTo(remoteUserId: string) {
        const socket = await getSocket();
        const entry = await ensurePeer(remoteUserId);
        const offer = await entry.pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: media === "video" });
        await entry.pc.setLocalDescription(offer);
        socket.emit("webrtc:offer", { roomId, toUserId: remoteUserId, sdp: entry.pc.localDescription });
    }

    function destroyPeer(remoteUserId: string) {
        const entry = peersRef.current[remoteUserId];
        if (!entry) return;
        entry.pc.close();
        setPeers((prev) => {
            const cp = { ...prev };
            delete cp[remoteUserId];
            return cp;
        });
    }

    async function leaveCall() {
        const socket = await getSocket();
        socket.emit("call:leave", { roomId });
        onClose();
    }

    async function endCall() {
        const socket = await getSocket();
        socket.emit("call:end", { roomId });
        onClose();
    }

    function toggleMute() {
        if (!localStream) return;
        const audio = localStream.getAudioTracks()[0];
        if (audio) {
            audio.enabled = !audio.enabled;
            setMuted(!audio.enabled);
        }
    }

    function toggleCamera() {
        if (!localStream) return;
        const video = localStream.getVideoTracks()[0];
        if (video) {
            video.enabled = !video.enabled;
            setCameraOff(!video.enabled);
        }
    }

    if (!isOpen) return null;

    const remoteEntries = Object.entries(peers);

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl rounded-xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div className="flex items-center space-x-2">
                        {media === "video" ? <VideoIcon className="w-5 h-5 text-teal-600" /> : <Phone className="w-5 h-5 text-teal-600" />}
                        <span className="font-semibold">Call</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={leaveCall}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-gray-100">
                    {/* Local */}
                    <div className="relative bg-black rounded-lg aspect-video overflow-hidden">
                        {media === "video" ? (
                            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Avatar className="w-24 h-24">
                                    <AvatarImage src="/placeholder.svg" />
                                    <AvatarFallback>Me</AvatarFallback>
                                </Avatar>
                            </div>
                        )}
                        {muted && (
                            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">Muted</div>
                        )}
                    </div>

                    {/* Remotes */}
                    <div className="grid grid-cols-2 gap-2">
                        {remoteEntries.length === 0 && (
                            <div className="col-span-2 h-full flex items-center justify-center text-gray-500">Waiting for others to join…</div>
                        )}
                        {remoteEntries.map(([uid, entry]) => (
                            <div key={uid} className="relative bg-black rounded-lg aspect-video overflow-hidden">
                                {media === "video" ? (
                                    <VideoView stream={entry.remoteStream} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Avatar className="w-20 h-20">
                                            <AvatarImage src="/placeholder.svg" />
                                            <AvatarFallback>{uid.slice(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                )}
                                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">{uid}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between p-3 border-t bg-white">
                    <div className="space-x-2">
                        <Button variant="secondary" onClick={toggleMute}>{muted ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}{muted ? "Unmute" : "Mute"}</Button>
                        {media === "video" && (
                            <Button variant="secondary" onClick={toggleCamera}>{cameraOff ? <VideoOff className="w-4 h-4 mr-2" /> : <Video className="w-4 h-4 mr-2" />}{cameraOff ? "Turn Camera On" : "Turn Camera Off"}</Button>
                        )}
                    </div>

                    {allFriends && onInviteMore && (
                        <InviteMore friends={allFriends} onInvite={onInviteMore} />
                    )}

                    <Button variant="destructive" onClick={endCall}>End</Button>
                </div>
            </div>
        </div>
    );
}

function VideoView({ stream }: { stream: MediaStream }) {
    const ref = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (ref.current) ref.current.srcObject = stream;
    }, [stream]);
    return <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />;
}

function InviteMore({ friends, onInvite }: { friends: Participant[]; onInvite: (ids: string[]) => void }) {
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    return (
        <div className="flex items-center space-x-2">
            <select multiple className="border rounded px-2 py-1 max-w-[240px]" onChange={(e) => {
                const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
                const map: Record<string, boolean> = {};
                opts.forEach((id) => (map[id] = true));
                setSelected(map);
            }}>
                {friends.map((f) => (
                    <option key={f.id} value={f.id}>{f.name || f.id}</option>
                ))}
            </select>
            <Button onClick={() => onInvite(Object.keys(selected))}>Invite</Button>
        </div>
    );
}