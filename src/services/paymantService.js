import api from "./axiosConfig.js";

export const PAYMENT_STATUS = Object.freeze({
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  PAID: "PAID",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
  TIMEOUT: "TIMEOUT",
});

export const FINAL_STATUSES = [
  PAYMENT_STATUS.PAID,
  PAYMENT_STATUS.REJECTED,
  PAYMENT_STATUS.CANCELLED,
  PAYMENT_STATUS.EXPIRED,
];


async function request(path, options = {}) {
  try {
    const response = await api.request({
      url: path,
      method: options.method || "GET",
      data: options.body ? JSON.parse(options.body) : undefined,
      headers: options.headers,
    });
    return response.data;
  } catch (err) {
    const details = err.response?.data ?? null;
    const message = typeof details === "string"
      ? details
      : details?.message || details?.error || err.message || `Error en ${path}`;
    const error = new Error(message);
    error.status = err.response?.status;
    error.details = details;
    throw error;
  }
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        reject(new DOMException("Cancelado", "AbortError"));
      },
      { once: true }
    );
  });
}

function createPayment({ idMembership }) {
  const membershipId = Number(idMembership)
  if (!Number.isInteger(membershipId) || membershipId <= 0) {
    const error = new Error('La membresía seleccionada no tiene un identificador válido.')
    error.code = 'INVALID_MEMBERSHIP_ID'
    throw error
  }

  return request("/payments", {
    method: "POST",
    body: JSON.stringify({ idMembership: membershipId }),
  });
}

function getPaymentStatus(reference) {
  return request(`/payments/${encodeURIComponent(reference)}/status`);
}


async function waitForPayment(
  reference,
  { intervalMs = 3000, timeoutMs = 180000, signal } = {}
) {
  const deadline = Date.now() + timeoutMs;
  let consecutiveFailures = 0;

  while (Date.now() < deadline) {
    await sleep(intervalMs, signal);

    try {
      const { status } = await getPaymentStatus(reference);
      consecutiveFailures = 0;
      if (FINAL_STATUSES.includes(status)) return status;
    } catch (err) {
      if (err.status === 401 || err.status === 403) throw err;
      if (++consecutiveFailures >= 5) throw err;
    }
  }

  return PAYMENT_STATUS.TIMEOUT;
}


async function payWithBold({ idMembership }, options) {
  const checkoutTab = window.open("", "_blank");
  if (!checkoutTab) {
    throw new Error(
      "El navegador bloqueó la ventana de pago. Permite las ventanas emergentes e inténtalo de nuevo."
    );
  }

  try {
    const payment = await createPayment({ idMembership });
    checkoutTab.location.href = payment.checkoutUrl;

    let closeMonitor;
    const checkoutClosed = new Promise((resolve, reject) => {
      closeMonitor = window.setInterval(() => {
        if (!checkoutTab.closed) return;

        const error = new Error("La ventana de pago fue cerrada.");
        error.code = "PAYMENT_WINDOW_CLOSED";
        reject(error);
      }, 250);
    });

    let status;
    try {
      status = await Promise.race([
        waitForPayment(payment.reference, options),
        checkoutClosed
      ]);
    } finally {
      window.clearInterval(closeMonitor);
    }

    return { reference: payment.reference, status };
  } catch (err) {
    checkoutTab.close();
    throw err;
  }
}

export const paymentService = {
  createPayment,
  getPaymentStatus,
  waitForPayment,
  payWithBold,
};