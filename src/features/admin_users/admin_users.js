/* eslint-disable no-undef */
import { usersService } from '../../services/userService.js'

const tableBody = document.getElementById('tableBody')

const modalElement = document.querySelector('#adminUsersModal')
const bootstrapModal = bootstrap.Modal.getOrCreateInstance(modalElement)
const modalTitle = document.getElementById('adminUsersModalLabel')

const userForm = document.getElementById('userForm')
const userIdInput = document.getElementById('userId')
const userNombreInput = document.getElementById('userNombre')
const userApellidoInput = document.getElementById('userApellido')
const userEmailInput = document.getElementById('userEmail')
const userPasswordInput = document.getElementById('userPassword')
const passwordHint = document.getElementById('passwordHint')
const btnDeleteUser = document.getElementById('btnDeleteUser')
let users = []

const formatDate = (isoString) => {
  if (!isoString) return 'Sin fecha'
  const date = new Date(isoString)
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

const getUserId = (user) => user.idUser

const getUserName = (user) => user.nameUser ?? ''

const getUserLastName = (user) => user.lastNameUser ?? ''

const getUserEmail = (user) => user.emailUser ?? ''

const getUserRole = (user) => user.nameRol ?? ''

const renderLoadingUsers = () => {
  tableBody.innerHTML = `
    <tr>
      <td colspan="5" class="text-center text-muted py-4">
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Cargando usuarios...
      </td>
    </tr>
  `
}

const renderUsers = (list) => {
  tableBody.innerHTML = ''

  if (list.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted py-4">No hay usuarios administradores registrados</td>
      </tr>
    `
    return
  }

  list.forEach((user) => {
    const tr = document.createElement('tr')

    const name = getUserName(user)
    const lastName = getUserLastName(user)
    const fullName = [name, lastName].filter(Boolean).join(' ')

    tr.innerHTML = `
      <td>
        <button class="btnEditUser" data-id="${getUserId(user)}" title="Editar usuario">
          <i class="fa-solid fa-pen"></i>
        </button>
      </td>
      <td class="text-muted">${fullName}</td>
      <td class="text-muted">${getUserEmail(user)}</td>
      <td class="text-muted">${getUserRole(user)}</td>
      <td class="text-muted">${formatDate(user.creationDate)}</td>
    `

    tableBody.appendChild(tr)
  })
}

const resetForm = () => {
  userForm.reset()
  userIdInput.value = ''
  userEmailInput.disabled = false
}

const openCreateModal = () => {
  resetForm()
  modalTitle.textContent = 'Agregar Usuario'
  userPasswordInput.disabled = false
  userPasswordInput.required = true
  passwordHint.classList.add('d-none')
  btnDeleteUser.classList.add('d-none')
  bootstrapModal.show()
}

const openEditModal = (id) => {
  const user = users.find((item) => String(getUserId(item)) === String(id))
  if (!user) return

  resetForm()
  modalTitle.textContent = 'Editar Usuario'
  userIdInput.value = getUserId(user)
  userNombreInput.value = getUserName(user)
  userApellidoInput.value = getUserLastName(user)
  userEmailInput.value = getUserEmail(user)
  userEmailInput.disabled = true
  userPasswordInput.disabled = true
  userPasswordInput.value = ''
  userPasswordInput.required = false
  passwordHint.classList.remove('d-none')
  btnDeleteUser.classList.remove('d-none')
  bootstrapModal.show()
}

userForm.addEventListener('submit', async (event) => {
  event.preventDefault()

  const id = userIdInput.value
  const nombre = userNombreInput.value.trim()
  const apellido = userApellidoInput.value.trim()
  const password = userPasswordInput.value
  const submitButton = userForm.querySelector('button[type="submit"]')
  submitButton.disabled = true

  try {
    if (id) {
      await usersService.updateAdminFromApi(id, {
        nameUser: nombre,
        lastNameUser: apellido,
        emailUser: userEmailInput.value
      })
    } else {
      await usersService.createAdminFromApi({
        nameUser: nombre,
        lastNameUser: apellido,
        emailUser: userEmailInput.value.trim(),
        passwordUser: password
      })
    }

    bootstrapModal.hide()
    await loadUsers()
    Swal.fire({ icon: 'success', title: id ? 'Usuario actualizado' : 'Usuario agregado', timer: 1500, showConfirmButton: false })
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Ups...', text: getApiErrorMessage(error) })
  } finally {
    submitButton.disabled = false
  }
})

btnDeleteUser.addEventListener('click', () => {
  const id = userIdInput.value
  if (!id) return

  Swal.fire({
    icon: 'warning',
    title: '¿Eliminar usuario?',
    text: 'Esta acción no se puede deshacer.',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc3545'
  }).then((confirmResult) => {
    if (!confirmResult.isConfirmed) return

    usersService.deleteUserFromApi(id)
      .then(async () => {
        bootstrapModal.hide()
        await loadUsers()
        Swal.fire({ icon: 'success', title: 'Usuario eliminado', timer: 1500, showConfirmButton: false })
      })
      .catch((error) => {
        Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: getApiErrorMessage(error) })
      })
  })
})

tableBody.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-id]')
  if (!btn) return

  openEditModal(btn.dataset.id)
})

document.getElementById('addProgram').addEventListener('click', openCreateModal)

const getApiErrorMessage = (error) => error.response?.data?.message
  || error.response?.data?.error
  || 'No fue posible completar la operación en el servidor.'

const loadUsers = async () => {
  renderLoadingUsers()
  const list = await usersService.getAllUsersFromApi()
  users = list.filter((user) => getUserRole(user).toUpperCase() === 'ADMIN')
  renderUsers(users)
}

loadUsers().catch((error) => {
  renderUsers([])
  Swal.fire({ icon: 'error', title: 'No se pudieron cargar los usuarios', text: getApiErrorMessage(error) })
})
