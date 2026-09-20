import api from './axiosConfig.js'

const mapCatalogItem = (item = {}) => ({
  id: item.idCatalog ?? item.id,
  title: item.name ?? item.title,
  description: item.description,
  image: item.image
})

export const catalogService = {
  getItemsCatalog: async () => {
    try {
      const response = await api.get('/catalog')
      const items = Array.isArray(response.data) ? response.data : (response.data.content || [])
      return items.map(mapCatalogItem)
    } catch (error) {
      console.error('Error obteniendo programas:', error)
      return []
    }
  },

  createItemCatalog: async (item) => {
    try {
      const response = await api.post('/catalog', item)
      return mapCatalogItem(response.data)
    } catch (error) {
      console.error('Error creando programa:', error)
      throw error
    }
  },

  updateItemCatalog: async (id, item) => {
    try {
      const response = await api.put(`/catalog/${id}`, item)
      return mapCatalogItem(response.data)
    } catch (error) {
      console.error('Error actualizando programa:', error)
      throw error
    }
  },

  deleteItemCatalog: async (id) => {
    try {
      await api.delete(`/catalog/${id}`)
      return true
    } catch (error) {
      console.error('Error eliminando programa:', error)
      throw error
    }
  }
}