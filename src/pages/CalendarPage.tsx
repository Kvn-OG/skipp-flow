import FullCalendar, { type DatesSetInfo, type EventClickInfo, type EventDisplayInfo, type EventDropInfo, type EventInput } from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/react/daygrid'
import interactionPlugin from '@fullcalendar/react/interaction'
import ptBrLocale from '@fullcalendar/react/locales/pt-br'
import classicTheme from '@fullcalendar/react/themes/classic'
import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/classic/theme.css'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { RefSelect } from '../components/ui/OptionSelect'
import { PageHeader } from '../components/ui/PageHeader'
import { ErrorState } from '../components/ui/States'
import { useAsync } from '../hooks/useAsync'
import { usePreferences } from '../hooks/usePreferences'
import { useToast } from '../hooks/useToast'
import { addDaysISO, formatLongDate, toISODate } from '../lib/dates'
import { errorMessage } from '../lib/errors'
import { CONTENT_FORMATS, PRODUCTION_STATUSES, findOption } from '../lib/options'
import { listClientOptions } from '../services/clients'
import { listContents, updateContentSchedule } from '../services/contents'
import type { ContentWithRelations } from '../types/domain'

type Range = { from: string; to: string }

/** Como cada conteúdo aparece dentro do dia no calendário. */
function EventChip({ info }: { info: EventDisplayInfo }) {
  const content = info.event.extendedProps.content as ContentWithRelations
  const status = findOption(PRODUCTION_STATUSES, content.production_status)
  return (
    <div
      className="w-full overflow-hidden rounded-md border-l-[3px] px-1.5 py-0.5 text-left"
      style={{ borderColor: status.color, backgroundColor: `${status.color}26` }}
      title={`${content.title} · ${content.client?.name ?? ''} · ${status.label}`}
    >
      <p className="truncate text-[11px] font-medium text-heading">{content.title}</p>
      <p className="truncate text-[10px] text-muted">
        {findOption(CONTENT_FORMATS, content.format).label} · {content.client?.name}
      </p>
    </div>
  )
}

export function CalendarPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { preferences } = usePreferences()
  const [clientId, setClientId] = useState('')
  const [range, setRange] = useState<Range | null>(null)

  const clients = useAsync(listClientOptions, [])
  // Busca só os conteúdos do período visível (o calendário avisa via datesSet)
  const { data, error, reload, setData } = useAsync(
    () =>
      range
        ? listContents({ clientId: clientId || undefined, scheduledFrom: range.from, scheduledTo: range.to })
        : Promise.resolve([]),
    [clientId, range?.from, range?.to],
  )

  const events = useMemo<EventInput[]>(
    () =>
      (data ?? [])
        .filter((c) => c.scheduled_date)
        .map((c) => ({
          id: c.id,
          title: c.title,
          start: c.scheduled_date!,
          allDay: true,
          color: 'transparent',
          extendedProps: { content: c },
        })),
    [data],
  )

  function onDatesSet(info: DatesSetInfo) {
    // "end" é exclusivo (primeiro dia FORA do período), então subtrai 1
    const from = toISODate(info.start)
    const to = addDaysISO(toISODate(info.end), -1)
    setRange((current) => (current?.from === from && current?.to === to ? current : { from, to }))
  }

  async function onEventDrop(info: EventDropInfo) {
    const newDate = info.event.start ? toISODate(info.event.start) : null
    const id = info.event.id
    setData((list) => list?.map((c) => (c.id === id ? { ...c, scheduled_date: newDate } : c)))
    try {
      await updateContentSchedule(id, newDate)
      toast.success(`"${info.event.title}" remarcado para ${formatLongDate(newDate)}.`)
    } catch (err) {
      info.revert()
      reload()
      toast.error(errorMessage(err))
    }
  }

  return (
    <>
      <PageHeader
        title="Calendário editorial"
        description="Datas previstas de publicação. Arraste um conteúdo para outro dia para remarcar."
        actions={
          <ButtonLink to="/conteudos/novo">
            <Plus className="size-4" /> Novo conteúdo
          </ButtonLink>
        }
      />

      <div className="mb-4 max-w-xs">
        <RefSelect aria-label="Cliente" items={clients.data} emptyLabel="Todos os clientes" value={clientId} onChange={(e) => setClientId(e.target.value)} />
      </div>

      {error && (
        <div className="mb-4">
          <ErrorState message={error} onRetry={reload} />
        </div>
      )}

      <Card className="skipp-calendar overflow-x-auto p-3 sm:p-5">
        <div className="min-w-[640px]">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin, classicTheme]}
            locale={ptBrLocale}
            initialView={preferences.calendarView}
            firstDay={preferences.weekStartsOn}
            headerToolbar={{ start: 'prev,next today', center: 'title', end: 'dayGridMonth,dayGridWeek' }}
            height="auto"
            fixedWeekCount={false}
            dayMaxEvents={3}
            events={events}
            eventContent={(info) => <EventChip info={info} />}
            editable
            eventDurationEditable={false}
            eventDrop={onEventDrop}
            eventClick={(info: EventClickInfo) => navigate(`/conteudos/${info.event.id}`)}
            dateClick={(info) => navigate(`/conteudos/novo?data=${info.dateStr}${clientId ? `&cliente=${clientId}` : ''}`)}
            datesSet={onDatesSet}
          />
        </div>
      </Card>
      <p className="mt-3 text-xs text-subtle">Dica: clique em um dia vazio para criar um conteúdo já com a data de publicação.</p>
    </>
  )
}
