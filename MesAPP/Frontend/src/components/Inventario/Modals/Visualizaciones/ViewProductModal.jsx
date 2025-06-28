import { useState } from 'react';
import { X, Package, ImageIcon } from 'lucide-react';
import styles from './ViewProductModal.module.css';

function ViewProductModal({ product, onClose }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  if (!product) return null;

  // Construir la ruta de la imagen
  const getImagePath = () => {
    if (!product.image_url) return null;
    
    // Si image_url ya es una ruta completa, usarla directamente
    if (product.image_url.startsWith('http') || product.image_url.startsWith('/')) {
      return product.image_url;
    }
    
    // Si es solo el nombre del archivo, construir la ruta
    return `/src/assets/images/inventary/products/${product.image_url}`;
  };

  const imagePath = getImagePath();

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleOverlayClick = (e) => {
    // Solo cerrar si se hace click en el overlay, no en el contenido del modal
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContainer}>
        {/* Header del modal */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleSection}>
            <Package className={styles.headerIcon} />
            <h2 className={styles.modalTitle}>Vista del Producto</h2>
          </div>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Cerrar modal"
          >
            <X className={styles.closeIcon} />
          </button>
        </div>

        {/* Contenido del modal */}
        <div className={styles.modalContent}>
          
          {/* Contenedor de la imagen */}
          <div className={styles.imageContainer}>
            {imagePath && !imageError ? (
              <>
                {imageLoading && (
                  <div className={styles.imageLoader}>
                    <div className={styles.loadingSpinner}></div>
                    <span className={styles.loadingText}>Cargando imagen...</span>
                  </div>
                )}
                <img
                  src={imagePath}
                  alt={`Imagen de ${product.name}`}
                  className={`${styles.productImage} ${imageLoading ? styles.imageHidden : ''}`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              </>
            ) : (
              <div className={styles.noImageContainer}>
                <ImageIcon className={styles.noImageIcon} />
                <span className={styles.noImageText}>
                  {product.image_url ? 'Error al cargar imagen' : 'Sin imagen disponible'}
                </span>
                {product.image_url && (
                  <span className={styles.imagePathText}>
                    Ruta: {product.image_url}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Información del producto */}
          <div className={styles.productInfo}>
            <h3 className={styles.productName}>{product.name}</h3>
            
            <div className={styles.productDetails}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Stock disponible:</span>
                <span className={`${styles.detailValue} ${styles.stockValue}`}>
                  {product.stock} unidades
                </span>
              </div>
              
              {product.image_url && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Nombre de imagen:</span>
                  <span className={styles.detailValue}>
                    {product.image_url}
                  </span>
                </div>
              )}

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Código:</span>
                <span className={styles.detailValue}>
                  {product.codigo || 'N/A'}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Categoría:</span>
                <span className={styles.detailValue}>
                  {product.category}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Precio:</span>
                <span className={styles.detailValue}>
                  ${product.price?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer opcional */}
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.closeFooterButton}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ViewProductModal;