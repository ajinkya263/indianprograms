'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, MessageSquare, Clock } from 'lucide-react'

interface ApprovalRow {
  id: string
  scheduled_post_id: string
  approver_id: string
  status: string
  notes: string
  created_at: string
  scheduled_post?: any
  submitter?: any
}

export default function ApprovalsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [tab, setTab] = useState<'incoming' | 'submitted'>('incoming')
  const [incoming, setIncoming] = useState<ApprovalRow[]>([])
  const [submitted, setSubmitted] = useState<ApprovalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [actionNotes, setActionNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.push('/login')
      setUserId(user.id)
      await fetchApprovals(user.id)
      setLoading(false)
    })
  }, [])

  const fetchApprovals = async (uid: string) => {
    const { data: incomingData } = await supabase
      .from('approval_workflows')
      .select('*, scheduled_post:scheduled_posts(*), submitter:profiles!user_id(name, email)')
      .eq('approver_id', uid)
      .order('created_at', { ascending: false })

    const { data: submittedData } = await supabase
      .from('approval_workflows')
      .select('*, scheduled_post:scheduled_posts(*), approver:profiles!approver_id(name, email)')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })

    setIncoming((incomingData || []) as any)
    setSubmitted((submittedData || []) as any)
  }

  const handleApprove = async (approval: ApprovalRow) => {
    if (!userId) return
    const notes = actionNotes[approval.id] || ''
    await supabase
      .from('approval_workflows')
      .update({ status: 'approved', notes, resolved_at: new Date().toISOString() })
      .eq('id', approval.id)
    await supabase
      .from('scheduled_posts')
      .update({ approval_status: 'approved' })
      .eq('id', approval.scheduled_post_id)
    await fetchApprovals(userId)
  }

  const handleReject = async (approval: ApprovalRow) => {
    if (!userId) return
    const notes = actionNotes[approval.id] || ''
    if (!notes.trim()) {
      alert('Please add notes explaining the rejection')
      return
    }
    await supabase
      .from('approval_workflows')
      .update({ status: 'rejected', notes, resolved_at: new Date().toISOString() })
      .eq('id', approval.id)
    await supabase
      .from('scheduled_posts')
      .update({ approval_status: 'rejected' })
      .eq('id', approval.scheduled_post_id)
    await fetchApprovals(userId)
  }

  const handleRequestChanges = async (approval: ApprovalRow) => {
    if (!userId) return
    const notes = actionNotes[approval.id] || ''
    if (!notes.trim()) {
      alert('Please add notes explaining what changes are needed')
      return
    }
    await supabase
      .from('approval_workflows')
      .update({ status: 'changes_requested', notes, resolved_at: new Date().toISOString() })
      .eq('id', approval.id)
    await fetchApprovals(userId)
  }

  const renderApproval = (a: ApprovalRow, isIncoming: boolean) => {
    const post = a.scheduled_post
    return (
      <div key={a.id} className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-xs ${
                a.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                a.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                a.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                'bg-orange-500/20 text-orange-400'
              }`}>
                {a.status === 'pending' ? <Clock size={10} className="inline mr-1" /> :
                 a.status === 'approved' ? <CheckCircle size={10} className="inline mr-1" /> :
                 <XCircle size={10} className="inline mr-1" />}
                {a.status.replace('_', ' ')}
              </span>
              {isIncoming && (a as any).submitter && (
                <span className="text-xs text-gray-500">From {(a as any).submitter.name || (a as any).submitter.email}</span>
              )}
            </div>
            {post && (
              <>
                <h3 className="font-semibold text-white">{post.title || 'Untitled post'}</h3>
                <p className="text-sm text-gray-400 line-clamp-3 mt-1">{post.content}</p>
                {post.image_url && <img src={post.image_url} alt="" className="mt-2 w-32 h-32 object-cover rounded-lg" />}
                <div className="mt-2 flex gap-1 flex-wrap">
                  {post.platforms?.map((p: string) => (
                    <span key={p} className="px-2 py-0.5 rounded text-xs bg-[#1A1726] text-gray-400">{p}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        {a.notes && (
          <div className="text-xs px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-gray-300">
            <MessageSquare size={10} className="inline mr-1 text-gray-500" />
            {a.notes}
          </div>
        )}
        {isIncoming && a.status === 'pending' && (
          <div className="space-y-2 pt-2 border-t border-[#1A1726]">
            <textarea
              placeholder="Notes (required for reject/changes)"
              value={actionNotes[a.id] || ''}
              onChange={(e) => setActionNotes({ ...actionNotes, [a.id]: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-[#070510] border border-[#1A1726] text-white text-sm"
            />
            <div className="flex gap-2">
              <button onClick={() => handleApprove(a)} className="px-3 py-1.5 rounded-lg text-xs bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30">
                <CheckCircle size={12} className="inline mr-1" />
                Approve
              </button>
              <button onClick={() => handleRequestChanges(a)} className="px-3 py-1.5 rounded-lg text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30">
                Request Changes
              </button>
              <button onClick={() => handleReject(a)} className="px-3 py-1.5 rounded-lg text-xs bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30">
                <XCircle size={12} className="inline mr-1" />
                Reject
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#070510] text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#E8970A]" style={{ fontFamily: 'Playfair Display, serif' }}>Approvals</h1>
          <p className="text-gray-400 mt-1 text-sm">Review and approve scheduled posts</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('incoming')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'incoming' ? 'bg-[#E8970A]/15 text-[#E8970A] border border-[#E8970A]/30' : 'text-gray-400 border border-transparent hover:bg-white/5'}`}
          >
            Awaiting Your Approval ({incoming.filter(a => a.status === 'pending').length})
          </button>
          <button
            onClick={() => setTab('submitted')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'submitted' ? 'bg-[#E8970A]/15 text-[#E8970A] border border-[#E8970A]/30' : 'text-gray-400 border border-transparent hover:bg-white/5'}`}
          >
            Your Submissions ({submitted.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-4">
            {tab === 'incoming' ? (
              incoming.length === 0 ? (
                <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-12 text-center text-gray-500">
                  No approvals waiting for you
                </div>
              ) : (
                incoming.map(a => renderApproval(a, true))
              )
            ) : (
              submitted.length === 0 ? (
                <div className="bg-[#0F0D1A] border border-[#1A1726] rounded-xl p-12 text-center text-gray-500">
                  You haven't submitted any posts for approval
                </div>
              ) : (
                submitted.map(a => renderApproval(a, false))
              )
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
