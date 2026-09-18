export const CatalogItemModal = (item = null) => {
  const isEditMode = Boolean(item)
  const categories = Array.isArray(item?.category) ? item.category : [item?.category]
  const hasCategory = (category) => categories.includes(category)

  return `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h1 class="modal-title fs-5" id="staticBackdropLabel">${isEditMode ? 'Editar' : 'Agregar'} Programa de Clases</h1>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>

        <div class="modal-body">
          <form id="catalogForm" data-edit-id="${item?.id ?? ''}">
            <div class="mb-3">
              <label for="title" class="form-label fw-semibold small">Nombre de la Clase / Programa</label>
              <input type="text" class="form-control" id="title" name="title" placeholder="Ej. Combate Deportivo" value="${item?.title ?? ''}" required>
            </div>
            <div class="mb-3">
              <label for="description" class="form-label fw-semibold small">Descripción</label>
              <textarea class="form-control" id="description" name="description" rows="3" placeholder="Breve detalle del programa..." required>${item?.description ?? ''}</textarea>
            </div>
            <div class="mb-3">
              <label for="category" class="form-label fw-semibold small">Categoría</label>
              <select class="form-select" id="category" name="category" required>
                <option value="" ${!item?.category ? 'selected' : ''} disabled>Selecciona una categoría</option>
                <option value="Membresía" ${hasCategory('Membresía') ? 'selected' : ''}>Membresía</option>
                <option value="Clase" ${hasCategory('Clase') ? 'selected' : ''}>Clase</option>
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
                ${isEditMode ? '' : 'required'}
              />
              <small id="imageHelpText" class="text-muted ${isEditMode ? '' : 'd-none'}">Si no deseas cambiar la imagen, puedes dejar este campo vacío</small>
            </div>
            <div class="d-flex justify-content-end gap-2 pt-2">
              <button type="submit" class="btn btn-primary" id="addCatalogItem">${isEditMode ? 'Guardar Cambios' : 'Guardar Programa'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
}