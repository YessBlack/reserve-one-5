/* eslint-disable no-undef */
/* eslint-disable space-before-function-paren */
import { schedulesService } from '../../services/schedulesService.js'
import { reservationsService } from '../../services/reservationsService.js'
import { usersService } from '../../services/userService.js'
import { Alert } from '../../shared/components/Alert/Alert.js'
import { capitalize } from '../../shared/js/utils.js'
import { ScheduleCardUser } from './components/ScheduleCardUser.js'
import { Filter, initFilter } from './components/Filter.js'
import { initAuthNav } from '../../shared/js/authNav.js'
import { formatScheduleDate } from '../../shared/js/dateUtils.js'

const SESSION_KEY = 'lanhua_session'
let availableClasses = []

const getClassId = (classItem) => classItem.idSchedule ?? classItem.id

const getSession = () => {
  const session = window.localStorage.getItem(SESSION_KEY)
  return session ? JSON.parse(session) : null
}

const isAuthenticated = () => Boolean(getSession())

const showMembershipRequiredAlert = () => {
  Swal.fire({
    icon: 'info',
    title: 'Membresía requerida',
    text: 'Primero adquiere una membresía activa para poder reservar clases.',
    showCancelButton: true,
    confirmButtonText: 'Ver membresías',
    cancelButtonText: 'Continuar viendo clases',
    confirmButtonColor: '#F2BE22',
    cancelButtonColor: '#6c757d'
  }).then((result) => {
    if (result.isConfirmed) window.location.href = '../pricing/pricing.html'
  })
}

const hasActiveMembership = async () => {
  const user = await usersService.getCurrentUserFromApi()
  return Boolean(user?.hasActiveMembership)
}

const renderClassesLoading = () => {
  const cardsContainer = document.querySelector('#disciplinesContainer')
  if (!cardsContainer) return

  cardsContainer.innerHTML = `
    <div class="classes-loading" role="status" aria-live="polite">
      <div class="classes-loading__spinner" aria-hidden="true"></div>
      <span>Cargando clases...</span>
    </div>
  `
}

const renderFilter = () => {
  const container = document.querySelector('#mainContainer')
  if (!container) return

  const filterContainer = document.createElement('div')
  filterContainer.innerHTML = Filter()
  container.insertBefore(filterContainer, container.querySelector('#disciplinesContainer'))
}

const renderFilteredClasses = (classes) => {
  const cardsContainer = document.querySelector('#disciplinesContainer')
  if (!cardsContainer) return

  cardsContainer.innerHTML = ''

  if (!classes || classes.length === 0) {
    cardsContainer.innerHTML = Alert({
      variant: 'info',
      title: 'No se encontraron clases',
      text: 'Intenta con otros filtros o borra los filtros actuales.'
    })
    return
  }

  classes.forEach(classItem => {
    cardsContainer.innerHTML += ScheduleCardUser(classItem)
  })
}

const renderClasses = async () => {
  const cardsContainer = document.querySelector('#disciplinesContainer')

  if (!cardsContainer) return

  renderClassesLoading()
  const classes = await schedulesService.getClasses()
  availableClasses = classes

  cardsContainer.innerHTML = ''

  if (!classes || classes.length === 0) {
    cardsContainer.innerHTML = Alert({
      variant: 'info',
      title: 'No hay clases disponibles',
      text: 'Actualmente no hay horarios o clases creadas por el administrador.'
    })
    return
  }

  classes.forEach(classItem => {
    cardsContainer.innerHTML += ScheduleCardUser(classItem)
  })
}

const setupEventListeners = () => {
  const cardsContainer = document.querySelector('#disciplinesContainer')

  if (!cardsContainer) return

  cardsContainer.addEventListener('click', async (event) => {
    const reserveBtn = event.target.closest('.reserve-btn')
    if (reserveBtn) {
      if (!isAuthenticated()) {
        Swal.fire({
          icon: 'warning',
          title: 'Iniciar Sesión Requerido',
          text: 'Debes Iniciar Sesión y tener una Mensualidad activas.',
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: 'Iniciar Sesión',
          denyButtonText: 'Mensualidades',
          cancelButtonText: 'Cancelar',
          customClass: {
            confirmButton: 'btn btn-primary px-3',
            cancelButton: 'btn btn-secondary px-3',
            denyButton: 'btn btn-warning px-3 text-dark'
          }
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = '../auth/auth.html'
          } else if (result.isDenied) {
            window.location.href = '../pricing/pricing.html'
          }
        })
        return
      }

      const classId = reserveBtn.getAttribute('data-id')
      const selectedClass = availableClasses.find(classItem => {
        return String(getClassId(classItem)) === String(classId)
      })

      if (!selectedClass) return

      let activeMembership = false
      try {
        activeMembership = await hasActiveMembership()
      } catch (error) {
        console.error('Error verificando la membresía activa:', error)
      }

      if (!activeMembership) {
        showMembershipRequiredAlert()
        return
      }

      Swal.fire({
        title: '<strong>Agregar Reserva</strong>',
        icon: 'question',
        html: `
          <div class="text-start mt-3 d-flex flex-column gap-2 fs-6">
            <p class="mb-1"><strong>Clase:</strong> ${capitalize(selectedClass?.catalog?.name)}</p>
            <p class="mb-1"><strong>Nivel:</strong> ${capitalize(selectedClass.level)}</p>
            <p class="mb-1"><strong>Horario:</strong> ${formatScheduleDate(selectedClass.scheduleDate)}</p>
            <p class="mb-1"><strong>Ubicación:</strong> ${selectedClass.location}</p>
            <p class="mb-0"><strong>Modalidad:</strong> ${capitalize(selectedClass.modality)}</p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Agregar',
        cancelButtonText: 'Cancelar',
        buttonsStyling: true,
        customClass: {
          confirmButton: 'btn btn-primary px-4',
          cancelButton: 'btn btn-secondary px-4'
        }
      }).then(async (result) => {
        if (result.isConfirmed) {
          const reservationResult = await reservationsService.addReservation(selectedClass)

          if (reservationResult.success) {
            Swal.fire({
              title: '¡Reserva Agregada!',
              text: `Has reservado tu cupo momentaneamente para la clase de ${capitalize(selectedClass.title)}, para completar la reserva ir a Mis Reservas y alli confirmarla.`,
              icon: 'success',
              showCancelButton: true,
              confirmButtonText: 'Ver Mis  Reservas',
              cancelButtonText: 'Continuar Agregando',
              reverseButtons: true,
              customClass: {
                confirmButton: 'btn btn-success px-3',
                cancelButton: 'btn btn-outline-dark px-3'
              }
            }).then((navigationResult) => {
              if (navigationResult.isConfirmed) {
                window.location.href = '../reservations/reservations.html'
              }
            })
          } else {
            Swal.fire({
              title: 'Clase ya agregada',
              text: reservationResult.message,
              icon: 'warning',
              confirmButtonText: 'Entendido',
              customClass: {
                confirmButton: 'btn btn-warning px-4'
              }
            })
          }
        }
      })
    }
  })
}

document.addEventListener('DOMContentLoaded', async () => {
  initAuthNav()
  renderFilter()
  renderClassesLoading()
  await initFilter(renderFilteredClasses, renderClasses)
  await renderClasses()
  setupEventListeners()
})
