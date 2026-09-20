const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

export const ScheduleModal = (schedule = null, professors = [], catalogs = []) => {
  const professorOptions = professors.map((professor) => {
    const fullName = [professor.nameUser, professor.lastNameUser].filter(Boolean).join(' ')
    return `<option value="${escapeHtml(professor.idUser)}">${escapeHtml(fullName)}</option>`
  }).join('')
  const catalogOptions = catalogs.map((catalog) => (
    `<option value="${escapeHtml(catalog.id)}">${escapeHtml(catalog.title)}</option>`
  )).join('')

  return `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h1 class="modal-title fs-5" id="staticBackdropLabel">${schedule ? 'Actualizar Horario' : 'Agregar Horario'}</h1>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>

        <div class="modal-body">
          <form id="scheduleForm">
            <div class="mb-3">
              <label for="modality" class="form-label fw-semibold small">Modalidad</label>
              <select class="form-select" id="modality" name="modality" required>
                <option value="" selected disabled>Selecciona una modalidad</option>
                <option value="grupal" ${schedule?.modality === 'grupal' ? 'selected' : ''}>Clase Grupal</option>
                <option value="personalizada" ${schedule?.modality === 'personalizada' ? 'selected' : ''}>Clase Individual</option>
              </select>
            </div>

            <div class="mb-3">
              <!-- Cambiamos el name/id a idCatalog para que coincida con el backend -->
              <label for="idCatalog" class="form-label fw-semibold small">Disciplina / Catálogo</label>
              <select class="form-select" id="idCatalog" name="idCatalog" required>
                <option value="" selected disabled>Selecciona una disciplina</option>
                ${catalogOptions}
              </select>
            </div>

            <div class="mb-3">
              <label for="level" class="form-label fw-semibold small">Nivel</label>
              <select class="form-select" id="level" name="level" required>
                <option value="" selected disabled>Selecciona un nivel</option>
                <option value="principiante">Principiante</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </div>

            <div class="mb-3">
              <!-- Cambiado a quotas para que coincida con tu entidad y DTO -->
              <label for="quotas" class="form-label fw-semibold small">Cupos</label>
              <input type="number" class="form-control" id="quotas" name="quotas" placeholder="Ej. 10" min="1" required>
            </div>

            <div class="mb-3">
              <label for="location" class="form-label fw-semibold small">Ubicación</label>
              <select class="form-select" id="location" name="location" required>
                <option value="Sede Laureles">Sede Laureles</option>
                <option value="Sede Monterrey">Sede Monterrey</option>
                <option value="Sede Haru no Hinata">Sede Haru no Hinata</option>
              </select>
            </div>

            <div class="mb-3">
              <label for="idUser" class="form-label fw-semibold small">Profesor Asignado</label>
              <select class="form-select" id="idUser" name="idUser" required>
                <option value="" selected disabled>Selecciona un profesor</option>
                ${professorOptions}
              </select>
            </div>

            <div class="mb-3">
              <label for="image" class="form-label fw-semibold small">Imagen</label>
              <input
                type="file"
                class="form-control"
                id="image"
                name="image"
                accept="image/*"
              />
              <small class="form-text text-muted">Opcional. Si no seleccionas una imagen, se usará la del catálogo.</small>
              <img id="catalogImagePreview" class="img-fluid rounded mt-2 d-none" alt="Vista previa de la imagen" style="max-height: 160px;">
            </div>

            <div class="row">
              <div class="col-md-12 mb-3">
                <label for="scheduleDate" class="form-label fw-semibold small">Fecha y Hora</label>
                <input type="datetime-local" class="form-control" id="scheduleDate" name="scheduleDate" required>
              </div>
            </div>

            <div class="d-flex justify-content-end gap-2 pt-2">
              <button type="submit" class="btn btn-primary" id="addSchedule">Guardar Horario</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
}
