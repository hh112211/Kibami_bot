import { Bot, InlineKeyboard, Context } from 'grammy'

// Bot instance - created lazily to avoid issues during build
let botInstance: Bot | null = null

export function getBot(): Bot {
  if (!botInstance) {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set')
    }
    botInstance = new Bot(token)
  }
  return botInstance
}

// Inline keyboard builders
export function createPersonalityKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('Friendly', 'personality_friendly')
    .text('Professional', 'personality_professional')
    .row()
    .text('Funny', 'personality_funny')
    .text('Caring', 'personality_caring')
    .row()
    .text('Motivational', 'personality_motivational')
}

export function createGenderKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('Male', 'gender_male')
    .text('Female', 'gender_female')
    .text('Other', 'gender_other')
}

export function createTreatStyleKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('Casual', 'treat_casual')
    .text('Formal', 'treat_formal')
    .row()
    .text('Playful', 'treat_playful')
    .text('Supportive', 'treat_supportive')
}

export function createContextKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('Working', 'context_work')
    .text('Alone Time', 'context_alone')
    .row()
    .text('Need to Vent', 'context_venting')
    .text('Just Chatting', 'context_casual')
}

export function createWorkHoursKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('9 AM - 5 PM', 'work_9_17')
    .text('8 AM - 4 PM', 'work_8_16')
    .row()
    .text('10 AM - 6 PM', 'work_10_18')
    .text('Custom', 'work_custom')
}

// Send message helper
export async function sendMessage(chatId: string | number, text: string, keyboard?: InlineKeyboard): Promise<void> {
  const bot = getBot()
  await bot.api.sendMessage(chatId, text, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  })
}

// Send typing action
export async function sendTypingAction(chatId: string | number): Promise<void> {
  const bot = getBot()
  await bot.api.sendChatAction(chatId, 'typing')
}
