import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

async function getUsers() {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export default async function UsersPage() {
  const users = await getUsers()
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">Manage your bot users and their preferences</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>{users.length} total users</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No users yet. Start chatting with your bot on Telegram!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Personality</TableHead>
                  <TableHead>Work Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.display_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.username ? `@${user.username}` : `ID: ${user.telegram_id}`}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {user.personality_type && (
                          <Badge variant="secondary" className="w-fit capitalize">
                            {user.personality_type}
                          </Badge>
                        )}
                        {user.treat_style && (
                          <Badge variant="outline" className="w-fit capitalize">
                            {user.treat_style}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.work_hours_start && user.work_hours_end ? (
                        <span className="text-sm">
                          {user.work_hours_start} - {user.work_hours_end}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.onboarding_completed ? (
                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Onboarding</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
