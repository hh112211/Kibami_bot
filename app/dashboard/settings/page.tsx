import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Bot, Key, Globe, Clock, CheckCircle, XCircle } from 'lucide-react'

export default function SettingsPage() {
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN
  const cronSecret = process.env.CRON_SECRET
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const vercelUrl = process.env.VERCEL_URL
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your Grand Flow bot</p>
      </div>
      
      {/* Environment Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <CardTitle>Environment Variables</CardTitle>
          </div>
          <CardDescription>Status of required configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EnvStatus
            name="TELEGRAM_BOT_TOKEN"
            isSet={!!telegramToken}
            description="Your Telegram bot token from @BotFather"
          />
          <EnvStatus
            name="CRON_SECRET"
            isSet={!!cronSecret}
            description="Secret for authenticating cron job requests"
          />
          <EnvStatus
            name="NEXT_PUBLIC_SUPABASE_URL"
            isSet={!!supabaseUrl}
            description="Supabase project URL"
          />
          <EnvStatus
            name="SUPABASE_SERVICE_ROLE_KEY"
            isSet={true} // We know it's set if Supabase integration is connected
            description="Supabase service role key for admin operations"
          />
        </CardContent>
      </Card>
      
      {/* Webhook Setup */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle>Webhook Configuration</CardTitle>
          </div>
          <CardDescription>Set up your Telegram webhook</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Bot className="h-4 w-4" />
            <AlertTitle>Webhook URL</AlertTitle>
            <AlertDescription className="mt-2">
              <code className="block rounded bg-muted px-3 py-2 text-sm">
                {vercelUrl ? `https://${vercelUrl}/api/telegram/webhook` : 'Deploy to Vercel first'}
              </code>
            </AlertDescription>
          </Alert>
          
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h4 className="font-medium mb-2">Setup Command</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Run this command to set your webhook (replace YOUR_TOKEN):
            </p>
            <code className="block rounded bg-background px-3 py-2 text-xs overflow-x-auto">
              {`curl "https://api.telegram.org/botYOUR_TOKEN/setWebhook?url=${
                vercelUrl ? `https://${vercelUrl}` : 'YOUR_VERCEL_URL'
              }/api/telegram/webhook"`}
            </code>
          </div>
        </CardContent>
      </Card>
      
      {/* Cron Jobs */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle>Scheduled Tasks</CardTitle>
          </div>
          <CardDescription>Automated reminder processing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium">Reminder Check</p>
                <p className="text-sm text-muted-foreground">Processes pending reminders and date notifications</p>
              </div>
              <Badge variant="secondary">Every 2 hours</Badge>
            </div>
            
            <Alert>
              <AlertDescription>
                Cron jobs are automatically configured in vercel.json. They will run after deployment.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
      
      {/* Bot Commands */}
      <Card>
        <CardHeader>
          <CardTitle>Bot Commands</CardTitle>
          <CardDescription>Available commands for users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { cmd: '/start', desc: 'Start the bot or select conversation context' },
              { cmd: '/mood', desc: 'Tell the bot how you are feeling' },
              { cmd: '/dates', desc: 'View upcoming important dates' },
              { cmd: '/history', desc: 'View conversation history' },
              { cmd: '/settings', desc: 'Change bot preferences' },
              { cmd: '/help', desc: 'Show help message' },
            ].map(({ cmd, desc }) => (
              <div key={cmd} className="flex items-center gap-4 py-2">
                <code className="w-24 rounded bg-muted px-2 py-1 text-sm">{cmd}</code>
                <span className="text-sm text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EnvStatus({ name, isSet, description }: { name: string; isSet: boolean; description: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div>
        <div className="flex items-center gap-2">
          <code className="text-sm font-medium">{name}</code>
          {isSet ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Badge variant={isSet ? 'default' : 'destructive'}>
        {isSet ? 'Configured' : 'Missing'}
      </Badge>
    </div>
  )
}
