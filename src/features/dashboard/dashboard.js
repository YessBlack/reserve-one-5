import { Alert } from '../../shared/components/Alert/Alert.js'
import { setMinDateToday } from '../../shared/js/dateUtils.js'
import { ScheduleCard } from './components/ScheduleCard/ScheduleCard.js'
import { ScheduleModal } from './components/ScheduleModal/ScheduleModal.js'
import { schedulesService } from '../../services/schedulesService.js'
import { usersService } from '../../services/userService.js'
import { catalogService } from '../../services/catalogService.js'
import { fileToBase64 } from '../../shared/js/utils.js'
import api from '../../services/axiosConfig.js'

let form

const getClasses = async () => {
  return await schedulesService.getClasses()
}

const deleteClass = async (id) => {
  const success = await schedulesService.deleteClass(id)

  if (success) {
    await renderClasses()
    Swal.fire({
      icon: 'success',
      title: 'Eliminado',
      text: 'La clase se eliminó correctamente.',
      timer: 1500,
      showConfirmButton: false
    })
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo eliminar la clase del servidor.'
    })
  }
}

let catalogItems = []
let dashboardClasses = []
let selectedCatalogId = 'all'
let professorUsers = []

const renderModalContentForm = (professors, catalogs) => {
  const modal = document.querySelector('#staticBackdrop')
  modal.innerHTML = ScheduleModal(null, professors, catalogs)
}

const getProfessors = async () => {
  const users = await usersService.getAllUsersFromApi()
  professorUsers = users.filter((user) => (user.nameRol ?? '').toUpperCase() === 'ADMIN')
  return professorUsers
}

const getCatalogItems = async () => catalogService.getItemsCatalog()

const getCatalogImage = (catalogId) => {
  const catalog = catalogItems.find((item) => String(item.id) === String(catalogId))
  return catalog?.image ?? ''
}

const updateCatalogImagePreview = () => {
  const preview = document.querySelector('#catalogImagePreview')
  if (!preview) return

  const image = form.dataset.currentImage || getCatalogImage(form.idCatalog.value)
  preview.src = image
  preview.classList.toggle('d-none', !image)
}

const setupImagePreview = () => {
  form.idCatalog.addEventListener('change', updateCatalogImagePreview)
  form.image.addEventListener('change', () => {
    const file = form.image.files[0]
    const preview = document.querySelector('#catalogImagePreview')
    if (!file || !preview) {
      updateCatalogImagePreview()
      return
    }

    preview.src = URL.createObjectURL(file)
    preview.classList.remove('d-none')
  })
  updateCatalogImagePreview()
}

const getClassCatalogId = (classItem) => classItem.idCatalog
  ?? classItem.catalogId
  ?? classItem.catalog?.idCatalog
  ?? classItem.catalog?.id

const getClassUserId = (classItem) => classItem.idUser
  ?? classItem.userId
  ?? classItem.user?.idUser
  ?? classItem.professor?.idUser

const enrichClassProfessor = (classItem) => {
  const existingProfessorName = classItem.userName
    || classItem.user?.nameUser
    || classItem.user?.name
    || classItem.professor?.nameUser
    || classItem.professor?.name
  if (existingProfessorName) return classItem

  const professor = professorUsers.find((user) => String(user.idUser) === String(getClassUserId(classItem)))
  return professor ? { ...classItem, user: professor } : classItem
}

const renderSchedulesLoading = () => {
  const loadingMarkup = `
    <div class="schedule-loading" role="status" aria-live="polite">
      <div class="schedule-loading__spinner" aria-hidden="true"></div>
      <span>Cargando horarios...</span>
    </div>
  `
  document.querySelector('#schedules-grupal').innerHTML = loadingMarkup
  document.querySelector('#schedules-individual').innerHTML = loadingMarkup
}

