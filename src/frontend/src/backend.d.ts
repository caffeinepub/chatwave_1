import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Message {
    deleted: boolean;
    content: string;
    seen: boolean;
    sender: Principal;
    mediaUrl: ExternalBlob;
    timestamp: bigint;
    receiver: Principal;
}
export interface CallRecord {
    duration: bigint;
    missed: boolean;
    callType: Variant_video_voice;
    timestamp: bigint;
    callee: Principal;
    caller: Principal;
}
export interface Profile {
    bio: string;
    blockedUsers: Array<Principal>;
    displayName: string;
    avatarUrl: ExternalBlob;
    lastSeen: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_video_voice {
    video = "video",
    voice = "voice"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    blockUser(userToBlock: Principal): Promise<void>;
    deleteMessage(msgId: bigint): Promise<void>;
    getAllProfiles(): Promise<Array<Profile>>;
    getCallHistory(): Promise<Array<CallRecord>>;
    getCallerUserProfile(): Promise<Profile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMessagesWith(user: Principal): Promise<Array<Message>>;
    getOwnProfile(): Promise<Profile>;
    getProfile(user: Principal): Promise<Profile>;
    getUserProfile(user: Principal): Promise<Profile | null>;
    isCallerAdmin(): Promise<boolean>;
    logCall(callee: Principal, callType: Variant_video_voice, duration: bigint, missed: boolean): Promise<void>;
    markMessageSeen(msgId: bigint): Promise<void>;
    registerOrUpdateProfile(displayName: string, avatarUrl: ExternalBlob, bio: string): Promise<Profile>;
    saveCallerUserProfile(profile: Profile): Promise<void>;
    sendMessage(receiver: Principal, content: string, mediaUrl: ExternalBlob): Promise<Message>;
    unblockUser(userToUnblock: Principal): Promise<void>;
}
