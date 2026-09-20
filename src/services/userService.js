import { cleanPayload } from '../shared/js/utils.js'
import api from './axiosConfig.js'

const SESSION_KEY = 'lanhua_session'
const TOKEN_KEY = 'lanhua_token'

const ROLE_ID_BY_NAME = {
  ADMIN: 1,
  CLIENT: 2
}

const getCurrentUserIdFromSession = () => {
  const sessionRaw = window.localStorage.getItem(SESSION_KEY)
  if (!sessionRaw) return null

  const { id, idUser } = JSON.parse(sessionRaw)
  return idUser ?? id ?? null
}

const resolveIdRol = (user, session) => {
  if (user?.idRol != null) return Number(user.idRol)

  const roleName = (user?.nameRol || session?.role || '').toUpperCase()
  if (ROLE_ID_BY_NAME[roleName] != null) return ROLE_ID_BY_NAME[roleName]

  return 2
}

const buildBasicUserPayload = (user, session, { nameUser, lastNameUser }) => {
  const payload = {
    nameUser: String(nameUser).trim(),
    lastNameUser: String(lastNameUser).trim(),
    emailUser: user.emailUser,
    idRol: resolveIdRol(user, session)
  }

  if (user.passwordUser) {
    payload.passwordUser = user.passwordUser
  }

  return payload
}

const buildExtendedInformationPayload = (idUser, information, changes) => {
  const payload = {
    idUser: Number(idUser),
    numberDni: cleanPayload(changes.numberDni),
    address: cleanPayload(changes.address),
    userPhone: cleanPayload(changes.userPhone),
    contactName: cleanPayload(changes.contactName),
    kinship: cleanPayload(changes.kinship),
    contactPhone: cleanPayload(changes.contactPhone),
    eps: cleanPayload(changes.eps),
    rh: cleanPayload(changes.rh),
    medicConditions: cleanPayload(changes.medicConditions)
  }

  if (changes.dateEps) {
    payload.dateEps = changes.dateEps
  }

  if (information?.idUserInformation != null) {
    payload.idUserInformation = Number(information.idUserInformation)
  }

  payload.documentUrl = changes.documentUrl ?? information?.documentUrl ?? ''
  payload.epsUrl = changes.epsUrl ?? information?.epsUrl ?? ''

  return payload
}

const getAllUsersFromApi = async () => {
  try {
    const response = await api.get('/users')
    return Array.isArray(response.data) ? response.data : (response.data.content || [])
  } catch (error) {
    console.error('Error obteniendo los usuarios:', error)
    return []
  }
}

const createAdminFromApi = async ({ nameUser, lastNameUser, emailUser, passwordUser }) => {
  const response = await api.post('/users', {
    nameUser: String(nameUser).trim(),
    lastNameUser: String(lastNameUser).trim(),
    emailUser: String(emailUser).trim(),
    passwordUser,
    idRol: ROLE_ID_BY_NAME.ADMIN
  })

  return response.data
}

const updateAdminFromApi = async (idUser, { nameUser, lastNameUser, emailUser }) => {
  const response = await api.put(`/users/${idUser}`, {
    nameUser: String(nameUser).trim(),
    lastNameUser: String(lastNameUser).trim(),
    emailUser: String(emailUser).trim(),
    idRol: ROLE_ID_BY_NAME.ADMIN
  })

  return response.data
}

const deleteUserFromApi = async (idUser) => {
  await api.delete(`/users/${idUser}`)
}

const getCurrentUserFromApi = async () => {
  const currentUserId = getCurrentUserIdFromSession()
  if (!currentUserId) return null

  try {
    const response = await api.get(`/users/${currentUserId}`)
    return response.data
  } catch (error) {
    console.error('Error obteniendo el usuario autenticado:', error)
    return null
  }
}

const getCurrentUserInformationFromApi = async () => {
  const currentUserId = getCurrentUserIdFromSession()
  if (!currentUserId) return null

  try {
    const response = await api.get(`/user-information/${currentUserId}`)
    return response.status === 204 ? null : response.data
  } catch (error) {
    if (error.response?.status === 404) return null
    console.error('Error obteniendo la información personal:', error)
    return null
  }
}

