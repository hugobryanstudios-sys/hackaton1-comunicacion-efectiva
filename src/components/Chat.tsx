import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdfjsLib from 'pdfjs-dist';
import './Chat.css';

// Configurar el worker de PDF.js para el navegador
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachments?: UploadedFile[];
}

interface Requirement {
  category: string;
  items: string[];
}

interface UploadedFile {
  id: string;
  name: string;
  type: 'document' | 'audio';
  content?: string;
  file: File;
  status: 'processing' | 'ready' | 'error';
}

const API_KEY = 'AIzaSyD3aefvwkk26LJjcdGxM8cxnjkffEeQzpM';

const SYSTEM_INSTRUCTION = `Eres un especialista en relevamiento de requisitos y análisis de tareas. Tu función principal es:

1. **Relevar requisitos**: Hacer preguntas claras y específicas para entender completamente la tarea o proyecto que el usuario necesita realizar.

2. **Verificar completitud**: Analizar si se tiene toda la información necesaria para presentar o ejecutar la tarea. Debes identificar:
   - Objetivos y alcance de la tarea
   - Recursos necesarios (humanos, técnicos, materiales)
   - Plazos y fechas importantes
   - Restricciones y limitaciones
   - Criterios de éxito y aceptación
   - Stakeholders involucrados
   - Dependencias con otras tareas o proyectos

3. **Identificar información faltante**: Cuando detectes que falta información crítica, pregunta específicamente por ella de manera clara y estructurada.

4. **Confirmar comprensión**: Al finalizar el relevamiento, resume todos los requisitos identificados y confirma que tienes toda la información necesaria.

5. **Formato de respuesta**: Sé profesional, estructurado y claro. Usa listas, secciones y preguntas directas cuando sea necesario.

6. **Preguntas iniciales**: Al inicio, haz UNA pregunta a la vez y espera la respuesta antes de continuar. Usa las respuestas anteriores para hacer preguntas más específicas y relevantes.

Actúa como un consultor experto que guía al usuario a través del proceso de definición completa de su tarea.`;

