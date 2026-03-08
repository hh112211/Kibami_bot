import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar, Bell } from 'lucide-react'

async function getImportantDates() {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('important_dates')
    .select(`
      *,
      user:users(display_name, username)
    `)
    .order('date', { ascending: true })
  
  if (error) throw error
  return data || []
}

function getDaysUntil(dateStr: string): number {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  const diffTime = date.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getDateBadge(daysUntil: number) {
  if (daysUntil < 0) {
    return <Badge variant="secondary">Passed</Badge>
  } else if (daysUntil === 0) {
    return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">Today</Badge>
  } else if (daysUntil <= 3) {
    return <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">Soon</Badge>
  } else if (daysUntil <= 7) {
    return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">This Week</Badge>
  }
  return <Badge variant="outline">{daysUntil} days</Badge>
}

export default async function DatesPage() {
  const dates = await getImportantDates()
  
  // Separate upcoming and past dates
  const upcoming = dates.filter((d: any) => getDaysUntil(d.date) >= 0)
  const past = dates.filter((d: any) => getDaysUntil(d.date) < 0)
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Important Dates</h1>
        <p className="text-muted-foreground">Track birthdays, anniversaries, and important events</p>
      </div>
      
      {/* Upcoming Dates */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Upcoming Dates</CardTitle>
          </div>
          <CardDescription>{upcoming.length} events coming up</CardDescription>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No upcoming dates. The bot will extract important dates from conversations automatically.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcoming.map((date: any) => {
                  const daysUntil = getDaysUntil(date.date)
                  return (
                    <TableRow key={date.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{date.title}</p>
                          {date.description && (
                            <p className="text-sm text-muted-foreground">{date.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {date.user?.display_name || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(date.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {date.date_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDateBadge(daysUntil)}
                          {date.recurring && (
                            <Bell className="h-4 w-4 text-muted-foreground" title="Recurring" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Past Dates */}
      {past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Past Dates</CardTitle>
            <CardDescription>{past.length} past events</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {past.slice(0, 10).map((date: any) => (
                  <TableRow key={date.id} className="opacity-60">
                    <TableCell>{date.title}</TableCell>
                    <TableCell>{date.user?.display_name || 'Unknown'}</TableCell>
                    <TableCell>{new Date(date.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {date.date_type}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
