import type { SVGProps } from 'react';

const Logo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    {...props}
  >
    <path fill="none" d="M0 0h256v256H0z" />
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={16}
      d="M168 224V88m-48-56v192m-48-96v96"
    />
    <path
      d="M160 88a32 32 0 0 1 64 0v128a8 8 0 0 1-8 8h-48a8 8 0 0 1-8-8Zm-48-56a32 32 0 0 1 64 0v184a8 8 0 0 1-8 8H96a8 8 0 0 1-8-8ZM64 128a32 32 0 0 1 64 0v88a8 8 0 0 1-8 8H56a8 8 0 0 1-8-8Z"
      opacity={0.2}
    />
  </svg>
);

export default Logo;