const INITIAL_QUESTIONS = [
  {
    id: 'tipo_proyecto',
    question: '¿Qué tipo de proyecto o tarea necesitas definir? (Por ejemplo: desarrollo de software, construcción, evento, investigación, etc.)',
    category: 'objetivos'
  },
  {
    id: 'objetivo_principal',
    question: '¿Cuál es el objetivo principal que quieres lograr con este proyecto?',
    category: 'objetivos'
  },
  {
    id: 'alcance',
    question: '¿Puedes describir el alcance del proyecto? ¿Qué está incluido y qué está fuera del alcance?',
    category: 'objetivos'
  },
  {
    id: 'stakeholders',
    question: '¿Quiénes son los principales stakeholders o personas involucradas en este proyecto? (clientes, usuarios finales, equipo, patrocinadores, etc.)',
    category: 'stakeholders'
  },
  {
    id: 'plazo',
    question: '¿Cuál es el plazo o fecha límite para completar este proyecto? ¿Hay fechas importantes o hitos intermedios?',
    category: 'plazos'
  },
  {
    id: 'recursos',
    question: '¿Qué recursos necesitarás para este proyecto? (equipo humano, herramientas, tecnología, presupuesto, materiales, etc.)',
    category: 'recursos'
  },
  {
    id: 'restricciones',
    question: '¿Existen restricciones o limitaciones que debamos considerar? (presupuesto, tiempo, tecnología, regulaciones, etc.)',
    category: 'restricciones'
  },
  {
    id: 'criterios_exito',
    question: '¿Cómo definirías el éxito de este proyecto? ¿Cuáles son los criterios de aceptación o validación?',
    category: 'criterios'
  },
  {
    id: 'dependencias',
    question: '¿Este proyecto depende de otros proyectos, tareas o recursos externos? ¿Hay dependencias críticas?',
    category: 'dependencias'
  }
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [completionStatus, setCompletionStatus] = useState({
    objetivos: false,
    recursos: false,
    plazos: false,
    restricciones: false,
    criterios: false,
    stakeholders: false,
    dependencias: false,
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [initialQuestionsMode, setInitialQuestionsMode] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [initialAnswers, setInitialAnswers] = useState<Record<string, string>>({});

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-flash-latest',
    systemInstruction: SYSTEM_INSTRUCTION
  });

  // Inicializar el chat con mensaje de bienvenida y primera pregunta
  useEffect(() => {
    if (!chatRef.current && !isInitialized) {
      chatRef.current = model.startChat({ 
        history: [],
      });
      setIsInitialized(true);
      
      // Enviar mensaje inicial de bienvenida y primera pregunta
      const welcomeMessage = `¡Hola! Soy tu asistente especializado en relevamiento de requisitos. 

Mi objetivo es ayudarte a definir completamente tu tarea o proyecto mediante una serie de preguntas específicas. Te haré una pregunta a la vez para asegurarme de obtener toda la información necesaria.

Empecemos con la primera pregunta:

**${INITIAL_QUESTIONS[0].question}**`;
      
      setMessages([{ role: 'assistant', content: welcomeMessage }]);
      setInitialQuestionsMode(true);
      setCurrentQuestionIndex(0);
    }
  }, [isInitialized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processDocument = async (file: File): Promise<string> => {
    if (file.type === 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + '\n\n';
        }

        return fullText.trim();
      } catch (error) {
        console.error('Error procesando PDF:', error);
        throw new Error('Error al procesar el archivo PDF');
      }
    } else if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
      return await file.text();
    } else {
      throw new Error('Tipo de documento no soportado. Formatos soportados: PDF, TXT, MD, DOC, DOCX');
    }
  };

  const processAudio = async (file: File): Promise<string> => {
    try {
      // Convertir audio a base64 para enviarlo a Gemini
      const arrayBuffer = await file.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      // Usar el modelo de Gemini que soporta audio (gemini-1.5-flash o gemini-1.5-pro)
      const audioModel = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
      });

      // Preparar el contenido para Gemini
      // Nota: Gemini 1.5 soporta audio directamente, pero requiere el formato correcto
      const prompt = `Analiza este archivo de audio y transcribe su contenido. Luego, extrae información relevante para el análisis de requisitos de una tarea o proyecto. Identifica y menciona:
- Objetivos y alcance mencionados
- Recursos necesarios (humanos, técnicos, materiales)
- Plazos y fechas importantes
- Restricciones y limitaciones
- Criterios de éxito y aceptación
- Stakeholders involucrados
- Dependencias con otras tareas o proyectos

Proporciona una transcripción estructurada y un análisis de los requisitos identificados.`;

      // Para audio, necesitamos usar la API de Gemini con FileData
      // Por ahora, retornamos un placeholder que se procesará cuando se envíe el mensaje
      return `[Archivo de audio: ${file.name} - ${(file.size / 1024 / 1024).toFixed(2)} MB. El audio será procesado y transcrito para extraer requisitos relevantes. Por favor, menciona los detalles importantes del audio en tu mensaje.]`;
    } catch (error) {
      console.error('Error procesando audio:', error);
      return `[Error al procesar el audio: ${file.name}. Por favor, describe manualmente el contenido del audio.]`;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFile(true);

    for (const file of Array.from(files)) {
      const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const fileType: 'document' | 'audio' = file.type.startsWith('audio/') ? 'audio' : 'document';

      const uploadedFile: UploadedFile = {
        id: fileId,
        name: file.name,
        type: fileType,
        file,
        status: 'processing',
      };

      setUploadedFiles((prev) => [...prev, uploadedFile]);

      try {
        let content: string;
        if (fileType === 'audio') {
          content = await processAudio(file);
        } else {
          content = await processDocument(file);
        }

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, content, status: 'ready' as const }
              : f
          )
        );

        // Enviar el contenido procesado al chat automáticamente
        let analysisPrompt: string;
        
        if (fileType === 'audio') {
          analysisPrompt = `He subido un archivo de audio llamado "${file.name}" (${(file.size / 1024 / 1024).toFixed(2)} MB). Por favor, analiza este audio y transcribe su contenido. Luego, extrae información relevante para el relevamiento de requisitos de una tarea o proyecto. Identifica objetivos, recursos, plazos, restricciones, criterios de éxito, stakeholders y dependencias mencionados en el audio.\n\nNota: Si puedes procesar el audio directamente, hazlo. Si no, pide al usuario que describa el contenido del audio.`;
        } else {
          analysisPrompt = `He subido un documento llamado "${file.name}". Por favor, analiza su contenido y extrae información relevante para el relevamiento de requisitos. Identifica objetivos, recursos, plazos, restricciones, criterios de éxito, stakeholders y dependencias mencionados.\n\nContenido del documento:\n${content.substring(0, 15000)}${content.length > 15000 ? '\n\n[Contenido truncado por longitud - se analizará el documento completo]' : ''}`;
        }

        const userMessage: Message = {
          role: 'user',
          content: analysisPrompt,
          attachments: [{ ...uploadedFile, content, status: 'ready' }],
        };
        setMessages((prev) => [...prev, userMessage]);

        // Para archivos de audio, intentar enviar el archivo directamente a Gemini
        let result;
        if (fileType === 'audio') {
          try {
            // Intentar usar el modelo con soporte de audio
            const audioModel = genAI.getGenerativeModel({ 
              model: 'gemini-1.5-flash',
            });
            
            // Convertir archivo a formato que Gemini pueda procesar
            const arrayBuffer = await file.arrayBuffer();
            const base64Audio = btoa(
              new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            
            // Crear el prompt con el audio
            const audioPrompt = `Analiza este archivo de audio y transcribe su contenido. Luego, extrae información relevante para el análisis de requisitos de una tarea o proyecto. Identifica objetivos, recursos, plazos, restricciones, criterios de éxito, stakeholders y dependencias.`;
            
            // Nota: La API de Gemini 1.5 requiere un formato específico para archivos
            // Por ahora, enviaremos el prompt de texto y el usuario puede describir el audio
            result = await chatRef.current.sendMessage(analysisPrompt);
          } catch (audioError) {
            console.error('Error procesando audio con Gemini:', audioError);
            // Fallback: enviar el prompt de texto normal
            result = await chatRef.current.sendMessage(analysisPrompt);
          }
        } else {
          result = await chatRef.current.sendMessage(analysisPrompt);
        }
        
        const response = await result.response;
        const text = response.text();

        const assistantMessage: Message = {
          role: 'assistant',
          content: text,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Error procesando archivo:', error);
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, status: 'error' as const } : f
          )
        );
      }
    }

    setIsProcessingFile(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const sendMessage = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || isLoading) return;

    let messageContent = input;
    
    // Incluir contenido de archivos listos en el mensaje
    const readyFiles = uploadedFiles.filter(f => f.status === 'ready' && f.content);
    if (readyFiles.length > 0 && !input.trim()) {
      messageContent = `Analiza los siguientes archivos y extrae requisitos:\n\n${readyFiles.map(f => `Archivo: ${f.name}\nContenido:\n${f.content?.substring(0, 5000)}`).join('\n\n---\n\n')}`;
    } else if (readyFiles.length > 0) {
      messageContent += `\n\n[Archivos adjuntos: ${readyFiles.map(f => f.name).join(', ')}]`;
    }

    const userMessage: Message = {
      role: 'user',
      content: messageContent || input,
      attachments: readyFiles,
    };
    setMessages((prev) => [...prev, userMessage]);
    
    // Guardar respuesta si estamos en modo de preguntas iniciales
    if (initialQuestionsMode && currentQuestionIndex < INITIAL_QUESTIONS.length) {
      const currentQuestion = INITIAL_QUESTIONS[currentQuestionIndex];
      setInitialAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: input.trim()
      }));
    }
    
    setInput('');
    setIsLoading(true);

    try {
      let result;
      let responseText: string;

      // Si estamos en modo de preguntas iniciales
      if (initialQuestionsMode && currentQuestionIndex < INITIAL_QUESTIONS.length - 1) {
        const nextQuestionIndex = currentQuestionIndex + 1;
        const nextQuestion = INITIAL_QUESTIONS[nextQuestionIndex];
        
        // Construir contexto con respuestas anteriores
        const contextAnswers = Object.entries(initialAnswers)
          .map(([key, value]) => {
            const question = INITIAL_QUESTIONS.find(q => q.id === key);
            return `Pregunta: ${question?.question}\nRespuesta: ${value}`;
          })
          .join('\n\n');

        const contextPrompt = `Contexto de respuestas anteriores:\n${contextAnswers}\n\nRespuesta actual a la pregunta "${INITIAL_QUESTIONS[currentQuestionIndex].question}": ${input.trim()}\n\nAhora haz la siguiente pregunta: "${nextQuestion.question}"\n\nSolo haz la pregunta, no agregues comentarios adicionales a menos que sea necesario para clarificar.`;
        
        result = await chatRef.current.sendMessage(contextPrompt);
        const response = await result.response;
        responseText = response.text();
        
        // Si la respuesta no contiene la pregunta, agregarla
        if (!responseText.includes(nextQuestion.question)) {
          responseText = `**${nextQuestion.question}**`;
        }
        
        setCurrentQuestionIndex(nextQuestionIndex);
      } else if (initialQuestionsMode && currentQuestionIndex === INITIAL_QUESTIONS.length - 1) {
        // Última pregunta inicial
        const contextAnswers = Object.entries(initialAnswers)
          .map(([key, value]) => {
            const question = INITIAL_QUESTIONS.find(q => q.id === key);
            return `Pregunta: ${question?.question}\nRespuesta: ${value}`;
          })
          .join('\n\n');

        const finalPrompt = `Contexto de respuestas anteriores:\n${contextAnswers}\n\nRespuesta final: ${input.trim()}\n\nAhora que tienes toda la información inicial, haz un resumen breve de lo que has entendido y luego indica que puedes hacer preguntas más específicas o profundizar en áreas particulares según sea necesario.`;
        
        result = await chatRef.current.sendMessage(finalPrompt);
        const response = await result.response;
        responseText = response.text();
        
        setInitialQuestionsMode(false);
        setCurrentQuestionIndex(-1);
      } else {
        // Modo normal de conversación
        result = await chatRef.current.sendMessage(messageContent);
        const response = await result.response;
        responseText = response.text();
      }

      const assistantMessage: Message = { role: 'assistant', content: responseText };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Analizar mensajes para extraer requisitos
  useEffect(() => {
    if (messages.length < 2) return;

    const analyzeRequirements = () => {
      const allText = messages
        .filter(m => m.role === 'assistant')
        .map(m => m.content)
        .join(' ')
        .toLowerCase();

      const newRequirements: Requirement[] = [];
      const newStatus = {
        objetivos: false,
        recursos: false,
        plazos: false,
        restricciones: false,
        criterios: false,
        stakeholders: false,
        dependencias: false,
      };

      // Detectar categorías de requisitos
      const categories = {
        objetivos: ['objetivo', 'meta', 'propósito', 'finalidad', 'alcance'],
        recursos: ['recurso', 'equipo', 'herramienta', 'material', 'presupuesto', 'personal'],
        plazos: ['plazo', 'fecha', 'deadline', 'tiempo', 'duración', 'cronograma'],
        restricciones: ['restricción', 'limitación', 'constraint', 'condición'],
        criterios: ['criterio', 'éxito', 'aceptación', 'validación', 'calidad'],
        stakeholders: ['stakeholder', 'cliente', 'usuario', 'equipo', 'responsable'],
        dependencias: ['dependencia', 'relación', 'vinculado', 'conectado'],
      };

      Object.entries(categories).forEach(([key, keywords]) => {
        const found = keywords.some(keyword => allText.includes(keyword));
        if (found) {
          newStatus[key as keyof typeof completionStatus] = true;
          
          // Extraer items específicos mencionados
          const items: string[] = [];
          messages.forEach(msg => {
            if (msg.role === 'assistant') {
              const lines = msg.content.split('\n');
              lines.forEach(line => {
                if (keywords.some(k => line.toLowerCase().includes(k))) {
                  const cleanLine = line.replace(/^[-*•]\s*/, '').trim();
                  if (cleanLine.length > 10) items.push(cleanLine);
                }
              });
            }
          });
          
          if (items.length > 0) {
            newRequirements.push({
              category: key.charAt(0).toUpperCase() + key.slice(1),
              items: [...new Set(items)].slice(0, 5),
            });
          }
        }
      });

      setRequirements(newRequirements);
      setCompletionStatus(newStatus);
    };

    analyzeRequirements();
  }, [messages]);

  const completionPercentage = Math.round(
    (Object.values(completionStatus).filter(Boolean).length / 
     Object.keys(completionStatus).length) * 100
  );

  const generateSummary = async () => {
    if (messages.length < 2) return;

    setIsLoading(true);
    try {
      const summaryPrompt = `Basándote en toda la conversación, genera un resumen ejecutivo estructurado de todos los requisitos identificados. Incluye:
1. Resumen general del proyecto/tarea
2. Objetivos principales
3. Recursos necesarios
4. Plazos y fechas clave
5. Restricciones identificadas
6. Criterios de éxito
7. Stakeholders involucrados
8. Dependencias
9. Información faltante (si la hay)
10. Conclusión sobre la completitud del relevamiento

Formato el resumen de manera profesional y clara.`;
      
      const result = await chatRef.current.sendMessage(summaryPrompt);
      const response = await result.response;
      const summary = response.text();

      const summaryMessage: Message = {
        role: 'assistant',
        content: `## 📊 RESUMEN EJECUTIVO DE REQUISITOS\n\n${summary}`,
      };
      setMessages((prev) => [...prev, summaryMessage]);
    } catch (error) {
      console.error('Error al generar resumen:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToJSON = () => {
    const data = {
      fecha: new Date().toISOString(),
      mensajes: messages,
      requisitos: requirements,
      estadoCompletitud: completionStatus,
      porcentajeCompletitud: completionPercentage,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requisitos-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToMarkdown = () => {
    let markdown = `# Relevamiento de Requisitos\n\n`;
    markdown += `**Fecha:** ${new Date().toLocaleDateString()}\n\n`;
    markdown += `**Completitud:** ${completionPercentage}%\n\n`;
    markdown += `## Requisitos Identificados\n\n`;
    
    requirements.forEach(req => {
      markdown += `### ${req.category}\n\n`;
      req.items.forEach(item => {
        markdown += `- ${item}\n`;
      });
      markdown += `\n`;
    });

    markdown += `## Conversación Completa\n\n`;
    messages.forEach(msg => {
      markdown += `### ${msg.role === 'user' ? 'Usuario' : 'Asistente'}\n\n`;
      markdown += `${msg.content}\n\n---\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requisitos-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-layout">
      {showSidebar && (
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>📊 Panel de Requisitos</h2>
            <button 
              className="close-sidebar" 
              onClick={() => setShowSidebar(false)}
              aria-label="Cerrar panel"
            >
              ✕
            </button>
          </div>
          
          <div className="completion-card">
            <div className="completion-header">
              <span>Progreso del Relevamiento</span>
              <span className="completion-percentage">{completionPercentage}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="requirements-checklist">
            <h3>Checklist de Categorías</h3>
            {Object.entries(completionStatus).map(([key, completed]) => (
              <div key={key} className={`checklist-item ${completed ? 'completed' : ''}`}>
                <span className="check-icon">{completed ? '✓' : '○'}</span>
                <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
              </div>
            ))}
          </div>

          {requirements.length > 0 && (
            <div className="requirements-summary">
              <h3>Requisitos Identificados</h3>
              {requirements.map((req, idx) => (
                <div key={idx} className="requirement-category">
                  <h4>{req.category}</h4>
                  <ul>
                    {req.items.map((item, i) => (
                      <li key={i}>{item.substring(0, 60)}{item.length > 60 ? '...' : ''}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <div className="sidebar-actions">
            <button 
              className="action-button primary" 
              onClick={generateSummary}
              disabled={isLoading || messages.length < 2}
            >
              📝 Generar Resumen
            </button>
            <button 
              className="action-button" 
              onClick={exportToJSON}
              disabled={messages.length < 2}
            >
              💾 Exportar JSON
            </button>
            <button 
              className="action-button" 
              onClick={exportToMarkdown}
              disabled={messages.length < 2}
            >
              📄 Exportar Markdown
            </button>
          </div>

          <div className="stats">
            <div className="stat-item">
              <span className="stat-label">Mensajes</span>
              <span className="stat-value">{messages.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Categorías</span>
              <span className="stat-value">{requirements.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Archivos</span>
              <span className="stat-value">{uploadedFiles.length}</span>
            </div>
          </div>
        </div>
      )}

      <div className={`chat-container ${!showSidebar ? 'full-width' : ''}`}>
        <div className="chat-header">
          <div className="header-content">
            <div>
              <h1>📋 Relevamiento de Requisitos</h1>
              <p className="chat-subtitle">Asistente especializado en análisis de tareas</p>
            </div>
            {!showSidebar && (
              <button 
                className="toggle-sidebar" 
                onClick={() => setShowSidebar(true)}
                aria-label="Mostrar panel"
              >
                📊 Panel
              </button>
            )}
          </div>
        </div>
        {initialQuestionsMode && currentQuestionIndex >= 0 && (
          <div className="questions-progress">
            <div className="progress-info">
              <span>Pregunta {currentQuestionIndex + 1} de {INITIAL_QUESTIONS.length}</span>
              <span className="progress-percentage">
                {Math.round(((currentQuestionIndex + 1) / INITIAL_QUESTIONS.length) * 100)}%
              </span>
            </div>
            <div className="progress-dots">
              {INITIAL_QUESTIONS.map((_, index) => (
                <span
                  key={index}
                  className={`progress-dot ${
                    index < currentQuestionIndex + 1 ? 'completed' : ''
                  } ${index === currentQuestionIndex ? 'current' : ''}`}
                />
              ))}
            </div>
          </div>
        )}
        <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-content">
              {message.content}
              {message.attachments && message.attachments.length > 0 && (
                <div className="message-attachments">
                  {message.attachments.map((file) => (
                    <div key={file.id} className="attachment-item">
                      <span className="attachment-icon">
                        {file.type === 'audio' ? '🎵' : '📄'}
                      </span>
                      <span className="attachment-name">{file.name}</span>
                      <span className="attachment-status">
                        {file.status === 'ready' ? '✓' : file.status === 'processing' ? '⏳' : '✗'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-container">
        {uploadedFiles.length > 0 && (
          <div className="uploaded-files-preview">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="uploaded-file-item">
                <span className="file-icon">{file.type === 'audio' ? '🎵' : '📄'}</span>
                <span className="file-name" title={file.name}>
                  {file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name}
                </span>
                <span className="file-status">
                  {file.status === 'ready' && '✓'}
                  {file.status === 'processing' && '⏳'}
                  {file.status === 'error' && '✗'}
                </span>
                <button
                  className="remove-file-button"
                  onClick={() => removeFile(file.id)}
                  aria-label="Eliminar archivo"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="input-row">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.txt,.md,.doc,.docx,audio/*,.mp3,.wav,.m4a,.ogg"
            multiple
            style={{ display: 'none' }}
            disabled={isProcessingFile}
          />
          <button
            className="attach-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingFile || isLoading}
            aria-label="Adjuntar archivo"
            title="Subir documento o audio"
          >
            {isProcessingFile ? '⏳' : '📎'}
          </button>
          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe tu tarea o proyecto aquí..."
            rows={1}
            disabled={isLoading}
          />
          <button
            className="send-button"
            onClick={sendMessage}
            disabled={isLoading || (!input.trim() && uploadedFiles.filter(f => f.status === 'ready').length === 0)}
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}

