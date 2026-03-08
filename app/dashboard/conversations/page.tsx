import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

async function getConversations() {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      user:users(display_name, username, telegram_id),
      messages(id, role, content, created_at)
    `)
    .order('started_at', { ascending: false })
    .limit(20)
  
  if (error) throw error
  return data || []
}

export default async function ConversationsPage() {
  const conversations = await getConversations()
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Conversations</h1>
        <p className="text-muted-foreground">View conversation history and user interactions</p>
      </div>
      
      {conversations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No conversations yet. Users will appear here after they start chatting with the bot.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {conversations.map((conv: any) => (
            <Card key={conv.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {conv.user?.display_name || 'Unknown User'}
                    </CardTitle>
                    <CardDescription>
                      {conv.user?.username ? `@${conv.user.username}` : `ID: ${conv.user?.telegram_id}`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {conv.context_type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(conv.started_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {conv.messages?.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No messages in this conversation</p>
                    ) : (
                      conv.messages
                        ?.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map((msg: any) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                msg.role === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              <p className={`mt-1 text-xs ${
                                msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              }`}>
                                {new Date(msg.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
