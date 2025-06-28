import React from 'react';
import { AlertTriangle, CheckCircle, Info, X, Trash2 } from 'lucide-react';
import './ConfirmationModal.css';

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning', // 'warning', 'danger', 'info', 'success'
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  showCancel = true,
  isLoading = false
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 className="confirmation-modal__icon confirmation-modal__icon--danger" />;
      case 'warning':
        return <AlertTriangle className="confirmation-modal__icon confirmation-modal__icon--warning" />;
      case 'info':
        return <Info className="confirmation-modal__icon confirmation-modal__icon--info" />;
      case 'success':
        return <CheckCircle className="confirmation-modal__icon confirmation-modal__icon--success" />;
      default:
        return <Info className="confirmation-modal__icon confirmation-modal__icon--info" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'confirmation-modal__button confirmation-modal__button--danger';
      case 'warning':
        return 'confirmation-modal__button confirmation-modal__button--warning';
      case 'success':
        return 'confirmation-modal__button confirmation-modal__button--success';
      default:
        return 'confirmation-modal__button confirmation-modal__button--primary';
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div className="confirmation-modal__overlay" onClick={handleOverlayClick}>
      <div className="confirmation-modal__content">
        <div className="confirmation-modal__header">
          <div className="confirmation-modal__header-content">
            {getIcon()}
            <h3 className="confirmation-modal__title">{title}</h3>
          </div>
          <button 
            className="confirmation-modal__close" 
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X />
          </button>
        </div>
        
        <div className="confirmation-modal__body">
          <p className="confirmation-modal__message">{message}</p>
        </div>
        
        <div className="confirmation-modal__actions">
          {showCancel && (
            <button 
              className="confirmation-modal__button confirmation-modal__button--secondary"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {cancelText}
            </button>
          )}
          <button 
            className={getConfirmButtonClass()}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="confirmation-modal__loading">
                <div className="confirmation-modal__spinner"></div>
                Procesando...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook personalizado para usar el modal de confirmación
export const useConfirmationModal = () => {
  const [modalConfig, setModalConfig] = React.useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    showCancel: true,
    onConfirm: () => {},
    onClose: () => {}
  });

  const showConfirmation = (config) => {
    return new Promise((resolve) => {
      setModalConfig({
        ...config,
        isOpen: true,
        onConfirm: () => {
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onClose: () => {
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  return {
    ConfirmationModalComponent: () => <ConfirmationModal {...modalConfig} />,
    showConfirmation,
    closeModal
  };
};

// Configuraciones predefinidas para casos comunes
export const confirmationPresets = {
  deleteRow: {
    title: '¿Eliminar esta fila?',
    message: 'Esta acción eliminará completamente la fila seleccionada. Esta acción no se puede deshacer.',
    type: 'danger',
    confirmText: 'Sí, eliminar',
    cancelText: 'Cancelar'
  },
  
  cancelChanges: {
    title: '¿Cancelar edición?',
    message: 'Se perderán todos los cambios realizados. ¿Está seguro de que desea cancelar?',
    type: 'warning',
    confirmText: 'Sí, cancelar',
    cancelText: 'Continuar editando'
  },
  
  saveChanges: {
    title: 'Guardar cambios',
    message: 'Se guardarán todos los cambios realizados. ¿Desea continuar?',
    type: 'success',
    confirmText: 'Guardar',
    cancelText: 'Revisar'
  },
  
  validationError: {
    title: 'Campos incompletos',
    message: 'Hay campos obligatorios sin completar. Por favor, revise las filas marcadas con errores.',
    type: 'warning',
    confirmText: 'Entendido',
    showCancel: false
  },
  
  deleteProduct: {
    title: '¿Eliminar producto?',
    message: 'Esta acción eliminará permanentemente el producto seleccionado. Esta acción no se puede deshacer.',
    type: 'danger',
    confirmText: 'Sí, eliminar',
    cancelText: 'Cancelar'
  }
};