# La carta de La Alacena

API REST en PHP y MySQL para gestionar los platos de la carta de un restaurante, más una página web que muestra la carta con estilo mediterráneo.

Es la práctica guiada «La carta del restaurante» del certificado IFCD0210, módulo UF1846.

## Estructura del proyecto

```
api_carta/
├── api/                      # La API REST (PHP)
│   ├── .htaccess             # Envía todas las peticiones a index.php y deja pasar la cabecera Authorization
│   ├── index.php             # Punto de entrada: lee el método y la ruta y llama a la función adecuada
│   ├── platos.php            # Operaciones sobre los platos (listar, ver, crear, modificar, borrar)
│   ├── ayudas.php            # Respuestas JSON, errores, lectura del cuerpo y comprobación de la clave
│   ├── conexion.php          # Conexión PDO con MySQL
│   ├── config_example.php    # Plantilla de configuración
│   └── config.php            # Configuración real (no se sube a git)
├── datos/
│   └── carta.sql             # Crea la base de datos `carta`, la tabla `platos` y 9 platos de ejemplo
├── css/
│   └── estilos.css           # Estilo de la carta: restaurante mediterráneo
├── js/
│   └── funciones.js          # Pide los platos a la API y los pinta en la página
├── index.html                # Página pública con la carta
├── docs.html                 # Documentación interactiva de la API (Swagger UI)
├── openapi.yaml              # Contrato de la API en formato OpenAPI 3.1
├── carta.postman_collection.json
└── pruebas/
    └── La carta de La Alacena.postman_collection.json   # Pruebas de la API para Postman
```

## Pasos realizados

### 1. Base de datos

El archivo [datos/carta.sql](datos/carta.sql) crea la base de datos `carta` con una sola tabla, `platos`:

| Columna      | Tipo                                     | Reglas                       |
|--------------|------------------------------------------|------------------------------|
| `id`         | `INT AUTO_INCREMENT`                     | Clave primaria               |
| `nombre`     | `VARCHAR(80)`                            | Obligatorio y único          |
| `categoria`  | `ENUM('entrante','principal','postre')`  | Obligatoria                  |
| `precio`     | `DECIMAL(6,2)`                           | Obligatorio, mayor que 0     |
| `disponible` | `BOOLEAN`                                | Por defecto `TRUE`           |

También inserta 9 platos de ejemplo: 3 entrantes, 3 principales y 3 postres.

### 2. Configuración y conexión

- [api/config_example.php](api/config_example.php) es la plantilla con los datos de conexión (`bd_dsn`, `bd_usuario`, `bd_clave`) y la clave de la API (`clave_api`).
- Cada instalación copia la plantilla a `api/config.php` y la rellena. Ese archivo está en [.gitignore](.gitignore) para que las contraseñas no se suban al repositorio.
- [api/conexion.php](api/conexion.php) abre la conexión con PDO. Los errores lanzan excepciones y los resultados se devuelven como arrays asociativos.

### 3. Enrutado con un único punto de entrada

- [api/.htaccess](api/.htaccess) usa `FallbackResource` para que cualquier ruta (`/api/platos`, `/api/platos/3`…) llegue a `index.php`. También configura Apache para que la cabecera `Authorization` llegue a PHP.
- [api/index.php](api/index.php) separa la ruta en partes (`platos`, `3`), pide la clave en las operaciones que cambian datos y envía cada combinación de método y ruta a su función con `match`.

### 4. Funciones de ayuda

En [api/ayudas.php](api/ayudas.php):

- `responder()` envía el código de estado y el JSON.
- `error()` envía errores con el formato `{"error": "…"}`.
- Un manejador de excepciones convierte cualquier fallo no previsto en un `500` sin mostrar detalles técnicos al cliente.
- `metodoNoPermitido()` responde `405` con la cabecera `Allow`.
- `leerJson()` lee el cuerpo de la petición y responde `400` si no es un objeto JSON.
- `exigirClave()` comprueba `Authorization: Bearer <clave>` con `hash_equals` y responde `401` si falta o no coincide.

### 5. Operaciones sobre los platos

En [api/platos.php](api/platos.php), cada ruta tiene su función. Todas las consultas usan sentencias preparadas.

| Método   | Ruta                              | Qué hace                                | Clave |
|----------|-----------------------------------|-----------------------------------------|-------|
| `GET`    | `/api/`                           | Información de la API                   | No    |
| `GET`    | `/api/platos`                     | Lista todos los platos                  | No    |
| `GET`    | `/api/platos?categoria=postre`    | Lista los platos de una categoría       | No    |
| `GET`    | `/api/platos/{id}`                | Devuelve un plato                       | No    |
| `POST`   | `/api/platos`                     | Crea un plato (`201` + `Location`)      | Sí    |
| `PUT`    | `/api/platos/{id}`                | Sustituye un plato                      | Sí    |
| `DELETE` | `/api/platos/{id}`                | Borra un plato (`204`)                  | Sí    |

