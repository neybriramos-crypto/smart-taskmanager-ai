import React from 'react';

const ModalConfirmacion = ({ isOpen, mensaje, onConfirmar, onCancelar }) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onCancelar()}>
      <div style={styles.modal}>
        <div style={{ marginBottom: 12 }}>{mensaje}</div>
        <div style={styles.botones}>
          <button style={styles.btnCancelar} onClick={onCancelar}>Cancelar</button>
          <button style={styles.btnAceptar} onClick={onConfirmar}>Aceptar</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#1a1a2e', padding: '20px', borderRadius: '8px', color: '#fff', textAlign: 'center', minWidth: 280 },
  botones: { marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' },
  btnAceptar: { padding: '8px 16px', backgroundColor: '#e74c3c', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '4px' },
  btnCancelar: { padding: '8px 16px', backgroundColor: '#555', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '4px' }
};

export default ModalConfirmacion;
