/* eslint-disable space-before-function-paren */
import { reservationsService } from '../../services/reservationsService.js'
import { schedulesService } from '../../services/schedulesService.js'
import { usersService } from '../../services/userService.js'
import { capitalize } from '../../shared/js/utils.js'

const SESSION_KEY = 'lanhua_session'

const currentDate = new Date()
let selectedDate = new Date()
let eventsData = []
let isAdmin = false

document.addEventListener('DOMContentLoaded', async () => {
  const session = JSON.parse(window.localStorage.getItem(SESSION_KEY))

  if (!session) {
    window.location.href = '../auth/auth.html'
    return
  }

  isAdmin = session.role === 'ADMIN'
  setupTheme()
  setupHeaders()
  renderCalendarLoading()
  await loadData()
  setupCalendarControls()
  renderCalendar()
  await renderAgenda(selectedDate)
})

function setupTheme() {
  document.body.classList.toggle('agenda-admin', isAdmin)
  document.body.classList.toggle('agenda-user', !isAdmin)
}

function setupHeaders() {
  const clientHeader = document.getElementById('clientHeader')
  const adminHeader = document.getElementById('adminHeader')
  const title = document.getElementById('daylieTitle')
  const description = document.getElementById('daylieDescription')

  clientHeader.classList.add('d-none')
  adminHeader.classList.add('d-none')

  if (isAdmin) {
    adminHeader.classList.remove('d-none')
    title.textContent = 'Agenda de Clases'
    description.textContent = 'Consulta y organiza las clases reservadas por los estudiantes.'
  } else {
    clientHeader.classList.remove('d-none')
    title.textContent = 'Mi Agenda de Entrenamiento'
    description.textContent = 'Consulta las clases que has reservado en el Club LanHua.'
  }
}

function renderCalendarLoading() {
  const loadingMarkup = `
    <div class="daylie-loading" role="status" aria-live="polite">
      <div class="daylie-loading__spinner" aria-hidden="true"></div>
      <span>Cargando calendario...</span>
    </div>
  `
  document.getElementById('calendarGrid').innerHTML = loadingMarkup
  document.getElementById('agendaList').innerHTML = loadingMarkup
}

function renderAgendaLoading() {
  document.getElementById('agendaList').innerHTML = `
    <div class="daylie-loading" role="status" aria-live="polite">
      <div class="daylie-loading__spinner" aria-hidden="true"></div>
      <span>Cargando clases...</span>
    </div>
  `
}

async function loadData() {
  if (isAdmin) {
    eventsData = await schedulesService.getClasses() || []
  } else {
    const reservations = await reservationsService.getConfirmedReservations() || []
    eventsData = reservations.map(reservation => ({
      ...reservation,
      id: reservation.schedule?.idSchedule,
      title: reservation.catalog?.name || 'Clase sin nombre',
      scheduleDate: reservation.schedule?.scheduleDate,
      location: reservation.schedule?.location || 'Sede Principal',
      image: reservation.schedule?.image || reservation.catalog?.image,
      level: reservation.schedule?.level || 'General',
      capacity: reservation.schedule?.quotas || 0,
      modality: reservation.modality || 'Grupal'
    }))
  }
}

function formatDateString(dateObj) {
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function hasEventsOnDate(dateString) {
  return eventsData.some(event => {
    if (!event?.scheduleDate) return false
    const eventDate = event.scheduleDate.split('T')[0]
    return eventDate === dateString
  })
}

function getEventCapacity(event) {
  return event.capacity ?? event.quotas ?? 0
}

function getReservationUserId(reservation) {
  return reservation.userId ?? reservation.idUser ?? reservation.user?.id ?? reservation.user?.idUser
}

function getUserFullName(user) {
  if (!user) return null

  const firstName = user.nombre || user.name || user.nameUser || ''
  const lastName = user.apellidos || user.apellido || user.lastName || user.lastNameUser || ''
  const fullName = `${firstName} ${lastName}`.trim()

  return fullName || user.email || user.emailUser || null
}

function setupCalendarControls() {
  document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1)
    renderCalendar()
  })

  document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1)
    renderCalendar()
  })
}

