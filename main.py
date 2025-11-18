import cv2
from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import os


app = FastAPI(
    title="frames-app",
    description="API para capturar fotogramas de videos y guardarlos como imágenes.",
    version="0.1.0",
)


app.mount("/static", StaticFiles(directory="static"), name="static")


templates = Jinja2Templates(directory="templates")


@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/images", response_class=HTMLResponse)
async def images(request: Request):
    fotos_dir = os.path.join("static", "fotos")
    images = []
    if os.path.exists(fotos_dir):
        for filename in sorted(os.listdir(fotos_dir)):
            if filename.endswith(".jpg"):
                nombre = os.path.splitext(filename)[0]
                images.append({
                    "nombre": nombre,
                    "src": f"/static/fotos/{filename}"
                })
    return templates.TemplateResponse("images.html", {"request": request, "images": images})



@app.post("/upload_video")
async def upload_video(request: Request, file: UploadFile = File(...)):
    # Carpeta y nombre base automáticos
    carpeta = "output"
    save_dir = os.path.join("..", carpeta, "videos")
    os.makedirs(save_dir, exist_ok=True)
    file_path = os.path.join(save_dir, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())
    # Limpiar carpeta fotos antes de guardar nuevas imágenes
    fotos_dir = os.path.join("static", "fotos")
    if os.path.exists(fotos_dir):
        for f in os.listdir(fotos_dir):
            try:
                os.remove(os.path.join(fotos_dir, f))
            except Exception:
                pass
    else:
        os.makedirs(fotos_dir, exist_ok=True)
    images = await capturar_fotogramas(file_path, fotos_dir)
    return templates.TemplateResponse("images.html", {"request": request, "images": images})


async def capturar_fotogramas(video, fotos_dir, intervalo=1):
    """
    Captura fotogramas de un video cada cierto intervalo de tiempo.

    Args:
        video_path (str): La ruta al archivo de video.
        nombre (str): El nombre base para los archivos de imagen.
        intervalo (int): El intervalo de tiempo en segundos entre capturas.
    """
    respuesta = []
    cap = cv2.VideoCapture(video)

    if not cap.isOpened():
        print("Error: No se pudo abrir el archivo de video.")
        return

    frame_rate = cap.get(cv2.CAP_PROP_FPS)
    contador_fotogramas = 0
    tiempo_actual = 0

    while True:
        tmp = dict()
        ret, frame = cap.read()

        if not ret:
            break

        tiempo_en_segundos = contador_fotogramas / frame_rate

        if tiempo_en_segundos >= tiempo_actual:
            nombre_archivo = f"t={int(tiempo_actual)}s.jpg"
            ruta_completa = os.path.join(fotos_dir, nombre_archivo)
            cv2.imwrite(ruta_completa, frame)
            tiempo_actual += intervalo
            tmp["nombre"] = f't={int(tiempo_actual)}s'
            tmp["src"] = f"/static/fotos/{nombre_archivo}"
            respuesta.append(tmp)

        contador_fotogramas += 1

    cap.release()
    cv2.destroyAllWindows()
    return respuesta

