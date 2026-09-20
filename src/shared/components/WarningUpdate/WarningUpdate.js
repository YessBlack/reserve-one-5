import { usersService } from '../../../services/userService.js'

const SESSION_KEY = 'lanhua_session'
const PROFILE_URL = '/src/features/users/users.html'

const isProfileComplete = (user, information) => {
  if (!user || !information) return false

  const requiredInformationFields = [
    'numberDni',
    'address',
    'userPhone',
    'contactName',
    'kinship',
    'contactPhone',
    'eps',
    'rh'
  ]

  const hasBasicUserData = Boolean(
    user.nameUser?.trim() && user.lastNameUser?.trim()
  )

  const hasExtendedData = requiredInformationFields.every((field) => {
    const value = information[field]
    return value !== undefined && value !== null && String(value).trim() !== ''
  })

  return hasBasicUserData && hasExtendedData
}

export const initWarningUpdate = async () => {
  const session = JSON.parse(window.localStorage.getItem(SESSION_KEY))
  if (!session || (session.role || '').toUpperCase() === 'ADMIN') return

  const [user, information] = await Promise.all([
    usersService.getCurrentUserFromApi(),
    usersService.getCurrentUserInformationFromApi()
  ])

  if (isProfileComplete(user, information)) return
  if (document.getElementById('warningUpdateBanner')) return

  const bannerElement = document.createElement('div')
  bannerElement.id = 'warningUpdateBanner'
  bannerElement.className = 'warning-update-banner'
  bannerElement.innerHTML = `
    <span>
        Completa Todos los datos en <a href="${PROFILE_URL}">Mi perfil</a> para completar tu inscripción.
    </span>
  `

  const headerElement = document.querySelector('header.header')
  if (headerElement && headerElement.parentNode) {
    headerElement.parentNode.insertBefore(bannerElement, headerElement.nextSibling)
  } else {
    document.body.insertBefore(bannerElement, document.body.firstChild)
  }

  setTimeout(() => {
    bannerElement.classList.add('fade-out')
    setTimeout(() => {
      bannerElement.remove()
    }, 500)
  }, 7000)
}
