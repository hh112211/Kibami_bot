import { Bot, MessageCircle, Calendar, Users, Bell, ArrowRight, Sparkles, Shield, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Grand Flow
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
              Your personal AI companion on Telegram. Not just a chatbot - a friend who understands you, remembers your story, and is always there when you need someone to talk to.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <a href="https://t.me/YOUR_BOT_USERNAME" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Start Chatting
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard">
                  View Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built for Real Connection
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            More than an AI assistant - a companion designed to understand and support you
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Sparkles className="h-6 w-6" />}
            title="Human-like Conversations"
            description="Speaks naturally in Myanmar and English, matching your style and energy. No robotic responses - just genuine conversation."
          />
          <FeatureCard
            icon={<Users className="h-6 w-6" />}
            title="Remembers Your Story"
            description="Keeps track of people you mention, situations you face, and your preferences. Brings up relevant past conversations naturally."
          />
          <FeatureCard
            icon={<Calendar className="h-6 w-6" />}
            title="Never Forgets Important Dates"
            description="Reminds you about birthdays, anniversaries, and deadlines. Like having a friend with perfect memory."
          />
          <FeatureCard
            icon={<Clock className="h-6 w-6" />}
            title="Context-Aware Support"
            description="Adapts whether you're working, need to vent, or just want casual chat. Right support at the right time."
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6" />}
            title="Your Privacy Matters"
            description="Conversations are private and secure. Share freely without worrying about who might see your thoughts."
          />
          <FeatureCard
            icon={<Bell className="h-6 w-6" />}
            title="Proactive Check-ins"
            description="Reaches out when you've been quiet, reminds you of important events, and celebrates your wins with you."
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            How It Works
          </h2>
          
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            <StepCard
              step="1"
              title="Start the Bot"
              description="Find the bot on Telegram and tap Start. Answer a few quick questions about your preferences."
            />
            <StepCard
              step="2"
              title="Just Chat"
              description="Talk like you would with a friend. Share your day, ask for advice, or just vent when you need to."
            />
            <StepCard
              step="3"
              title="Build Your Connection"
              description="The more you chat, the better it understands you. It remembers what matters to you."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Have Someone to Talk To?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start a conversation today. Your personal companion is waiting.
          </p>
          <div className="mt-8">
            <Button size="lg" asChild>
              <a href="https://t.me/YOUR_BOT_USERNAME" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                Open in Telegram
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Grand Flow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with care for real human connection
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader>
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

function StepCard({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
        {step}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  )
}
