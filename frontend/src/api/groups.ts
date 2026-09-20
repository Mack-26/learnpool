import type {
  DocumentOut,
  GroupDetailOut,
  GroupOut,
  GroupQuestionOut,
  HomeResponse,
  JoinGroupResponse,
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
