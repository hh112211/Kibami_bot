import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendMessage } from '@/lib/telegram/bot'
import { generateText } from 'ai'

// This endpoint is called by Vercel Cron to check and send reminders
export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const now = new Date()
    
    // 1. Check pending reminders
    const { data: reminders, error: reminderError } = await supabase
      .from('reminders')
      .select(`
        *,
        user:users!reminders_user_id_fkey(id, telegram_id, display_name, personality_type, treat_style)
      `)
      .eq('is_sent', false)
      .lte('remind_at', now.toISOString())
    
    if (reminderError) throw reminderError
    
    // Send reminder messages
    for (const reminder of reminders || []) {
      if (reminder.user) {
        // Generate personalized reminder message
        const personalizedMessage = await generatePersonalizedReminder(
          reminder.message,
          reminder.user.display_name,
          reminder.user.personality_type,
          reminder.user.treat_style
        )
        
        await sendMessage(reminder.user.telegram_id, personalizedMessage)
        
        // Mark as sent
        await supabase
          .from('reminders')
          .update({ is_sent: true })
          .eq('id', reminder.id)
      }
    }
    
    // 2. Check important dates and create reminders
    const today = now.toISOString().split('T')[0]
    const upcomingDays = [1, 3, 7] // Remind 1, 3, and 7 days before
    
    for (const daysBefore of upcomingDays) {
      const targetDate = new Date(now.getTime() + daysBefore * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
      
      const { data: importantDates, error: dateError } = await supabase
        .from('important_dates')
        .select(`
          *,
          user:users!important_dates_user_id_fkey(id, telegram_id, display_name, personality_type, treat_style)
        `)
        .eq('date', targetDate)
        .gte('remind_before_days', daysBefore)
      
      if (dateError) continue
      
      for (const date of importantDates || []) {
        if (!date.user) continue
        
        // Check if we already reminded for this date today
        const { data: existingReminder } = await supabase
          .from('reminders')
          .select('id')
          .eq('important_date_id', date.id)
          .gte('created_at', today)
          .limit(1)
          .single()
        
        if (existingReminder) continue
        
        // Create personalized reminder
        const message = await generateDateReminder(
          date.title,
          date.date,
          date.date_type,
          daysBefore,
          date.user.display_name,
          date.user.personality_type,
          date.user.treat_style
        )
        
        // Send immediately
        await sendMessage(date.user.telegram_id, message)
        
        // Log the reminder
        await supabase.from('reminders').insert({
          user_id: date.user.id,
          important_date_id: date.id,
          message,
          remind_at: now.toISOString(),
          is_sent: true,
        })
      }
    }
    
    // 3. Check for inactive users and send check-in messages
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
    
    const { data: inactiveUsers, error: inactiveError } = await supabase
      .from('users')
      .select(`
        id, telegram_id, display_name, personality_type, treat_style,
        messages:messages(created_at)
      `)
      .eq('is_active', true)
      .eq('onboarding_completed', true)
    
    if (!inactiveError && inactiveUsers) {
      for (const user of inactiveUsers) {
        // Check if user has any recent messages
        const lastMessage = user.messages?.[0]
        if (!lastMessage || new Date(lastMessage.created_at) < new Date(threeDaysAgo)) {
          // Check if we already sent a check-in today
          const { data: recentCheckIn } = await supabase
            .from('reminders')
            .select('id')
            .eq('user_id', user.id)
            .is('important_date_id', null)
            .gte('created_at', today)
            .limit(1)
            .single()
          
          if (recentCheckIn) continue
          
          // Send check-in message
          const checkInMessage = await generateCheckInMessage(
            user.display_name,
            user.personality_type,
            user.treat_style
          )
          
          await sendMessage(user.telegram_id, checkInMessage)
          
          // Log check-in
          await supabase.from('reminders').insert({
            user_id: user.id,
            message: checkInMessage,
            remind_at: now.toISOString(),
            is_sent: true,
          })
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      remindersProcessed: reminders?.length || 0,
      timestamp: now.toISOString()
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: 'Failed to process reminders' }, { status: 500 })
  }
}

async function generatePersonalizedReminder(
  originalMessage: string,
  displayName: string | null,
  personalityType: string | null,
  treatStyle: string | null
): Promise<string> {
  const result = await generateText({
    model: 'openai/gpt-4o-mini',
    system: `You are a friendly companion. Personalize this reminder message for ${displayName || 'the user'}. 
    Style: ${personalityType || 'friendly'}, ${treatStyle || 'casual'}.
    Keep it short and natural. Use Myanmar language if the original is in Myanmar.`,
    prompt: `Make this reminder sound like it's from a friend: "${originalMessage}"`,
    maxTokens: 150,
  })
  
  return result.text
}

async function generateDateReminder(
  title: string,
  date: string,
  dateType: string,
  daysBefore: number,
  displayName: string | null,
  personalityType: string | null,
  treatStyle: string | null
): Promise<string> {
  const timeText = daysBefore === 1 ? 'tomorrow' : `in ${daysBefore} days`
  
  const result = await generateText({
    model: 'openai/gpt-4o-mini',
    system: `You are a friendly companion reminding ${displayName || 'your friend'} about an upcoming event.
    Style: ${personalityType || 'friendly'}, ${treatStyle || 'casual'}.
    Be warm and helpful. Use Myanmar language naturally. Keep it conversational.`,
    prompt: `Remind them that "${title}" (${dateType}) is ${timeText} on ${date}. Make it feel like a friend reminding them, not a notification.`,
    maxTokens: 150,
  })
  
  return result.text
}

async function generateCheckInMessage(
  displayName: string | null,
  personalityType: string | null,
  treatStyle: string | null
): Promise<string> {
  const result = await generateText({
    model: 'openai/gpt-4o-mini',
    system: `You are a caring friend checking in on ${displayName || 'your friend'} who you haven't heard from in a few days.
    Style: ${personalityType || 'friendly'}, ${treatStyle || 'casual'}.
    Don't be pushy or make them feel guilty. Just show you care. Use Myanmar or mixed language naturally.`,
    prompt: `Write a short, friendly check-in message. Ask how they're doing without being intrusive.`,
    maxTokens: 100,
  })
  
  return result.text
}
