/* eslint-disable no-undef */
import { Alert } from '../../shared/components/Alert/Alert.js'
import { fileToBase64 } from '../../shared/js/utils.js'
import { catalogService } from '../../services/catalogService.js'
import { CatalogItemCard } from './components/CatalogItemCard/CatalogItemCard.js'
import { CatalogItemModal } from './components/CatalogItemModal/CatalogItemModal.js'

// elements
const modalElement = document.querySelector('#catalogModal')
const catalogContainer = document.querySelector('#catalogContainer')
const bootstrapModal = bootstrap.Modal.getOrCreateInstance(modalElement)

let form
let catalogItems = []

// CRUD
const getItemsCatalog = async () => {
  catalogItems = await catalogService.getItemsCatalog()
  return catalogItems
}

const showCatalogError = (error) => {
  const status = error.response?.status
  const text = status === 403
    ? 'Tu sesión no tiene permisos para administrar el catálogo. Inicia sesión nuevamente con una cuenta ADMIN.'
    : 'No fue posible completar la operación. Intenta nuevamente.'

  Swal.fire({
    icon: 'error',
    title: 'Error en el catálogo',
    text
  })
}

// renders
const renderItemsCatalog = async () => {
  catalogContainer.innerHTML = `
    <div class="catalog-loading" role="status" aria-live="polite">
      <div class="catalog-loading__spinner" aria-hidden="true"></div>
      <span>Cargando programas...</span>
    </div>
  `

  const programs = await getItemsCatalog()

  catalogContainer.innerHTML = ''

  if (programs.length === 0) {
    catalogContainer.innerHTML = Alert({
      variant: 'info',
      title: 'Aún no tienes programas agregados',
      text: 'Haz clic en "Agregar Programa" para crear el primero.'
    })
    return
  }

  programs.forEach(item => {
    catalogContainer.innerHTML += CatalogItemCard(item)
  })
}

const renderModalContentForm = (item = null) => {
  modalElement.innerHTML = CatalogItemModal(item)
  form = document.querySelector('#catalogForm')

  if (item) {
    form.dataset.editId = item.id
  }

  form.addEventListener('submit', handleSubmit)
  validateForm()
}

// form: create / edit / reset
const resetFormState = () => {
  renderModalContentForm()
}

const validateForm = () => {
  const addCatalogItem = document.querySelector('#addCatalogItem')

  const updateButtonState = () => {
    addCatalogItem.disabled = !form.checkValidity()
  }

  updateButtonState()

  form.addEventListener('input', updateButtonState)
  form.addEventListener('change', updateButtonState)
}

// handles
const handleCreate = async () => {
  const imageFile = form.image.files[0]
  const imageBase64 = await fileToBase64(imageFile)

  const payload = {
    name: form.title.value.toLowerCase(),
    description: form.description.value,
    image: imageBase64
  }

  await catalogService.createItemCatalog(payload)

  Swal.fire({
    icon: 'success',
    title: 'Programa agregado',
    text: 'El programa se agregó correctamente.',
    timer: 1500,
    showConfirmButton: false
  })

  return true
}

const handleEdit = async (editId) => {
  const imageFile = form.image.files[0]
  const currentItem = catalogItems.find(item => String(item.id) === String(editId))

  const updatedItem = {
    name: form.title.value.toLowerCase(),
    description: form.description.value,
    image: currentItem?.image
  }

  if (imageFile && imageFile.size > 0) {
    updatedItem.image = await fileToBase64(imageFile)
  }

  await catalogService.updateItemCatalog(editId, updatedItem)

  Swal.fire({
    icon: 'success',
    title: 'Programa actualizado',
    text: 'El programa se actualizó correctamente.',
    timer: 1500,
    showConfirmButton: false
  })

  return true
}

const handleDelete = async (id) => {
  const result = await Swal.fire({
    title: '¿Estás seguro?',
    text: '¿Estás seguro de que deseas eliminar este programa?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    customClass: {
      confirmButton: 'btn btn-primary px-3',
      cancelButton: 'btn btn-secondary px-3'
    }
  })

  if (!result.isConfirmed) return

  try {
    await catalogService.deleteItemCatalog(id)
    await renderItemsCatalog()

    Swal.fire({
      icon: 'success',
      title: 'Eliminado',
      text: 'El programa se eliminó correctamente.',
      timer: 1500,
      showConfirmButton: false
    })
  } catch (error) {
    showCatalogError(error)
  }
}

const handleSubmit = async (e) => {
  e.preventDefault()

  const editId = form.dataset.editId
  let saved = false

  try {
    if (editId) {
      saved = await handleEdit(editId)
    } else {
      saved = await handleCreate()
    }
  } catch (error) {
    showCatalogError(error)
  }

  if (!saved) return

  bootstrapModal.hide()
  await renderItemsCatalog()
}

// listeners
const setupModalReset = () => {
  modalElement.addEventListener('hidden.bs.modal', resetFormState)
}

const setupEventListeners = () => {
  catalogContainer.addEventListener('click', (event) => {
    const deleteBtn = event.target.closest('.delete-btn')
    if (deleteBtn) {
      handleDelete(deleteBtn.dataset.id)
      return
    }

    const editBtn = event.target.closest('.edit-btn')

    if (editBtn) {
      const item = catalogItems.find(i => String(i.id) === editBtn.dataset.id)

      renderModalContentForm(item)
      bootstrapModal.show()
    }
  })

}

// init
const init = async () => {
  renderModalContentForm()
  await renderItemsCatalog()
  setupEventListeners()
  setupModalReset()
  validateForm()
}

init()