function renderCalendar() {
  const grid = document.getElementById('calendarGrid')
  const monthYearDisplay = document.getElementById('monthYearDisplay')
  grid.innerHTML = ''

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  monthYearDisplay.textContent = `${monthNames[month]} ${year}`

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const today = new Date()
  const todayString = formatDateString(today)
  const selectedString = formatDateString(selectedDate)

  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div')
    emptyCell.className = 'calendar-day empty'
    grid.appendChild(emptyCell)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement('div')
    dayCell.className = 'calendar-day'

    const cellDateObj = new Date(year, month, day)
    const cellDateString = formatDateString(cellDateObj)

    if (cellDateString === todayString) dayCell.classList.add('today')
    if (cellDateString === selectedString) dayCell.classList.add('active')

    let cellHTML = `<span class="day-number">${day}</span>`

    if (hasEventsOnDate(cellDateString)) {
      cellHTML += '<div class="event-indicator"></div>'
    }

    dayCell.innerHTML = cellHTML

    dayCell.addEventListener('click', async () => {
      document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('active'))
      dayCell.classList.add('active')

      selectedDate = cellDateObj
      await renderAgenda(selectedDate)
    })

    grid.appendChild(dayCell)
  }
}

async function renderAgenda(dateObj) {
  const agendaList = document.getElementById('agendaList')
  const selectedDateText = document.getElementById('selectedDateText')
  const targetDateString = formatDateString(dateObj)

  renderAgendaLoading()

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  selectedDateText.textContent = capitalize(dateObj.toLocaleDateString('es-ES', options))

  const dailyEvents = eventsData.filter(event => {
    return event?.scheduleDate && event.scheduleDate.split('T')[0] === targetDateString
  })

  agendaList.innerHTML = ''

  if (dailyEvents.length === 0) {
    agendaList.innerHTML = `
      <div class="text-center text-muted p-4 border rounded border-dashed agenda-empty">
        <i class="fa-regular fa-calendar-xmark fs-2 mb-2"></i>
        <p class="small m-0">No hay clases programadas para este día.</p>
      </div>
    `
    return
  }

  const cardTitleClass = isAdmin ? 'text-dark' : 'text-white'
  const professorTextClass = isAdmin ? 'text-muted' : 'text-light'
  const attendeesListClass = isAdmin ? 'text-dark' : 'text-light'
  const attendeesBoxClass = isAdmin
    ? 'mt-1 bg-white p-2 rounded border'
    : 'mt-1 bg-dark p-2 rounded border border-secondary'

  const allUsers = isAdmin ? await usersService.getAllUsersFromApi() : []

  const allConfirmed = isAdmin
    ? await reservationsService.getAllConfirmedReservations()
    : []

  for (const event of dailyEvents) {
    const timeString = event.scheduleDate.split('T')[1]
    const professorName = event.professor ? event.professor : 'Profesor sin asignar'

    let adminDetails = ''

    if (isAdmin) {
      const classReservations = allConfirmed.filter(res => {
        return String(res.schedule?.idSchedule ?? res.idSchedule) === String(event.idSchedule ?? event.id)
      })
      const attendeeNames = classReservations.map(res => {
        const userId = getReservationUserId(res)
        const user = allUsers.find(u => String(u.id ?? u.idUser) === String(userId))
        return getUserFullName(user) || getUserFullName(res.user) || 'Usuario sin nombre'
      })

      let attendeesListHTML = '<p class="text-muted small mb-0 fst-italic">Nadie ha reservado aún.</p>'
      if (attendeeNames.length > 0) {
        attendeesListHTML = `<ul class="mb-0 ps-3 small ${attendeesListClass}" style="list-style-type: circle;">
          ${attendeeNames.map(name => `<li>${name}</li>`).join('')}
        </ul>`
      }

      adminDetails = `
      <div class="mt-3 pt-2 border-top border-secondary">
        <div class="mb-2">
          <span class="text-warning small fw-bold"><i class="fa-solid fa-chalkboard-user me-1"></i> Profesor:</span>
          <span class="${professorTextClass} small">${professorName}</span>
        </div>
        <div>
          <span class="text-info small fw-bold"><i class="fa-solid fa-users me-1"></i> Confirmados (${classReservations.length}/${getEventCapacity(event)}):</span>
          <div class="${attendeesBoxClass}" style="max-height: 100px; overflow-y: auto;">
            ${attendeesListHTML}
          </div>
        </div>
      </div>
      `
    }

    agendaList.innerHTML += `
      <div class="card agenda-card p-3 shadow-sm">
        <div class="d-flex justify-content-between align-items-start mb-1">
          <h6 class="fw-bold m-0 ${cardTitleClass}">${capitalize(event.title)}</h6>
          <span class="badge bg-warning text-dark">${timeString}</span>
        </div>
        <p class="text-secondary small mb-1"><i class="fa-solid fa-location-dot me-1"></i> ${event.location}</p>
        <div class="d-flex gap-2">
          <span class="badge bg-secondary opacity-75">${capitalize(event.level)}</span>
          <span class="badge bg-secondary opacity-75">${capitalize(event.modality)}</span>
        </div>
        ${adminDetails}
      </div>
    `
  }
}
