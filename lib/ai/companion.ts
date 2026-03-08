import { generateText, tool } from 'ai'
import { z } from 'zod'
import type { User, Message, UserInsight, ContextType } from '@/lib/types/database'
import { saveInsight, saveImportantDate, getUpcomingDates, getUserInsights } from '@/lib/db/insights'
import { getConversationHistory, updateConversationContext } from '@/lib/db/conversations'

interface CompanionContext {
  user: User
  conversationId: string
  recentMessages: Message[]
  insights: UserInsight[]
  currentContext: ContextType
}

function buildSystemPrompt(ctx: CompanionContext): string {
  const { user, insights, currentContext } = ctx
  
  const personalityTraits: Record<string, string> = {
    friendly: 'warm, approachable, uses casual language, asks about their day',
    professional: 'respectful, clear, provides structured advice, maintains boundaries',
    funny: 'uses humor, light-hearted jokes, makes conversations enjoyable',
    caring: 'empathetic, supportive, validates feelings, offers comfort',
    motivational: 'encouraging, positive, helps set goals, celebrates progress',
  }
  
  const treatStyles: Record<string, string> = {
    casual: 'use informal language, contractions, feel like a close friend',
    formal: 'maintain respect, use polite language, like a trusted advisor',
    playful: 'be fun, use playful teasing, keep things light',
    supportive: 'always validate feelings, offer encouragement, be patient',
  }
  
  const contextBehaviors: Record<string, string> = {
    work: 'Help with work problems, provide practical advice, suggest breaks when appropriate, be a productive companion',
    alone: 'Be companionable, engage in casual chat, check on their wellbeing, suggest activities',
    venting: 'Listen actively, validate feelings, avoid immediately solving problems, let them express themselves fully before offering gentle advice',
    casual: 'Be friendly and natural, engage in light conversation, remember past topics',
  }
  
  // Build insights summary
  const insightsSummary = insights.length > 0
    ? insights.slice(0, 10).map(i => `- ${i.insight_type}: ${i.key} = ${i.value}`).join('\n')
    : 'No specific insights yet'
  
  // Detect language from recent messages
  const recentUserMessages = ctx.recentMessages
    .filter(m => m.role === 'user')
    .slice(-3)
    .map(m => m.content)
    .join(' ')
  
  const hasMyanmarChars = /[\u1000-\u109F]/.test(recentUserMessages)
  const languageInstruction = hasMyanmarChars
    ? 'Respond in Myanmar (Burmese) language. Mix with English when appropriate for the user.'
    : 'Respond in the same language the user uses. If they mix Myanmar and English, you can too.'

  return `You are a personal companion AI for ${user.display_name || 'a friend'}. You are NOT a generic AI assistant - you are their close friend/confidant.

## Your Personality
${user.personality_type ? personalityTraits[user.personality_type] : personalityTraits.friendly}

## How to Treat Them
${user.treat_style ? treatStyles[user.treat_style] : treatStyles.casual}

## Current Context: ${currentContext}
${contextBehaviors[currentContext]}

## Language
${languageInstruction}

## What You Know About Them
Gender: ${user.gender || 'not specified'}
Work Hours: ${user.work_hours_start ? `${user.work_hours_start} - ${user.work_hours_end}` : 'not specified'}

## Insights from Past Conversations
${insightsSummary}

## CRITICAL RULES
1. Be HUMAN-LIKE. Never sound like an AI. Use their name naturally, reference past conversations.
2. NEVER start with "I understand" or "I'm here for you" - it sounds robotic.
3. Match their energy - if they're upset, acknowledge it first before anything else.
4. If they need to vent, LET THEM. Don't immediately offer solutions.
5. Warn them gently about things you think are bad ideas, like a real friend would.
6. Tease them playfully when appropriate (based on personality setting).
7. Remember and reference important dates and people they've mentioned.
8. If you extract important information (dates, people, goals), use the tools provided.
9. Keep responses conversational - not too long unless they need detailed advice.
10. Use appropriate tools to save important dates and insights about the user.`
}

export async function generateCompanionResponse(
  userMessage: string,
  ctx: CompanionContext
): Promise<string> {
  // Build conversation history for AI
  const messages = ctx.recentMessages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))
  
  // Add current message
  messages.push({ role: 'user', content: userMessage })

  const result = await generateText({
    model: 'openai/gpt-4o-mini',
    system: buildSystemPrompt(ctx),
    messages,
    tools: {
      saveImportantDate: tool({
        description: 'Save an important date mentioned by the user (birthday, anniversary, deadline, etc.)',
        inputSchema: z.object({
          title: z.string().describe('Short title for the date'),
          date: z.string().describe('Date in YYYY-MM-DD format'),
          dateType: z.enum(['birthday', 'anniversary', 'deadline', 'appointment', 'custom']),
          description: z.string().nullable().describe('Additional context about this date'),
          recurring: z.boolean().describe('Whether this repeats annually'),
        }),
        execute: async ({ title, date, dateType, description, recurring }) => {
          await saveImportantDate(
            ctx.user.id,
            title,
            date,
            dateType,
            description || undefined,
            recurring
          )
          return { saved: true, title, date }
        },
      }),
      
      saveUserInsight: tool({
        description: 'Save an important insight about the user (person they mentioned, their goal, concern, preference)',
        inputSchema: z.object({
          insightType: z.enum(['person', 'situation', 'preference', 'concern', 'goal']),
          key: z.string().describe('Short identifier (e.g., "boss", "girlfriend", "career goal")'),
          value: z.string().describe('Details about this insight'),
          context: z.string().nullable().describe('Why this is important'),
        }),
        execute: async ({ insightType, key, value, context }) => {
          await saveInsight(
            ctx.user.id,
            insightType,
            key,
            value,
            context || undefined
          )
          return { saved: true, key }
        },
      }),
      
      updateConversationContext: tool({
        description: 'Update the conversation context based on what the user seems to need right now',
        inputSchema: z.object({
          newContext: z.enum(['work', 'alone', 'venting', 'casual']),
          reason: z.string().describe('Why you think the context should change'),
        }),
        execute: async ({ newContext, reason }) => {
          await updateConversationContext(ctx.conversationId, newContext)
          return { updated: true, newContext, reason }
        },
      }),
      
      getUpcomingDates: tool({
        description: 'Check for upcoming important dates for the user',
        inputSchema: z.object({
          daysAhead: z.number().default(7).describe('How many days ahead to look'),
        }),
        execute: async ({ daysAhead }) => {
          const dates = await getUpcomingDates(ctx.user.id, daysAhead)
          return { dates: dates.map(d => ({ title: d.title, date: d.date, type: d.date_type })) }
        },
      }),
    },
    maxSteps: 3,
  })

  return result.text
}

export async function buildCompanionContext(
  user: User,
  conversationId: string,
  currentContext: ContextType = 'casual'
): Promise<CompanionContext> {
  const [recentMessages, insights] = await Promise.all([
    getConversationHistory(conversationId, 20),
    getUserInsights(user.id),
  ])
  
  return {
    user,
    conversationId,
    recentMessages,
    insights,
    currentContext,
  }
}
