import "./Fastview.css"; // CSS específico para Fastview

function Fastview() {
  return (
    <div className="fastview-container">
      <h2>Vista Rápida del Inventario</h2>
      
      <div className="quick-stats">
        <div className="stat-card">
          <h3>Total Productos</h3>
          <span className="stat-number">150</span>
        </div>
        <div className="stat-card">
          <h3>Bajo Stock</h3>
          <span className="stat-number warning">12</span>
        </div>
        <div className="stat-card">
          <h3>Sin Stock</h3>
          <span className="stat-number danger">3</span>
        </div>
      </div>

      <div className="quick-actions">
        <button className="btn-primary quick-btn">Agregar Producto</button>
        <button className="btn-primary quick-btn">Generar Reporte</button>
      </div>

      <div className="recent-movements">
        <h3>Movimientos Recientes</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Movimiento</th>
              <th>Cantidad</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Producto A</td>
              <td>Entrada</td>
              <td>+20</td>
              <td>22/06/2025</td>
            </tr>
            <tr>
              <td>Producto B</td>
              <td>Salida</td>
              <td>-5</td>
              <td>22/06/2025</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Fastview;