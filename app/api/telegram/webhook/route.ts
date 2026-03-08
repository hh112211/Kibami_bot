import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateUser, getUserByTelegramId } from '@/lib/db/users'
import { getOrCreateConversation, addMessage, getConversationHistory } from '@/lib/db/conversations'
import { 
  sendMessage, 
  sendTypingAction, 
  createContextKeyboard,
  getBot 
} from '@/lib/telegram/bot'
import { startOnboarding, handleOnboardingCallback, getNextOnboardingStep } from '@/lib/telegram/onboarding'
import { generateCompanionResponse, buildCompanionContext } from '@/lib/ai/companion'
import type { ContextType } from '@/lib/types/database'

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      is_bot: boolean
      first_name: string
      last_name?: string
      username?: string
    }
    chat: {
      id: number
      type: string
    }
    date: number
    text?: string
  }
  callback_query?: {
    id: string
    from: {
      id: number
      first_name: string
      username?: string
    }
    message: {
      chat: {
        id: number
      }
    }
    data: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json()
    
    // Handle callback queries (inline keyboard responses)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query)
      return NextResponse.json({ ok: true })
    }
    
    // Handle regular messages
    if (update.message?.text) {
      await handleMessage(update.message)
    }
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}

async function handleMessage(message: TelegramUpdate['message']) {
  if (!message || !message.text) return
  
  const telegramId = message.from.id.toString()
  const chatId = message.chat.id
  const text = message.text
  const displayName = [message.from.first_name, message.from.last_name].filter(Boolean).join(' ')
  const username = message.from.username
  
  // Get or create user
  const user = await getOrCreateUser(telegramId, displayName, username)
  
  // Handle commands
  if (text.startsWith('/')) {
    await handleCommand(chatId, text, user)
    return
  }
  
  // Check if onboarding is complete
  if (!user.onboarding_completed) {
    const step = getNextOnboardingStep(user)
    if (step !== 'complete') {
      await startOnboarding(chatId, user)
      return
    }
  }
  
  // Send typing indicator
  await sendTypingAction(chatId)
  
  // Get or create conversation
  const conversation = await getOrCreateConversation(user.id)
  
  // Save user message
  await addMessage(
    conversation.id,
    user.id,
    'user',
    text,
    message.message_id.toString()
  )
  
  // Build context and generate AI response
  const context = await buildCompanionContext(
    user,
    conversation.id,
    conversation.context_type as ContextType
  )
  
  const response = await generateCompanionResponse(text, context)
  
  // Save bot response
  await addMessage(conversation.id, user.id, 'assistant', response)
  
  // Send response to user
  await sendMessage(chatId, response)
}

async function handleCallbackQuery(callback: NonNullable<TelegramUpdate['callback_query']>) {
  const telegramId = callback.from.id.toString()
  const chatId = callback.message.chat.id
  const data = callback.data
  
  const user = await getUserByTelegramId(telegramId)
  if (!user) return
  
  // Answer callback query to remove loading state
  const bot = getBot()
  await bot.api.answerCallbackQuery(callback.id)
  
  // Handle onboarding callbacks
  if (data.startsWith('personality_') || data.startsWith('gender_') || 
      data.startsWith('treat_') || data.startsWith('work_')) {
    await handleOnboardingCallback(chatId, user.id, data, user)
    return
  }
  
  // Handle context switching
  if (data.startsWith('context_')) {
    const newContext = data.replace('context_', '') as ContextType
    const conversation = await getOrCreateConversation(user.id, newContext)
    
    const contextMessages: Record<ContextType, string> = {
      work: 'အလုပ်အကြောင်း ပြောကြရအောင်။ ဘာကူညီပေးရမလဲ?',
      alone: 'ငါဒီမှာရှိတယ်။ ဘာပြောချင်လဲ?',
      venting: 'ပြောချင်တာရှိရင် ပြောပါ။ ငါနားထောင်နေမယ်။',
      casual: 'ဟိုင်း! ဘယ်လိုနေလဲ?',
    }
    
    await sendMessage(chatId, contextMessages[newContext])
    return
  }
}

async function handleCommand(chatId: number, text: string, user: Awaited<ReturnType<typeof getOrCreateUser>>) {
  const command = text.split(' ')[0].toLowerCase()
  
  switch (command) {
    case '/start':
      if (!user.onboarding_completed) {
        await startOnboarding(chatId, user)
      } else {
        await sendMessage(
          chatId,
          `<b>ပြန်လာတာ ကြိုဆိုပါတယ် ${user.display_name || 'there'}!</b>\n\nဘာပြောချင်လဲ?`,
          createContextKeyboard()
        )
      }
      break
      
    case '/settings':
      await sendMessage(
        chatId,
        '<b>Settings</b>\n\nဘာပြောင်းချင်လဲ?\n\n/personality - ကိုယ်ရည်ကိုယ်သွေးပြောင်းမယ်\n/workhours - အလုပ်ချိန်ပြောင်းမယ်\n/language - ဘာသာစကားပြောင်းမယ်'
      )
      break
      
    case '/mood':
      await sendMessage(
        chatId,
        '<b>အခု ဘယ်လိုနေလဲ?</b>\n\nပြောပြပါ ဒါမှမဟုတ် ရွေးပါ:',
        createContextKeyboard()
      )
      break
      
    case '/history':
      await sendMessage(
        chatId,
        '<b>Conversation History</b>\n\nAdmin dashboard မှာ history ပြန်ကြည့်လို့ရပါတယ်။\n\nDashboard: ' + (process.env.VERCEL_URL || 'your-app-url.vercel.app')
      )
      break
      
    case '/dates':
      const { getUpcomingDates } = await import('@/lib/db/insights')
      const dates = await getUpcomingDates(user.id, 30)
      
      if (dates.length === 0) {
        await sendMessage(chatId, 'လာမယ့်ရက် ၃၀ အတွင်း အရေးကြီးတဲ့ date မရှိသေးပါဘူး။')
      } else {
        const dateList = dates
          .map(d => `• <b>${d.title}</b> - ${new Date(d.date).toLocaleDateString('my-MM')}`)
          .join('\n')
        await sendMessage(chatId, `<b>လာမယ့် Important Dates:</b>\n\n${dateList}`)
      }
      break
      
    case '/help':
      await sendMessage(
        chatId,
        `<b>Commands</b>\n\n/start - စတင်မယ် / context ရွေးမယ်\n/mood - အခုဘယ်လိုနေလဲ ပြောမယ်\n/dates - အရေးကြီးတဲ့ date တွေကြည့်မယ်\n/history - conversation history\n/settings - settings ပြောင်းမယ်\n/help - ဒီ help message\n\n<b>Tips:</b>\n• ရင်ဖွင့်ချင်ရင် ပြောပါ\n• အရေးကြီးတဲ့ date တွေပြောထားရင် remind လုပ်ပေးမယ်\n• အလုပ်အကြောင်း၊ လူတွေအကြောင်း - ဘာမဆို ပြောလို့ရတယ်`
      )
      break
      
    default:
      await sendMessage(chatId, 'Command မသိပါဘူး။ /help ရိုက်ပြီး ကြည့်ပါ။')
  }
}

// GET endpoint for webhook setup verification
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Telegram webhook endpoint is ready' 
  })
}
