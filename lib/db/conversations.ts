import { createAdminClient } from '@/lib/supabase/admin'
import type { Conversation, Message, ContextType } from '@/lib/types/database'

export async function getOrCreateConversation(
  userId: string,
  contextType: ContextType = 'casual'
): Promise<Conversation> {
  const supabase = createAdminClient()
  
  // Find active conversation (started within last 2 hours and not ended)
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  
  const { data: existingConversation, error: findError } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .is('ended_at', null)
    .gte('started_at', twoHoursAgo)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()
  
  if (existingConversation && !findError) {
    return existingConversation as Conversation
  }
  
  // Create new conversation
  const { data: newConversation, error: createError } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      context_type: contextType,
    })
    .select()
    .single()
  
  if (createError) {
    throw new Error(`Failed to create conversation: ${createError.message}`)
  }
  
  return newConversation as Conversation
}

export async function updateConversationContext(
  conversationId: string,
  contextType: ContextType
): Promise<void> {
  const supabase = createAdminClient()
  
  await supabase
    .from('conversations')
    .update({ context_type: contextType })
    .eq('id', conversationId)
}

export async function addMessage(
  conversationId: string,
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  telegramMessageId?: string
): Promise<Message> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      role,
      content,
      telegram_message_id: telegramMessageId || null,
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to add message: ${error.message}`)
  }
  
  return data as Message
}

export async function getConversationHistory(
  conversationId: string,
  limit: number = 20
): Promise<Message[]> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit)
  
  if (error) {
    throw new Error(`Failed to get conversation history: ${error.message}`)
  }
  
  return (data || []) as Message[]
}

export async function getRecentConversations(
  userId: string,
  days: number = 7
): Promise<Conversation[]> {
  const supabase = createAdminClient()
  const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .gte('started_at', daysAgo)
    .order('started_at', { ascending: false })
  
  if (error) {
    throw new Error(`Failed to get recent conversations: ${error.message}`)
  }
  
  return (data || []) as Conversation[]
}

export async function getUserMessageHistory(
  userId: string,
  limit: number = 50
): Promise<Message[]> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    throw new Error(`Failed to get user message history: ${error.message}`)
  }
  
  return (data || []).reverse() as Message[]
}
