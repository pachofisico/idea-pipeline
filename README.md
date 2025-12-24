# Idea Pipeline - Generador de Ideas con IA

Sistema inteligente de generación y gestión de ideas de innovación, diseñado para transformar hallazgos de mercado en conceptos de producto detallados, protegibles y escalables.

## 🚀 Características Principales

- **Investigación Automatizada**: Búsqueda en tiempo real de tendencias y vacíos de mercado utilizando DuckDuckGo.
- **Generación de Ideas con Gemini**: Transformación de hallazgos en conceptos de producto con análisis de viabilidad e impacto.
- **Gestiuón de Directorios**: Organización jerárquica con explorador lateral y capacidad de mover ideas entre carpetas.
- **Bitácora de Evolución**: Historial cronológico de notas y avances para cada idea.
- **Bocetado Digital**: Lienzo integrado para capturar la visión visual inicial de la idea.
- **Redacción de Patentes con IA**: Generación automática de borradores técnicos de patentes utilizando Gemini 2.0.
- **Generación de Imágenes**: Creación de visualizaciones realistas del producto (estética Nanobanana) usando integración con Flux (Pollinations.ai).
- **Gestión Multimedia**: Subida de videos e imágenes, galería interactiva y previsualización de archivos.

## 🛠️ Stack Tecnológico

- **Frontend**: React.js, Vite, Axios, React Canvas Draw.
- **Backend**: Node.js, Express.
- **Base de Datos**: PostgreSQL con Sequelize ORM.
- **IA**: Google Gemini 2.0 Flash, Pollinations.ai (Flux Model).
- **Infraestructura**: Docker & Docker Compose.

## 📦 Instalación y Ejecución

1. Clonar el repositorio.
2. Configurar las variables de entorno en `./server/server.env`:
   ```env
   GEMINI_API_KEY=tu_api_key
   DB_HOST=db
   DB_NAME=ideadb
   DB_USER=postgres
   DB_PASSWORD=password
   ```
3. Ejecutar con Docker:
   ```powershell
   docker-compose up --build
   ```
4. Acceder a:
   - Frontend: `http://localhost:5173`
   - API: `http://localhost:3000`

## 📂 Estructura del Proyecto

- `/client`: Aplicación frontend en React.
- `/server`: Servidor Express, lógica de agentes y gestión de archivos.
- `/docs`: Documentación detallada de arquitectura y modelos.
