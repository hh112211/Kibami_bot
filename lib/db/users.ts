import { createAdminClient } from '@/lib/supabase/admin'
import type { User, PersonalityType, Gender, TreatStyle } from '@/lib/types/database'

export async function getOrCreateUser(telegramId: string, displayName?: string, username?: string): Promise<User> {
  const supabase = createAdminClient()
  
  // Try to find existing user
  const { data: existingUser, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single()
  
  if (existingUser && !findError) {
    return existingUser as User
  }
  
  // Create new user
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      telegram_id: telegramId,
      display_name: displayName || null,
      username: username || null,
    })
    .select()
    .single()
  
  if (createError) {
    throw new Error(`Failed to create user: ${createError.message}`)
  }
  
  return newUser as User
}

export async function updateUserPreferences(
  userId: string,
  preferences: {
    gender?: Gender
    personality_type?: PersonalityType
    treat_style?: TreatStyle
    work_hours_start?: string
    work_hours_end?: string
    timezone?: string
    language_preference?: string
    onboarding_completed?: boolean
  }
): Promise<User> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('users')
    .update({
      ...preferences,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to update user preferences: ${error.message}`)
  }
  
  return data as User
}

export async function getUserByTelegramId(telegramId: string): Promise<User | null> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data as User
}
