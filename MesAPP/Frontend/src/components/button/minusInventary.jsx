import styles from "./module.module.css";

const Minus = ({ initialValue, step, onSubtract }) => {
  const handleSubtract = () => {
    const newValue = initialValue - step;
    onSubtract(newValue); // Envía el nuevo valor al padre (Inventario)
  };

  return (
    <button onClick={handleSubtract} className={styles.btnMinusInventary}>
      Restar: {initialValue - step}
    </button>
  );
};

export default Minus;