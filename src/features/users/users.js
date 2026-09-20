/* eslint-disable no-undef */
import { usersService } from '../../services/userService.js'

const SESSION_KEY = 'lanhua_session'

const getSession = () => {
  const session = window.localStorage.getItem(SESSION_KEY)
  return session ? JSON.parse(session) : null
}

const setValue = (id, value) => {
  const input = document.getElementById(id)
  if (input) input.value = value ?? ''
}

const showEpsExpirationWarning = (dateEps) => {
  if (!dateEps) return

  const lastUpdate = new Date(`${dateEps}T00:00:00`)
  const diffDays = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 90) return

  Swal.fire({
    icon: 'warning',
    title: '¡Certificado de EPS vencido!',
    text: 'Actualiza la fecha y adjunta un certificado vigente.',
    confirmButtonColor: '#f2be22',
    background: '#212529',
    color: '#fff'
  })
}

const populateProfileForm = (user, information = {}) => {
  const safeInformation = information || {}
  setValue('inputFirstName', user.nameUser)
  setValue('inputLastName', user.lastNameUser)
  setValue('inputDocumentId', safeInformation.numberDni)
  setValue('inputAddress', safeInformation.address)
  setValue('inputPhone', safeInformation.userPhone)
  setValue('inputEmergencyName', safeInformation.contactName)
  setValue('inputEmergencyRelation', safeInformation.kinship)
  setValue('inputEmergencyPhone', safeInformation.contactPhone)
  setValue('selectHealthProvider', safeInformation.eps)
  setValue('selectBloodType', safeInformation.rh)
  setValue('textareaMedicalConditions', safeInformation.medicConditions)
  setValue('inputEpsUpdateDate', safeInformation.dateEps)

  showEpsExpirationWarning(safeInformation.dateEps)
}

const setupHeaders = (session) => {
  const clientHeader = document.getElementById('clientHeader')
  const adminHeader = document.getElementById('adminHeader')
  const role = (session.role || '').toUpperCase()

  if (role === 'ADMIN') {
    adminHeader?.classList.remove('d-none')
  } else {
    clientHeader?.classList.remove('d-none')
  }
}

const setupAvatarPreview = () => {
  const imageUploader = document.getElementById('profileImageInput')
  if (!imageUploader) return

  imageUploader.addEventListener('change', (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.addEventListener('load', (loadEvent) => {
      const avatar = document.getElementById('avatarPreview')
      if (avatar) avatar.src = loadEvent.target.result
    })
    reader.readAsDataURL(file)
  })
}

const setupCancelButton = () => {
  const cancelButton = document.getElementById('btnCancelUpdates')
  if (!cancelButton) return

  cancelButton.addEventListener('click', () => {
    window.location.href = '../catalog_users/catalog_user.html'
  })
}

const readInformationChangesFromForm = () => ({
  nameUser: document.getElementById('inputFirstName').value.trim(),
  lastNameUser: document.getElementById('inputLastName').value.trim(),
  numberDni: document.getElementById('inputDocumentId').value.trim(),
  address: document.getElementById('inputAddress').value.trim(),
  userPhone: document.getElementById('inputPhone').value.trim(),
  contactName: document.getElementById('inputEmergencyName').value.trim(),
  kinship: document.getElementById('inputEmergencyRelation').value.trim(),
  contactPhone: document.getElementById('inputEmergencyPhone').value.trim(),
  eps: document.getElementById('selectHealthProvider').value.trim(),
  rh: document.getElementById('selectBloodType').value,
  medicConditions: document.getElementById('textareaMedicalConditions').value.trim(),
  dateEps: document.getElementById('inputEpsUpdateDate').value || null
})

const setupProfileForm = (initialUser, initialInformation) => {
  const profileForm = document.getElementById('profileConfigurationForm')
  if (!profileForm) return

  let user = initialUser
  let information = initialInformation

  profileForm.addEventListener('submit', async (event) => {
    event.preventDefault()

    const changes = readInformationChangesFromForm()
    const submitButton = profileForm.querySelector('button[type="submit"]')
    if (submitButton) submitButton.disabled = true

    const result = await usersService.updateCurrentUserFromApi(user, information, changes)

    if (submitButton) submitButton.disabled = false

    if (result.user) {
      user = result.user
      if (result.information) {
        information = result.information
      }
      populateProfileForm(user, information)
    }

    const icon = result.success
      ? 'success'
      : result.partial
        ? 'warning'
        : 'error'
    const title = result.success
      ? 'Perfil actualizado'
      : result.partial
        ? 'Guardado parcial'
        : 'No se pudo actualizar'

    Swal.fire({
      icon,
      title,
      text: result.success
        ? 'Tus cambios se guardaron correctamente.'
        : result.message,
      confirmButtonColor: '#f2be22'
    })
  })
}

const initProfile = async () => {
  const session = getSession()
  if (!session) {
    window.location.href = '../auth/auth.html'
    return
  }

  setupHeaders(session)

  const [user, information] = await Promise.all([
    usersService.getCurrentUserFromApi(),
    usersService.getCurrentUserInformationFromApi()
  ])
  if (!user) {
    Swal.fire({
      icon: 'error',
      title: 'No se encontró tu usuario',
      text: 'No fue posible cargar la información desde el servidor.',
      confirmButtonColor: '#f2be22'
    })
    return
  }

  populateProfileForm(user, information)
  setupAvatarPreview()
  setupCancelButton()
  setupProfileForm(user, information)
}

document.addEventListener('DOMContentLoaded', initProfile)
