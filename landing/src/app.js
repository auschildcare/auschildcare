import React from 'react';
import { HelmetProvider } from 'react-helmet-async';

export const dva = {
  config: {
    onError(err) {
      err.preventDefault();
      console.error(err.message);
    },
  },
};

// to support helmet in SSR
export function rootContainer(container) {
  return React.createElement(HelmetProvider, {}, container);
}
