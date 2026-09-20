/* eslint-disable space-before-function-paren */
/* eslint-disable no-undef */
import { reservationsService } from '../../services/reservationsService.js'
import { getImagePath } from '../../shared/js/config.js'
import { formatScheduleDate } from '../../shared/js/dateUtils.js'
import { capitalize } from '../../shared/js/utils.js'

const resolveImageSource = (image) => {
  if (!image) return getImagePath('lanhua-banner-1.png')
  if (image.startsWith('data:') || image.startsWith('http') || image.startsWith('/')) return image
  return getImagePath(image.split('/').pop())
}

async function renderizarReservas() {
  const contenedor = document.getElementById('lista-reservas')
  const totalElemento = document.getElementById('total-reservas')
  const contadorBadge = document.getElementById('contador-badge')
  const resumenCantidad = document.getElementById('resumen-cantidad')
  const resumenClases = document.getElementById('resumen-clases')
  const contenedorVaciar = document.getElementById('contenedor-vaciar')

  if (!contenedor) return

  const misReservas = await reservationsService.getPendingReservations()

  contenedor.innerHTML = ''

  if (!misReservas || misReservas.length === 0) {
    contenedor.innerHTML = `
            <div class="card p-5 text-center bg-dark text-muted border-secondary">
                <h5 class="text-warning mb-2">No tienes reservas activas</h5>
                <p class="small mb-3">Parece que aún no has agendado ninguna clase en el club.</p>
                <a href="../catalog_users/catalog_user.html" class="btn btn-outline-warning btn-sm w-50 mx-auto fw-bold">Ver Cartelera de Clases</a>
            </div>`
    if (totalElemento) totalElemento.textContent = '0'
    if (contadorBadge) contadorBadge.textContent = '0 clases'
    if (resumenCantidad) resumenCantidad.textContent = '0'
    if (resumenClases) resumenClases.innerHTML = '<p class="text-secondary small mb-0">No hay clases seleccionadas.</p>'
    if (contenedorVaciar) contenedorVaciar.classList.add('d-none')

    return
  }

  if (contenedorVaciar) contenedorVaciar.classList.remove('d-none')

  misReservas.forEach((item) => {
    const claseInfo = item.schedule || {}
    const catalogoInfo = item.catalog || {}
    const titulo = catalogoInfo.name || 'Clase sin nombre'
    const imagen = claseInfo.image || catalogoInfo.image
    const nivel = claseInfo.level || 'General'

    const fechaText =
      claseInfo.scheduleDate ? formatScheduleDate(claseInfo.scheduleDate) : 'Fecha por confirmar'

    const ubicacion = claseInfo.location || 'Sede Principal'
    const modalidad = item.modality || 'grupal'
    const cuposDisponibles = claseInfo.availableQuotas ?? claseInfo.availableSlots ?? claseInfo.quotas ?? claseInfo.capacity ?? 0
    const idReserva = item.idReservation || item.id

    contenedor.innerHTML += `
        <div class="card p-3 bg-dark border-secondary mb-2">
            <div class="row align-items-center">
                <div class="col-md-3 mb-2 mb-md-0">
                    <img src="${resolveImageSource(imagen)}" class="img-fluid rounded object-fit-cover" alt="${titulo}" style="height: 80px; width: 100%;">
                </div>
                <div class="col-md-5">
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <h5 class="text-light m-0 fs-6 fw-bold">${capitalize(titulo)}</h5>
                        <span class="badge bg-warning text-dark" style="font-size: 0.65rem;">${capitalize(nivel)}</span>
                    </div>
                    <p class="text-light small mb-1">${fechaText}</p>
                    <p class="text-light small mb-1">Ubicación: ${ubicacion}</p>
                    <p class="text-light small mb-0">Modalidad: ${capitalize(modalidad)}</p>
                </div>
                <div class="col-md-2 my-2 my-md-0">
                  <div class="reservation-seats text-light small">
                    <div>Disponibles: <strong>${cuposDisponibles}</strong></div>
                    <div class="mt-1">Tu cupo: <strong>1</strong></div>
                  </div>
                </div>
                <div class="col-md-2 text-end">
                    <button class="btn btn-sm btn-outline-danger px-2 py-1" onclick="eliminarItem('${idReserva}')">Quitar</button>
                </div>
            </div>
        </div>
    `
  })

  if (totalElemento) totalElemento.textContent = misReservas.length
  if (contadorBadge) contadorBadge.textContent = `${misReservas.length} clase${misReservas.length !== 1 ? 's' : ''}`
  if (resumenCantidad) resumenCantidad.textContent = misReservas.length
  if (resumenClases) {
    resumenClases.innerHTML = misReservas.map(item => {
      const titulo = item.catalog?.name || 'Clase sin nombre'
      return `<div class="border-bottom border-secondary pb-2 mb-2 small d-flex justify-content-between align-items-center w-100">
        <span class="text-light">${capitalize(titulo)}</span>
        <strong class="text-warning">1</strong>
      </div>`
    }).join('')
  }
}

