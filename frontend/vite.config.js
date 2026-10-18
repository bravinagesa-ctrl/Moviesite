
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tmdbHandler from './api/tmdb.js'

const tmdbApiPlugin = (token) => ({
  name: 'local-tmdb-api',
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      if (request.url?.split('?')[0] !== '/api/tmdb') {
        next()
        return
      }

      const apiResponse = {
        setHeader: (name, value) => response.setHeader(name, value),
        status(code) {
          response.statusCode = code
          return this
        },
        json(data) {
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify(data))
          return this
        },
      }

      try {
        await tmdbHandler(request, apiResponse, { token })
      } catch (error) {
        console.error('Local TMDB API request failed:', error)
        response.statusCode = 500
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify({ error: 'Movie service request failed.' }))
      }
    })
  },
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    plugins: [
      tmdbApiPlugin(env.TMDB_API_READ_ACCESS_TOKEN),
      react(),
      tailwindcss(),
    ],
  }
})


  
