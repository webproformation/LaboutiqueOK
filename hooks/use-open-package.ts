import { useState } from 'react';

export function useOpenPackage() {
  const [isOpenPackage, setIsOpenPackage] = useState(false);

  const toggleOpenPackage = (value: boolean) => {
    setIsOpenPackage(value);
    // On pourrait sauvegarder ça dans le localStorage ou le contexte panier ici
  };

  return {
    isOpenPackage,
    setIsOpenPackage: toggleOpenPackage
  };
}