import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  open: boolean;
  type: 'login' | 'signup' | null;
  openModal: (type: 'login' | 'signup') => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
};

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'login' | 'signup' | null>(null);

  const openModal = (modalType: 'login' | 'signup') => {
    setType(modalType);
    setOpen(true);
  };
  const closeModal = () => {
    setOpen(false);
    setType(null);
  };

  return (
    <ModalContext.Provider value={{ open, type, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};
