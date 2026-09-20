import type {
  DocumentOut,
  GroupDetailOut,
  GroupOut,
  GroupQuestionOut,
  HomeResponse,
  JoinGroupResponse,
  PrivateChatOut,
} from '../types/api'
import client from './client'

export async function createGroup(name: string, subject?: string): Promise<GroupOut> {
  const res = await client.post<GroupOut>('/api/student/groups', { name, subject: subject || null })
  return res.data
}

export async function getMyGroups(): Promise<GroupOut[]> {
  const res = await client.get<GroupOut[]>('/api/student/groups')
  return res.data
}

export async function joinGroup(joinCode: string): Promise<JoinGroupResponse> {
  const res = await client.post<JoinGroupResponse>(`/api/student/groups/join/${encodeURIComponent(joinCode)}`)
  return res.data
}

export async function getGroupDetail(groupId: string): Promise<GroupDetailOut> {
  const res = await client.get<GroupDetailOut>(`/api/student/groups/${groupId}`)
  return res.data
}

export async function getGroupQuestions(groupId: string): Promise<GroupQuestionOut[]> {
  const res = await client.get<GroupQuestionOut[]>(`/api/student/groups/${groupId}/questions`)
  return res.data
}

export async function getGroupDocuments(groupId: string): Promise<DocumentOut[]> {
  const res = await client.get<DocumentOut[]>(`/api/student/groups/${groupId}/documents`)
  return res.data
}

export async function uploadGroupDocument(groupId: string, file: File, title?: string): Promise<DocumentOut> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('title', title ?? '')
  const res = await client.post<DocumentOut>(`/api/student/groups/${groupId}/documents/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function getHome(): Promise<HomeResponse> {
  const res = await client.get<HomeResponse>('/api/student/home')
  return res.data
}

export async function askGroupQuestion(
  groupId: string,
  content: string,
  opts: { anonymous?: boolean; focusDocumentId?: string | null } = {},
): Promise<GroupQuestionOut> {
  const res = await client.post<GroupQuestionOut>(`/api/student/groups/${groupId}/questions`, {
    content,
    anonymous: opts.anonymous ?? false,
    focus_document_id: opts.focusDocumentId ?? null,
  })
  return res.data
}

export async function forkGroupQuestionPrivately(groupId: string, questionId: string, content: string): Promise<GroupQuestionOut> {
  const res = await client.post<GroupQuestionOut>(`/api/student/groups/${groupId}/questions/${questionId}/fork`, { content })
  return res.data
}

export async function getMyChats(): Promise<PrivateChatOut[]> {
  const res = await client.get<PrivateChatOut[]>('/api/student/chats')
  return res.data
}

export async function continuePrivateChat(questionId: string, content: string): Promise<PrivateChatOut> {
  const res = await client.post<PrivateChatOut>(`/api/student/chats/${questionId}/continue`, { content })
  return res.data
}

export async function sharePrivateChat(questionId: string): Promise<PrivateChatOut> {
  const res = await client.post<PrivateChatOut>(`/api/student/chats/${questionId}/share`)
  return res.data
}
