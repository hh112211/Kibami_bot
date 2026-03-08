import { createAdminClient } from '@/lib/supabase/admin'
import type { UserInsight, ImportantDate, Reminder, InsightType, DateType } from '@/lib/types/database'

export async function saveInsight(
  userId: string,
  insightType: InsightType,
  key: string,
  value: string,
  context?: string,
  messageId?: string
): Promise<UserInsight> {
  const supabase = createAdminClient()
  
  // Check if insight already exists
  const { data: existing } = await supabase
    .from('user_insights')
    .select('*')
    .eq('user_id', userId)
    .eq('insight_type', insightType)
    .eq('key', key)
    .single()
  
  if (existing) {
    // Update existing insight
    const { data, error } = await supabase
      .from('user_insights')
      .update({
        value,
        context,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()
    
    if (error) throw new Error(`Failed to update insight: ${error.message}`)
    return data as UserInsight
  }
  
  // Create new insight
  const { data, error } = await supabase
    .from('user_insights')
    .insert({
      user_id: userId,
      insight_type: insightType,
      key,
      value,
      context,
      extracted_from_message_id: messageId || null,
    })
    .select()
    .single()
  
  if (error) throw new Error(`Failed to save insight: ${error.message}`)
  return data as UserInsight
}

export async function getUserInsights(userId: string): Promise<UserInsight[]> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('user_insights')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  
  if (error) throw new Error(`Failed to get insights: ${error.message}`)
  return (data || []) as UserInsight[]
}

export async function saveImportantDate(
  userId: string,
  title: string,
  date: string,
  dateType: DateType,
  description?: string,
  recurring: boolean = false,
  remindBeforeDays: number = 1
): Promise<ImportantDate> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('important_dates')
    .insert({
      user_id: userId,
      title,
      date,
      date_type: dateType,
      description,
      recurring,
      remind_before_days: remindBeforeDays,
    })
    .select()
    .single()
  
  if (error) throw new Error(`Failed to save important date: ${error.message}`)
  return data as ImportantDate
}

export async function getUpcomingDates(userId: string, daysAhead: number = 7): Promise<ImportantDate[]> {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('important_dates')
    .select('*')
    .eq('user_id', userId)
    .gte('date', today)
    .lte('date', futureDate)
    .order('date', { ascending: true })
  
  if (error) throw new Error(`Failed to get upcoming dates: ${error.message}`)
  return (data || []) as ImportantDate[]
}

export async function createReminder(
  userId: string,
  message: string,
  remindAt: string,
  importantDateId?: string
): Promise<Reminder> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('reminders')
    .insert({
      user_id: userId,
      message,
      remind_at: remindAt,
      important_date_id: importantDateId || null,
    })
    .select()
    .single()
  
  if (error) throw new Error(`Failed to create reminder: ${error.message}`)
  return data as Reminder
}

export async function getPendingReminders(): Promise<(Reminder & { user: { telegram_id: string } })[]> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  
  const { data, error } = await supabase
    .from('reminders')
    .select(`
      *,
      user:users!reminders_user_id_fkey(telegram_id)
    `)
    .eq('is_sent', false)
    .lte('remind_at', now)
  
  if (error) throw new Error(`Failed to get pending reminders: ${error.message}`)
  return (data || []) as (Reminder & { user: { telegram_id: string } })[]
}

export async function markReminderSent(reminderId: string): Promise<void> {
  const supabase = createAdminClient()
  
  await supabase
    .from('reminders')
    .update({ is_sent: true })
    .eq('id', reminderId)
}