window.eliminarItem = async (idReservation) => {
  const result = await Swal.fire({
    title: '¿Estás seguro?',
    text: '¿Deseas cancelar esta reserva?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#f2be22',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, cancelar',
    cancelButtonText: 'No'
  })

  if (result.isConfirmed) {
    const response = await reservationsService.removeReservation(idReservation)

    if (response.success) {
      Swal.fire({
        icon: 'success',
        title: '¡Cancelada!',
        text: 'La reserva ha sido cancelada correctamente.',
        background: '#212529',
        color: '#fff',
        confirmButtonColor: '#f2be22'
      })

      await renderizarReservas()
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cancelar la reserva.',
        background: '#212529',
        color: '#fff'
      })
    }
  }
}

window.vaciarReservas = async function () {
  Swal.fire({
    title: '¿Cancelar todas las reservas?',
    text: '¿Estás segura de que deseas cancelar todas tus reservas de clases?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, cancelar todo',
    cancelButtonText: 'No, mantener',
    customClass: {
      confirmButton: 'btn btn-danger px-4',
      cancelButton: 'btn btn-secondary px-4'
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      const pendientes = await reservationsService.getPendingReservations()
      for (const res of pendientes) {
        await reservationsService.removeReservation(res.idReservation || res.id)
      }
      await renderizarReservas()
      Swal.fire({
        title: 'Reservas canceladas',
        text: 'Todas tus reservas han sido canceladas.',
        icon: 'success',
        confirmButtonText: 'Entendido',
        customClass: {
          confirmButton: 'btn btn-success px-4'
        }
      })
    }
  })
}

window.confirmarReservas = async function () {
  const misReservas = await reservationsService.getPendingReservations()
  if (!misReservas || misReservas.length === 0) {
    Swal.fire({
      title: 'Sin reservas',
      text: 'No tienes clases pendientes seleccionadas para confirmar.',
      icon: 'warning',
      confirmButtonText: 'Entendido',
      customClass: {
        confirmButton: 'btn btn-warning px-4'
      }
    })
    return
  }

  Swal.fire({
    title: '¡Reservas confirmadas!',
    text: '¡Tus reservas han sido registradas con éxito en el sistema del club!',
    icon: 'success',
    confirmButtonText: 'Ir a Mi Agenda',
    showCancelButton: true,
    cancelButtonText: 'Seguir aquí',
    customClass: {
      confirmButton: 'btn btn-success px-4',
      cancelButton: 'btn btn-secondary px-4'
    }
  }).then(async (result) => {
    await reservationsService.confirmUserReservations()
    await renderizarReservas()
    if (result.isConfirmed) {
      window.location.href = '../daylie/daylie.html'
    }
  })
}

document.addEventListener('DOMContentLoaded', renderizarReservas)
