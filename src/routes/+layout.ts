import "iconify-icon";

import "../reset.css";
import "../variables.css";
import "../main.css";

import type { LayoutLoad } from './$types';


export const prerender = true;
export const ssr = false;

export const load: LayoutLoad = ({ url }) => {
  return {
    url: url.pathname,
  };
}
