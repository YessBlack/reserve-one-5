import { capitalize, formatPrice } from '../../../../shared/js/utils.js'

export const CatalogItemCard = (classItem) => {
  return `
    <div class="col-md-6 col-lg-3">
      <div class="card h-100 bg-white class-card">
        <div class="position-relative">
          <img src="${classItem.image}" class="card-img-top object-fit-cover bg-secondary bg-opacity-25"
            style="height: 180px;" alt="${classItem.title}">
        </div>
        <div class="card-body d-flex flex-column justify-content-between">
          <div>
            <h3 class="h5 fw-bold class-title mb-2">${capitalize(classItem.title)}</h3>
            <p class="card-text small text-secondary mb-3">${classItem.description}</p>
          </div>

          <div class="d-flex flex-column gap-2 fs-6">

          </div>

          <div>
            <hr class="text-muted opacity-25">
            <div class="d-flex justify-content-end gap-2">
              <button
                class="btn btn-outline-danger rounded-circle p-2 d-flex align-items-center justify-content-center edit-btn"
                style="width: 36px; height: 36px;" type="button" aria-label="Actualizar clase" title="Editar" data-id="${classItem.id}">
                <i class="fa-solid fa-pen small"></i>
              </button>
              <button
                class="btn btn-outline-danger rounded-circle p-2 d-flex align-items-center justify-content-center delete-btn"
                style="width: 36px; height: 36px;" type="button" aria-label="Eliminar clase" title="Eliminar" data-id="${classItem.id}">
                <i class="fa-solid fa-trash small"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}