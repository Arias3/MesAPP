import React from 'react';
import Select from 'react-select';

const opciones = Array.from({ length: 13 }, (_, i) => ({
  value: i + 1,
  label: (i + 1).toString()
}));

function TableSelector({ mesa, setMesa }) {
  return (
    <Select
      options={opciones}
      value={opciones.find(o => o.value === mesa)}
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
          color: '#111',
          backgroundColor: state.isSelected
            ? '#e6e6e6'
            : state.isFocused
              ? '#f5f5f5'
              : '#fff',
        }),
      }}
    />
  );
}

export default TableSelector;