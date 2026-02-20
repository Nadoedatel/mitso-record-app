import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './app/App.vue'
import router from './pages'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
