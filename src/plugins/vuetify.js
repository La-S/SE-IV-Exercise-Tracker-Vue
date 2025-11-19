import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
export default createVuetify({
  components: components,
  directives: directives,
  theme: {
    defaultTheme: 'dark', 
    themes: {
      light: {
        colors: {
          background: '#F2F3F4',
          surface: '#F2F3F4',
          primary: '#58f707', 
          secondary: '#121212',
          text: '#000000',
        },
      },
      dark: {
        colors: {
          background: '#121212',
          surface: '#121212',
          primary: '#58f707',
          secondary: '#1f1f1f',
          text: '#FFFFFF',
        },
      },
    },
  },
  typography: {
    defaultFontFamily: 'Inter, sans-serif', 
    h1: { fontFamily: 'Anton, sans-serif' },
  },

})