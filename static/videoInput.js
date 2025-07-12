let selectedFile = null;

// Referencias a elementos del DOM
const uploadArea = document.getElementById('uploadArea');
const videoInput = document.getElementById('videoInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const fileType = document.getElementById('fileType');
const videoPreview = document.getElementById('videoPreview');
const previewVideo = document.getElementById('previewVideo');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const uploadBtn = document.getElementById('uploadBtn');

// Event listeners
uploadArea.addEventListener('click', () => {
    videoInput.click();
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelection(files[0]);
    }
});

videoInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelection(e.target.files[0]);
    }
});

// Función para manejar la selección de archivo
function handleFileSelection(file) {
    // Validar que sea un archivo MP4
    if (!file.type.includes('mp4')) {
        alert('Por favor, selecciona solo archivos MP4.');
        return;
    }
    
    // Validar tamaño (máximo 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB en bytes
    if (file.size > maxSize) {
        alert('El archivo es demasiado grande. Máximo 100MB.');
        return;
    }
    
    selectedFile = file;
    displayFileInfo(file);
    createVideoPreview(file);
    uploadBtn.disabled = false;
}

// Función para mostrar información del archivo
function displayFileInfo(file) {
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileType.textContent = file.type;
    fileInfo.style.display = 'block';
}

// Función para crear vista previa del video
function createVideoPreview(file) {
    const videoURL = URL.createObjectURL(file);
    previewVideo.src = videoURL;
    videoPreview.style.display = 'block';
    
    // Limpiar URL cuando el video se carga
    previewVideo.addEventListener('loadeddata', () => {
        URL.revokeObjectURL(videoURL);
    });
}

// Función para formatear el tamaño del archivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Función para quitar archivo seleccionado
function removeFile() {
    selectedFile = null;
    videoInput.value = '';
    fileInfo.style.display = 'none';
    videoPreview.style.display = 'none';
    uploadProgress.style.display = 'none';
    uploadBtn.disabled = true;
    
    // Limpiar la fuente del video
    previewVideo.src = '';
}

// Función para subir el archivo al backend
async function uploadFile() {
    if (!selectedFile) {
        alert('No hay archivo seleccionado.');
        return;
    }

    uploadProgress.style.display = 'block';
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Subiendo...';


    const formData = new FormData();
    formData.append('file', selectedFile);


    try {
        const response = await fetch('/upload_video', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            // window.location.href = '/images';
        } else {
            alert('Error al subir el video.');
        }
    } catch (error) {
        alert('Error de red al subir el video.');
    }

    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Subir Video';
}

// Función para resetear el estado después de la subida
function resetUploadState() {
    uploadProgress.style.display = 'none';
    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Subir Video';
    progressFill.style.width = '0%';
    progressText.textContent = '0%';
}

// Prevenir comportamiento por defecto del drag and drop en toda la página
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    document.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}