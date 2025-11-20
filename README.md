# Agente de Análisis de Requisitos - Chat con IA

Aplicación web moderna con chat interactivo que utiliza Google Gemini para ayudar a revisar si tienes todos los requisitos y conocimientos necesarios para realizar una tarea. El agente conversa contigo, analiza la información que proporcionas e identifica automáticamente si falta información o qué requisitos son necesarios.

## 🚀 Características

* **Chat Interactivo con IA**: Conversación natural con Google Gemini para analizar requisitos
* **Preguntas Iniciales Guiadas**: Sistema de 9 preguntas específicas una por una para obtener información inicial
* **Análisis Conversacional**: El modelo analiza si tienes toda la información o requiere detalles adicionales
* **Panel de Requisitos en Tiempo Real**: Visualización de requisitos identificados con indicadores de progreso
* **Carga de Documentos**: Soporte para subir y analizar documentos (PDF, TXT, MD, DOC, DOCX)
* **Procesamiento de Audio**: Análisis de archivos de audio y transcripción de conversaciones/llamadas
* **Exportación de Datos**: Exporta requisitos a JSON o Markdown
* **Resumen Ejecutivo Automático**: Genera resúmenes estructurados de todos los requisitos identificados
* **Interfaz de Chat Moderna**: Diseño tipo chat messenger con burbujas de mensajes
* **Historial de Conversación**: Mantiene el contexto durante toda la conversación
* **Análisis Inteligente**: Identifica automáticamente tecnologías, conceptos y requisitos necesarios
* **Preguntas Contextuales**: El agente hace preguntas específicas cuando falta información
* **Recomendaciones Personalizadas**: Proporciona sugerencias basadas en el análisis
* **Diseño Responsive**: Funciona perfectamente en escritorio y móvil
* **Indicadores de Progreso**: Barra de progreso visual para el relevamiento de requisitos

## 📋 Requisitos Previos

