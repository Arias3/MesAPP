import styles from "./module.module.css";

const Plus = ({ initialValue, step, onSum }) => {
  const handleSum = () => {
    const newValue = initialValue + step;
    onSum(newValue); // Envía el nuevo valor al padre (Inventario)
  };

  return (
    <button onClick={handleSum} className={styles.btnPlusInventary}>
      Sumar: {initialValue + step}
    </button>
  );
};

export default Plus;