const renderDisciplinesLoading = () => {
  const container = document.querySelector('#dashboardDisciplinesContainer')
  if (!container) return

  container.innerHTML = `
    <div class="schedule-loading discipline-loading" role="status" aria-live="polite">
      <div class="schedule-loading__spinner" aria-hidden="true"></div>
      <span>Cargando disciplinas y programas...</span>
    </div>
  `
}

const waitForRender = () => new Promise((resolve) => requestAnimationFrame(resolve))

const renderClasses = async (classes = null) => {
  const grupalContainer = document.querySelector('#schedules-grupal')
  const individualContainer = document.querySelector('#schedules-individual')

  if (!grupalContainer || !individualContainer) return

  renderSchedulesLoading()
  await waitForRender()

  dashboardClasses = (classes ?? await getClasses()).map(enrichClassProfessor)
  const visibleClasses = selectedCatalogId === 'all'
    ? dashboardClasses
    : dashboardClasses.filter((classItem) => String(getClassCatalogId(classItem)) === String(selectedCatalogId))

  grupalContainer.innerHTML = ''
  individualContainer.innerHTML = ''

  if (visibleClasses.length === 0) {
    grupalContainer.innerHTML = Alert({
      variant: 'info',
      title: selectedCatalogId === 'all' ? 'Aún no tienes horarios agregados' : 'No hay horarios para este programa',
      text: selectedCatalogId === 'all' ? 'Haz clic en "Agregar Horario" para crear el primero.' : 'Selecciona otro programa para ver sus horarios.'
    })
    individualContainer.innerHTML = ''
    return
  }

  visibleClasses.forEach(classItem => {
    const modalidad = classItem.modality ? classItem.modality.toLowerCase() : 'grupal'

    if (modalidad === 'grupal') {
      grupalContainer.innerHTML += ScheduleCard(classItem)
    } else {
      individualContainer.innerHTML += ScheduleCard(classItem)
    }
  })

  if (grupalContainer.innerHTML === '') {
    grupalContainer.innerHTML = '<p class="text-muted small">No hay clases grupales registradas.</p>'
  }
  if (individualContainer.innerHTML === '') {
    individualContainer.innerHTML = '<p class="text-muted small">No hay clases individuales registradas.</p>'
  }
}

const resetFormState = () => {
  form.reset()
  delete form.dataset.editId
  delete form.dataset.currentImage
  form.image.required = false
  updateCatalogImagePreview()
  document.querySelector('#staticBackdropLabel').textContent = 'Agregar Horario'

  const submitBtn = document.querySelector('#addSchedule')
  submitBtn.textContent = 'Agregar Horario'
}

const setSelectValue = (select, value, label = value) => {
  if (!value) {
    const matchingOption = Array.from(select.options).find(option =>
      label && option.textContent.trim().toLowerCase() === String(label).trim().toLowerCase()
    )
    select.value = matchingOption ? matchingOption.value : ''
    return
  }

  const optionExists = Array.from(select.options).some(option => String(option.value) === String(value))

  if (!optionExists) {
    const option = document.createElement('option')
    option.value = value
    option.textContent = label
    option.selected = true
    select.add(option)
  } else {
    select.value = value
  }
}

const normalizeId = (value) => {
  if (value === undefined || value === null || value === '') return value
  return /^\d+$/.test(String(value)) ? Number(value) : value
}

