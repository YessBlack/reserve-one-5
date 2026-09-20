import api from './axiosConfig.js'

const mapMembership = (membership = {}) => ({
  id: membership.id
    ?? membership.idMembership
    ?? membership.membershipId
    ?? membership.membership?.id,
  name: membership.name,
  description: membership.description,
  price: Number(membership.price ?? 0),
  createdAt: membership.createdAt,
  updatedAt: membership.updatedAt
})

export const membershipService = {
  getMemberships: async () => {
    const response = await api.get('/memberships')
    const memberships = Array.isArray(response.data)
      ? response.data
      : (response.data.content || response.data.data || [])

    return memberships.map(mapMembership).filter((membership) => membership.id != null)
  }
}
