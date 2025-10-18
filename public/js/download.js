// ===== DOWNLOAD.JS - Script para la página de descarga =====

document.addEventListener('DOMContentLoaded', function() {
    // Animar elementos cuando se cargan
    const animatedElements = document.querySelectorAll('.download-card, .requirements, .warning-box');
    animatedElements.forEach((element, index) => {
        setTimeout(() => {
            element.style.opacity = '1';
        }, index * 200);
    });

    // Configuración de descarga desde GitHub Releases
    const DOWNLOAD_URL = 'https://github.com/JuanOicata/SafePlay_Web/releases/download/v1.0.0/SafePlay-Setup-1.0.0.exe';

    // Manejar el botón de descarga principal
    const mainDownloadBtn = document.getElementById('mainDownloadBtn');

    if (mainDownloadBtn) {
        mainDownloadBtn.addEventListener('click', function(e) {
            e.preventDefault();

            // Mostrar feedback visual al usuario
            const originalText = this.innerHTML;
            const originalOpacity = this.style.opacity;

            // Estado de "cargando"
            this.innerHTML = '<span>⏳</span> Iniciando descarga...';
            this.style.opacity = '0.7';
            this.style.pointerEvents = 'none'; // Evitar múltiples clics

            // Simular tiempo de preparación y luego descargar
            setTimeout(() => {
                try {
                    // Iniciar la descarga directa desde GitHub Releases
                    window.location.href = DOWNLOAD_URL;

                    // Mostrar confirmación al usuario
                    setTimeout(() => {
                        this.innerHTML = '<span>✅</span> Descarga iniciada';

                        // Restaurar botón después de 3 segundos
                        setTimeout(() => {
                            this.innerHTML = originalText;
                            this.style.opacity = originalOpacity || '1';
                            this.style.pointerEvents = 'auto';
                        }, 3000);
                    }, 500);

                } catch (error) {
                    console.error('Error al iniciar descarga:', error);

                    // En caso de error, mostrar mensaje y restaurar botón
                    alert('Error al iniciar la descarga. Por favor, inténtalo de nuevo o contacta con soporte.');
                    this.innerHTML = originalText;
                    this.style.opacity = originalOpacity || '1';
                    this.style.pointerEvents = 'auto';
                }
            }, 800);
        });
    }

    // Funcionalidad adicional: tracking de descargas (opcional)
    function trackDownload() {
        // Aquí puedes agregar analytics o tracking si lo necesitas
        console.log('Descarga de SafePlay.exe iniciada desde:', window.location.href);

        // Ejemplo de tracking con Google Analytics (si lo usas):
        // gtag('event', 'download', {
        //     'event_category': 'engagement',
        //     'event_label': 'SafePlay.exe'
        // });
    }

    // Verificar si el navegador soporta descargas
    function checkDownloadSupport() {
        if (!window.location || typeof window.location.href !== 'string') {
            console.warn('El navegador podría no soportar descargas automáticas');
            return false;
        }
        return true;
    }

    // Inicializar verificación
    if (!checkDownloadSupport()) {
        console.warn('Verificar compatibilidad del navegador para descargas');
    }

    // Manejar errores de red (opcional)
    window.addEventListener('online', function() {
        console.log('Conexión restaurada - descargas disponibles');
    });

    window.addEventListener('offline', function() {
        console.warn('Sin conexión - las descargas podrían fallar');
    });
});

// Función para copiar el enlace de descarga (funcionalidad extra)
function copyDownloadLink() {
    const downloadUrl = 'https://github.com/JuanOicata/SafePlay_Web/releases/download/v1.0.0/win-unpacked.zip';

    if (navigator.clipboard) {
        navigator.clipboard.writeText(downloadUrl).then(() => {
            alert('Enlace de descarga copiado al portapapeles');
        }).catch(err => {
            console.error('Error al copiar:', err);
            fallbackCopyTextToClipboard(downloadUrl);
        });
    } else {
        fallbackCopyTextToClipboard(downloadUrl);
    }
}

// Fallback para navegadores que no soportan navigator.clipboard
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            alert('Enlace de descarga copiado al portapapeles');
        } else {
            console.error('Falló el copiado con execCommand');
        }
    } catch (err) {
        console.error('execCommand no soportado:', err);
        alert('No se pudo copiar automáticamente. El enlace es:\n' + text);
    }

    document.body.removeChild(textArea);
}