const fillFormForEdit = (classToEdit, classId) => {
  const modality = classToEdit.modality?.toLowerCase() ?? 'grupal'
  const level = classToEdit.level?.toLowerCase() ?? ''
  setSelectValue(form.modality, modality)

  const catalogId = classToEdit.idCatalog ?? classToEdit.catalogId ?? classToEdit.catalog?.idCatalog ?? classToEdit.catalog?.id
  const catalogName = classToEdit.catalog?.name ?? classToEdit.catalog?.title ?? 'Disciplina actual'
  setSelectValue(form.idCatalog, catalogId, catalogName)
  setSelectValue(form.level, level)
  form.quotas.value = classToEdit.quotas ?? classToEdit.capacity ?? ''
  setSelectValue(form.location, classToEdit.location)
  const userId = classToEdit.idUser ?? classToEdit.userId ?? classToEdit.user?.idUser ?? classToEdit.user?.id ?? classToEdit.professor?.idUser ?? classToEdit.professor?.id
  const assignedUser = classToEdit.user ?? classToEdit.professor ?? {}
  const userName = classToEdit.userName
    || [assignedUser.nameUser, assignedUser.lastNameUser].filter(Boolean).join(' ')
    || assignedUser.name
    || ''
  setSelectValue(form.idUser, userId, userName)
  form.dataset.currentImage = classToEdit.image ?? classToEdit.catalog?.image ?? getCatalogImage(catalogId)

  const scheduleDate = classToEdit.date ?? classToEdit.scheduleDate ?? ''
  form.scheduleDate.value = scheduleDate.replace(' ', 'T').slice(0, 16)
  form.dataset.editId = classId

  form.image.required = false
  document.querySelector('#staticBackdropLabel').textContent = 'Actualizar Horario'

  const submitBtn = document.querySelector('#addSchedule')
  submitBtn.textContent = 'Actualizar Horario'
  submitBtn.disabled = !form.checkValidity()
}

const handleSubmitSchedule = () => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault()

    const submitButton = document.querySelector('#addSchedule')
    if (submitButton.disabled) return

    const originalButtonText = submitButton.textContent
    submitButton.disabled = true
    submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1" aria-hidden="true"></i> Guardando...'

    try {
      const formData = new FormData(form)
      const schedule = Object.fromEntries(formData)
      const editId = form.dataset.editId
      const imageFile = form.image.files[0]
      const image = imageFile && imageFile.size > 0
        ? await fileToBase64(imageFile)
        : form.dataset.currentImage || getCatalogImage(schedule.idCatalog)

      const scheduleData = {
        idCatalog: normalizeId(schedule.idCatalog),
        level: schedule.level,
        quotas: Number(schedule.quotas),
        scheduleDate: schedule.scheduleDate,
        location: schedule.location,
        modality: schedule.modality,
        idUser: normalizeId(schedule.idUser),
        image
      }

      if (editId) {
        await api.put(`/schedules/${editId}`, scheduleData)
      } else {
        await api.post('/schedules', scheduleData)
      }

      await renderClasses()

      Swal.fire({
        icon: 'success',
        title: editId ? 'Horario Actualizado' : 'Horario agregado',
        text: editId ? 'El horario se actualizó correctamente.' : 'El horario se agregó correctamente.',
        timer: 1500,
        showConfirmButton: false
      })

      const modalElement = document.querySelector('#staticBackdrop')
      const bootstrapModal = bootstrap.Modal.getOrCreateInstance(modalElement)
      bootstrapModal.hide()
    } catch (error) {
      const serverError = error.response?.data
      const responseMessage = typeof serverError === 'string' ? serverError.trim() : ''
      const errorMessage = responseMessage || serverError?.message || serverError?.error || `Error HTTP ${error.response?.status || 'desconocido'}`

      console.error('Error guardando el horario:', errorMessage, serverError)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage
      })
    } finally {
      submitButton.disabled = false
      submitButton.textContent = originalButtonText
    }
  })
}

const validateForm = () => {
  const addSchedule = document.querySelector('#addSchedule')
  if (!addSchedule) return

  form.addEventListener('input', () => {
    addSchedule.disabled = !form.checkValidity()
  })

  form.addEventListener('change', () => {
    addSchedule.disabled = !form.checkValidity()
  })
}

const setupModalReset = () => {
  const modalElement = document.querySelector('#staticBackdrop')
  if (modalElement) {
    modalElement.addEventListener('hidden.bs.modal', resetFormState)
  }
}

