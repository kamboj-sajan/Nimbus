import { api } from "./http";
import type { SessionUser } from "./session";

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  size?: number;
  lastModified?: string;
  children?: FileNode[];
}

export type EntryType = FileNode["type"];

interface Message {
  message: string;
}

export const authApi = {
  register: (body: { name: string; username: string; email: string; password: string }) =>
    api.post<Message & { requiresVerification: boolean }>("/auth/register", body).then((r) => r.data),
  login: (body: { email: string; password: string }) =>
    api.post<Message & { token: string; user: SessionUser }>("/auth/login", body).then((r) => r.data),
  logout: () => api.post<Message>("/auth/logout").then((r) => r.data),
  me: () => api.get<{ user: SessionUser }>("/auth/me").then((r) => r.data.user),
  forgotPassword: (body: { email: string }) =>
    api.post<Message>("/auth/forgot-password", body).then((r) => r.data),
  resetPassword: (body: { token: string; password: string }) =>
    api.post<Message>("/auth/reset-password", body).then((r) => r.data),
  changePassword: (body: { oldPassword: string; newPassword: string }) =>
    api.post<Message>("/auth/change-password", body).then((r) => r.data),
  verifyEmail: (token: string) =>
    api.get<Message>("/auth/verify-email", { params: { token } }).then((r) => r.data),
};

/**
 * `socketId` identifies the calling tab so the API can skip it when broadcasting
 * "tree changed" to the user's other tabs.
 */
const socketHeader = (socketId?: string) => (socketId ? { "X-Socket-Id": socketId } : undefined);

export const filesApi = {
  tree: () => api.get<FileNode[]>("/files/tree").then((r) => r.data),
  read: (path: string) =>
    api.get<{ content: string }>("/files/content", { params: { path } }).then((r) => r.data.content),
  write: (path: string, content: string) =>
    api.put<Message & { savedAt: string }>("/files/content", { path, content }).then((r) => r.data),
  create: (path: string, type: EntryType, content?: string, socketId?: string) =>
    api.post<Message>("/files", { path, type, content }, { headers: socketHeader(socketId) }).then((r) => r.data),
  rename: (path: string, name: string, socketId?: string) =>
    api
      .patch<Message & { path: string; type: EntryType }>("/files", { path, name }, { headers: socketHeader(socketId) })
      .then((r) => r.data),
  remove: (path: string, type: EntryType, socketId?: string) =>
    api.delete<Message>("/files", { data: { path, type }, headers: socketHeader(socketId) }).then((r) => r.data),
};
