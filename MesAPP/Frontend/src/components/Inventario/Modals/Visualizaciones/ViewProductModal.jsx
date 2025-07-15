import { useState } from 'react';
import { X, Package } from 'lucide-react';
import styles from './ViewProductModal.module.css';

function ViewProductModal({ product, onClose }) {
  if (!product) return null;

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
          
          {/* Información del producto */}
          <div className={styles.productInfo}>
            <h3 className={styles.productName}>{product.name}</h3>
            
            <div className={styles.productDetails}>
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

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Costo:</span>
                <span className={styles.detailValue}>
                  ${product.cost?.toFixed(2) || '0.00'}
                </span>
              </div>
              
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Stock disponible:</span>
                <span className={`${styles.detailValue} ${styles.stockValue}`}>
                  {product.stock} {product.unity || 'unidades'}
                </span>
              </div>

              {product.barcode && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Código de Barras:</span>
                  <span className={styles.detailValue}>
                    {product.barcode}
                  </span>
                </div>
              )}

              {product.flavor_count !== undefined && product.flavor_count !== null && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Cantidad de Sabores:</span>
                  <span className={styles.detailValue}>
                    {product.flavor_count} {product.flavor_count === 1 ? 'sabor' : 'sabores'}
                  </span>
                </div>
              )}

              {product.unity && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Unidad:</span>
                  <span className={styles.detailValue}>
                    {product.unity}
                  </span>
                </div>
              )}

              {product.description && (
                <div className={`${styles.detailItem} ${styles.descriptionItem}`}>
                  <span className={styles.detailLabel}>Descripción:</span>
                  <span className={`${styles.detailValue} ${styles.descriptionValue}`}>
                    {product.description}
                  </span>
                </div>
              )}
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