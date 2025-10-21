import { createVuetify } from 'vuetify'
import 'vuetify/styles'

export default createVuetify({
  theme: {
    defaultTheme: 'dark', 
    themes: {
      light: {
        colors: {
          background: '#FFFFFF',
          surface: '#FFFFFF',
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