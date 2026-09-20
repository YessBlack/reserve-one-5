const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

export const MembershipCard = (membership, index = 0) => {
  const tierClass = index === 0
    ? 'tier-kids'
    : index === 1
      ? 'tier-student'
      : 'tier-regular'
  const price = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0
  }).format(membership.price)

  return `
    <article class="membership-tier-card ${tierClass}">
      <div class="tier-header">
        <img src="/src/assets/LogoSinFondo.png" class="logo" alt="Logo Lan Hua">
        <h3 class="tier-name">${escapeHtml(membership.name)}</h3>
        <span class="tier-target">Mensualidad Lan Hua</span>
      </div>
      <div class="tier-pricing">
        <span class="currency">$</span><span class="price-amount">${price}</span>
      </div>
      <ul class="tier-benefits-list">
        <li><i class="fa-solid fa-check"></i> ${escapeHtml(membership.description)}</li>
      </ul>
      <button class="select-plan-trigger" data-membership-id="${escapeHtml(membership.id)}" data-plan="${escapeHtml(membership.name)}" data-price="${membership.price}">
        Elegir Plan
      </button>
    </article>
  `
}
