import { 
  sendMessage, 
  createPersonalityKeyboard, 
  createGenderKeyboard, 
  createTreatStyleKeyboard,
  createWorkHoursKeyboard 
} from './bot'
import { updateUserPreferences } from '@/lib/db/users'
import type { User, PersonalityType, Gender, TreatStyle } from '@/lib/types/database'

type OnboardingStep = 'gender' | 'personality' | 'treat_style' | 'work_hours' | 'complete'

export function getNextOnboardingStep(user: User): OnboardingStep {
  if (!user.gender) return 'gender'
  if (!user.personality_type) return 'personality'
  if (!user.treat_style) return 'treat_style'
  if (!user.work_hours_start) return 'work_hours'
  return 'complete'
}

export async function startOnboarding(chatId: string | number, user: User): Promise<void> {
  const step = getNextOnboardingStep(user)
  await sendOnboardingStep(chatId, step, user)
}

export async function sendOnboardingStep(chatId: string | number, step: OnboardingStep, user: User): Promise<void> {
  const displayName = user.display_name || 'there'
  
  switch (step) {
    case 'gender':
      await sendMessage(
        chatId,
        `<b>Hey ${displayName}!</b>\n\nကျွန်တော်က မင်းရဲ့ personal companion bot ပါ။ မင်းအကြောင်းကို နည်းနည်းသိချင်ပါတယ်။\n\n<b>ပထမဆုံး - မင်းက ဘယ်လိုခေါ်စေချင်လဲ?</b>`,
        createGenderKeyboard()
      )
      break
      
    case 'personality':
      await sendMessage(
        chatId,
        `<b>Great!</b>\n\nငါ ဘယ်လို personality နဲ့ ပြောစေချင်လဲ? မင်းနဲ့ အကိုက်ညီဆုံး တစ်ခုရွေးပါ။`,
        createPersonalityKeyboard()
      )
      break
      
    case 'treat_style':
      await sendMessage(
        chatId,
        `<b>Nice choice!</b>\n\nမင်းကို ဘယ်လိုပြောစေချင်လဲ? Casual ဖြစ်ဖြစ်၊ formal ဖြစ်ဖြစ် - မင်းကြိုက်တာပြောပါ။`,
        createTreatStyleKeyboard()
      )
      break
      
    case 'work_hours':
      await sendMessage(
        chatId,
        `<b>Almost done!</b>\n\nမင်း အလုပ်ချိန် ဘယ်အချိန်လဲ? ဒါသိထားရင် အလုပ်လုပ်နေချိန်မှာ ငါက support ပေးနိုင်မယ်။`,
        createWorkHoursKeyboard()
      )
      break
      
    case 'complete':
      await sendMessage(
        chatId,
        `<b>All set!</b>\n\nအားလုံးပြင်ဆင်ပြီးပါပြီ။ အခုကစပြီး ငါနဲ့ စကားပြောလို့ရပါပြီ။\n\n• အလုပ်အကြောင်း ဆွေးနွေးချင်ရင် ပြောလို့ရတယ်\n• ရင်ဖွင့်ချင်ရင်လဲ ဒီမှာရှိတယ်\n• အကြံဉာဏ်လိုချင်ရင် မေးလို့ရတယ်\n• အရေးကြီးတဲ့ date တွေ remind လုပ်ပေးမယ်\n\nဘာစပြောမလဲ? 😊`
      )
      break
  }
}

export async function handleOnboardingCallback(
  chatId: string | number,
  userId: string,
  callbackData: string,
  user: User
): Promise<void> {
  const [category, value] = callbackData.split('_').slice(0, 2)
  const fullValue = callbackData.split('_').slice(1).join('_')
  
  switch (category) {
    case 'gender':
      await updateUserPreferences(userId, { gender: value as Gender })
      user.gender = value as Gender
      await sendOnboardingStep(chatId, 'personality', user)
      break
      
    case 'personality':
      await updateUserPreferences(userId, { personality_type: value as PersonalityType })
      user.personality_type = value as PersonalityType
      await sendOnboardingStep(chatId, 'treat_style', user)
      break
      
    case 'treat':
      const treatStyle = fullValue.replace('treat_', '') as TreatStyle
      await updateUserPreferences(userId, { treat_style: treatStyle })
      user.treat_style = treatStyle
      await sendOnboardingStep(chatId, 'work_hours', user)
      break
      
    case 'work':
      const workHours = parseWorkHours(fullValue)
      await updateUserPreferences(userId, {
        work_hours_start: workHours.start,
        work_hours_end: workHours.end,
        onboarding_completed: true,
      })
      await sendOnboardingStep(chatId, 'complete', user)
      break
  }
}

function parseWorkHours(value: string): { start: string; end: string } {
  const mapping: Record<string, { start: string; end: string }> = {
    'work_9_17': { start: '09:00', end: '17:00' },
    'work_8_16': { start: '08:00', end: '16:00' },
    'work_10_18': { start: '10:00', end: '18:00' },
    'work_custom': { start: '09:00', end: '17:00' }, // Default for custom
  }
  
  return mapping[value] || { start: '09:00', end: '17:00' }
}