`validarPlato()` comprueba los datos antes de guardarlos y, si algo falla, responde `422` con la lista de errores por campo. Estas son las reglas:

- el nombre tiene de 1 a 80 caracteres;
- la categoría es una de las tres permitidas;
- el precio es un número mayor que 0 y menor que 10000;
- `disponible` es `true` o `false`.

Si se intenta guardar un nombre que ya existe, la API responde `409`.

### 6. Documentación

- [openapi.yaml](openapi.yaml) describe la API en OpenAPI 3.1: rutas, parámetros, esquemas (`Plato`, `PlatoNuevo`, `Error`), respuestas y seguridad con Bearer.
- [docs.html](docs.html) carga ese contrato en Swagger UI para consultarlo y probarlo desde el navegador.

### 7. Pruebas con Postman

La colección de [pruebas/](pruebas/) tiene 16 peticiones ordenadas que cubren:

- los casos correctos: listar, filtrar, ver, crear, modificar y borrar;
- los errores: categoría no válida, plato o ruta inexistente, petición sin clave, datos no válidos, nombre repetido, método no permitido y borrado de un plato ya borrado.

Las peticiones usan dos variables de colección: `base` (dirección de la API) y `clave` (clave de la API).

### 8. Página de la carta (front-end)

- [index.html](index.html) es la página pública. Tiene un contenedor `#carta` vacío que se rellena con JavaScript.
- [js/funciones.js](js/funciones.js) pide los platos a la API con `fetch`, comprueba que la respuesta sea correcta y crea una tarjeta `.plato` por cada uno, con nombre, descripción y precio.

### 9. Estilo de restaurante mediterráneo

[css/estilos.css](css/estilos.css) le da a la carta el aspecto de un restaurante mediterráneo:

- **Paleta:** azul Egeo, blanco cal, terracota, verde oliva y amarillo limón, definida como variables CSS en `:root`.
- **Fuentes:** *Playfair Display* para los títulos y *Lato* para el texto, cargadas desde Google Fonts.
- **Fondo:** color arena con un dibujo suave de azulejo hecho solo con gradientes, sin imágenes.
- **Cabecera:** fondo azul con el subtítulo «Cocina mediterránea» y una línea amarilla debajo.
- **Platos:** tarjetas en una rejilla que se adapta al ancho (`grid` + `auto-fit`), con un borde terracota, una ramita 🌿 y el precio destacado. Al pasar el ratón, la tarjeta sube un poco.
- **Responsive:** en pantallas pequeñas se reducen los márgenes.

## Instalación y puesta en marcha (XAMPP)

1. Copia el proyecto en `C:\xampp\htdocs\api_carta`.
2. Arranca **Apache** y **MySQL** desde el panel de XAMPP.
3. Abre phpMyAdmin (`http://localhost/phpmyadmin`), entra en la pestaña **Importar** y elige `datos/carta.sql`.
4. Copia `api/config_example.php` a `api/config.php` y rellénalo:
   ```php
   return [
       'bd_dsn'     => 'mysql:host=localhost;dbname=carta;charset=utf8mb4',
       'bd_usuario' => 'root',
       'bd_clave'   => '',
       'clave_api'  => 'una-clave-secreta-larga',
   ];
   ```
5. Comprueba que funciona:
   - API: <http://localhost/api_carta/api/platos>
   - Carta: <http://localhost/api_carta/>
   - Documentación: <http://localhost/api_carta/docs.html>

### Probar con Postman

1. Importa la colección de la carpeta `pruebas/`.
2. En las variables de la colección, pon en `base` la dirección `http://localhost/api_carta/api`. Ahora mismo vale `http://localhost/carta/api`, que no coincide con la carpeta de este proyecto.
3. Pon en `clave` el mismo valor que `clave_api` en `config.php`.
4. Ejecuta la colección entera con **Run collection**, en orden.

## Pendiente

- **La descripción de los platos:** [js/funciones.js](js/funciones.js) muestra `plato.descripcion`, pero ni la tabla `platos` ni la API tienen ese campo, así que la carta muestra «undefined». Hay dos soluciones:
  - añadir una columna `descripcion` a la tabla, a la validación, a la función `plato()` y a `openapi.yaml`;
  - o mostrar la categoría en su lugar, con `plato.categoria`.
- **Los platos no disponibles:** la API devuelve todos los platos, también los que tienen `disponible: false`. Habría que decidir si la carta los oculta o los marca como agotados.
- **Las direcciones de los ejemplos:** `openapi.yaml` y las colecciones de Postman usan rutas distintas en algunos ejemplos (`/carta/api` y `/api_carta/api`). Conviene dejarlas todas iguales.