* Node.js 18+
* npm o yarn
* API Key de Google Gemini (puedes obtenerla en [Google AI Studio](https://makersuite.google.com/app/apikey))

## 🛠️ Instalación

1. Clona el repositorio o navega al directorio del proyecto:

```bash
git clone https://github.com/hugobryanstudios-sys/hackaton1-comunicacion-efectiva.git
cd hackaton1-comunicacion-efectiva
```

2. Instala las dependencias:

```bash
npm install
```

3. Configura la API Key de Gemini:  
   Edita el archivo `src/components/Chat.tsx` y reemplaza la constante `API_KEY` con tu API Key:

```typescript
const API_KEY = 'tu_api_key_aqui';
```

**Nota**: Para obtener tu API Key:  
   * Visita [Google AI Studio](https://makersuite.google.com/app/apikey)
   * Inicia sesión con tu cuenta de Google
   * Crea una nueva API Key
   * Cópiala y pégala en el código

## 🎯 Uso

1. Asegúrate de tener configurado la API Key de Gemini en el código
2. Inicia el servidor de desarrollo:

```bash
npm run dev
```

3. Abre tu navegador en `http://localhost:5173`
4. Comienza a chatear:  
   * El asistente te dará la bienvenida y comenzará con preguntas iniciales
   * Responde a las 9 preguntas guiadas una por una
   * El agente analizará si tiene suficiente información
   * Si falta información, el agente hará preguntas específicas
   * Puedes subir documentos o archivos de audio para análisis
   * Continúa la conversación hasta que el agente tenga toda la información necesaria
   * El agente te proporcionará un análisis completo de los requisitos identificados
   * Usa el panel lateral para ver el progreso y exportar los requisitos

## 📁 Estructura del Proyecto

```
hackaton1-comunicacion-efectiva/
├── src/
│   ├── components/
│   │   ├── Chat.tsx          # Componente principal del chat con IA
│   │   └── Chat.css          # Estilos del componente de chat
│   ├── App.tsx               # Componente principal de la aplicación
│   ├── App.css               # Estilos de la aplicación
│   ├── main.tsx              # Punto de entrada de React
│   └── index.css             # Estilos globales
├── public/                   # Archivos estáticos
├── package.json              # Dependencias del proyecto
├── tsconfig.json             # Configuración de TypeScript
├── vite.config.ts            # Configuración de Vite
├── .gitignore                # Archivos ignorados por Git
└── README.md                  # Este archivo
```

## 🎨 Tecnologías Utilizadas

* **React 19**: Biblioteca de UI
* **TypeScript**: Tipado estático para JavaScript
* **Vite**: Build tool y servidor de desarrollo
* **Google Generative AI (Gemini)**: Modelo de lenguaje para análisis conversacional
* **PDF.js**: Procesamiento de archivos PDF
* **CSS3**: Estilos modernos con animaciones

## 💬 Flujo de Uso

1. **Preguntas Iniciales**: El asistente hace 9 preguntas específicas:
   - Tipo de proyecto
   - Objetivo principal
   - Alcance
   - Stakeholders
   - Plazos
   - Recursos
   - Restricciones
   - Criterios de éxito
   - Dependencias

2. **Análisis de Documentos**: Sube documentos PDF o de texto para análisis automático

3. **Procesamiento de Audio**: Sube archivos de audio de conversaciones o llamadas

4. **Panel de Requisitos**: Visualiza en tiempo real:
   - Progreso del relevamiento
   - Checklist de categorías
   - Requisitos identificados
   - Estadísticas

5. **Exportación**: Descarga los requisitos en formato JSON o Markdown

6. **Resumen Ejecutivo**: Genera un resumen completo de todos los requisitos

## 🔒 Seguridad

⚠️ **IMPORTANTE**:

* Nunca compartas tu API Key públicamente
* El archivo `.env` está incluido en `.gitignore` y no debe ser subido a repositorios públicos
* Si compartes el código, asegúrate de que la API Key no esté hardcodeada en producción
* Para producción, usa variables de entorno del servidor/hosting

## 🔧 Scripts Disponibles

* `npm run dev`: Inicia el servidor de desarrollo
* `npm run build`: Construye la aplicación para producción
* `npm run preview`: Previsualiza la build de producción
* `npm run lint`: Ejecuta el linter de ESLint

## 🌟 Características Destacadas

### Panel de Requisitos
- Visualización en tiempo real del progreso
- Checklist interactivo de categorías
- Resumen de requisitos identificados
- Estadísticas del relevamiento

### Carga de Archivos
- Soporte para múltiples formatos de documentos
- Procesamiento automático de PDFs
- Análisis de archivos de audio
- Vista previa de archivos cargados

### Exportación
- Exportación a JSON con toda la información
- Exportación a Markdown para documentación
- Incluye conversación completa y requisitos

### Análisis Inteligente
- Extracción automática de requisitos
- Identificación de categorías
- Verificación de completitud
- Sugerencias personalizadas

## 📄 Licencia

Este proyecto es parte de un hackathon de comunicación efectiva.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o un pull request para cualquier mejora.

## ⚠️ Troubleshooting

### Error: "API key de Gemini no configurada"

* Asegúrate de que la constante `API_KEY` en `src/components/Chat.tsx` esté correctamente configurada
* Verifica que la API Key sea válida
* Reinicia el servidor de desarrollo después de modificar el código

### Error: "Error al generar respuesta"

* Verifica que tu API Key sea válida
* Asegúrate de tener conexión a internet
* Revisa la consola del navegador para más detalles
* Verifica que el modelo `gemini-flash-latest` esté disponible

### Error al procesar PDFs

* Asegúrate de que el archivo PDF no esté corrupto
* Verifica que el PDF tenga texto extraíble (no solo imágenes)
* Revisa la consola para errores específicos

### Error al procesar audio

* Verifica que el formato de audio sea compatible
* Asegúrate de que el archivo no esté corrupto
* El procesamiento de audio puede requerir conexión estable a internet
