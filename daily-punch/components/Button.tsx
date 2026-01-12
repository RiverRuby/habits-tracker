import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'icon';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = "font-bold border-2 border-black transition-all active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#F4D03F] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#f1c40f] px-6 py-2 uppercase tracking-wide",
    secondary: "bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100 px-6 py-2 uppercase tracking-wide",
    icon: "bg-white p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 flex items-center justify-center aspect-square",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;