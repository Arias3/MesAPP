import React from 'react';
import Select from 'react-select';

const opciones = [
  { value: null, label: '' }, // Opción en blanco
  ...Array.from({ length: 13 }, (_, i) => ({
    value: i + 1,
    label: (i + 1).toString()
  }))
];

function TableSelector({ mesa, setMesa, mesasOcupadas = [] }) {
  // Marca como deshabilitadas las mesas ocupadas
  const opcionesFiltradas = opciones.map(opt => ({
    ...opt,
    isDisabled: opt.value !== null && mesasOcupadas.includes(opt.value)
  }));

  return (
    <Select
      options={opcionesFiltradas}
      value={opcionesFiltradas.find(o => o.value === mesa) || opcionesFiltradas[0]}
      onChange={option => setMesa(option.value)}
      placeholder="Selecciona mesa"
      isOptionDisabled={option => option.isDisabled}
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