const setupEventListeners = () => {
  const cardsContainers = document.querySelectorAll('.cards')

  cardsContainers.forEach(container => {
    container.addEventListener('click', async (event) => {
      const deleteBtn = event.target.closest('.delete-btn')
      if (deleteBtn) {
        const classId = deleteBtn.getAttribute('data-id')
        Swal.fire({
          title: '¿Estás seguro?',
          text: '¿Estás seguro de que deseas eliminar esta clase?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'Cancelar',
          customClass: {
            confirmButton: 'btn btn-primary px-3',
            cancelButton: 'btn btn-secondary px-3'
          }
        }).then(async (result) => {
          if (result.isConfirmed) {
            await deleteClass(classId)
          }
        })
        return
      }

      const editBtn = event.target.closest('.edit-btn')
      if (editBtn) {
        const classId = editBtn.getAttribute('data-id')
        const currentClasses = await getClasses()
        const classToEdit = currentClasses.find(c => String(c.idSchedule ?? c.id) === String(classId))

        if (classToEdit) {
          fillFormForEdit(classToEdit, classId)

          const modalElement = document.querySelector('#staticBackdrop')
          const bootstrapModal = bootstrap.Modal.getOrCreateInstance(modalElement)
          bootstrapModal.show()
        }
      }
    })
  })
}

const renderDashboardDisciplines = async () => {
  const container = document.querySelector('#dashboardDisciplinesContainer')
  if (!container) return

  try {
    const programs = catalogItems

    container.innerHTML = ''

    if (programs.length === 0) {
      container.innerHTML = '<p class="text-muted small">No hay disciplinas o programas registrados.</p>'
      return
    }

    container.innerHTML += `
      <div class="col-md-6 col-lg-4">
        <button type="button" class="catalog-filter-card w-100 border-0 p-0 bg-transparent text-start" data-catalog-id="all">
          <div class="catalog-filter-option">
            <div class="d-flex align-items-center gap-3">
              <div class="rounded-circle bg-warning text-dark d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                <i class="fa-solid fa-layer-group" aria-hidden="true"></i>
              </div>
              <div>
                <h5 class="h6 mb-1 text-warning text-uppercase fw-bold">Todos</h5>
                <p class="small text-light mb-0">Mostrar todos los horarios</p>
              </div>
            </div>
          </div>
        </button>
      </div>
    `

    programs.forEach(program => {
      const programTitle = program.title ?? 'Programa sin nombre'

      container.innerHTML += `
        <div class="col-md-6 col-lg-4">
          <button type="button" class="catalog-filter-card w-100 border-0 p-0 bg-transparent text-start" data-catalog-id="${program.id}">
            <div class="catalog-filter-option">
              <div class="d-flex align-items-center gap-3">
                <img src="${program.image || '../../assets/lanhua-banner-1.png'}" alt="${programTitle}" class="rounded-circle object-fit-cover bg-secondary" style="width: 50px; height: 50px;">
                <div>
                  <h5 class="h6 mb-1 text-warning text-uppercase fw-bold">${programTitle}</h5>
                  <p class="catalog-description small text-light mb-0" style="font-size: 12px;">${program.description || ''}</p>
                </div>
              </div>
            </div>
          </button>
        </div>
      `
    })

    container.addEventListener('click', async (event) => {
      const filterButton = event.target.closest('[data-catalog-id]')
      if (!filterButton) return

      selectedCatalogId = filterButton.dataset.catalogId
      await renderClasses(dashboardClasses)
    })
  } catch (error) {
    console.error('Error cargando disciplinas:', error)
    container.innerHTML = '<p class="text-danger small">Error al conectar con el servidor para cargar las disciplinas.</p>'
  }
}

const initDashboard = async () => {
  renderDisciplinesLoading()
  const [professors, catalogs] = await Promise.all([getProfessors(), getCatalogItems()])
  catalogItems = catalogs
  renderModalContentForm(professors, catalogs)

  form = document.querySelector('#scheduleForm')

  if (form) {
    await renderClasses()
    setupEventListeners()
    setupModalReset()
    setMinDateToday('#scheduleDate')
    handleSubmitSchedule()
    validateForm()
    setupImagePreview()
  }

  renderDashboardDisciplines()
}

initDashboard()
