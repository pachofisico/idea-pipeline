# Diagrama de Componentes - Idea Pipeline

Este diagrama detalla la interacción entre los diferentes módulos y capas del sistema.

```mermaid
%%{init: {'theme': 'neutral'}}%%
graph TD
    subgraph Cliente
        UI[Frontend React]
    end

    subgraph Servidor
        Server[Express Server]
        SM[Storage Manager]
        DB[(PostgreSQL)]
        FS[Local Disk]
    end

    subgraph Agentes
        Arch[Researcher]
        Gen[Generator]
        Eval[Evaluator]
    end

    subgraph Externo
        DDG[DuckDuckGo API]
        Gemini[Google Gemini 2.0]
        Poll[Pollinations.ai]
    end

    UI -- API Requests --> Server
    Server --> DB
    Server --> FS
    Server --> SM
    
    Server -- Orquesta --> Arch
    Server -- Orquesta --> Gen
    Server -- Orquesta --> Eval
    
    Arch -- Scraping --> DDG
    Gen -- IA Análisis --> Gemini
    Gen -- IA Imágenes --> Poll
    
    UI -.-> Socket[Socket.io Expansion]
```

## Descripción de Componentes

### 1. Frontend (React + Vite)
*   **UI Components**: Manejan la experiencia de usuario artesanal (Canvas, Fichas).
*   **State Management**: Controla el flujo de vistas y la carga de ideas en memoria.

### 2. Express Server (Node.js)
*   **Routes**: Endpoints para CRUD de ideas y disparadores de IA.
*   **Storage Manager**: Encapsula la lógica de guardado de archivos y miniaturas.

### 3. Capa de Agentes (Lógica de IA)
*   **Researcher**: Orquesta búsquedas web y parseo de HTML.
*   **Generator**: Transforma texto plano en estructuras JSON ricas y redacta documentos técnicos.
*   **Evaluator**: Módulo matemático y de IA para asignar puntajes de mercado.

### 4. Proveedores Externos
*   **Google Gemini**: El cerebro lingüístico detrás de las ideas y patentes.
*   **Pollinations.ai**: Motor de síntesis de imagen para prototipado visual rápido.
