// Funcionalidad del Modal de Términos y Condiciones
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('termsModal');
    const openModalLink = document.getElementById('openTermsModal');
    const closeModalBtn = document.getElementById('closeModal');

    // Verificar que los elementos existen
    if (!modal || !openModalLink || !closeModalBtn) {
        console.error('No se encontraron los elementos del modal');
        return;
    }

    // Abrir modal
    openModalLink.addEventListener('click', function(e) {
        e.preventDefault();
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    });

    // Cerrar modal con el botón X
    closeModalBtn.addEventListener('click', function() {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    });

    // Cerrar modal al hacer clic fuera del contenido
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    });

    // Cerrar modal con tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    });
});