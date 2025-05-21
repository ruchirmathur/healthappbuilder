import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect } from "react";

export const AutoLogin: React.FC = () => {
  const { isAuthenticated, loginWithRedirect } = useAuth0();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      if (!isAuthenticated) {
        await loginWithRedirect({
          appState: {
            returnTo: "/admin",
          },
        });
      }
    };

    checkAuthAndRedirect();
  }, [isAuthenticated, loginWithRedirect]);

  return null; // Render nothing as this component's purpose is just to handle redirection
};