# 🚀 Prueba Técnica: API de Cotización de Divisas (Fiat ⇄ Crypto) con NestJS

Bienvenido a este desafío para crear una **API** moderna en **NestJS** para convertir divisas fiat y criptomonedas. ¡Prepárate para demostrar tus habilidades y buenas prácticas de desarrollo!

---

## 📚 Objetivo

Desarrollar una aplicación back-end en NestJS que exponga dos endpoints REST para realizar conversiones entre monedas fiat y criptomonedas. La solución debe incluir:

- Arquitectura modular y escalable.
- Seguridad básica con autenticación.
- Consulta en tiempo real a un proveedor de precios (por ejemplo, la API de Cryptomkt) o su simulación.
- Documentación clara y concisa(deseable).
- Pruebas unitarias y de integración (opcional).

> **💡 Nota sobre la Estructura del Proyecto:** 
> Este repositorio proporciona una estructura base que implementa el patrón Facade junto con las prácticas recomendadas de NestJS. Esta estructura es una guía para ayudarte a comenzar, pero no es un requisito estricto. Te animamos a:
> - Adaptar la estructura según tu experiencia y criterio
> - Implementar patrones alternativos si los consideras más apropiados
> - Reorganizar los módulos de la manera que mejor se ajuste a tu solución
> 
> Lo fundamental es que tu implementación mantenga los principios de código limpio, modular y mantenible.

---

## 🔍 Requerimientos Funcionales

### 1️⃣ Endpoint para Crear una Cotización

- **Método y Ruta:** `POST /quote`
- **Cuerpo de la Solicitud (JSON):**
  
  ```json
  {
    "amount": 1000000,
    "from": "ARS",
    "to": "ETH"
  }
  ```

- **Campos:**
  - **amount:** Monto a convertir.
  - **from:** Código de la moneda origen (Ej.: ARS, CLP, MXN, USDC, BTC, ETH).
  - **to:** Código de la moneda destino (Ej.: ETH, USDC, CLP, USD, ARS).

- **Proceso:**
  1. **Consulta a Proveedor de Precios:**  
     Obtener el valor de `rate` en tiempo real consultando una API externa, por ejemplo:
     ```
     https://api.exchange.cryptomkt.com/api/3/public/price/rate?from={to}&to={from}
     ```
     > **Importante:** Si no se puede integrar la API real, simula la respuesta y documenta en el README cómo se realizaría la consulta real.
  
  2. **Cálculo:**  
     Calcular el `convertedAmount` multiplicando el `amount` por el `rate` obtenido.
  
  3. **Gestión de Timestamps e Identificador:**  
     - Generar un ID único para la cotización.
     - Registrar el timestamp de generación.
     - Establecer un `expiresAt` (por ejemplo, 5 minutos después de la creación).
  
  4. **Registro de la Cotización:**  
     Almacenar en la base de datos la siguiente información:
     - Identificador único.
     - Valores de `from`, `to` y `amount`.
     - Tasa de conversión (`rate`) y `convertedAmount`.
     - Timestamp de creación y `expiresAt`.

- **Respuesta Esperada: ARS -> ETH**

  ```json
  {
    "id": "a1b2c3d4",
    "from": "ARS",
    "to": "ETH",
    "amount": 1000000,
    "rate": 0.0000023,
    "convertedAmount": 2.3,
    "timestamp": "2025-02-03T12:00:00Z",
    "expiresAt": "2025-02-03T12:05:00Z"
  }
  ```

  **Respuesta Esperada: ETH -> ARS**

  ```json
  {
  "id": "d4c3b2a1",
  "from": "ETH",
  "to": "ARS",
  "amount": 1,
  "rate": 434782.61,
  "convertedAmount": 434782.61,
  "timestamp": "2025-02-03T12:00:00Z",
  "expiresAt": "2025-02-03T12:05:00Z"
  }
  ```

---

### 2️⃣ Endpoint para Obtener una Cotización

- **Método y Ruta:** `GET /quote/:id`
- **Proceso:**
  - Recuperar la cotización desde la base de datos utilizando el ID proporcionado.
  - Validar que la cotización aún sea válida (es decir, que el timestamp actual no supere el valor de `expiresAt`).
- **Respuesta:**
  - Si la cotización existe y es válida, devolver la información completa en formato JSON (similar al ejemplo anterior).
  - En caso contrario, responder con el código HTTP adecuado (por ejemplo, `404 Not Found`).

---

### 3️⃣ Registro de Cotizaciones

Cada cotización generada debe registrarse en la base de datos con los siguientes datos:

- **ID único** de la cotización.
- Valores de `from`, `to` y `amount`.
- Tasa de conversión (`rate`) y monto convertido (`convertedAmount`).
- Timestamps de creación y `expiresAt`.

