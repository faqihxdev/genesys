// import { LucideIcon, icons } from "lucide-react";

// interface HeaderWithIconProps {
//   icon: string;
//   title: string;
// }

// export const HeaderWithIcon = ({ icon, title }: HeaderWithIconProps) => {
//   const IconComponent = icons[icon as keyof typeof icons] || icons["Circle"];

//   return (
//     <div className="flex items-center">
//       <IconComponent className="size-4" />
//       <div className="ml-2.5 flex items-center text-xs font-medium leading-none tracking-wide uppercase opacity-80">
//         <span className="translate-y-px">{title}</span>
//       </div>
//     </div>
//   );
// };

import { Icon } from "@iconify/react";

interface HeaderWithIconProps {
  icon: string;
  title: string;
}

export const HeaderWithIcon = ({ icon, title }: HeaderWithIconProps) => {
  return (
    <div className="flex items-center">
      <Icon icon={icon} className={`size-4`} />
      <div className="ml-2.5 flex items-center text-xs font-medium leading-none tracking-wide uppercase opacity-80">
        <span className="translate-y-px">{title}</span>
      </div>
    </div>
  );
};
