import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM ?? 'onboarding@resend.dev'
const APP_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

function getResend(): Resend {
  return new Resend(process.env.RESEND_API_KEY)
}

export interface ReminderMatch {
  matchNumber: number
  homeTeam: string
  awayTeam: string
  scheduledAt: Date
}

export interface PredictionToday {
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  points: number
}

export interface GroupStanding {
  name: string
  position: number
  totalMembers: number
}

export interface SummaryData {
  predictionsToday: PredictionToday[]
  groups: GroupStanding[]
}

export function buildReminderHtml(userName: string, matches: ReminderMatch[]): string {
  const rows = matches
    .map(m => {
      const time = m.scheduledAt.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Argentina/Buenos_Aires',
      })
      return `<li>${m.homeTeam} vs ${m.awayTeam} — Partido #${m.matchNumber} (${time} hs)</li>`
    })
    .join('')

  return `
<p>Hola ${userName},</p>
<p>Estos partidos cierran en menos de 2 horas y todavía no cargaste tu pronóstico:</p>
<ul>${rows}</ul>
<p><a href="${APP_URL}/torneo">Cargar pronósticos →</a></p>
`
}

export function buildSummaryHtml(userName: string, data: SummaryData): string {
  const totalPoints = data.predictionsToday.reduce((s, p) => s + p.points, 0)
  const predRows = data.predictionsToday
    .map(p => `<tr><td>${p.homeTeam} vs ${p.awayTeam}</td><td>${p.homeScore}-${p.awayScore}</td><td>${p.points} pts</td></tr>`)
    .join('')
  const groupItems = data.groups
    .map(g => `<li>${g.name}: posición ${g.position} de ${g.totalMembers}</li>`)
    .join('')

  return `
<p>Hola ${userName},</p>
<h2>Tus pronósticos de hoy — ${totalPoints} puntos</h2>
<table>
  <thead><tr><th>Partido</th><th>Resultado</th><th>Pts</th></tr></thead>
  <tbody>${predRows}</tbody>
</table>
<h2>Tu posición en los grupos</h2>
<ul>${groupItems}</ul>
<p><a href="${APP_URL}/grupos">Ver grupos →</a></p>
`
}

export async function sendReminderEmail(
  to: string,
  userName: string,
  matches: ReminderMatch[]
): Promise<void> {
  const count = matches.length
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `⏰ ${count === 1 ? '1 partido cierra' : `${count} partidos cierran`} en 2 horas — Prode 2026`,
    html: buildReminderHtml(userName, matches),
  })
}

export async function sendDailySummaryEmail(
  to: string,
  userName: string,
  data: SummaryData
): Promise<void> {
  const totalPoints = data.predictionsToday.reduce((s, p) => s + p.points, 0)
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Prode 2026 — Resumen del día: ${totalPoints} pts`,
    html: buildSummaryHtml(userName, data),
  })
}
