import { Auth0Provider } from "@auth0/auth0-react";
import React, { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface Auth0ProviderWithNavigateProps {
  children: ReactNode;
}

export const Auth0ProviderWithNavigate: React.FC<Auth0ProviderWithNavigateProps> = ({ children }) => {
  const navigate = useNavigate();

  // Read from environment variables injected at build time
  const domain = process.env.REACT_APP_OKTA_DOMAIN || "";
  const clientId = process.env.REACT_APP_OKTA_CLIENT_ID || "";
  const redirectUri = process.env.REACT_APP_REDIRECT_URL || window.location.origin;

  const onRedirectCallback = (appState?: { returnTo?: string }) => {
    navigate(appState?.returnTo || window.location.pathname);
  };

  // Optionally, show a warning if not configured
  if (!(domain && clientId && redirectUri)) {
    console.warn("Auth0ProviderWithNavigate: Missing Auth0 configuration.");
    return null;
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
};
