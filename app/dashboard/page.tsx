import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, MessageSquare, Calendar, TrendingUp } from 'lucide-react'

async function getStats() {
  const supabase = createAdminClient()
  
  const [usersResult, messagesResult, conversationsResult, datesResult] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
    supabase.from('conversations').select('*', { count: 'exact', head: true }),
    supabase.from('important_dates').select('*', { count: 'exact', head: true }),
  ])
  
  // Get recent activity
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: activeUsersCount } = await supabase
    .from('messages')
    .select('user_id', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo)
  
  return {
    totalUsers: usersResult.count || 0,
    totalMessages: messagesResult.count || 0,
    totalConversations: conversationsResult.count || 0,
    totalDates: datesResult.count || 0,
    activeUsers: activeUsersCount || 0,
  }
}

async function getRecentUsers() {
  const supabase = createAdminClient()
  
  const { data } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
  
  return data || []
}

async function getRecentConversations() {
  const supabase = createAdminClient()
  
  const { data } = await supabase
    .from('conversations')
    .select(`
      *,
      user:users(display_name, username)
    `)
    .order('started_at', { ascending: false })
    .limit(5)
  
  return data || []
}

export default async function DashboardPage() {
  const stats = await getStats()
  const recentUsers = await getRecentUsers()
  const recentConversations = await getRecentConversations()
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your Grand Flow bot activity</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          description="Registered users"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Messages"
          value={stats.totalMessages}
          description="Total messages exchanged"
          icon={<MessageSquare className="h-4 w-4" />}
        />
        <StatCard
          title="Conversations"
          value={stats.totalConversations}
          description="Chat sessions"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title="Important Dates"
          value={stats.totalDates}
          description="Dates being tracked"
          icon={<Calendar className="h-4 w-4" />}
        />
      </div>
      
      {/* Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Newly registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users yet</p>
              ) : (
                recentUsers.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.display_name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">@{user.username || user.telegram_id}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
            <CardDescription>Latest chat sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentConversations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              ) : (
                recentConversations.map((conv: any) => (
                  <div key={conv.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{conv.user?.display_name || 'Unknown User'}</p>
                      <p className="text-sm text-muted-foreground capitalize">{conv.context_type} context</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(conv.started_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>Complete these steps to get your bot running</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-inside list-decimal space-y-3 text-sm">
            <li>
              <span className="font-medium">Create a Telegram Bot</span>
              <p className="ml-5 text-muted-foreground">Talk to @BotFather on Telegram to create a new bot and get your token</p>
            </li>
            <li>
              <span className="font-medium">Set Environment Variables</span>
              <p className="ml-5 text-muted-foreground">Add TELEGRAM_BOT_TOKEN and CRON_SECRET to your Vercel project</p>
            </li>
            <li>
              <span className="font-medium">Set Webhook URL</span>
              <p className="ml-5 text-muted-foreground">
                Call: https://api.telegram.org/bot{'<YOUR_TOKEN>'}/setWebhook?url={'<YOUR_VERCEL_URL>'}/api/telegram/webhook
              </p>
            </li>
            <li>
              <span className="font-medium">Test Your Bot</span>
              <p className="ml-5 text-muted-foreground">Send /start to your bot on Telegram</p>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  description, 
  icon 
}: { 
  title: string
  value: number
  description: string
  icon: React.ReactNode 
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
