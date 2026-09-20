/* eslint-disable no-undef */

import { PAYMENT_STATUS, paymentService } from "../../services/paymantService.js"
import { usersService } from "../../services/userService.js"
import { membershipService } from "../../services/membershipService.js"
import { MembershipCard } from "./components/membershipCard/membershipCard.js"

const CURRENT_SESSION_KEY = 'lanhua_session'
const SWAL_THEME = { background: '#1c1f26', color: '#fff' }

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount)
}

const renderMemberships = async () => {
  const grid = document.querySelector('.membership-grid')
  if (!grid) return

  grid.id = 'membershipGrid'
  grid.innerHTML = `
    <div class="memberships-loading" role="status" aria-live="polite">
      <div class="memberships-loading__spinner" aria-hidden="true"></div>
      <span>Cargando mensualidades...</span>
    </div>
  `

  try {
    const memberships = await membershipService.getMemberships()
    grid.innerHTML = memberships.length > 0
      ? memberships.map((membership, index) => MembershipCard(membership, index)).join('')
      : '<p class="memberships-empty">No hay mensualidades disponibles.</p>'
  } catch (error) {
    console.error('Error obteniendo las mensualidades:', error)
    grid.innerHTML = '<p class="memberships-empty">No fue posible cargar las mensualidades.</p>'
  }
}

async function startPlanPayment(idMembership, planName, planPrice) {
  const controller = new AbortController()

  Swal.fire({
    ...SWAL_THEME,
    title: 'Esperando tu pago…',
    html: 'Completa el pago en la pestaña de Bold y vuelve aquí.<br>Te avisaremos apenas se confirme.',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    showCancelButton: true,
    cancelButtonText: 'Cancelar',
    cancelButtonColor: '#BF2A37',
    didOpen: () => Swal.showLoading()
  }).then((result) => {
    if (result.dismiss === Swal.DismissReason.cancel) controller.abort()
  })

  try {
    const { status } = await paymentService.payWithBold(
      { idMembership },
      { signal: controller.signal }
    )

    if (status === PAYMENT_STATUS.PAID) {
      // TODO: aquí se debe activar la membresía en el backend
      Swal.fire({
        ...SWAL_THEME,
        icon: 'success',
        title: '¡Pago aprobado!',
        text: `Recibimos tu pago del Plan ${planName}.`,
        confirmButtonColor: '#F2BE22'
      })
    } else if (status === PAYMENT_STATUS.TIMEOUT) {
      Swal.fire({
        ...SWAL_THEME,
        icon: 'info',
        title: 'No pudimos confirmar tu pago',
        text: 'Si ya pagaste, actualiza la página en unos minutos.',
        confirmButtonColor: '#F2BE22'
      })
    } else {
      Swal.fire({
        ...SWAL_THEME,
        icon: 'error',
        title: 'Pago no procesado',
        text: 'No pudimos procesar el pago. Puedes intentarlo de nuevo.',
        confirmButtonColor: '#F2BE22'
      })
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      Swal.close()
      return
    }

    if (err.code === 'PAYMENT_WINDOW_CLOSED') {
      Swal.fire({
        ...SWAL_THEME,
        icon: 'info',
        title: 'Pago cancelado',
        text: 'Cerraste la ventana de Bold antes de completar el pago.',
        confirmButtonColor: '#F2BE22'
      })
      return
    }

    if (err.code === 'INVALID_MEMBERSHIP_ID') {
      console.error(err.message)
      Swal.close()
      return
    }

    if (err.status === 403) {
      Swal.fire({
        ...SWAL_THEME,
        icon: 'warning',
        title: 'No tienes permiso para pagar',
        text: err.message || 'El servidor rechazó el acceso al servicio de pagos.',
        confirmButtonColor: '#F2BE22'
      })
      return
    }

    Swal.fire({
      ...SWAL_THEME,
      icon: 'error',
      title: 'Ocurrió un problema',
      text: err.message || 'No se pudo iniciar el pago.',
      confirmButtonColor: '#F2BE22'
    })
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  setupLogoutEvents()
  await renderMemberships()

  const planTriggers = document.querySelectorAll('.select-plan-trigger')

  planTriggers.forEach(button => {
    button.addEventListener('click', function (event) {
      event.preventDefault()

      if (!usersService.isAuthenticated()) {
        Swal.fire({
          ...SWAL_THEME,
          icon: 'warning',
          title: 'Iniciar Sesión Requerido',
          text: 'Debes ingresar a tu cuenta o registrarte para poder adquirir un plan.',
          showCancelButton: true,
          confirmButtonText: 'Iniciar Sesión / Registrarse',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#F2BE22',
          cancelButtonColor: '#BF2A37'
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = '../auth/auth.html'
          }
        })
        return
      }

      const planName = this.getAttribute('data-plan') || 'Plan Lan Hua'
      const planPrice = parseInt(this.getAttribute('data-price')) || 0
      const idMembership = Number(this.getAttribute('data-membership-id'))

      if (!idMembership) {
        console.error('La membresía no tiene un id válido:', {
          dataset: this.dataset,
          message: 'La API debe devolver id o idMembership en cada membresía.'
        })
        return
      }

      Swal.fire({
        ...SWAL_THEME,
        title: `¿Elegir Plan ${planName}?`,
        html: `El valor de tu mensualidad será de <strong>${formatCurrency(planPrice)}</strong>.<br>Te llevaremos a Bold para completar el pago de forma segura.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#F2BE22',
        cancelButtonColor: '#BF2A37',
        confirmButtonText: 'Ir a pagar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          startPlanPayment(idMembership, planName, planPrice)
        }
      })
    })
  })
})

function setupLogoutEvents() {
  const logoutButtons = document.querySelectorAll('#clientLogoutBtn, #adminLogoutBtn')

  logoutButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      localStorage.removeItem(CURRENT_SESSION_KEY)
      sessionStorage.removeItem(CURRENT_SESSION_KEY)
      window.location.replace('../auth/auth.html')
    })
  })
}