/* eslint-disable no-undef */
import api from '../../services/axiosConfig.js'

const SESSION_KEY = 'lanhua_session'
const TOKEN_KEY = 'lanhua_token'

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch (e) {
    return null
  }
}

const setSession = (userEmail, role, userId) => {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      id: userId,
      idUser: userId,
      email: userEmail,
      role,
      isLoggedIn: true
    })
  )
}

const logout = () => {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

document.addEventListener('DOMContentLoaded', () => {
  const loginHeader = document.getElementById('loginHeader')
  const registerHeader = document.getElementById('registerHeader')
  const loginTab = document.getElementById('login-tab')
  const registerTab = document.getElementById('register-tab')

  const updateHeader = (target) => {
    const isRegister = target === '#register' || target === 'register'
    if (loginHeader && registerHeader) {
      if (isRegister) {
        loginHeader.classList.add('d-none')
        registerHeader.classList.remove('d-none')
      } else {
        loginHeader.classList.remove('d-none')
        registerHeader.classList.add('d-none')
      }
    }
  }

  if (loginTab) {
    loginTab.addEventListener('shown.bs.tab', () => updateHeader('#login'))
  }

  if (registerTab) {
    registerTab.addEventListener('shown.bs.tab', () => updateHeader('#register'))
  }

  const hash = window.location.hash
  if (hash) {
    const triggerEl = document.querySelector(`button[data-bs-target="${hash}"]`)
    if (triggerEl) {
      const tab = new bootstrap.Tab(triggerEl)
      tab.show()
      updateHeader(hash)
    }
  }

  const toggleButtons = document.querySelectorAll('.toggle-password')

  toggleButtons.forEach(button => {
    button.addEventListener('click', function () {
      const targetId = this.getAttribute('data-target')
      const inputElement = document.getElementById(targetId)
      const icon = this.querySelector('i')

      if (inputElement.type === 'password') {
        inputElement.type = 'text'
        icon.classList.remove('fa-eye')
        icon.classList.add('fa-eye-slash')
      } else {
        inputElement.type = 'password'
        icon.classList.remove('fa-eye-slash')
        icon.classList.add('fa-eye')
      }
    })
  })

  const loginForm = document.getElementById('loginForm')
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault()

      const email = document.getElementById('loginCorreo').value.trim().toLowerCase()
      const password = document.getElementById('loginPassword').value
      const btn = loginForm.querySelector('button[type="submit"]')
      const spinner = document.getElementById('loginSpinner')

      spinner.classList.remove('d-none')
      btn.disabled = true

      try {
        const response = await api.post('/auth/login', {
          email,
          password
        })

        const token = response.data.token
        const userId = response.data.id
        localStorage.setItem(TOKEN_KEY, token)

        const tokenData = parseJwt(token)
        const userRole = tokenData.rol || response.data.role

        setSession(email, userRole, userId)
        spinner.classList.add('d-none')
        btn.disabled = false

        Swal.fire({
          icon: 'success',
          title: '¡Bienvenido a LAN HUA!',
          text: 'Has iniciado sesión correctamente.',
          confirmButtonColor: '#f2be22',
          background: '#212529',
          color: '#fff'
        }).then(() => {
          if (userRole === 'ADMIN') {
            window.location.href = '../dashboard/dashboard.html'
          } else {
            window.location.href = '../catalog_users/catalog_user.html'
          }
        })
      } catch (error) {
        spinner.classList.add('d-none')
        btn.disabled = false

        console.error('Error en login:', error)

        Swal.fire({
          icon: 'error',
          title: 'Credenciales incorrectas',
          text: 'El correo o la contraseña son incorrectos.',
          confirmButtonColor: '#f2be22',
          background: '#212529',
          color: '#fff'
        })
      }
    })
  }

  const registerForm = document.getElementById('registerForm')
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault()

      const nombre = document.getElementById('regNombre').value.trim()
      const apellido = document.getElementById('regApellido').value.trim()
      const correo = document.getElementById('regCorreo').value.trim().toLowerCase()
      const password = document.getElementById('regPassword').value
      const confirmPassword = document.getElementById('regConfirmPassword').value

      if (password !== confirmPassword) {
        Swal.fire({
          icon: 'error',
          title: 'Error de validación',
          text: 'Las contraseñas no coinciden. Por favor, verifica e intenta de nuevo.',
          confirmButtonColor: '#f2be22',
          background: '#212529',
          color: '#fff'
        })
        return
      }

      if (password.length < 8) {
        Swal.fire({
          icon: 'warning',
          title: 'Contraseña muy corta',
          text: 'La contraseña debe tener al menos 8 caracteres para ser segura.',
          confirmButtonColor: '#f2be22',
          background: '#212529',
          color: '#fff'
        })
        return
      }

      const btn = registerForm.querySelector('button[type="submit"]')
      const spinner = document.getElementById('registerSpinner')

      spinner.classList.remove('d-none')
      btn.disabled = true

      try {
        await api.post('/users', {
          nameUser: nombre,
          lastNameUser: apellido,
          emailUser: correo,
          passwordUser: password
        })

        spinner.classList.add('d-none')
        btn.disabled = false

        Swal.fire({
          icon: 'success',
          title: '¡Registro exitoso!',
          text: 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
          confirmButtonColor: '#f2be22',
          background: '#212529',
          color: '#fff'
        }).then(() => {
          registerForm.reset()
          const loginTab = new bootstrap.Tab(document.getElementById('login-tab'))
          loginTab.show()
        })
      } catch (error) {
        spinner.classList.add('d-none')
        btn.disabled = false

        console.error('Error en registro:', error)

        Swal.fire({
          icon: 'error',
          title: 'Error al registrar',
          text: 'Puede que el correo ya esté registrado o haya un problema en el servidor.',
          confirmButtonColor: '#f2be22',
          background: '#212529',
          color: '#fff'
        })
      }
    })
  }
})
