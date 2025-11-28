import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { VDataTable } from 'vuetify/labs/VDataTable'

const darkNavyTheme = {
  dark: true,
  colors: {
    background: '#0B1120',
    surface: '#111B2E',
    primary: '#4C8BF5',
    secondary: '#1F2A44',
    accent: '#5EEAD4',
    menubar: '#0D1A2F',
    menubarText: '#E2E8F0',
    drawer: '#111B2E',
    text: '#E2E8F0',
    border: '#1F2A44',
  },
}

export default createVuetify({
  components: {
    ...components,
    VDataTable,
  },
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: darkNavyTheme,
    },
  },
  typography: {
    defaultFontFamily: 'Inter, sans-serif',
    h1: { fontFamily: 'Anton, sans-serif' },
  },
})
