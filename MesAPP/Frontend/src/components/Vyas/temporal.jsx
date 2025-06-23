import { useState } from "react";
import Plus from "../../components/button/plus";
import Minus from "../../components/button/minus";

function temporal() {
  const [sharedCount, setSharedCount] = useState(0); // Estado compartido

  return (
    <div>
      <h1>Inventario</h1>
      <p>Valor actual: {sharedCount}</p>
      
      <Plus 
        initialValue={sharedCount} 
        step={1} 
        onSum={(newValue) => setSharedCount(newValue)} 
      />
      
      <Minus 
        initialValue={sharedCount} 
        step={1} 
        onSubtract={(newValue) => setSharedCount(newValue)} 
      />
    </div>
  );
}

export default Inventario;