#### Opciones de Base de Datos:
- **Opción 1:** MongoDB con Mongoose.
- **Opción 2:** PostgreSQL con Prisma.

> **Selecciona** la opción con la que te sientas más cómodo y **documenta** tu elección en este README.

---

## 🔒 Seguridad

### Autenticación

- **Protege** ambos endpoints implementando autenticación con JWT (JSON Web Tokens).
- Utiliza un **Guard** o middleware en NestJS para verificar la presencia y validez del JWT en el header `Authorization`.
- Implementa endpoints para registro y login que generen y validen los JWT.
- En caso de no proporcionar un token o ser inválido, la API debe retornar un error `401 Unauthorized`.

---

## 💻 Front-End (Opcional)

### Objetivo

Desarrolla una interfaz utilizando Next.js que permita:

- **Crear Cotizaciones:**  
  Un formulario donde el usuario ingrese `amount`, `from` y `to` para generar una cotización.
  
- **Consultar Cotizaciones:**  
  Un campo para ingresar el ID de la cotización y mostrar sus detalles.

#### Consideraciones:
- La aplicación debe ser desarrollada utilizando Next.js
- La interfaz debe integrarse con la API desarrollada
- Su desarrollo es opcional para la aprobación de esta prueba

---

## 🤖 Uso de Inteligencia Artificial

Se permite y fomenta el uso de herramientas de IA (como ChatGPT, GitHub Copilot, etc.) para el desarrollo de esta prueba técnica. Sin embargo, se requiere:

- Mencionar en el README qué herramientas de IA se utilizaron
- Explicar brevemente cómo se aprovecharon estas herramientas
- Asegurarse de entender y poder explicar todo el código generado por IA
- Mantener un balance entre el código generado por IA y el desarrollo propio

El uso de IA debe ser un complemento para mejorar la eficiencia del desarrollo, no un sustituto del entendimiento técnico.

---

## 🛠 Requerimientos de Calidad y Herramientas

- **Testing:**  
  Implementa pruebas unitarias básicas para la lógica de negocio (por ejemplo, en los servicios que gestionan las cotizaciones).

- **Linter y Formateo:**  
  Utiliza ESLint y Prettier para mantener un código limpio, legible y coherente.

- **Documentación:**  
  Este archivo README.md debe incluir:
  - Instrucciones para levantar la aplicación localmente (o con Docker, si decides implementarlo).
  - Cómo ejecutar las pruebas.
  - Detalles de las variables de entorno (incluye un archivo de ejemplo, como `.env.example`).
  - La elección de la base de datos y cualquier configuración especial.

- **Dockerización (Opcional):**  
  Si dockerizas la aplicación, incluye un `Dockerfile` y/o `docker-compose.yml` con instrucciones para levantar tanto la aplicación como la base de datos en contenedores.

---

## 🎯 Expectativas del Desarrollador

- **Calidad y Claridad:**  
  - Código modular, limpio y bien documentado.
  - Fácil mantenimiento y comprensión del mismo.
  
- **Buenas Prácticas:**  
  - Uso correcto de NestJS e inyección de dependencias.
  - Aplicación de principios SOLID.
  - Implementación del patrón Facade para centralizar la lógica de negocio.
  
- **Seguridad y Testing:**  
  - Autenticación efectiva.
  - Pruebas unitarias y de integración para respaldar la funcionalidad.
  
- **Documentación Completa:**  
  Asegúrate de que el README ofrezca toda la información necesaria para levantar la aplicación, configurar variables de entorno y ejecutar pruebas.

- **Front-End (Opcional):**  
  Su integración con el back-end deberá ser funcional y demostrar la capacidad de crear y consultar cotizaciones.

---

## 📦 Instrucciones de Entrega

- **Repositorio:**
  - Antes de comenzar, haz un fork de este repositorio para que tu solución se base en esta plantilla.
  - El código debe subirse a un repositorio **público** en GitHub.
  - Se te proporcionará un correo electrónico al cual deberás dar acceso como colaborador del repositorio para la revisión del código.
  - Alternativamente, puedes enviar un archivo ZIP que incluya la carpeta `.git` para mantener el historial de commits.
  
  > **Nota:** Si eliges la opción del ZIP, asegúrate de que el archivo incluya todo el historial de Git para poder evaluar la evolución del desarrollo.

- **README.md:**  
  - Incluir instrucciones detalladas para levantar la aplicación (back-end y front-end si aplica).
  - Explicar cómo ejecutar las pruebas.
  - Documentar la configuración de variables de entorno y otra información relevante.
  - Si implementas Docker, describe los pasos para levantar los contenedores.

- **Código y Documentación:**  
  Verifica que el código compile correctamente y la aplicación funcione sin errores. Asegúrate de que este README sea claro, completo y atractivo para otros desarrolladores.

---

### 🚀 ¡Buena suerte y a codificar! 👩‍💻👨‍💻