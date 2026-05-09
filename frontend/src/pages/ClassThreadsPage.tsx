import { Navigate, useParams } from 'react-router-dom'

export default function ClassThreadsPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  return <Navigate replace to={`/sessions/${sessionId}/report?tab=feed`} />
}
