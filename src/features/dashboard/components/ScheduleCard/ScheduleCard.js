import { capitalize } from '../../../../shared/js/utils.js'

export const ScheduleCard = (classItem) => {
  const classId = classItem.idSchedule ?? classItem.id
  const className = classItem.catalog?.name ?? classItem.catalog?.title ?? classItem.title ?? 'Sin nombre'
  const assignedUser = classItem.user ?? classItem.professor
  const nestedProfessorName = [assignedUser?.nameUser, assignedUser?.lastNameUser].filter(Boolean).join(' ')
  const professorName = classItem.userName
    || nestedProfessorName
    || assignedUser?.name
    || (typeof classItem.professor === 'string' ? classItem.professor : '')

  return `
    <article class="class-card border">
      <div class="position-relative">
        <!-- La imagen personalizada del horario tiene prioridad sobre la del catálogo -->
        <img src="${classItem.image || classItem.catalog?.image || ''}" alt="${className}" class="card-img-top">
        <span class="badge position-absolute bottom-0 start-0 m-2 class-badge">${capitalize(classItem.level || '')}</span>
      </div>

      <div class="card-body p-3 d-flex flex-column gap-2">
        <!-- Aquí llamamos al nombre de la disciplina dentro del catálogo -->
        <h4 class="class-title h5 m-0 fw-bold">${capitalize(className)}</h4>

        <div class="d-flex flex-column gap-2 fs-6">

          <div class="class-item d-flex align-items-center gap-2">
            <i class="fa-solid fa-users" aria-hidden="true"></i>
            <span>${classItem.quotas} Cupos disponibles</span>
          </div>

          <div class="class-item d-flex align-items-center gap-2">
            <i class="fa-solid fa-calendar" aria-hidden="true"></i>
            <time datetime="${classItem.scheduleDate}" class="d-flex gap-1">
              <span>${classItem.scheduleDate}</span>
            </time>
          </div>

          <div class="class-item d-flex align-items-center gap-2">
            <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
            <span>Ubicación: ${classItem.location}</span>
          </div>

          <div class="class-item d-flex align-items-center gap-2">
            <i class="fa-solid fa-shoe-prints" aria-hidden="true"></i>
            <span>Modalidad: ${capitalize(classItem.modality)}</span>
          </div>

           <div class="class-item d-flex align-items-center gap-2">
            <i class="fa-solid fa-chalkboard-user" aria-hidden="true"></i>
            <span class="${professorName ? '' : 'text-warning fw-bold'}">Profesor: ${professorName || 'Sin asignar'}</span>
          </div>

        </div>
      
        <hr class="my-2 opacity-25">

        <div class="d-flex justify-content-end gap-2">
          <!-- Usamos idSchedule que es como viene en tu ResponseDto -->
          <button class="btn btn-action rounded-circle p-0 d-flex align-items-center justify-content-center edit-btn"
            type="button" aria-label="Actualizar clase" title="Actualizar" data-id="${classId}">
            <i class="fa-solid fa-pen"></i>
          </button>

          <button class="btn btn-action-danger rounded-circle p-0 d-flex align-items-center justify-content-center delete-btn"
            type="button" aria-label="Eliminar clase" title="Eliminar" data-id="${classId}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </article>
  `
}
