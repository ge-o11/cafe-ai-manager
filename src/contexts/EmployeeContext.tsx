import React, { createContext, useContext, useState } from 'react';

export interface ActiveEmployee {
  id: string;
  name: string;
  employee_number: string;
}

interface EmployeeContextType {
  currentEmployee: ActiveEmployee | null;
  setCurrentEmployee: (e: ActiveEmployee | null) => void;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

const KEY = 'cafe_active_employee';

export const EmployeeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentEmployee, setCurrentEmployeeState] = useState<ActiveEmployee | null>(() => {
    try {
      const s = sessionStorage.getItem(KEY);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const setCurrentEmployee = (e: ActiveEmployee | null) => {
    setCurrentEmployeeState(e);
    if (e) sessionStorage.setItem(KEY, JSON.stringify(e));
    else sessionStorage.removeItem(KEY);
  };

  return (
    <EmployeeContext.Provider value={{ currentEmployee, setCurrentEmployee }}>
      {children}
    </EmployeeContext.Provider>
  );
};

export const useEmployee = () => {
  const ctx = useContext(EmployeeContext);
  if (!ctx) throw new Error('useEmployee must be used within EmployeeProvider');
  return ctx;
};
