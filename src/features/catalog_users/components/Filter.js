import { schedulesService } from '../../../services/schedulesService.js'

let availableClasses = []

const normalizeValue = (value) => String(value ?? '').trim().toLowerCase()
const getClassTitle = (classItem) => classItem.catalog?.name ?? classItem.title ?? ''
const getClassDate = (classItem) => classItem.scheduleDate ?? classItem.date ?? ''

const getUniqueValues = (classes, property) => {
  if (!Array.isArray(classes)) return []
  return [...new Set(classes.map(property).map(normalizeValue).filter(Boolean))]
}

const renderFilterOptions = (classes) => {
  const titles = getUniqueValues(classes, getClassTitle)
  const titleSelect = document.querySelector('#filterTitle')

  titles.forEach(title => {
    const option = document.createElement('option')
    option.value = title
    option.textContent = title.charAt(0).toUpperCase() + title.slice(1)
    titleSelect.appendChild(option)
  })

  const levels = getUniqueValues(classes, classItem => classItem.level)
  const levelSelect = document.querySelector('#filterLevel')

  levels.forEach(level => {
    const option = document.createElement('option')
    option.value = level
    option.textContent = level.charAt(0).toUpperCase() + level.slice(1)
    levelSelect.appendChild(option)
  })

  const modalities = getUniqueValues(classes, classItem => classItem.modality)
  const modalitySelect = document.querySelector('#filterModality')

  modalities.forEach(modality => {
    const option = document.createElement('option')
    option.value = modality
    option.textContent = modality.charAt(0).toUpperCase() + modality.slice(1)
    modalitySelect.appendChild(option)
  })

  const locations = getUniqueValues(classes, classItem => classItem.location)
  const locationSelect = document.querySelector('#filterLocation')

  locations.forEach(location => {
    const option = document.createElement('option')
    option.value = location
    option.textContent = location
    locationSelect.appendChild(option)
  })
}

const filterClasses = (renderFilteredClasses) => {
  const titleFilter = document.querySelector('#filterTitle').value
  const levelFilter = document.querySelector('#filterLevel').value
  const modalityFilter = document.querySelector('#filterModality').value
  const locationFilter = document.querySelector('#filterLocation').value
  const dateFilter = document.querySelector('#filterDate').value

  const filteredClasses = availableClasses.filter(classItem => {
    const matchTitle = !titleFilter || normalizeValue(getClassTitle(classItem)) === titleFilter
    const matchLevel = !levelFilter || normalizeValue(classItem.level) === levelFilter
    const matchModality = !modalityFilter || normalizeValue(classItem.modality) === modalityFilter
    const matchLocation = !locationFilter || normalizeValue(classItem.location) === locationFilter
    const matchDate = !dateFilter || getClassDate(classItem).startsWith(dateFilter)

    return matchTitle && matchLevel && matchModality && matchLocation && matchDate
  })

  renderFilteredClasses(filteredClasses)
}

const clearFilters = (renderClasses) => {
  document.querySelector('#filterTitle').value = ''
  document.querySelector('#filterLevel').value = ''
  document.querySelector('#filterModality').value = ''
  document.querySelector('#filterLocation').value = ''
  document.querySelector('#filterDate').value = ''
  renderClasses()
}

const setupFilterListeners = (renderFilteredClasses, renderClasses) => {
  const filterInputs = [
    '#filterTitle',
    '#filterLevel',
    '#filterModality',
    '#filterLocation',
    '#filterDate'
  ]

  filterInputs.forEach(selector => {
    const element = document.querySelector(selector)
    if (element) {
      element.addEventListener('change', () => filterClasses(renderFilteredClasses))
    }
  })

  const clearBtn = document.querySelector('#clearFilters')
  if (clearBtn) {
    clearBtn.addEventListener('click', () => clearFilters(renderClasses))
  }
}

export const Filter = () => {
  return `
    <div class="filters-section mt-5">
      <div class="card p-4">
        <div class="row g-3">
          <div class="col-md-3">
            <label class="form-label small fw-bold">Tipo de Clase</label>
            <select class="form-select form-select-sm" id="filterTitle">
              <option value="">Todos</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label small fw-bold">Nivel</label>
            <select class="form-select form-select-sm" id="filterLevel">
              <option value="">Todos</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label small fw-bold">Modalidad</label>
            <select class="form-select form-select-sm" id="filterModality">
              <option value="">Todas</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label small fw-bold">Ubicación</label>
            <select class="form-select form-select-sm" id="filterLocation">
              <option value="">Todas</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label small fw-bold">Fecha</label>
            <input type="date" class="form-control form-control-sm" id="filterDate">
          </div>
          <div class="col-md-1 d-flex align-items-end">
            <button class="btn btn-sm w-100" id="clearFilters">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
}

export const initFilter = async (renderFilteredClasses, renderClasses) => {
  availableClasses = await schedulesService.getClasses()
  renderFilterOptions(availableClasses)
  setupFilterListeners(renderFilteredClasses, renderClasses)
}
