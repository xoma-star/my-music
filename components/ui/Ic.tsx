import { icons, type IconName } from '@/lib/icons';

interface Props extends React.SVGAttributes<SVGSVGElement> {
  n: IconName;
}

export default function Ic({ n, ...props }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: icons[n] }}
      {...props}
    />
  );
}
