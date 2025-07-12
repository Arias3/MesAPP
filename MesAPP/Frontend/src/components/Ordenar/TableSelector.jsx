import React, { useEffect, useState } from 'react';
import Select from 'react-select';

function TableSelector({ mesa, setMesa }) {
  const [cantidadMesas, setCantidadMesas] = useState(0);

  useEffect(() => {
    const API_HOST = import.meta.env.VITE_API_HOST;
    const API_PORT = import.meta.env.VITE_API_PORT || 5000;
    fetch(`http://${API_HOST}:${API_PORT}/api/mesas/count`)
      .then(res => res.json())
      .then(data => setCantidadMesas(data.count || 0))
      .catch(() => setCantidadMesas(0));
  }, []);

  const opciones = [
    { value: null, label: '' },
    { value: 0, label: 'Mostrador' },
    ...Array.from({ length: cantidadMesas }, (_, i) => ({
      value: i + 1,
      label: (i + 1).toString()
    }))
  ];

  return (
    <Select
      options={opciones}
      value={opciones.find(o => o.value === mesa) || opciones[0]}
      onChange={option => setMesa(option.value)}
      placeholder="Selecciona mesa"
      styles={{
        control: (base) => ({
          ...base,
          background: '#fff',
          borderColor: '#b0b0b0',
          minWidth: 80,
          width: 'clamp(80px, 15vw, 180px)',
          color: '#111',
        }),
        singleValue: (base) => ({
          ...base,
          color: '#111',
        }),
        input: (base) => ({
          ...base,
          color: '#111',
        }),
        menu: (base) => ({
          ...base,
          zIndex: 9999,
        }),
        option: (base, state) => ({
          ...base,
          color: state.isDisabled ? '#aaa' : '#111',
          backgroundColor: state.isSelected
            ? '#e6e6e6'
            : state.isFocused
              ? '#f5f5f5'
              : '#fff',
          cursor: state.isDisabled ? 'not-allowed' : 'pointer',
        }),
      }}
    />
  );
}

export default TableSelector;