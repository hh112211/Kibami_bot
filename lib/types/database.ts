export type PersonalityType = 'friendly' | 'professional' | 'funny' | 'caring' | 'motivational'
export type Gender = 'male' | 'female' | 'other'
export type TreatStyle = 'casual' | 'formal' | 'playful' | 'supportive'
export type ContextType = 'work' | 'alone' | 'venting' | 'casual'
export type InsightType = 'person' | 'situation' | 'preference' | 'concern' | 'goal'
export type DateType = 'birthday' | 'anniversary' | 'deadline' | 'appointment' | 'custom'

export interface User {
  id: string
  telegram_id: string
  display_name: string | null
  username: string | null
  gender: Gender | null
  personality_type: PersonalityType | null
  treat_style: TreatStyle | null
  work_hours_start: string | null
  work_hours_end: string | null
  timezone: string
  language_preference: string
  onboarding_completed: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  user_id: string
  context_type: ContextType
  started_at: string
  ended_at: string | null
  summary: string | null
  mood_score: number | null
}

export interface Message {
  id: string
  conversation_id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  telegram_message_id: string | null
  created_at: string
}

export interface ImportantDate {
  id: string
  user_id: string
  title: string
  description: string | null
  date: string
  date_type: DateType
  recurring: boolean
  remind_before_days: number
  last_reminded_at: string | null
  created_at: string
}

export interface Reminder {
  id: string
  user_id: string
  important_date_id: string | null
  message: string
  remind_at: string
  is_sent: boolean
  created_at: string
}

export interface UserInsight {
  id: string
  user_id: string
  insight_type: InsightType
  key: string
  value: string
  context: string | null
  extracted_from_message_id: string | null
  created_at: string
  updated_at: string
}