const updateBasicUserFromApi = async (user, session, { nameUser, lastNameUser }) => {
  const idUser = user?.idUser ?? getCurrentUserIdFromSession()
  if (!idUser) {
    throw new Error('No se encontró el identificador del usuario.')
  }

  const response = await api.put(
    `/users/${idUser}`,
    buildBasicUserPayload(user, session, { nameUser, lastNameUser })
  )

  return response.data
}

const saveExtendedUserInformationFromApi = async (user, information, extendedChanges) => {
  const idUser = user?.idUser ?? getCurrentUserIdFromSession()
  if (!idUser) {
    throw new Error('No se encontró el identificador del usuario.')
  }

  const payload = buildExtendedInformationPayload(idUser, information, extendedChanges)
  const response = await api.post('/user-information', payload)
  return response.data
}

const updateCurrentUserFromApi = async (user, information, formChanges) => {
  const sessionRaw = window.localStorage.getItem(SESSION_KEY)
  if (!sessionRaw) return { success: false, message: 'Sesión no encontrada.' }

  const session = JSON.parse(sessionRaw)

  const {
    nameUser = user.nameUser,
    lastNameUser = user.lastNameUser,
    ...extendedChanges
  } = formChanges || {}

  let updatedUser = user

  try {
    updatedUser = await updateBasicUserFromApi(user, session, { nameUser, lastNameUser })
    syncSessionProfile(nameUser, lastNameUser)
  } catch (error) {
    console.error('Error actualizando datos básicos del usuario:', error)
    return {
      success: false,
      step: 'user',
      message: error.response?.data?.message
        || error.response?.data?.error
        || 'No fue posible actualizar nombre y apellido.'
    }
  }

  try {
    const updatedInformation = await saveExtendedUserInformationFromApi(
      updatedUser,
      information,
      extendedChanges
    )

    return {
      success: true,
      user: updatedUser,
      information: updatedInformation
    }
  } catch (error) {
    console.error('Error guardando información extendida:', error)

    const status = error.response?.status
    let message = error.response?.data?.message
      || error.response?.data?.error
      || 'No fue posible guardar la información adicional.'

    if (status === 403) {
      message = 'El servidor rechazó guardar la información adicional (403). '
        + 'Nombre y apellido sí se guardaron. En Spring Security, el rol CLIENT debe poder hacer POST a /api/user-information con su propio idUser.'
    }

    return {
      success: false,
      step: 'information',
      partial: true,
      user: updatedUser,
      message
    }
  }
}

const syncSessionProfile = (nameUser, lastNameUser) => {
  const sessionRaw = window.localStorage.getItem(SESSION_KEY)
  if (!sessionRaw) return

  const session = JSON.parse(sessionRaw)
  session.nombre = nameUser
  session.apellido = lastNameUser
  session.nameUser = nameUser
  session.lastNameUser = lastNameUser
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

const logout = () => {
  window.localStorage.removeItem(SESSION_KEY)
}

const getSession = () => {
  const session =
    localStorage.getItem(SESSION_KEY) ||
    sessionStorage.getItem(SESSION_KEY)

  if (!session) return null

  try {
    return JSON.parse(session)
  } catch (e) {
    return null
  }
}

const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 <= Date.now() : false
  } catch {
    return true
  }
}

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null
}

export const isAuthenticated = () => {
  const session = getSession()
  if (!session || !(session.idUser ?? session.id)) return false

  const token = getToken()
  return Boolean(token) && !isTokenExpired(token)
}

export const usersService = {
  getAllUsersFromApi,
  createAdminFromApi,
  updateAdminFromApi,
  deleteUserFromApi,
  getCurrentUserFromApi,
  getCurrentUserInformationFromApi,
  updateBasicUserFromApi,
  saveExtendedUserInformationFromApi,
  updateCurrentUserFromApi,
  syncSessionProfile,
  logout,
  getToken,
  getSession,
  isAuthenticated
}
